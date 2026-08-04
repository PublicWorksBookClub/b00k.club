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
import { solve } from './solve.js'
import { PROPOSITIONS, PROPOSITION_BY_ID, DEFAULT_TOOL_IDS } from './propositions.js'

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
    upTo: Infinity,
    notice: null,
    noticeKind: 'problem',
    readonly: !!options.readonly,
  }

  const undoStack = []
  const redoStack = []

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
  const snapshot = () => {
    undoStack.push(D.cloneDoc(doc))
    if (undoStack.length > 200) undoStack.shift()
    redoStack.length = 0
  }
  const nextGesture = () => `g${++gestureCounter}`
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
    return restored
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

    /* -------------------------------------------------- drawing */

    click(world, hit) {
      if (state.readonly) return
      if (state.mode === 'define') return api.definitionPick(hit)
      if (state.mode === 'select') return api.select(hit ? (hit.point || hit.curve).id : null)
      if (state.activeTool) return api.pickForTool(world, hit)

      if (state.mode === 'point') {
        snapshot()
        const g = nextGesture()
        resolvePoint(world, hit, g)
        return invalidate()
      }
      if (!CURVE_MODES.has(state.mode)) return

      if (!state.pending) {
        snapshot()
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

    applyTool(tool, argIds) {
      const gesture = beginPickGesture()
      D.addStep(doc, M.makeToolStep(doc, tool, argIds, gesture))
      state.pickGesture = null
      state.picked = []
      state.upTo = Infinity
      const info = getScene().steps[doc.steps.length - 1]
      state.notice = info && !info.ok ? info.error : null
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
      const keep = doc.tools
      doc = D.createDoc({ tools: keep })
      state.selection.clear()
      state.pending = null
      state.upTo = Infinity
      invalidate()
    },

    setUpTo(n) {
      state.upTo = n >= doc.steps.length ? Infinity : Math.max(0, n)
      invalidate()
    },

    /* -------------------------------------------------- documents */

    load(next, { keepTools = false } = {}) {
      const incoming = typeof next === 'string' ? D.deserializeDoc(next) : next
      if (keepTools) {
        const have = new Set((incoming.tools || []).map((t) => t.id))
        for (const t of doc.tools || []) if (!have.has(t.id)) incoming.tools.push(t)
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
      doc = D.createDoc({ tools: kept })
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
      for (const [from, to] of prop.demo?.join || []) {
        D.addStep(doc, { op: 'segment', id: D.newId(doc, 'c'), a: bind.get(from), b: bind.get(to), g: gesture, given: true })
      }
      M.inlineTool(doc, prop, givens, gesture)
      state.upTo = Infinity
      state.mode = 'select'
      say(`${prop.ref}. ${prop.summary}`, 'info')
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
