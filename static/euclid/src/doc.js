/**
 * The document: an ordered list of *steps*.
 *
 * A step is one thing the geometer did. Objects are what steps produce. Keeping
 * the ordered step list (rather than a bag of objects) as the source of truth
 * buys three things at once:
 *
 *   - the proof reads as a numbered list, and can be scrubbed back and forth;
 *   - a custom tool is literally a slice of this list, replayed with new inputs;
 *   - dragging is just "edit one step's numbers and re-run".
 *
 * Step shapes (`id` is the id of the object the step produces):
 *
 *   { op: 'point',    id, x, y }                 a point placed by hand
 *   { op: 'onCurve',  id, curve, t }             "let a point be taken at random on…"
 *   { op: 'inter',    id, c1, c2, branch }       a named intersection
 *   { op: 'segment',  id, a, b }                 postulate 1
 *   { op: 'ray',      id, a, b }                 postulate 2 (produced one way)
 *   { op: 'line',     id, a, b }                 postulate 2 (produced both ways)
 *   { op: 'circle',   id, o, r }                 postulate 3 (centre o, through r)
 *   { op: 'macro',    id, tool, args, out }      a previously proved construction
 *
 * A macro step produces one object per output of the tool it invokes; `out`
 * holds those objects' ids, so later steps can refer to them directly.
 *
 * Steps created by a single gesture share a `g` (gesture) id and are undone
 * together — clicking two fresh points and joining them is one undo, not three.
 */

export const DOC_VERSION = 1

export function createDoc(init = {}) {
  return { v: DOC_VERSION, seq: 0, steps: [], tools: [], meta: {}, ...init }
}

export function newId(doc, prefix = 's') {
  doc.seq = (doc.seq || 0) + 1
  return prefix + doc.seq
}

/** Ids this step refers to (its arguments), in argument order. */
export function refsOf(step) {
  switch (step.op) {
    case 'onCurve':
      return [step.curve]
    case 'inter':
      return [step.c1, step.c2]
    case 'segment':
    case 'ray':
    case 'line':
      return [step.a, step.b]
    case 'circle':
      return [step.o, step.r]
    case 'macro':
      return [...(step.args || [])]
    default:
      return []
  }
}

/** Ids of the objects this step produces and exposes to later steps. */
export function producesOf(step) {
  return step.op === 'macro' ? [...(step.out || [])] : [step.id]
}

/** Rewrite a step's argument ids through `fn`, leaving everything else alone. */
export function remapRefs(step, fn) {
  switch (step.op) {
    case 'onCurve':
      return { ...step, curve: fn(step.curve) }
    case 'inter':
      return { ...step, c1: fn(step.c1), c2: fn(step.c2) }
    case 'segment':
    case 'ray':
    case 'line':
      return { ...step, a: fn(step.a), b: fn(step.b) }
    case 'circle':
      return { ...step, o: fn(step.o), r: fn(step.r) }
    case 'macro':
      return { ...step, args: (step.args || []).map(fn) }
    default:
      return { ...step }
  }
}

/* ------------------------------------------------------------------ *
 * Automatic intersections
 *
 * Every pair of drawn curves that meets yields knowable points, with no
 * step needed. Their ids are derived from the pair, so they survive a
 * rebuild and can be referenced by later steps like any other object.
 * ------------------------------------------------------------------ */

export const AUTO_PREFIX = 'x:'

export const autoId = (c1, c2, branch) => `${AUTO_PREFIX}${c1}~${c2}~${branch}`

export function parseAutoId(id) {
  if (typeof id !== 'string' || !id.startsWith(AUTO_PREFIX)) return null
  const [c1, c2, branch] = id.slice(AUTO_PREFIX.length).split('~')
  if (!c1 || !c2 || branch === undefined) return null
  return { c1, c2, branch: Number(branch) }
}

/** The object ids an id depends on: itself, plus the parents of an auto point. */
function rootsOf(id) {
  const auto = parseAutoId(id)
  return auto ? [id, auto.c1, auto.c2] : [id]
}

/* ------------------------------------------------------------------ *
 * Editing
 * ------------------------------------------------------------------ */

export function addStep(doc, step) {
  doc.steps.push(step)
  return step
}

export function findStep(doc, stepId) {
  return doc.steps.find((s) => s.id === stepId) || null
}

/** The step that produced `objId` (auto points belong to no step). */
export function stepProducing(doc, objId) {
  return doc.steps.find((s) => producesOf(s).includes(objId)) || null
}

/**
 * Remove a step and everything that leans on it. Objects derived from a deleted
 * curve — including the automatic intersections it created — go with it.
 */
export function removeStep(doc, stepId) {
  const doomed = new Set()
  const seed = findStep(doc, stepId)
  if (!seed) return doc
  doomed.add(seed.id)
  for (const id of producesOf(seed)) doomed.add(id)

  let changed = true
  while (changed) {
    changed = false
    for (const step of doc.steps) {
      if (doomed.has(step.id)) continue
      const hit = refsOf(step).some((ref) => rootsOf(ref).some((r) => doomed.has(r)))
      if (!hit) continue
      doomed.add(step.id)
      for (const id of producesOf(step)) doomed.add(id)
      changed = true
    }
  }
  doc.steps = doc.steps.filter((s) => !doomed.has(s.id))
  return doc
}

/** Remove the whole gesture that produced `stepId` (see the `g` field). */
export function removeGestureOf(doc, stepId) {
  const step = findStep(doc, stepId)
  if (!step) return doc
  if (!step.g) return removeStep(doc, stepId)
  for (const s of doc.steps.filter((s) => s.g === step.g)) {
    if (findStep(doc, s.id)) removeStep(doc, s.id)
  }
  return doc
}

/* ------------------------------------------------------------------ *
 * Serialisation
 * ------------------------------------------------------------------ */

export function cloneDoc(doc) {
  return JSON.parse(JSON.stringify(doc))
}

export function serializeDoc(doc) {
  return JSON.stringify({ v: DOC_VERSION, seq: doc.seq, steps: doc.steps, tools: doc.tools, meta: doc.meta }, null, 2)
}

export function deserializeDoc(text) {
  const raw = typeof text === 'string' ? JSON.parse(text) : text
  if (!raw || !Array.isArray(raw.steps)) throw new Error('Not a sketch file: no steps found.')
  const doc = createDoc({ seq: raw.seq || 0, steps: raw.steps, tools: raw.tools || [], meta: raw.meta || {} })
  // Old files, or hand-written ones, may not carry a sequence counter high
  // enough to avoid colliding with the ids already in use.
  let max = doc.seq
  for (const s of doc.steps) {
    for (const id of [s.id, ...producesOf(s)]) {
      const n = Number(String(id).replace(/^\D+/, ''))
      if (Number.isFinite(n) && n > max) max = n
    }
  }
  doc.seq = max
  return doc
}
