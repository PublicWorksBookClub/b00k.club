/**
 * Turning a construction into a tool.
 *
 * This is the part that makes the app Euclidean rather than a drawing program.
 * Once a proposition has been carried out, it may be used forever after as a
 * single move — so a tool is nothing more than a slice of the step list with
 * some of its objects declared to be the givens and some declared to be what is
 * produced.
 *
 * Extraction walks back from the chosen outputs to the chosen inputs and keeps
 * whatever it passes through. Two wrinkles:
 *
 *   - Automatic intersections carry no step of their own, so any that the
 *     construction leans on are written out as explicit `inter` steps in the
 *     tool's body. A tool is therefore closed: replaying it never depends on
 *     what else happens to be drawn on the page.
 *   - A free point that is neither an input nor derived from one would make the
 *     tool depend on where the author happened to click. That is refused, and
 *     the offending points are handed back so the caller can offer to promote
 *     them to inputs.
 */

import * as D from './doc.js'

export function extractTool(doc, scene, spec) {
  const inputIds = spec.inputIds || []
  const outputIds = spec.outputIds || []
  if (!inputIds.length) return { ok: false, error: 'Choose at least one given — the things the tool is applied to.' }
  if (!outputIds.length) return { ok: false, error: 'Choose at least one result — the things the tool produces.' }
  for (const id of outputIds) {
    if (inputIds.includes(id))
      return { ok: false, error: `${scene.name(id)} is both a given and a result. Pick something else as the result.` }
  }

  const inputs = new Set(inputIds)
  const neededSteps = new Map()
  const synthetic = new Map()
  const freePoints = []
  const unknown = []
  const seen = new Set()

  const want = (objId) => {
    if (!objId || inputs.has(objId) || seen.has(objId)) return
    seen.add(objId)
    const auto = D.parseAutoId(objId)
    if (auto) {
      synthetic.set(objId, auto)
      want(auto.c1)
      want(auto.c2)
      return
    }
    const step = D.stepProducing(doc, objId)
    if (!step) {
      unknown.push(objId)
      return
    }
    if (neededSteps.has(step.id)) return
    neededSteps.set(step.id, step)
    if (step.op === 'point') freePoints.push(step)
    for (const r of D.refsOf(step)) want(r)
  }
  for (const id of outputIds) want(id)

  if (unknown.length) {
    return { ok: false, error: `${unknown.map((id) => scene.name(id)).join(', ')} could not be traced back to a step.` }
  }
  if (freePoints.length) {
    return {
      ok: false,
      error:
        freePoints.length === 1
          ? `${scene.name(freePoints[0].id)} was placed by hand, so it has to be one of the givens.`
          : `${freePoints.map((s) => scene.name(s.id)).join(', ')} were placed by hand, so they have to be among the givens.`,
      missingInputs: freePoints.map((s) => s.id),
    }
  }

  // Document order is a valid order for the steps; synthesised intersections
  // slot in just after the later of the two curves they need.
  const indexOfStep = new Map(doc.steps.map((s, i) => [s.id, i]))
  const indexOfObject = (objId) => {
    if (inputs.has(objId)) return -1
    const step = D.stepProducing(doc, objId)
    return step ? indexOfStep.get(step.id) : -1
  }

  const entries = []
  for (const step of neededSteps.values()) entries.push({ sort: indexOfStep.get(step.id), kind: 'step', step })
  for (const [autoId, auto] of synthetic) {
    entries.push({ sort: Math.max(indexOfObject(auto.c1), indexOfObject(auto.c2)) + 0.5, kind: 'synthetic', autoId, auto })
  }
  entries.sort((a, b) => a.sort - b.sort)

  const map = new Map()
  inputIds.forEach((id, i) => map.set(id, 'i' + i))
  let counter = 0
  const local = () => 'l' + counter++
  const ref = (id) => map.get(id) || id
  const body = []
  const uses = new Set()

  for (const entry of entries) {
    if (entry.kind === 'synthetic') {
      const id = local()
      map.set(entry.autoId, id)
      body.push({ op: 'inter', id, c1: ref(entry.auto.c1), c2: ref(entry.auto.c2), branch: entry.auto.branch })
      continue
    }
    const step = entry.step
    if (step.op === 'macro') {
      const id = local()
      const out = (step.out || []).map((o) => {
        const l = local()
        map.set(o, l)
        return l
      })
      uses.add(step.tool)
      body.push({ op: 'macro', id, tool: step.tool, args: (step.args || []).map(ref), out })
      continue
    }
    const id = local()
    const rewritten = D.remapRefs(step, ref)
    delete rewritten.g
    map.set(step.id, id)
    body.push({ ...rewritten, id })
  }

  const outputs = outputIds.map((id) => map.get(id))
  if (outputs.some((o) => !o)) return { ok: false, error: 'One of the results could not be traced back to the givens.' }

  const tool = {
    id: spec.id || slugId(spec.name || 'tool'),
    name: (spec.name || '').trim() || 'Untitled construction',
    ref: (spec.ref || '').trim() || null,
    abbr: (spec.abbr || '').trim() || initials(spec.name || 'T'),
    summary: (spec.summary || '').trim() || null,
    inputs: inputIds.map((id, i) => ({ id: 'i' + i, kind: scene.get(id)?.type === 'curve' ? 'curve' : 'point', label: scene.name(id) })),
    body,
    outputs,
    uses: [...uses],
    createdAt: spec.createdAt || null,
  }
  return { ok: true, tool }
}

/** A tool plus everything it leans on, dependencies first. */
export function collectToolDeps(tool, registry, seen = new Set()) {
  const out = []
  for (const id of tool.uses || []) {
    if (seen.has(id)) continue
    seen.add(id)
    const dep = registry.get ? registry.get(id) : registry[id]
    if (!dep) continue
    out.push(...collectToolDeps(dep, registry, seen))
    out.push(dep)
  }
  return out
}

