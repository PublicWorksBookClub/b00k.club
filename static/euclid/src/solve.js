/**
 * Run a document and produce a *scene*: every object the steps call into being,
 * plus the automatic intersections they imply, plus lettering and prose.
 *
 * The whole scene is rebuilt from scratch on every change, including on every
 * pointer move while dragging. That sounds wasteful and isn't: figures are
 * small, and it means there is exactly one code path, so a dragged figure can
 * never drift out of agreement with a freshly loaded one.
 *
 * Steps are appended and may only refer to earlier objects, so document order
 * is already a topological order — no sorting required.
 */

import * as G from './geometry.js'
import * as D from './doc.js'
import * as MAG from './magnitudes.js'
import * as M from './macros.js'

const MAX_TOOL_DEPTH = 24

/** The order fresh lines take their colour in, when nothing says otherwise. */
export const COLOR_ORDER = ['black', 'red', 'blue', 'yellow']

export function solve(doc, opts = {}) {
  const upTo = opts.upTo ?? Infinity
  const tools = new Map()
  for (const t of opts.tools || []) tools.set(t.id, t)
  for (const t of doc.tools || []) tools.set(t.id, t)

  const objects = new Map()
  const order = []
  const stageCurves = [] // top-level, visible curves — the ones that may cut each other
  const stepInfos = []

  const get = (id) => objects.get(id) || null
  const getPoint = (id) => {
    const o = objects.get(id)
    return o && o.type === 'point' ? o : null
  }
  const getCurve = (id) => {
    const o = objects.get(id)
    return o && o.type === 'curve' ? o : null
  }

  const shownPoints = []

  function put(obj) {
    objects.set(obj.id, obj)
    order.push(obj.id)
    if (obj.type === 'point' && !obj.hidden) shownPoints.push(obj.pos)
    return obj
  }

  // Byrne colours a figure so the colours carry the argument. A step may name
  // its own; anything else takes the next colour in the book's order.
  let colorTurn = 0

  function build(id, def, meta) {
    const made = evaluate(def, getPoint, getCurve)
    if (!made) return null
    const obj = put({ id, def, hidden: false, ghost: false, auto: false, ...made, ...meta })
    if (obj.type === 'curve') {
      obj.color = def.color || COLOR_ORDER[colorTurn++ % COLOR_ORDER.length]
      obj.dash = !!def.dash
      // Byrne tells two lines of one colour apart by drawing one heavier.
      obj.thick = !!def.thick
    }
    if (obj.type === 'mark') obj.color = def.color || 'yellow'
    return obj
  }

  /** Every pair of drawn curves that meets yields points, with no step needed. */
  function generateAutos(newCurveIds, stepIndex) {
    for (const nc of newCurveIds) {
      const b = getCurve(nc)
      if (!b) continue
      for (const pc of stageCurves) {
        const a = getCurve(pc)
        if (!a) continue
        const hits = G.intersect(a.geom, b.geom)
        for (let branch = 0; branch < 2; branch++) {
          const p = hits[branch]
          if (!p) continue
          // Near tangency both roots collapse onto the same spot; keep one.
          if (branch === 1 && hits[0] && G.dist(hits[0], p) < G.MERGE_TOLERANCE) continue
          // An intersection landing on a point the figure already has is that
          // point. A circle always meets a line drawn from its own centre at
          // the point that drew it, and a second anonymous dot on top of A is
          // clutter, not knowledge.
          if (shownPoints.some((q) => G.dist(q, p) < G.MERGE_TOLERANCE)) continue
          const id = D.autoId(pc, nc, branch)
          if (objects.has(id)) continue
          put({
            id,
            type: 'point',
            pos: p,
            def: { op: 'inter', c1: pc, c2: nc, branch },
            auto: true,
            hidden: false,
            ghost: false,
            stepIndex,
          })
        }
      }
      stageCurves.push(nc)
    }
  }

  /**
   * Replay a proved construction with fresh inputs.
   *
   * `visible` holds the ids the caller wants shown; everything else the tool
   * makes along the way is scaffolding and stays hidden (or ghosted, when the
   * reader has asked to see the working). Visibility is intersected on the way
   * down, so a nested tool's outputs stay hidden unless the outermost caller
   * asked for them.
   */
  /**
   * What a tool calls the thing it hands back — "the perpendicular at A" — for
   * when the points it is drawn between cannot name it.
   *
   * The template is kept rather than filled in, because the points it names
   * have not earned their letters yet: lettering waits until every step has
   * run. It is filled in when the prose is written.
   */
  function nameTheOutput(tool, localId, objId, argIds, resolve) {
    const obj = objects.get(objId)
    if (!obj) return
    const role = M.fillRole((tool.names || {})[localId], resolve, argIds)
    if (role) obj.role = role
  }

  function runMacro(call, stepIndex, depth) {
    const fail = (error) => ({ ok: false, error, produced: [], visibleCurves: [] })
    const tool = tools.get(call.toolId)
    if (!tool) return fail(`No tool named “${call.toolId}” is in the toolbox.`)
    if (depth > MAX_TOOL_DEPTH) return fail('This tool is defined in terms of itself.')

    const bind = new Map()
    const inputs = tool.inputs || []
    for (let i = 0; i < inputs.length; i++) bind.set(inputs[i].id, call.argIds[i])
    // A line the proposition is handed is drawn once, outside the tool, and the
    // body refers to that one rather than drawing a second on top of it.
    for (const [local, id] of Object.entries(call.givens || {})) bind.set(local, id)
    const alias = new Map()
    const outputs = tool.outputs || []
    for (let i = 0; i < outputs.length; i++) if (call.outIds[i]) alias.set(outputs[i], call.outIds[i])

    const idFor = (local) => alias.get(local) || call.prefix + local
    const ref = (r) => (bind.has(r) ? bind.get(r) : idFor(r))

    let ok = true
    let error = null
    let needsChoice = null
    const produced = []
    const visibleCurves = []
    const path = call.path || ''
    const keyFor = (key) => (path ? `${path}.${key}` : key)

    // A line the proposition is handed that the caller has not supplied is
    // drawn here instead, as working. That is what keeps tools composable: a
    // reader applying I.9 is shown the angle it is given, while I.12 calling
    // I.10 has no such line to hand and does not need to be asked for one.
    for (const want of M.givensOf(tool)) {
      if (!want.id || bind.has(want.id)) continue
      const id = idFor(want.id)
      const made = build(id, { op: 'segment', a: ref(want.from), b: ref(want.to), color: want.color, dash: want.dash }, {
        stepIndex,
        hidden: true,
        ghost: true,
        beyond: call.beyond,
        fromTool: call.toolId,
      })
      if (!made) {
        ok = false
        error = error || 'Part of this construction could not be carried out here.'
      }
      bind.set(want.id, id)
    }

    for (const body of tool.body || []) {
      if (body.op === 'macro') {
        const outIds = (body.out || []).map(idFor)
        // A tool may settle its own nested choices; whatever it leaves open
        // bubbles up to the reader under a path-qualified name.
        const nestedPath = path ? `${path}.${body.id}` : body.id
        const picks = { ...call.picks }
        for (const [k, v] of Object.entries(body.picks || {})) picks[`${nestedPath}.${k}`] = v
        // What the calling step asked for only as scaffolding stays scaffolding.
        const working = new Set((body.working || []).map(idFor))
        const res = runMacro(
          {
            toolId: body.tool,
            argIds: (body.args || []).map(ref),
            outIds,
            prefix: call.prefix + body.id + '/',
            visible: new Set(outIds.filter((id) => call.visible.has(id) && !working.has(id))),
            expanded: call.expanded,
            beyond: call.beyond,
            picks,
            colors: call.colors,
            dashes: call.dashes,
            thicks: call.thicks,
            path: nestedPath,
          },
          stepIndex,
          depth + 1,
        )
        if (!res.ok) {
          ok = false
          error = error || res.error
        }
        needsChoice = needsChoice || res.needsChoice
        produced.push(...res.produced)
        visibleCurves.push(...res.visibleCurves)
        // The tool doing the calling has the last word on what the thing is
        // called: I.31 hands back a parallel, however it happened to draw it.
        // A name is keyed by the object, not the step, so a macro's outputs are
        // named one by one.
        ;(body.out || []).forEach((local, i) => nameTheOutput(tool, local, outIds[i], call.argIds, ref))
        continue
      }
      const id = idFor(body.id)
      const shown = call.visible.has(id)
      let def = D.remapRefs(body, ref)
      if (body.choose) {
        // Two circles cut in two places, and only the reader can say which one
        // is wanted. Until they do, the step simply has not been carried out.
        const picked = call.picks ? call.picks[keyFor(body.choose)] : undefined
        if (picked === undefined) {
          ok = false
          error = error || 'This construction offers a choice; it is waiting on you.'
          needsChoice = needsChoice || { key: keyFor(body.choose), at: id, options: body.options || [0, 1] }
          continue
        }
        def = { ...def, branch: picked }
      }
      const obj = build(id, def, {
        stepIndex,
        hidden: call.beyond || (!shown && !call.expanded),
        ghost: !shown,
        beyond: call.beyond,
        fromTool: call.toolId,
      })
      if (!obj) {
        ok = false
        error = error || 'Part of this construction could not be carried out here.'
        continue
      }
      if (call.colors && call.colors[id]) obj.color = call.colors[id]
      if (call.dashes && id in call.dashes) obj.dash = call.dashes[id]
      if (call.thicks && id in call.thicks) obj.thick = call.thicks[id]
      nameTheOutput(tool, body.id, id, call.argIds, ref)
      produced.push(id)
      if (shown && obj.type === 'curve') visibleCurves.push(id)
    }
    return { ok, error, needsChoice, produced, visibleCurves }
  }

  // Scrubbing back through a proof hides the later steps rather than skipping
  // them, so the step list stays whole and every step keeps its prose.
  let moveNumber = 0
  const claims = []
  for (let i = 0; i < doc.steps.length; i++) {
    const step = doc.steps[i]
    const beyond = i >= upTo
    // Setting out the given figure is not part of the construction, so those
    // steps are not numbered and the construction proper begins at 1.
    const setup = !!step.setup
    if (!setup) moveNumber += 1
    const info = { index: i, step, setup, number: setup ? null : moveNumber, ok: true, error: null, produced: [], beyond }
    if (step.op === 'claim') {
      // A claim draws nothing, so there is nothing to build. Whether it is true
      // as the figure now stands is worked out below, once every point is
      // placed — a claim may be about points a later step has still to move.
      claims.push(info)
    } else if (step.op === 'macro') {
      const outIds = step.out || []
      // A construction may want part of what a tool hands back only as
      // scaffolding — I.2 gives a point and the line to it, and a step that
      // wanted the length alone should not spend a letter on the point.
      const working = new Set(step.working || [])
      const res = runMacro(
        {
          toolId: step.tool,
          argIds: step.args || [],
          givens: step.givens || null,
          outIds,
          prefix: step.id + '/',
          visible: new Set(outIds.filter((id) => !working.has(id))),
          expanded: !!step.expanded,
          beyond,
          picks: step.picks || {},
          colors: step.colors || null,
          dashes: step.dashes || null,
          thicks: step.thicks || null,
          path: '',
        },
        i,
        0,
      )
      info.ok = res.ok
      info.error = res.error
      info.needsChoice = res.needsChoice
      info.produced = res.produced
      // The step doing the calling has the last word on what a thing is called,
      // so a written-out proposition's own names go on after the tool's.
      for (const [id, role] of Object.entries(step.roles || {})) {
        const made = objects.get(id)
        if (made) made.role = role
      }
      if (!beyond) generateAutos(res.visibleCurves, i)
    } else {
      // A step may declare itself working: the circle that carries a length to
      // where it is wanted, the line produced only so a point can be taken on
      // it. Byrne draws none of that, and neither does the figure — but it is
      // there, and one press shows it, which is the difference between a
      // construction and a picture.
      const scaffolding = !!step.working && !step.expanded
      const obj = build(step.id, step, {
        stepIndex: i,
        hidden: beyond || scaffolding,
        ghost: !!step.working,
        beyond,
        role: step.role || undefined,
      })
      if (!obj) {
        info.ok = false
        info.error = failureText(step)
      } else {
        info.produced = [step.id]
        // A curve nobody can see should not litter the page with the points it
        // happens to cut. Show the working and its intersections come back.
        if (obj.type === 'curve' && !beyond && !obj.hidden) generateAutos([step.id], i)
      }
    }
    stepInfos.push(info)
  }

  // An intersection is knowable before anything names it, so the circles of I.1
  // put a point at each crossing the moment they are drawn — and then the step
  // that names one puts a second object in the same place. One of them is
  // invisible, catches clicks, and can be rubbed out on its own. Take it away:
  // where a step has named a point, that named point is the point.
  pruneShadowedAutos(objects, order, doc)
  letterThePoints(objects, order, doc)

  // Claims are settled last, against the finished figure: a claim is about how
  // the figure stands, not about the moment it was written down.
  const reading = { get, objects }
  for (const info of claims) {
    const step = info.step
    const verdict = MAG.holds(step, reading)
    info.claim = { verdict }
    if (verdict === null) {
      info.ok = false
      info.error = 'This cannot be read off the figure as it stands.'
    } else if (!verdict) {
      info.ok = false
      info.error = 'This does not hold.'
    }
  }

  const scene = {
    objects,
    order,
    steps: stepInfos,
    /** How many steps set out the givens before the construction begins. */
    setupCount: stepInfos.filter((s) => s.setup).length,
    moves: moveNumber,
    tools,
    get,
    getPoint,
    getCurve,
    name: (id) => shortName(objects, id),
    bounds: () => sceneBounds(objects, order),
  }
  for (const info of stepInfos) {
    // `parts` keeps the names as names so they can be printed in the colours
    // they are drawn in; `text` is the same sentence flattened, for anything
    // that only wants a string.
    info.parts = describeStep(objects, tools, info.step, info.index)
    info.text = info.parts.map((part) => (typeof part === 'string' ? part : part.text)).join('')
  }
  return scene
}

