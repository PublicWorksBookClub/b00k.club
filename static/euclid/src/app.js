/**
 * The sketch controller: all state, and every command the interface can issue.
 *
 * Knows nothing about the DOM. The canvas and the panels talk to it through
 * these methods and re-render whenever it says something changed, which keeps
 * the drawing surface and the step list incapable of disagreeing.
 */

import * as D from './doc.js'
import * as G from './geometry.js'
import * as C from './camera.js'
import * as M from './macros.js'
import * as MAG from './magnitudes.js'
import { solve } from './solve.js'
import { PROPOSITIONS, PROPOSITION_BY_ID, DEFAULT_TOOL_IDS } from './propositions.js'
import { BOOK_I } from './book1.js'

export const PRIMITIVES = [
  { id: 'select', label: 'Move', glyph: 'arrow', hint: 'Drag a point to test the figure. Click anything to select it.' },
  { id: 'point', label: 'Point', glyph: 'point', hint: 'Click to set down a point — on a line to keep it there, or loose on the page.' },
  { id: 'segment', label: 'Join', glyph: 'segment', hint: 'Postulate 1. Click two points to draw the straight line between them.' },
  { id: 'ray', label: 'Produce', glyph: 'ray', hint: 'Postulate 2. Click two points; the line runs on beyond the second.' },
  { id: 'line', label: 'Straight line', glyph: 'line', hint: 'Postulate 2, produced both ways.' },
  { id: 'circle', label: 'Circle', glyph: 'circle', hint: 'Postulate 3. Click the centre, then a point the circumference passes through.' },
]

const CURVE_MODES = new Set(['segment', 'ray', 'line', 'circle'])