/** Build the document step that applies `tool` to the given objects. */
export function makeToolStep(doc, tool, argIds, gesture, givens = null) {
  const step = {
    op: 'macro',
    id: D.newId(doc, 'm'),
    tool: tool.id,
    args: [...argIds],
    out: (tool.outputs || []).map(() => D.newId(doc, 'o')),
    g: gesture,
  }
  // Which object is standing in for each line the proposition is handed, so
  // that "let a point be taken at random on AB" means the AB that was given
  // rather than a second one drawn on top of it.
  if (givens && Object.keys(givens).length) step.givens = { ...givens }
  return step
}

/**
 * What a tool is given, as a list of {from, to, id, …}.
 *
 * The older, shorter form — a pair of input ids and an optional style — is
 * still read, since most propositions have nothing to say about their givens
 * beyond which two points they run between.
 */
export function givensOf(tool) {
  return (tool.given || []).map((g) =>
    (Array.isArray(g) ? { from: g[0], to: g[1], ...(g[2] || {}) } : { ...g }))
}

/**
 * A tool's name for something it draws, with its references resolved.
 *
 * `{0}`, `{1}` … are the things the tool was applied to, in the order they were
 * given. A template may also name a step of the construction — `{l4}` — for the
 * cases where what a thing is depends on something the tool drew rather than on
 * something it was handed: "the circle about A with radius {i1}{l2}". Both come
 * out as positions into one list of object ids, because that is all the prose
 * writer needs to know; it fills in the letters once every point has one.
 */
export function fillRole(template, resolve, argIds) {
  if (!template) return null
  const args = [...argIds]
  const text = template.replace(/\{([^}]+)\}/g, (whole, key) => {
    if (/^\d+$/.test(key)) return whole
    const id = resolve(key)
    if (!id) return whole
    args.push(id)
    return `{${args.length - 1}}`
  })
  return { template: text, args }
}

/**
 * Write a tool's construction out as ordinary steps, so it can be read and
 * scrubbed through one move at a time.
 *
 * Only the outermost level is unfolded: a body step that invokes an earlier
 * proposition stays a single step, which is the right granularity for reading —
 * by the time you reach I.3 you are not meant to re-derive I.2.
 *
 * Passing `outIds` binds the tool's results to ids that already exist, so an
 * applied tool can be unfolded in place and everything drawn from its results
 * carries on pointing at the same objects.
 */
export function inlineTool(doc, tool, argIds, gesture, outIds = null, givens = null) {
  const map = new Map()
  ;(tool.inputs || []).forEach((inp, i) => map.set(inp.id, argIds[i]))
  for (const [local, id] of Object.entries(givens || {})) map.set(local, id)
  if (outIds) (tool.outputs || []).forEach((local, i) => outIds[i] && map.set(local, outIds[i]))
  const ref = (r) => map.get(r) || r
  const claim = (local, prefix) => {
    const id = map.get(local) || D.newId(doc, prefix)
    map.set(local, id)
    return id
  }
  // What the tool calls the things it draws — "the bisector of the angle at A".
  // Applied as a single move these travel with the macro step; written out,
  // they have to travel with the steps themselves or a walked proposition
  // would talk about "a circle" where an applied one says what circle.
  const names = tool.names || {}
  const roleFor = (local) => fillRole(names[local], (key) => map.get(key), argIds)
  const added = []
  for (const body of tool.body || []) {
    let step
    if (body.op === 'macro') {
      const out = (body.out || []).map((o) => claim(o, 'o'))
      // Choices the tool settles for itself have to travel with it.
      step = { op: 'macro', id: D.newId(doc, 'm'), tool: body.tool, args: (body.args || []).map(ref), out, g: gesture }
      step.outLocals = [...(body.out || [])]
      if (body.remark) step.remark = body.remark
      if (body.picks) step.picks = { ...body.picks }
      // Some of what a tool hands back is wanted only as scaffolding. I.2 gives
      // a point and the line to it; a construction that only wants the length
      // says so, and the point stays working rather than taking a letter that
      // belongs to a corner of the figure.
      if (body.working) step.working = body.working.map((o) => map.get(o) || o)
      const roles = {}
      ;(body.out || []).forEach((local, i) => {
        const role = roleFor(local)
        if (role) roles[out[i]] = role
      })
      if (Object.keys(roles).length) step.roles = roles
    } else {
      step = { ...D.remapRefs(body, ref), id: claim(body.id, 'p'), g: gesture }
      const role = roleFor(body.id)
      if (role) step.role = role
    }
    // Which line of the tool's own body this step came from, so a proposition
    // corrected on the paper can be written back out as the file it came from.
    step.local = body.id
    D.addStep(doc, step)
    added.push(step)
  }
  return added
}

/** What the toolbar should ask the reader to click, in order. */
export function inputPrompts(tool) {
  return (tool.inputs || []).map((inp, i) => ({
    index: i,
    kind: inp.kind || 'point',
    label: inp.label || String.fromCharCode(65 + i),
    text: `Choose ${inp.kind === 'curve' ? 'a line or circle' : 'a point'} for ${inp.label || String.fromCharCode(65 + i)}`,
  }))
}

export function toolIsUsedBy(toolId, tools) {
  return tools.filter((t) => (t.uses || []).includes(toolId))
}

function slugId(name) {
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'tool'
  return `own.${slug}.${Math.random().toString(36).slice(2, 7)}`
}

function initials(name) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return 'T'
  if (words.length === 1) return words[0].slice(0, 2)
  return words
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}