function evaluate(def, getPoint, getCurve) {
  switch (def.op) {
    case 'point':
      return { type: 'point', pos: { x: def.x, y: def.y } }
    case 'onCurve': {
      const c = getCurve(def.curve)
      if (!c) return null
      return { type: 'point', pos: G.pointAt(c.geom, def.t) }
    }
    case 'inter': {
      const a = getCurve(def.c1)
      const b = getCurve(def.c2)
      if (!a || !b) return null
      const p = G.intersect(a.geom, b.geom)[def.branch | 0]
      if (!p) return null
      return { type: 'point', pos: p }
    }
    case 'segment':
    case 'ray':
    case 'line': {
      const a = getPoint(def.a)
      const b = getPoint(def.b)
      if (!a || !b) return null
      const t0 = def.op === 'line' ? -Infinity : 0
      const t1 = def.op === 'segment' ? 1 : Infinity
      const geom = G.lineThrough(a.pos, b.pos, t0, t1)
      return geom ? { type: 'curve', geom } : null
    }
    case 'circle': {
      const o = getPoint(def.o)
      const r = getPoint(def.r)
      if (!o || !r) return null
      const geom = G.circleThrough(o.pos, r.pos)
      return geom ? { type: 'curve', geom } : null
    }
    case 'angle': {
      // A mark, not a magnitude and not a figure: it draws the wedge Byrne
      // fills in, and nothing else in the scene may cut it or stand on it.
      const v = getPoint(def.v)
      const a = getPoint(def.a)
      const b = getPoint(def.b)
      if (!v || !a || !b) return null
      if (G.dist(v.pos, a.pos) < 1e-9 || G.dist(v.pos, b.pos) < 1e-9) return null
      return { type: 'mark', at: v.pos, from: a.pos, to: b.pos }
    }
    default:
      return null
  }
}