export function createSketch(options = {}) {
  const listeners = new Set()
  let doc = D.createDoc()
  let scene = null
  let gestureCounter = 0

  const state = {
    camera: C.createCamera(),
    mode: 'select',
    activeTool: null,
    selection: new Set(),
    hover: null,
    cursor: null,
    snap: null,
    pending: null,
    picked: [],
    pickGesture: null,
    definition: null,
    choice: null,
    lasso: null,
    heldMagnitude: null,
    holdSelect: false,
    upTo: Infinity,
    notice: null,
    noticeKind: 'problem',
    readonly: !!options.readonly,
  }

  const undoStack = []
  const redoStack = []
  // What was already selected when the lasso started, so a lasso that is drawn
  // back off something releases it rather than keeping it for good.
  let lassoBase = null

  /* ---------------------------------------------------------------- */

  const emit = () => {
    for (const fn of listeners) fn(api)
  }
  const invalidate = () => {
    scene = null
    emit()
  }
  const registry = () => {
    const all = new Map(PROPOSITIONS.map((t) => [t.id, t]))
    for (const t of doc.tools || []) all.set(t.id, t)
    return all
  }
  const getScene = () => {
    if (!scene) scene = solve(doc, { tools: [...registry().values()], upTo: state.upTo })
    return scene
  }
  /** Read the scene after editing the document, rather than the stale one. */
  const rebuiltScene = () => {
    scene = null
    return getScene()
  }
  const snapshot = () => {
    undoStack.push(D.cloneDoc(doc))
    if (undoStack.length > 200) undoStack.shift()
    redoStack.length = 0
  }
  const nextGesture = () => `g${++gestureCounter}`
  const promptFor = (tool, key) => {
    const found = (tool && tool.choices ? tool.choices : []).find((c) => key.endsWith(c.key))
    return found ? found.prompt : 'This construction can go either way. Click the point you want.'
  }
  const say = (text, kind = 'problem') => {
    state.notice = text
    state.noticeKind = kind
  }

  /**
   * Undo takes back what was drawn, not what was proved.
   *
   * Snapshots are whole documents, toolbox included, so restoring one plainly
   * would un-prove any proposition saved since — which is not what undo means
   * here. A tool leaves the toolbox only by being removed on purpose.
   */
  const keepingToolbox = (restored) => {
    const tools = [...(restored.tools || [])]
    const have = new Set(tools.map((t) => t.id))
    for (const tool of doc.tools || []) if (!have.has(tool.id)) tools.push(tool)
    restored.tools = tools
    const facts = [...(restored.facts || [])]
    const known = new Set(facts.map((f) => f.id))
    for (const fact of doc.facts || []) if (!known.has(fact.id)) facts.push(fact)
    restored.facts = facts
    return restored
  }

  /** Is there already a straight line drawn between these two points? */
  const joinedAlready = (a, b) => {
    for (const o of getScene().objects.values()) {
      if (o.type !== 'curve' || o.hidden || !o.def) continue
      if (o.def.op !== 'segment') continue
      if ((o.def.a === a && o.def.b === b) || (o.def.a === b && o.def.b === a)) return true
    }
    return false
  }

  /**
   * Drawing while scrubbed back rubs out what came after.
   *
   * Going back to step four and drawing something means "from here, this
   * instead" — appending to the end of a proof the reader is not looking at
   * would be a surprise.
   */
  const truncateFuture = () => {
    if (state.upTo === Infinity || state.upTo >= doc.steps.length) return
    doc.steps = doc.steps.slice(0, state.upTo)
    state.upTo = Infinity
    scene = null
  }

  /** One undo entry per tool application, however many points it sets down. */
  const beginPickGesture = () => {
    if (!state.pickGesture) {
      snapshot()
      state.pickGesture = nextGesture()
    }
    return state.pickGesture
  }

  /* ---------------------------------------------------------------- *
   * Placing points
   * ---------------------------------------------------------------- */

  /**
   * Turn a click into a point id, making one if the reader clicked empty
   * paper. A click on a line yields a point that stays on that line — which is
   * how "let a point be taken at random on AB" gets recorded.
   */
  function resolvePoint(world, hit, gesture) {
    if (hit && hit.point) return hit.point.id
    if (hit && hit.curve) {
      const id = D.newId(doc, 'p')
      const t = G.clampParam(hit.curve.geom, G.paramAt(hit.curve.geom, world))
      D.addStep(doc, { op: 'onCurve', id, curve: hit.curve.id, t, g: gesture })
      return id
    }
    const id = D.newId(doc, 'p')
    D.addStep(doc, { op: 'point', id, x: world.x, y: world.y, g: gesture })
    return id
  }

  /* ---------------------------------------------------------------- *
   * Commands
   * ---------------------------------------------------------------- */

  const api = {
    get doc() {
      return doc
    },
    get scene() {
      return getScene()
    },
    get state() {
      return state
    },
    get tools() {
      return doc.tools || []
    },
    get camera() {
      return state.camera
    },
    get canUndo() {
      return undoStack.length > 0
    },
    get canRedo() {
      return redoStack.length > 0
    },
    registry,

    subscribe(fn) {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    changed: invalidate,

    /* -------------------------------------------------- modes */

    setMode(mode, toolId = null) {
      if (state.choice) api.cancelChoice()
      api.cancelPending()
      state.mode = mode
      state.activeTool = toolId
      state.picked = []
      if (mode !== 'define') state.definition = null
      say(null)
      invalidate()
    },

    cancelPending() {
      // Points set down for a line, or for a tool, that never got drawn go with it.
      for (const gesture of [state.pending && state.pending.gesture, state.pickGesture]) {
        if (!gesture) continue
        for (const step of doc.steps.filter((s) => s.g === gesture)) {
          if (D.findStep(doc, step.id)) D.removeStep(doc, step.id)
        }
      }
      state.pending = null
      state.pickGesture = null
      state.picked = []
      scene = null
    },

    /**
     * Holding option borrows the pointer without giving up the tool in hand.
     * Let go and you are back to drawing where you left off.
     */
    setHoldSelect(on) {
      if (state.holdSelect === !!on) return
      state.holdSelect = !!on
      invalidate()
    },
    /** The mode the pointer is actually in, which option can borrow. */
    get workingMode() {
      return state.holdSelect ? 'select' : state.mode
    },

    setHover(id) {
      if (state.hover === id) return
      state.hover = id
      emit()
    },
    setCursor(world, snap) {
      state.cursor = world
      state.snap = snap
      if (state.pending || state.mode !== 'select') emit()
    },
    select(id, additive = false) {
      if (!additive) state.selection.clear()
      if (id) {
        if (state.selection.has(id)) state.selection.delete(id)
        else state.selection.add(id)
      }
      emit()
    },

    /**
     * Sweep a rectangle over the figure, selecting as it goes.
     *
     * The selection is recomputed from scratch on every move rather than added
     * to, so shrinking the rectangle lets things go again — the selection is
     * what the rectangle covers now, not everything it has ever covered.
     */
    setLasso(rect, additive = false) {
      if (!rect) {
        state.lasso = null
        lassoBase = null
        return emit()
      }
      if (!lassoBase) lassoBase = additive ? new Set(state.selection) : new Set()
      state.lasso = rect
      api.selectWithin(rect, lassoBase)
    },

    /**
     * Everything the lasso caught, on top of whatever it started with.
     *
     * A point counts if it is inside; a curve counts if any of it is, so a
     * circle can be caught by sweeping across its rim without enclosing the
     * whole of it. Hidden and ghosted things are not there to be caught.
     *
     * The selection is rebuilt from the rectangle each time rather than added
     * to, so pulling the rectangle back off something lets it go again.
     */
    selectWithin(rect, base = new Set()) {
      state.selection = new Set(base)
      const inside = (p) => p.x >= rect.x0 && p.x <= rect.x1 && p.y >= rect.y0 && p.y <= rect.y1
      const scene = getScene()
      for (const id of scene.order) {
        const o = scene.objects.get(id)
        if (!o || o.hidden || o.ghost) continue
        if (o.type === 'point' ? inside(o.pos) : G.meetsRect(o.geom, rect)) state.selection.add(id)
      }
      emit()
    },

    /* -------------------------------------------------- drawing */

    click(world, hit, { additive = false } = {}) {
      if (state.readonly) return
      if (state.choice) return api.pickChoice(world, 18 / state.camera.k)
      if (state.holdSelect) return api.select(hit ? (hit.point || hit.curve).id : null, additive)
      if (state.mode === 'define') return api.definitionPick(hit)
      if (state.mode === 'select') return api.select(hit ? (hit.point || hit.curve).id : null, additive)
      if (state.activeTool) return api.pickForTool(world, hit)

      if (state.mode === 'point') {
        snapshot()
        truncateFuture()
        const g = nextGesture()
        resolvePoint(world, hit, g)
        return invalidate()
      }
      if (!CURVE_MODES.has(state.mode)) return

      if (!state.pending) {
        snapshot()
        truncateFuture()
        const gesture = nextGesture()
        const anchorId = resolvePoint(world, hit, gesture)
        state.pending = { op: state.mode, gesture, anchorId, anchor: { ...world } }
        scene = null
        const anchor = getScene().get(anchorId)
        if (anchor) state.pending.anchor = anchor.pos
        return invalidate()
      }

      const { op, gesture, anchorId } = state.pending
      const secondId = resolvePoint(world, hit, gesture)
      if (secondId === anchorId) {
        state.notice = 'A line needs two distinct points.'
        return invalidate()
      }
      const id = D.newId(doc, 'c')
      const step =
        op === 'circle' ? { op: 'circle', id, o: anchorId, r: secondId, g: gesture } : { op, id, a: anchorId, b: secondId, g: gesture }
      D.addStep(doc, step)
      state.pending = null
      state.upTo = Infinity
      return invalidate()
    },

    /* -------------------------------------------------- dragging */

    beginDrag(objId) {
      // A read-only figure may still be dragged — pulling a given about to see
      // whether the construction holds is the whole point of reading one.
      const step = D.stepProducing(doc, objId)
      if (!step || (step.op !== 'point' && step.op !== 'onCurve')) return null
      snapshot()
      return { objId, stepId: step.id }
    },
    updateDrag(drag, world) {
      const step = D.findStep(doc, drag.stepId)
      if (!step) return
      if (step.op === 'point') {
        step.x = world.x
        step.y = world.y
      } else {
        const curve = getScene().getCurve(step.curve)
        if (curve) step.t = G.clampParam(curve.geom, G.paramAt(curve.geom, world))
      }
      invalidate()
    },

    /* -------------------------------------------------- claiming */

    /**
     * What a claim would be made about, given what is selected.
     *
     * Two points is a length; three is a triangle if all three sides are drawn,
     * an angle otherwise, at whichever vertex the drawn lines meet. Reported
     * rather than acted on so the interface can say what it is about to claim
     * before the reader commits to it.
     */
    magnitudeFromSelection() {
      return api.readings()[0] || null
    },

    /**
     * Every way the selection could be read, likeliest first.
     *
     * Three points are a triangle or one of three angles, and which is meant
     * cannot be guessed from the figure — Book I is largely about the angles of
     * triangles, so both are always live. The interface offers them all.
     */
    readings() {
      const points = [...state.selection].filter((id) => {
        const o = getScene().get(id)
        return o && o.type === 'point'
      })
      if (points.length < 2 || points.length > 3) return []
      return MAG.readingsOf(points, (a, b) => !!joinedAlready(a, b))
    },

    /**
     * Set down one of the two magnitudes a claim compares.
     *
     * A claim needs two, and they are chosen one after another because a
     * selection can only hold one figure at a time. The first is held until the
     * second arrives.
     */
    holdMagnitude(which = null) {
      const mag = which || api.magnitudeFromSelection()
      if (!mag) {
        say('Select two points for a length, or three for an angle or a triangle.')
        return null
      }
      state.heldMagnitude = mag
      state.selection.clear()
      say(`${MAG.nameOf(mag, (id) => (getScene().get(id) || {}).label || '•')} — now choose what it is to be compared with.`, 'info')
      invalidate()
      return mag
    },

    dropMagnitude() {
      state.heldMagnitude = null
      say(null)
      invalidate()
    },

    /**
     * Assert that the held magnitude and the selected one stand in some
     * relation, and write it down as a step.
     *
     * The claim draws nothing. What it does is make a statement the figure can
     * be held to: it is checked as the figure now stands, and can be checked
     * again over hundreds of random configurations by shaking.
     */
    claim(rel = 'eq', because = null, which = null) {
      const first = state.heldMagnitude
      // Of the ways the selection could be read, take the one that matches what
      // is being held: comparing an angle, you mean the angle.
      const second = which
        || api.readings().find((m) => m.kind === (first || {}).kind)
        || api.magnitudeFromSelection()
      if (!first || !second) {
        say('A claim compares two things: choose one, then the other.')
        return null
      }
      if (first.kind !== second.kind) {
        say('Euclid compares like with like — a length with a length, an angle with an angle.')
        return null
      }
      if (MAG.sameMagnitude(first, second)) {
        say('That is the same thing twice; a claim wants two.')
        return null
      }
      snapshot()
      truncateFuture()
      const step = { op: 'claim', id: D.newId(doc, 'q'), rel, of: [first, second], because, g: nextGesture() }
      D.addStep(doc, step)
      state.heldMagnitude = null
      state.selection.clear()
      state.upTo = Infinity
      const info = rebuiltScene().steps[doc.steps.length - 1]
      say(info && info.ok ? null : (info && info.error) || 'That does not hold.', info && info.ok ? 'info' : 'problem')
      invalidate()
      return step
    },

    /** Say why a claim is allowed: a definition, an axiom, or something proved. */
    setClaimReason(stepId, because) {
      const step = D.findStep(doc, stepId)
      if (!step || step.op !== 'claim') return
      snapshot()
      if (because) step.because = because
      else delete step.because
      invalidate()
    },

    /**
     * Mark a claim as the thing that was to be proved.
     *
     * Euclid ends a theorem by observing that what he set out to show is now
     * shown. Saying which claim that is turns a list of true statements into a
     * proof of something in particular, and it is what a fact is minted from.
     * Only one claim can be the conclusion; marking another moves it.
     */
    markConclusion(stepId) {
      const step = D.findStep(doc, stepId)
      if (!step || step.op !== 'claim') return
      snapshot()
      const already = step.qed
      for (const s of doc.steps) if (s.op === 'claim') delete s.qed
      if (!already) step.qed = true
      invalidate()
    },

    /** The claim marked as the conclusion, with how it stands. */
    conclusion() {
      const found = getScene().steps.find((info) => info.step.op === 'claim' && info.step.qed)
      return found || null
    },

    /* -------------------------------------------------- what has been proved */

    get facts() {
      return doc.facts || []
    },

    /**
     * Keep a proved theorem, so later proofs may cite it.
     *
     * A fact is not a tool: there is nothing to carry out. It is a statement
     * you have earned the right to lean on, and the evidence it was earned by
     * travels with it — how many configurations it survived — because that is
     * the difference between a theorem and a lucky figure.
     */
    proveFact({ ref, name, statement } = {}) {
      const conclusion = api.conclusion()
      if (!conclusion) {
        say('Mark the claim that is what was to be proved first.')
        return null
      }
      if (!conclusion.ok) {
        say('That claim does not hold, so there is nothing to keep.')
        return null
      }
      const evidence = api.shake()
      if (evidence.failed.length) {
        say('Shaking the figure breaks that claim: it is true of your figure, not in general.')
        invalidate()
        return null
      }
      snapshot()
      // A claim's prose says why *this* figure's claim holds — "(I.4)" — which
      // is no part of the theorem. And when the reader says which proposition
      // they have proved, the book's own words are better than the letters that
      // happened to be on the paper.
      const said = conclusion.text.replace(/\s*\([^()]*\)\.?$/, '').replace(/\.$/, '')
      const entry = ref && BOOK_I.propositions.find((p) => `I.${p.n}` === ref)
      const fact = {
        id: ref ? `euclid.${ref}` : `fact.${D.newId(doc, 'f')}`,
        ref: ref || null,
        name: name || said,
        statement: statement || (entry ? entry.text : said + '.'),
        rounds: evidence.rounds,
      }
      doc.facts = [...(doc.facts || []).filter((f) => f.id !== fact.id), fact]
      say(`${fact.ref ? fact.ref + ' is' : 'That is'} yours to cite now — it held in ${evidence.rounds} configurations.`, 'info')
      invalidate()
      return fact
    },

    /**
     * Go back to the beginning of the book: the first three propositions and
     * nothing else. The figure on the paper is not touched.
     */
    forgetProgress() {
      snapshot()
      const start = new Set(DEFAULT_TOOL_IDS)
      doc.tools = (doc.tools || []).filter((t) => start.has(t.id))
      for (const id of DEFAULT_TOOL_IDS) {
        if (doc.tools.some((t) => t.id === id)) continue
        const found = PROPOSITION_BY_ID.get(id)
        if (found) doc.tools.push(found)
      }
      doc.facts = []
      say('Back to the first three propositions.', 'info')
      invalidate()
    },

    /**
     * What has been earned, in a form fit to be kept between visits.
     *
     * One of Book I's propositions is written down as its number and nothing
     * else. Keeping the whole body would be wasteful, and worse: a reader who
     * came back would be handed the copy that was current when they first
     * visited, bugs and all, rather than the one in the app. Tools the reader
     * built themselves have no such home to be read back from, so those are
     * kept whole.
     */
    get progress() {
      return {
        tools: (doc.tools || []).map((t) => (PROPOSITION_BY_ID.has(t.id) ? { id: t.id } : t)),
        facts: doc.facts || [],
      }
    },

    restoreProgress(saved) {
      if (!saved) return
      for (const kept of saved.tools || []) {
        const tool = kept && kept.body ? kept : PROPOSITION_BY_ID.get(kept && kept.id)
        if (tool) api.addTool(tool)
      }
      api.restoreFacts(saved.facts)
    },

    /** Put back facts kept from a previous visit, without disturbing this one's. */
    restoreFacts(facts) {
      const known = new Set((doc.facts || []).map((f) => f.id))
      for (const fact of facts || []) if (fact && fact.id && !known.has(fact.id)) doc.facts.push(fact)
      invalidate()
    },

    forgetFact(id) {
      snapshot()
      doc.facts = (doc.facts || []).filter((f) => f.id !== id)
      invalidate()
    },

    /**
     * Which of Book I's propositions may honestly be cited.
     *
     * The ones in the toolbox are constructions you have; the ones in `facts`
     * are theorems you have proved. Nothing stops a reader citing something
     * they have not got — the app is not a proctor — but it says which is
     * which, because the whole shape of the book is that each proposition
     * stands on the ones before it.
     */
    proved() {
      const have = new Set()
      for (const tool of doc.tools || []) if (tool.ref) have.add(tool.ref)
      for (const fact of doc.facts || []) if (fact.ref) have.add(fact.ref)
      return have
    },

    /**
     * Shake the figure and see whether the claims survive.
     *
     * A claim that holds where it was written down may hold only there. Every
     * point set down by hand is jogged about at random, the whole document is
     * run again, and any claim that fails is reported — the same defence the
     * constructions have, turned on the assertions. The figure is left as it
     * was found.
     */
    shake(rounds = 200, spread = 0.35) {
      const free = doc.steps.filter((s) => s.op === 'point' || s.op === 'onCurve')
      const was = free.map((s) => (s.op === 'point' ? { x: s.x, y: s.y } : { t: s.t }))
      const claims = doc.steps.filter((s) => s.op === 'claim')
      if (!claims.length) return { rounds: 0, claims: 0, failed: [], broke: 0, at: doc.steps.length }

      const bounds = getScene().bounds()
      const reach = bounds ? Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) * spread : 100
      // A parameter means something different on each kind of curve — an angle
      // round a circle, a fraction along a segment — and the kind never changes
      // however the figure is jogged, so it is read once and kept.
      const along = new Map()
      for (const s of free) {
        if (s.op !== 'onCurve') continue
        const curve = getScene().getCurve(s.curve)
        along.set(s.id, curve && curve.geom.kind === 'circle' ? 'circle'
          : curve && curve.def ? curve.def.op : 'segment')
      }
      const failed = new Set()
      let broke = 0
      let ran = 0
      for (let i = 0; i < rounds; i++) {
        for (const s of free) {
          if (s.op === 'point') {
            s.x += (Math.random() - 0.5) * reach
            s.y += (Math.random() - 0.5) * reach
          } else {
            s.t = G.randomParam(along.get(s.id) || 'segment')
          }
        }
        scene = null
        const shaken = getScene()
        // A configuration the construction cannot survive says nothing about
        // the claims, so it is passed over rather than counted against them.
        if (shaken.steps.some((info) => info.step.op !== 'claim' && !info.ok)) {
          broke += 1
        } else {
          ran += 1
          for (const info of shaken.steps) {
            if (info.step.op === 'claim' && !info.ok) failed.add(info.step.id)
          }
        }
        free.forEach((s, k) => Object.assign(s, was[k]))
      }
      scene = null
      invalidate()
      return { rounds: ran, claims: claims.length, failed: [...failed], broke, at: doc.steps.length }
    },

    /* -------------------------------------------------- tools */

    /**
     * Choose the next given for the active tool. A given that wants a point may
     * be supplied by clicking empty paper, exactly as the drawing tools allow —
     * the point is set down as part of the same gesture, so one undo takes back
     * the whole application.
     */
    pickForTool(world, hit) {
      const tool = registry().get(state.activeTool)
      if (!tool) return
      const want = (tool.inputs || [])[state.picked.length]
      if (!want) return

      let id
      if (want.kind === 'curve') {
        if (!hit || !hit.curve) {
          state.notice = 'This one wants a straight line or a circle.'
          return invalidate()
        }
        id = hit.curve.id
      } else {
        id = resolvePoint(world, hit, beginPickGesture())
      }
      if (state.picked.includes(id)) {
        state.notice = 'That one has been given already.'
        return invalidate()
      }
      state.picked = [...state.picked, id]
      state.notice = null
      if (state.picked.length === (tool.inputs || []).length) api.applyTool(tool, state.picked)
      else invalidate()
    },

    /**
     * What a tool needs of the things it is given, if it needs anything.
     *
     * I.3 cuts the lesser line off the greater; handed them the other way about
     * it cannot be done, and "part of this construction could not be carried
     * out here" is a poor way to say so. A requirement is written in the same
     * terms as a claim — two magnitudes and how they must stand — so it is
     * plain data, travels with a saved tool, and is read by the same code.
     */
    unmetRequirement(tool, argIds) {
      const bind = new Map((tool.inputs || []).map((inp, i) => [inp.id, argIds[i]]))
      const scene = getScene()
      for (const want of tool.requires || []) {
        const asked = {
          rel: want.rel,
          of: want.of.map((m) => ({ ...m, pts: m.pts.map((p) => bind.get(p) || p) })),
        }
        if (MAG.holds(asked, scene) === false) return want
      }
      return null
    },

    applyTool(tool, argIds) {
      const unmet = api.unmetRequirement(tool, argIds)
      if (unmet) {
        // Put the paper back as it was — the points clicked into empty space go
        // with the attempt — and say what was wrong with it.
        api.cancelPending()
        say(unmet.says)
        invalidate()
        return
      }
      const gesture = beginPickGesture()
      truncateFuture()
      // "On a given finite straight line to describe an equilateral triangle" —
      // the line is part of what the proposition is handed. Applied to two bare
      // points there is no such line, so it is drawn, and the triangle has a
      // base rather than hanging in the air.
      const inputIndex = new Map((tool.inputs || []).map((inp, i) => [inp.id, i]))
      for (const [from, to, style] of tool.given || []) {
        const a = argIds[inputIndex.get(from)]
        const b = argIds[inputIndex.get(to)]
        if (!a || !b || joinedAlready(a, b)) continue
        D.addStep(doc, { op: 'segment', id: D.newId(doc, 'c'), a, b, g: gesture, given: true, ...style })
      }
      const step = M.makeToolStep(doc, tool, argIds, gesture)
      D.addStep(doc, step)
      state.pickGesture = null
      state.picked = []
      state.upTo = Infinity
      const info = rebuiltScene().steps[doc.steps.length - 1]
      if (info && info.needsChoice) {
        state.choice = { stepId: step.id, tool: tool.id, ...info.needsChoice }
        say(promptFor(tool, info.needsChoice.key), 'info')
      } else {
        say(info && !info.ok ? info.error : null)
      }
      invalidate()
    },

    /* -------------------------------------------------- choices */

    /**
     * The construction, worked out both ways.
     *
     * Each option carries everything the step would draw, so the reader can see
     * both figures ghosted at once and click the point that decides between
     * them — which is the only piece of information the construction is short of.
     */
    choiceOptions() {
      const choice = state.choice
      if (!choice) return []
      const stepIndex = doc.steps.findIndex((s) => s.id === choice.stepId)
      if (stepIndex < 0) return []
      const tools = [...registry().values()]
      return (choice.options || [0, 1])
        .map((value) => {
          const trial = D.cloneDoc(doc)
          const step = trial.steps[stepIndex]
          step.picks = { ...(step.picks || {}), [choice.key]: value }
          const scene = solve(trial, { tools })
          const objects = []
          for (const id of scene.order) {
            const o = scene.objects.get(id)
            if (o && o.stepIndex === stepIndex && !o.auto) objects.push(o)
          }
          const at = scene.get(choice.at)
          return at ? { value, objects, point: at.pos, label: at.label || null } : null
        })
        .filter(Boolean)
    },

    chooseBranch(value) {
      const choice = state.choice
      if (!choice) return
      const step = D.findStep(doc, choice.stepId)
      if (!step) return
      step.picks = { ...(step.picks || {}), [choice.key]: value }
      state.choice = null
      // Settling one choice may uncover the next.
      const info = rebuiltScene().steps.find((s) => s.step.id === choice.stepId)
      if (info && info.needsChoice) {
        const tool = registry().get(step.tool)
        state.choice = { stepId: step.id, tool: step.tool, ...info.needsChoice }
        say(promptFor(tool, info.needsChoice.key), 'info')
      } else {
        say(info && !info.ok ? info.error : null)
      }
      invalidate()
    },

    /** Click near one of the candidates to settle the choice. */
    pickChoice(world, reach) {
      const options = api.choiceOptions()
      let best = null
      for (const option of options) {
        const d = G.dist(option.point, world)
        if (d <= reach && (!best || d < best.d)) best = { d, value: option.value }
      }
      if (best) api.chooseBranch(best.value)
      else say('Click one of the two points to say which way it should go.', 'info')
      invalidate()
    },

    /** Abandon the step that is waiting on a choice. */
    cancelChoice() {
      if (!state.choice) return
      state.choice = null
      api.undo()
    },

    /* -------------------------------------------------- colour */

    setDash(objId, on) {
      const step = D.stepProducing(doc, objId)
      if (!step) return
      snapshot()
      if (step.op === 'macro') step.dashes = { ...(step.dashes || {}), [objId]: !!on }
      else step.dash = !!on
      invalidate()
    },

    setColor(objId, color) {
      const step = D.stepProducing(doc, objId)
      if (!step) return
      snapshot()
      if (step.op === 'macro') {
        // A tool's results are coloured where they are made; recolour the
        // objects it exposed rather than the call.
        step.colors = { ...(step.colors || {}), [objId]: color }
      } else {
        step.color = color
      }
      invalidate()
    },

    /** Write a tool's construction out as steps, to be read one at a time. */
    unfoldStep(stepId) {
      const step = D.findStep(doc, stepId)
      if (!step || step.op !== 'macro') return
      const tool = registry().get(step.tool)
      if (!tool) return
      snapshot()
      // The unfolded steps reuse the tool step's own result ids, so anything
      // already drawn from those results goes on pointing at the same objects.
      const at = doc.steps.indexOf(step)
      const before = doc.steps.length
      M.inlineTool(doc, tool, step.args, nextGesture(), step.out)
      const added = doc.steps.splice(before)
      doc.steps.splice(at, 1, ...added)
      state.upTo = Infinity
      invalidate()
    },

    toggleStepWorking(stepId) {
      const step = D.findStep(doc, stepId)
      if (!step || step.op !== 'macro') return
      step.expanded = !step.expanded
      invalidate()
    },

    addTool(tool) {
      const have = new Set((doc.tools || []).map((t) => t.id))
      for (const dep of M.collectToolDeps(tool, registry())) {
        if (!have.has(dep.id)) {
          doc.tools.push(dep)
          have.add(dep.id)
        }
      }
      if (!have.has(tool.id)) doc.tools.push(tool)
      invalidate()
    },

    removeTool(toolId) {
      const dependents = M.toolIsUsedBy(toolId, doc.tools || [])
      if (dependents.length) {
        state.notice = `${dependents.map((t) => t.name).join(', ')} still stands on this one.`
        return invalidate()
      }
      if (doc.steps.some((s) => s.op === 'macro' && s.tool === toolId)) {
        state.notice = 'This tool has been used in the figure. Undo that first.'
        return invalidate()
      }
      doc.tools = (doc.tools || []).filter((t) => t.id !== toolId)
      if (state.activeTool === toolId) api.setMode('select')
      invalidate()
    },

    /* -------------------------------------------------- defining a tool */

    startDefinition() {
      api.cancelPending()
      state.mode = 'define'
      state.activeTool = null
      state.definition = { stage: 'inputs', inputs: [], outputs: [], error: null, missing: null }
      invalidate()
    },

    definitionPick(hit) {
      const def = state.definition
      if (!def || !hit) return
      const object = hit.point || hit.curve
      if (!object) return
      const list = def.stage === 'inputs' ? 'inputs' : 'outputs'
      const already = def[list].indexOf(object.id)
      if (already >= 0) def[list].splice(already, 1)
      else def[list].push(object.id)
      def.error = null
      invalidate()
    },

    definitionStage(stage) {
      if (!state.definition) return
      state.definition.stage = stage
      state.definition.error = null
      invalidate()
    },

    definitionAcceptMissing() {
      const def = state.definition
      if (!def || !def.missing) return
      for (const id of def.missing) if (!def.inputs.includes(id)) def.inputs.push(id)
      def.missing = null
      def.error = null
      invalidate()
    },

    createTool(details) {
      const def = state.definition
      if (!def) return null
      const made = M.extractTool(doc, getScene(), {
        inputIds: def.inputs,
        outputIds: def.outputs,
        name: details.name,
        ref: details.ref,
        abbr: details.abbr,
        summary: details.summary,
      })
      if (!made.ok) {
        def.error = made.error
        def.missing = made.missingInputs || null
        invalidate()
        return null
      }
      api.addTool(made.tool)
      state.definition = null
      state.mode = 'select'
      say(`“${made.tool.name}” is now in the toolbox.`, 'info')
      invalidate()
      return made.tool
    },

    /* -------------------------------------------------- editing */

    deleteSelection() {
      if (state.readonly || !state.selection.size) return
      snapshot()
      for (const id of [...state.selection]) {
        const step = D.stepProducing(doc, id)
        if (step) D.removeGestureOf(doc, step.id)
      }
      state.selection.clear()
      invalidate()
    },

    deleteStep(stepId) {
      if (state.readonly) return
      snapshot()
      D.removeStep(doc, stepId)
      invalidate()
    },

    undo() {
      const previous = undoStack.pop()
      if (!previous) return
      redoStack.push(D.cloneDoc(doc))
      doc = keepingToolbox(previous)
      state.pending = null
      state.pickGesture = null
      state.picked = []
      state.selection.clear()
      invalidate()
    },

    redo() {
      const next = redoStack.pop()
      if (!next) return
      undoStack.push(D.cloneDoc(doc))
      doc = keepingToolbox(next)
      invalidate()
    },

    clear() {
      snapshot()
      // What you have proved stays proved; only the paper is cleared.
      doc = D.createDoc({ tools: doc.tools, facts: doc.facts })
      state.selection.clear()
      state.pending = null
      state.upTo = Infinity
      invalidate()
    },

    /**
     * Declare everything drawn so far to be the given figure.
     *
     * A proposition starts from something — two points, a line, an angle — and
     * that is not part of what it proves. Marking the setup lets the reader lay
     * it out with the ordinary tools, colours and dashes and then say "this is
     * what we are given", after which the construction is numbered from 1.
     */
    markSetup(upToIndex = doc.steps.length) {
      snapshot()
      doc.steps.forEach((step, i) => {
        if (i < upToIndex) step.setup = true
        else delete step.setup
      })
      say(`The first ${upToIndex} step${upToIndex === 1 ? '' : 's'} are now the given figure.`, 'info')
      invalidate()
    },

    clearSetup() {
      snapshot()
      for (const step of doc.steps) delete step.setup
      say(null)
      invalidate()
    },

    setUpTo(n) {
      const floor = getScene().setupCount
      state.upTo = n >= doc.steps.length ? Infinity : Math.max(floor, n)
      invalidate()
    },

    /* -------------------------------------------------- documents */

    load(next, { keepTools = false } = {}) {
      const incoming = typeof next === 'string' ? D.deserializeDoc(next) : next
      if (keepTools) {
        const have = new Set((incoming.tools || []).map((t) => t.id))
        for (const t of doc.tools || []) if (!have.has(t.id)) incoming.tools.push(t)
        const known = new Set((incoming.facts || []).map((f) => f.id))
        for (const f of doc.facts || []) if (!known.has(f.id)) incoming.facts.push(f)
      }
      undoStack.length = 0
      redoStack.length = 0
      doc = incoming
      state.selection.clear()
      state.pending = null
      state.upTo = Infinity
      invalidate()
      return doc
    },

    serialize: () => D.serializeDoc(doc),

    /** Set out a proposition's construction as steps, ready to be read through. */
    walkProposition(propId) {
      const prop = PROPOSITION_BY_ID.get(propId)
      if (!prop) return
      snapshot()
      // Reading a proposition through starts a fresh figure but keeps the
      // toolbox — what you have proved stays proved.
      const kept = [...(doc.tools || [])]
      const have = new Set(kept.map((t) => t.id))
      for (const dep of M.collectToolDeps(prop, registry())) if (!have.has(dep.id)) kept.push(dep)
      doc = D.createDoc({ tools: kept, facts: doc.facts })
      const gesture = nextGesture()
      const givens = (prop.demo?.points || []).map((p) => {
        const id = D.newId(doc, 'p')
        D.addStep(doc, { op: 'point', id, x: p.x, y: p.y, g: gesture })
        return id
      })
      // The givens are part of the figure. "From a given point, to draw a
      // straight line equal to a given straight line (BC)" needs BC on the page
      // before the construction starts, or there is nothing to copy.
      const bind = new Map((prop.inputs || []).map((inp, i) => [inp.id, givens[i]]))
      for (const [from, to, style] of prop.given || []) {
        D.addStep(doc, {
          op: 'segment', id: D.newId(doc, 'c'), a: bind.get(from), b: bind.get(to),
          g: gesture, given: true, ...style,
        })
      }
      // Everything so far is what the proposition is given; its construction is
      // numbered from one.
      for (const step of doc.steps) step.setup = true
      M.inlineTool(doc, prop, givens, gesture)
      state.upTo = Infinity
      state.mode = 'select'
      say(`${prop.ref}. ${prop.summary}`, 'info')
      invalidate()
      return doc
    },

    /**
     * Take up a proposition, whether or not the sketchpad knows how it goes.
     *
     * Three of Book I are written out; the rest are the reader's to work. For
     * those, a clean sheet and the statement is the whole of what the app can
     * honestly offer — with the toolbox kept, since the point of the book is
     * that what you have proved stays proved and is there to be used. A theorem
     * gets a further warning: the app checks that a construction stands up, and
     * has no way to check that an argument does.
     */
    openProposition(n, entry) {
      const prop = PROPOSITIONS.find((p) => p.ref === `I.${n}`)
      if (prop) return api.walkProposition(prop.id)
      api.clear()
      state.mode = 'select'
      const task = entry && entry.text ? ` ${entry.text}` : ''
      say(
        entry && entry.kind === 'theorem'
          ? `I.${n}.${task} A theorem: build the figure it supposes — the hypothesis is constructed,`
            + ' not assumed — then state what follows, and shake it to see whether it holds in general.'
          : `I.${n}.${task} Set out the given figure, then construct it with the tools you have.`,
        'info',
      )
      invalidate()
      return doc
    },

    startingPoints(positions) {
      const gesture = nextGesture()
      for (const p of positions) {
        D.addStep(doc, { op: 'point', id: D.newId(doc, 'p'), x: p.x, y: p.y, g: gesture })
      }
      invalidate()
    },

    /* -------------------------------------------------- prose */

    hint() {
      if (state.holdSelect) return 'Holding option: drag a point, or click to select. Let go to go back to the tool.'
      if (state.choice) return state.notice || 'Two ways are open. Click the point you want.'
      if (state.notice) return state.notice
      const def = state.definition
      if (def) {
        if (def.error) return def.error
        return def.stage === 'inputs'
          ? 'Click the things the tool will be applied to, in the order they should be given.'
          : 'Now click what the tool should produce.'
      }
      if (state.activeTool) {
        const tool = registry().get(state.activeTool)
        const prompts = M.inputPrompts(tool || { inputs: [] })
        const want = prompts[state.picked.length]
        return want ? `${tool.ref ? tool.ref + '. ' : ''}${want.text}.` : ''
      }
      if (state.pending) {
        return state.pending.op === 'circle' ? 'Now click a point for the circumference to pass through.' : 'Now click the second point.'
      }
      const primitive = PRIMITIVES.find((p) => p.id === state.mode)
      return primitive ? primitive.hint : ''
    },
  }

  // A fresh sketch starts with the first three propositions to hand, and two
  // points to try them on.
  const startingTools = new Map(PROPOSITIONS.map((t) => [t.id, t]))
  for (const id of options.toolIds || DEFAULT_TOOL_IDS) {
    const tool = startingTools.get(id)
    if (tool) api.addTool(tool)
  }
  return api
}