function failureText(step) {
  switch (step.op) {
    case 'angle':
      return 'The angle has no arms: two of these points fall together.'
    case 'inter':
      return 'These no longer cut one another.'
    case 'onCurve':
      return 'The line this point was taken on is gone.'
    case 'segment':
    case 'ray':
    case 'line':
      return 'The two points have come together, so no straight line is determined.'
    case 'circle':
      return 'The centre and the point on the circumference have come together.'
    default:
      return 'This step cannot be carried out.'
  }
}

/* ------------------------------------------------------------------ *
 * Lettering
 * ------------------------------------------------------------------ */

function* letters() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const subscripts = '₁₂₃₄₅₆₇₈₉'
  for (const ch of alphabet) yield ch
  for (const sub of subscripts) for (const ch of alphabet) yield ch + sub
  for (let n = 10; ; n++) for (const ch of alphabet) yield ch + n
}

/**
 * Points get letters in the order they come into being. Automatic
 * intersections stay anonymous dots until some later step actually uses one —
 * which is how a figure in the text gets lettered, and keeps a page of circles
 * from turning into alphabet soup.
 */
/**
 * Drop an anonymous intersection that a named point has landed on top of.
 *
 * Only the anonymous one goes, and only if nothing refers to it: a step that
 * leans on an intersection has earned it, whatever else happens to be there.
 */
function pruneShadowedAutos(objects, order, doc) {
  const named = []
  for (const id of order) {
    const o = objects.get(id)
    if (o && o.type === 'point' && !o.auto && !o.hidden && !o.ghost) named.push(o.pos)
  }
  if (!named.length) return
  const referred = new Set()
  for (const step of doc.steps) for (const ref of D.refsOf(step)) referred.add(ref)
  for (const id of [...order]) {
    const o = objects.get(id)
    if (!o || !o.auto || referred.has(id)) continue
    if (!named.some((p) => G.dist(p, o.pos) < G.MERGE_TOLERANCE)) continue
    objects.delete(id)
    order.splice(order.indexOf(id), 1)
  }
}

function letterThePoints(objects, order, doc) {
  const next = letters()
  const give = (id) => {
    const o = objects.get(id)
    if (!o || o.type !== 'point' || o.label || o.ghost) return
    if (o.hidden && !o.beyond) return
    o.label = next.next().value
  }

  // Walk the steps in order. Each step first letters any anonymous
  // intersection it uses — an intersection earns its letter at the moment
  // something refers to it — and then whatever it produces.
  //
  // Doing it this way rather than by position in the scene is what keeps
  // letters still. A point that has been called C stays C: a later step that
  // finally names an intersection drawn long ago appends a letter rather than
  // inserting one and pushing every letter after it along by one.
  for (const step of doc.steps) {
    for (const ref of D.refsOf(step)) give(ref)
    give(step.id)
    for (const out of step.out || []) give(out)
  }
}

/**
 * What a thing is called, and how it is drawn.
 *
 * A name is not plain text: on the page a line called AB is a coloured stroke,
 * and the prose is easier to read against the figure if the name carries the
 * colour with it. So a name is returned as a piece the printer can decorate —
 * the letters, what kind of thing it is, and its colour — and `text` is the
 * same thing flattened for anything that only wants a string.
 */
/**
 * Two lettered points that lie on a curve, in letter order.
 *
 * A line raised inside a tool is drawn between one lettered point and a hidden
 * one, so it cannot be called AE — but by the time the figure is finished there
 * are usually two lettered points sitting on it, and naming it by those is
 * exactly what Euclid does. `avoid` keeps a step from naming a line after the
 * very point it is in the middle of defining.
 */
function letteredOn(objects, curve, avoid) {
  const found = []
  for (const o of objects.values()) {
    if (o.type !== 'point' || !o.label || o.ghost) continue
    if (avoid && avoid.has(o.id)) continue
    if (G.distanceToCurve(curve.geom, o.pos) > 1e-6) continue
    found.push(o.label)
    if (found.length === 2) break
  }
  return found.length === 2 ? found.join('') : null
}

/** A tool's name for what it produced, with the letters filled in. */
function roleOf(objects, o) {
  if (!o.role) return null
  return o.role.template.replace(/\{(\d+)\}/g, (_, n) => {
    const arg = objects.get(o.role.args[Number(n)])
    return (arg && arg.label) || '•'
  })
}

function nameOf(objects, id, avoid) {
  const o = objects.get(id)
  if (!o) return { text: '?' }
  if (o.type === 'point') return { text: o.label || '•', letters: o.label || '•', kind: 'point' }
  const d = o.def || {}
  // A mark is not a line, so it takes no bar: the angle sign and the three
  // letters, in the colour the wedge is filled.
  if (o.type === 'mark') {
    const letters = [d.a, d.v, d.b].map((x) => (objects.get(x) || {}).label || '•').join('')
    return { text: `∠${letters}`, letters, kind: 'angle', color: o.color }
  }
  const p = (x) => {
    const q = objects.get(x)
    return (q && q.label) || '•'
  }
  const named = (letters, kind, mark = '') => {
    // A line drawn to a point that never earned a letter — the far end of a
    // perpendicular raised inside a tool, say — cannot be called AE. Two
    // lettered points that happen to lie on it will do instead; failing that,
    // what the tool calls it; failing that, what kind of thing it is.
    if (letters.includes('•')) {
      const found = kind === 'circle' ? null : letteredOn(objects, o, avoid)
      if (found) return { text: found + mark, letters: found, kind, color: o.color }
      return { text: roleOf(objects, o) || DESCRIPTION[kind] || 'the figure' }
    }
    return { text: kind === 'circle' ? mark + letters : letters + mark, letters, kind, color: o.color, thick: !!o.thick }
  }
  switch (d.op) {
    case 'segment':
      return named(`${p(d.a)}${p(d.b)}`, 'segment')
    case 'ray':
      return named(`${p(d.a)}${p(d.b)}`, 'ray', '→')
    case 'line':
      return named(`${p(d.a)}${p(d.b)}`, 'line', '↔')
    case 'circle':
      return named(`${p(d.o)}${p(d.r)}`, 'circle', '⊙')
    default:
      return { text: 'the figure' }
  }
}

const DESCRIPTION = {
  segment: 'a straight line',
  ray: 'a straight line produced',
  line: 'a straight line drawn both ways',
  circle: 'a circle',
}

function shortName(objects, id) {
  return nameOf(objects, id).text
}

/**
 * The closed figure a step completes, if it completes one.
 *
 * A tool that hands back a point and the two lines to it has drawn a triangle,
 * and saying so — △ABD — is how the book would put it, rather than reciting
 * the parts. Only segments already drawn by this step or before it count, so a
 * later step cannot retrospectively close a figure for an earlier one.
 */
function closedFigure(objects, step, upToIndex) {
  const corners = new Set()
  const sides = []
  for (const id of [...(step.args || []), ...(step.out || [])]) {
    const o = objects.get(id)
    if (o && o.type === 'point') corners.add(id)
  }
  for (const o of objects.values()) {
    if (o.type !== 'curve' || (o.def || {}).op !== 'segment' || o.hidden || o.ghost) continue
    if (o.stepIndex > upToIndex) continue
    if (!corners.has(o.def.a) || !corners.has(o.def.b)) continue
    sides.push([o.def.a, o.def.b])
  }
  if (corners.size < 3 || sides.length !== corners.size) return null

  const next = new Map([...corners].map((id) => [id, []]))
  for (const [a, b] of sides) {
    next.get(a).push(b)
    next.get(b).push(a)
  }
  if ([...next.values()].some((ends) => ends.length !== 2)) return null

  // Walk the cycle from the earliest letter, towards its earlier neighbour, so
  // the same figure is always named the same way.
  const letter = (id) => (objects.get(id) || {}).label || ''
  const start = [...corners].sort((a, b) => letter(a).localeCompare(letter(b)))[0]
  const walk = [start]
  let from = start
  let here = next.get(start).slice().sort((a, b) => letter(a).localeCompare(letter(b)))[0]
  while (here !== start) {
    walk.push(here)
    const [x, y] = next.get(here)
    const onward = x === from ? y : x
    from = here
    here = onward
    if (walk.length > corners.size) return null
  }
  if (walk.length !== corners.size || walk.length !== 3) return null
  return { text: `△${walk.map(letter).join('')}`, kind: 'figure' }
}

/**
 * How a proof cites its authority, written the way the book cites it.
 *
 * Byrne prints the reason in the margin beside the line it justifies —
 * (def. 15), (ax. 1), (I. 4) — and a proof that does not say why is not a
 * proof, so a claim carries its reason with it.
 */
/**
 * How the book would write down what allows a claim.
 *
 * Byrne's `const.` and `hyp.` cite nothing numbered: the construction is what
 * is on the paper, and the hypothesis is what the proposition supposed. In a
 * sketchpad they are the commonest reasons of all, since the figure *is* the
 * construction and its supposition was built rather than promised.
 */
export const BARE_REASONS = { const: 'const.', hyp: 'hyp.' }

export function citation(because) {
  if (!because) return null
  if (BARE_REASONS[because.kind]) return BARE_REASONS[because.kind]
  if (because.n == null) return null
  const kind = { def: 'def.', post: 'post.', ax: 'ax.', prop: null }[because.kind]
  return kind ? `${kind} ${because.n}` : `I.${because.n}`
}

function describeClaim(objects, step) {
  const letter = (id) => {
    const o = objects.get(id)
    return (o && o.label) || '•'
  }
  const parts = []
  const magnitude = (mag) => {
    // A sum is written out with its parts named one by one, so each keeps its
    // own colour.
    if (mag.kind === 'sum') {
      mag.of.forEach((part, i) => {
        if (i) parts.push(' + ')
        magnitude(part)
      })
      return
    }
    // A magnitude reads off the figure, so it is coloured like the figure: a
    // length takes the colour of the line drawn along it when there is one.
    const drawn = mag.kind === 'length' ? drawnBetween(objects, mag.pts[0], mag.pts[1]) : null
    parts.push({
      text: MAG.nameOf(mag, letter),
      letters: MAG.nameOf(mag, letter),
      kind: drawn ? 'segment' : 'magnitude',
      color: drawn ? drawn.color : null,
    })
  }
  magnitude(step.of[0])
  parts.push(` ${MAG.signOf(step)} `)
  magnitude(step.of[1])
  const why = citation(step.because)
  parts.push(why ? ` (${why}).` : '.')
  return parts
}

/** The straight line already drawn between two points, if there is one. */
function drawnBetween(objects, a, b) {
  for (const o of objects.values()) {
    if (o.type !== 'curve' || o.hidden || o.ghost) continue
    const d = o.def || {}
    if (d.op !== 'segment') continue
    if ((d.a === a && d.b === b) || (d.a === b && d.b === a)) return o
  }
  return null
}

function describeStep(objects, tools, step, index) {
  const n = (id) => shortName(objects, id)
  const name = (id) => nameOf(objects, id)
  switch (step.op) {
    case 'claim':
      return describeClaim(objects, step)
    case 'point':
      return ['Let the point ', name(step.id), ' be placed.']
    case 'onCurve':
      return ['Let a point ', name(step.id), ' be taken at random on ', name(step.curve), '.']
    case 'inter': {
      // A line must not be named after the point this very step is defining.
      const notYet = new Set([step.id])
      return ['Let ', name(step.id), ' be the point in which ', nameOf(objects, step.c1, notYet),
        ' and ', nameOf(objects, step.c2, notYet), ' cut one another.']
    }
    case 'angle':
      return ['Let ', name(step.id), ' be marked.']
    case 'segment':
      return step.given
        ? ['Let ', name(step.id), ' be the given straight line.']
        : ['Let ', name(step.id), ' be joined.']
    case 'ray':
      return ['Let ', name(step.id), ' be produced beyond ', name(step.b), '.']
    case 'line':
      return ['Let the straight line through ', n(step.a), ' and ', n(step.b), ' be drawn.']
    case 'circle': {
      // "With centre A and distance AB let ⊙AB be described" needs the point
      // the circumference passes through to have a letter. Where it has none —
      // a length carried to A by I.2 and then swept round — saying it twice
      // over would read "with distance A• let the circle about A…", so the
      // circle's own name carries the whole of it.
      const through = n(step.r)
      if (through === '•') return ['Let ', name(step.id), ' be described.']
      return ['With centre ', n(step.o), ' and distance ', n(step.o), through,
        ' let ', name(step.id), ' be described.']
    }
    case 'macro': {
      const tool = tools.get(step.tool)
      const called = tool ? tool.ref || tool.name : step.tool
      const args = (step.args || []).map(n).join(', ')
      const figure = closedFigure(objects, step, index)
      // What was wanted only as scaffolding is not a result to announce.
      const working = new Set(step.working || [])
      const outs = figure ? [figure]
        : (step.out || []).filter((id) => !working.has(id)).map(name)
          .filter((o) => o.text && o.text !== '?' && o.text !== '•')
      const gives = []
      outs.forEach((out, i) => {
        gives.push(i === 0 ? ', giving ' : ' and ')
        gives.push(out)
      })
      return [`By ${called}, applied to ${args}`, ...gives, '.']
    }
    default:
      return [step.op]
  }
}

function sceneBounds(objects, order) {
  const pts = []
  for (const id of order) {
    const o = objects.get(id)
    if (!o || o.hidden) continue
    if (o.type === 'point') pts.push(o.pos)
    // A mark sits inside the figure it marks and can never enlarge it.
    else if (o.type === 'mark') continue
    else if (o.geom.kind === 'circle') {
      pts.push({ x: o.geom.c.x - o.geom.r, y: o.geom.c.y - o.geom.r })
      pts.push({ x: o.geom.c.x + o.geom.r, y: o.geom.c.y + o.geom.r })
    } else {
      pts.push(o.geom.a, o.geom.b)
    }
  }
  return G.boundsOf(pts, 24)
}
