import test from 'node:test'
import assert from 'node:assert/strict'

import * as G from '../src/geometry.js'
import * as D from '../src/doc.js'
import { solve } from '../src/solve.js'
import { extractTool, makeToolStep, inlineTool } from '../src/macros.js'
import { PROPOSITIONS } from '../src/propositions.js'

import { createSketch } from '../src/app.js'

const TOOLS = PROPOSITIONS

/** I.4's figure as the app sets it out, ready to be measured. */
function freshI4() {
  const app = createSketch()
  app.walkProposition('euclid.I.4')
  return app
}
const labelledIn = (app, label) => [...app.scene.objects.values()].find((o) => o.label === label).id
const tool = (id) => TOOLS.find((t) => t.id === id)

/* Deterministic pseudo-randomness, so a failure can actually be reproduced. */
function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function docWithPoints(points) {
  const doc = D.createDoc()
  const ids = points.map((p) => {
    const id = D.newId(doc, 'p')
    D.addStep(doc, { op: 'point', id, x: p.x, y: p.y })
    return id
  })
  return { doc, ids }
}

function apply(doc, toolId, argIds, picks = { apex: 0 }) {
  const step = makeToolStep(doc, tool(toolId), argIds, 'g')
  // I.1 leaves the side the triangle falls on to the reader; the tests say.
  if (picks) step.picks = picks
  D.addStep(doc, step)
  return step
}

const run = (doc, opts = {}) => solve(doc, { tools: TOOLS, ...opts })
const at = (scene, id) => {
  const o = scene.get(id)
  assert.ok(o, `object ${id} was not produced`)
  assert.equal(o.type, 'point')
  return o.pos
}
const close = (a, b, tol = 1e-6, what = '') => assert.ok(Math.abs(a - b) <= tol, `${what} expected ${b}, got ${a}`)

/* ------------------------------------------------------------------ *
 * Geometry
 * ------------------------------------------------------------------ */

test('line × circle numbers its roots along the line, and clipping does not renumber them', () => {
  const line = G.lineThrough({ x: 0, y: 0 }, { x: 10, y: 0 }, 0, Infinity)
  const circle = G.circleThrough({ x: 30, y: 0 }, { x: 40, y: 0 })
  const hits = G.intersect(line, circle)
  close(hits[0].x, 20, 1e-9, 'nearer root')
  close(hits[1].x, 40, 1e-9, 'further root')

  // The same circle, but the ray now starts beyond the nearer root: the
  // survivor must keep branch 1 rather than sliding down into branch 0.
  const shifted = G.lineThrough({ x: 25, y: 0 }, { x: 35, y: 0 }, 0, Infinity)
  const clipped = G.intersect(shifted, circle)
  assert.equal(clipped[0], null)
  close(clipped[1].x, 40, 1e-9, 'surviving root keeps its branch')
})

test('circle × circle keeps each branch on its own side while the figure moves', () => {
  let previous = null
  for (let i = 0; i <= 40; i++) {
    const angle = (i / 40) * Math.PI * 2
    const c1 = G.circleThrough({ x: 0, y: 0 }, { x: 100, y: 0 })
    const centre2 = { x: 120 * Math.cos(angle), y: 120 * Math.sin(angle) }
    const c2 = G.circleThrough(centre2, G.add(centre2, { x: 100, y: 0 }))
    const [p0] = G.intersect(c1, c2)
    assert.ok(p0, 'the circles should cut')
    // Branch 0 must stay on the left of centre-to-centre, i.e. never jump sides.
    const side = G.cross(G.sub(centre2, { x: 0, y: 0 }), G.sub(p0, { x: 0, y: 0 }))
    assert.ok(side > 0, 'branch 0 stayed on one side')
    if (previous) assert.ok(G.dist(previous, p0) < 40, 'branch 0 moved continuously')
    previous = p0
  }
})

test('a line is clipped to the viewport, and a line that misses it is dropped', () => {
  const rect = { minX: 0, minY: 0, maxX: 100, maxY: 100 }
  const through = G.fullLine({ x: -50, y: 50 }, { x: 150, y: 50 })
  const [a, b] = G.clipLineToRect(through, rect)
  close(a.x, 0, 1e-9)
  close(b.x, 100, 1e-9)
  assert.equal(G.clipLineToRect(G.fullLine({ x: -50, y: 500 }, { x: 150, y: 500 }), rect), null)
})

/* ------------------------------------------------------------------ *
 * Automatic intersections
 * ------------------------------------------------------------------ */

test('two circles that cut yield knowable points with no step of their own', () => {
  const { doc, ids } = docWithPoints([
    { x: 0, y: 0 },
    { x: 100, y: 0 },
  ])
  const [a, b] = ids
  const c1 = D.newId(doc, 'c')
  D.addStep(doc, { op: 'circle', id: c1, o: a, r: b })
  const c2 = D.newId(doc, 'c')
  D.addStep(doc, { op: 'circle', id: c2, o: b, r: a })

  const scene = run(doc)
  const autos = [...scene.objects.values()].filter((o) => o.auto)
  assert.equal(autos.length, 2)
  for (const p of autos) {
    close(G.dist(p.pos, { x: 0, y: 0 }), 100, 1e-9, 'lies on the first circle')
    close(G.dist(p.pos, { x: 100, y: 0 }), 100, 1e-9, 'lies on the second circle')
  }
  // Anonymous until something uses them.
  assert.ok(autos.every((p) => !p.label))

  const seg = D.newId(doc, 's')
  D.addStep(doc, { op: 'segment', id: seg, a: D.autoId(c1, c2, 0), b: D.autoId(c1, c2, 1) })
  const scene2 = run(doc)
  assert.ok(scene2.get(D.autoId(c1, c2, 0)).label, 'a point that gets used gets a letter')
  assert.ok(scene2.steps.every((s) => s.ok))
})

test('an intersection that ceases to exist invalidates what leant on it, and comes back', () => {
  const { doc, ids } = docWithPoints([
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 120, y: 0 },
    { x: 190, y: 0 },
  ])
  const [a, b, c, d] = ids
  const c1 = D.newId(doc, 'c')
  D.addStep(doc, { op: 'circle', id: c1, o: a, r: b })
  const c2 = D.newId(doc, 'c')
  D.addStep(doc, { op: 'circle', id: c2, o: c, r: d })
  const meet = D.newId(doc, 'i')
  D.addStep(doc, { op: 'inter', id: meet, c1, c2, branch: 0 })
  const chord = D.newId(doc, 's')
  D.addStep(doc, { op: 'segment', id: chord, a, b: meet })
  assert.ok(run(doc).get(meet))
  assert.ok(run(doc).get(chord))

  // Drag the second circle away: the two no longer cut one another.
  doc.steps.find((s) => s.id === c).x = 600
  doc.steps.find((s) => s.id === d).x = 670
  const broken = run(doc)
  assert.equal(broken.get(meet), null)
  assert.equal(broken.get(chord), null, 'and what leant on it falls with it')
  assert.equal(broken.steps.find((s) => s.step.id === meet).ok, false)
  assert.match(broken.steps.find((s) => s.step.id === meet).error, /cut one another/)

  doc.steps.find((s) => s.id === c).x = 120
  doc.steps.find((s) => s.id === d).x = 190
  const mended = run(doc)
  assert.ok(mended.get(meet), 'and it returns when the figure is dragged back')
  assert.ok(mended.get(chord))
  assert.ok(mended.steps.every((s) => s.ok))
})

/* ------------------------------------------------------------------ *
 * The propositions
 * ------------------------------------------------------------------ */

test('I.1 constructs an equilateral triangle on any given line', () => {
  const random = rng(7)
  for (let i = 0; i < 40; i++) {
    const A = { x: random() * 400 - 200, y: random() * 400 - 200 }
    const B = { x: random() * 400 - 200, y: random() * 400 - 200 }
    if (G.dist(A, B) < 1) continue
    const { doc, ids } = docWithPoints([A, B])
    const step = apply(doc, 'euclid.I.1', ids)
    const scene = run(doc)
    const C = at(scene, step.out[0])
    const side = G.dist(A, B)
    close(G.dist(A, C), side, side * 1e-9, 'AC')
    close(G.dist(B, C), side, side * 1e-9, 'BC')
  }
})

test('I.2 places at a given point a straight line equal to a given straight line', () => {
  const random = rng(11)
  let checked = 0
  for (let i = 0; i < 200; i++) {
    const A = { x: random() * 400 - 200, y: random() * 400 - 200 }
    const B = { x: random() * 400 - 200, y: random() * 400 - 200 }
    const C = { x: random() * 400 - 200, y: random() * 400 - 200 }
    if (G.dist(A, B) < 5 || G.dist(B, C) < 5) continue
    const { doc, ids } = docWithPoints([A, B, C])
    const step = apply(doc, 'euclid.I.2', ids)
    const scene = run(doc)
    assert.ok(
      scene.steps.every((s) => s.ok),
      `I.2 failed for A=${JSON.stringify(A)} B=${JSON.stringify(B)} C=${JSON.stringify(C)}`,
    )
    const L = at(scene, step.out[0])
    close(G.dist(A, L), G.dist(B, C), 1e-6, 'AL equals BC')
    checked++
  }
  assert.ok(checked > 150, `only ${checked} configurations were exercised`)
})

test('I.3 cuts off from the greater a straight line equal to the less', () => {
  const random = rng(23)
  let checked = 0
  for (let i = 0; i < 200; i++) {
    const A = { x: random() * 300 - 150, y: random() * 300 - 150 }
    const B = { x: random() * 300 - 150, y: random() * 300 - 150 }
    const P = { x: random() * 300 - 150, y: random() * 300 - 150 }
    const Q = { x: random() * 300 - 150, y: random() * 300 - 150 }
    const greater = G.dist(A, B)
    const lesser = G.dist(P, Q)
    if (lesser < 5 || greater < lesser * 1.05 || G.dist(A, P) < 5) continue
    const { doc, ids } = docWithPoints([A, B, P, Q])
    const step = apply(doc, 'euclid.I.3', ids)
    const scene = run(doc)
    assert.ok(
      scene.steps.every((s) => s.ok),
      'I.3 carried out',
    )
    const E = at(scene, step.out[0])
    close(G.dist(A, E), lesser, 1e-6, 'AE equals PQ')
    close(G.dist(A, E) + G.dist(E, B), greater, 1e-6, 'E lies on AB')
    checked++
  }
  assert.ok(checked > 60, `only ${checked} configurations were exercised`)
})

test('I.9 bisects the angle, including when it is exactly two thirds of a right angle', () => {
  const random = rng(31)
  const cases = []
  for (let i = 0; i < 120; i++) {
    cases.push({
      A: { x: random() * 200 - 100, y: random() * 200 - 100 },
      B: { x: random() * 400 - 200, y: random() * 400 - 200 },
      C: { x: random() * 400 - 200, y: random() * 400 - 200 },
    })
  }
  // The 60° case, in both orientations — this is what I.10 feeds it.
  for (const sign of [1, -1]) {
    cases.push({ A: { x: 0, y: 0 }, B: { x: 100, y: 0 }, C: { x: 50, y: sign * 86.60254037844386 } })
  }

  let checked = 0
  for (const { A, B, C } of cases) {
    const u = G.sub(B, A)
    const w = G.sub(C, A)
    if (G.len(u) < 20 || G.len(w) < 20) continue
    const between = Math.acos(Math.max(-1, Math.min(1, G.dot(u, w) / (G.len(u) * G.len(w)))))
    if (between < 0.05 || between > Math.PI - 0.05) continue

    const { doc, ids } = docWithPoints([A, B, C])
    const step = apply(doc, 'euclid.I.9', ids)
    const scene = run(doc)
    assert.ok(
      scene.steps.every((s) => s.ok),
      `I.9 carried out (angle ${between})`,
    )
    const bisector = scene.get(step.out[0])
    assert.equal(bisector.type, 'curve')

    // A must lie on it, and it must make equal angles with the two arms.
    close(G.distanceToCurve(bisector.geom, A), 0, 1e-6, 'the bisector passes through the vertex')
    const dir = G.scale(bisector.geom.d, 1 / G.len(bisector.geom.d))
    const angleTo = (arm) => {
      const cosine = Math.abs(G.dot(dir, G.scale(arm, 1 / G.len(arm))))
      return Math.acos(Math.max(-1, Math.min(1, cosine)))
    }
    close(angleTo(u), angleTo(w), 1e-6, 'equal angles with the two arms')
    checked++
  }
  assert.ok(checked > 80, `only ${checked} configurations were exercised`)
})

test('I.10 bisects the given straight line', () => {
  const random = rng(43)
  for (let i = 0; i < 60; i++) {
    const A = { x: random() * 400 - 200, y: random() * 400 - 200 }
    const B = { x: random() * 400 - 200, y: random() * 400 - 200 }
    if (G.dist(A, B) < 10) continue
    const { doc, ids } = docWithPoints([A, B])
    const step = apply(doc, 'euclid.I.10', ids)
    const scene = run(doc)
    assert.ok(
      scene.steps.every((s) => s.ok),
      'I.10 carried out',
    )
    const M = at(scene, step.out[0])
    close(M.x, (A.x + B.x) / 2, 1e-6, 'midpoint x')
    close(M.y, (A.y + B.y) / 2, 1e-6, 'midpoint y')
  }
})

test('a tool keeps its scaffolding out of sight but hands back its results', () => {
  const { doc, ids } = docWithPoints([
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 40, y: 120 },
  ])
  const step = apply(doc, 'euclid.I.2', ids)
  const scene = run(doc)
  const produced = scene.steps[3].produced.map((id) => scene.get(id)).filter(Boolean)
  const shown = produced.filter((o) => !o.hidden)
  assert.deepEqual(shown.map((o) => o.id).sort(), [...step.out].sort())
  assert.ok(produced.length > shown.length, 'the working is there but hidden')
  // Hidden scaffolding must not litter the page with intersections.
  assert.ok([...scene.objects.values()].every((o) => !o.auto || !o.hidden))
})

/* ------------------------------------------------------------------ *
 * Making new tools
 * ------------------------------------------------------------------ */

test('a construction carried out by hand can be saved as a tool and reused', () => {
  // Build I.1 from the postulates alone.
  const { doc, ids } = docWithPoints([
    { x: 0, y: 0 },
    { x: 100, y: 0 },
  ])
  const [a, b] = ids
  const c1 = D.newId(doc, 'c')
  D.addStep(doc, { op: 'circle', id: c1, o: a, r: b })
  const c2 = D.newId(doc, 'c')
  D.addStep(doc, { op: 'circle', id: c2, o: b, r: a })
  const apexId = D.autoId(c1, c2, 0) // an automatic intersection, never named by a step
  const s1 = D.newId(doc, 's')
  D.addStep(doc, { op: 'segment', id: s1, a, b: apexId })
  const s2 = D.newId(doc, 's')
  D.addStep(doc, { op: 'segment', id: s2, a: b, b: apexId })

  const scene = run(doc)
  const made = extractTool(doc, scene, {
    inputIds: [a, b],
    outputIds: [apexId, s1, s2],
    name: 'Equilateral triangle',
    ref: 'I.1',
    id: 'own.eq',
  })
  assert.ok(made.ok, made.error)
  const built = made.tool
  assert.equal(built.inputs.length, 2)
  assert.equal(built.outputs.length, 3)
  // The automatic intersection had to be written out as a step of its own.
  assert.ok(
    built.body.some((s) => s.op === 'inter'),
    'the intersection was made explicit',
  )
  assert.ok(
    built.body.every((s) => s.op !== 'point'),
    'no hand-placed points survive into the tool',
  )

  // Apply it somewhere else entirely.
  const fresh = docWithPoints([
    { x: -300, y: 40 },
    { x: -180, y: 210 },
  ])
  const step = makeToolStep(fresh.doc, built, fresh.ids, 'g')
  D.addStep(fresh.doc, step)
  const scene2 = solve(fresh.doc, { tools: [built] })
  assert.ok(scene2.steps.every((s) => s.ok))
  const P = scene2.get(fresh.ids[0]).pos
  const Q = scene2.get(fresh.ids[1]).pos
  const R = at(scene2, step.out[0])
  const side = G.dist(P, Q)
  close(G.dist(P, R), side, 1e-6, 'still equilateral')
  close(G.dist(Q, R), side, 1e-6, 'still equilateral')
})

test('a tool may not depend on a point that was merely placed by hand', () => {
  const { doc, ids } = docWithPoints([
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 20, y: 60 },
  ])
  const [a, b, stray] = ids
  const seg = D.newId(doc, 's')
  D.addStep(doc, { op: 'segment', id: seg, a, b: stray })
  const scene = run(doc)
  const made = extractTool(doc, scene, { inputIds: [a, b], outputIds: [seg], name: 'Bad' })
  assert.equal(made.ok, false)
  assert.deepEqual(made.missingInputs, [stray], 'and it says which point to promote')

  const fixed = extractTool(doc, scene, { inputIds: [a, b, stray], outputIds: [seg], name: 'Fine' })
  assert.ok(fixed.ok, fixed.error)
})

test('a tool built on another tool replays it', () => {
  const { doc, ids } = docWithPoints([
    { x: 0, y: 0 },
    { x: 120, y: 0 },
    { x: 30, y: 90 },
  ])
  const step = apply(doc, 'euclid.I.2', ids)
  const scene = run(doc)
  const made = extractTool(doc, scene, { inputIds: ids, outputIds: [step.out[1]], name: 'Copied line', id: 'own.copy' })
  assert.ok(made.ok, made.error)
  assert.deepEqual(made.tool.uses, ['euclid.I.2'])

  const fresh = docWithPoints([
    { x: 5, y: 5 },
    { x: 200, y: 10 },
    { x: 90, y: 160 },
  ])
  const call = makeToolStep(fresh.doc, made.tool, fresh.ids, 'g')
  D.addStep(fresh.doc, call)
  const scene2 = solve(fresh.doc, { tools: [...TOOLS, made.tool] })
  assert.ok(scene2.steps.every((s) => s.ok))
  const copied = scene2.get(call.out[0])
  assert.equal(copied.type, 'curve')
  const A = scene2.get(fresh.ids[0]).pos
  const B = scene2.get(fresh.ids[1]).pos
  const C = scene2.get(fresh.ids[2]).pos
  close(G.dist(copied.geom.a, copied.geom.b), G.dist(B, C), 1e-6, 'the copied length')
  close(G.dist(A, copied.geom.a), 0, 1e-6, 'placed at the given point')
})

/* ------------------------------------------------------------------ *
 * Reading a proof
 * ------------------------------------------------------------------ */

test('a proposition can be unfolded into steps and scrubbed through', () => {
  const { doc, ids } = docWithPoints([
    { x: 0, y: 0 },
    { x: 100, y: 20 },
    { x: 30, y: 120 },
  ])
  const added = inlineTool(doc, tool('euclid.I.2'), ids, 'walk')
  assert.equal(added.length, tool('euclid.I.2').body.length)
  const scene = run(doc)
  assert.ok(
    scene.steps.every((s) => s.ok),
    'every unfolded step stands on its own',
  )
  assert.ok(
    scene.steps.some((s) => s.step.op === 'macro'),
    'the appeal to I.1 stays a single step',
  )

  const L = added[added.length - 1]
  const A = scene.get(ids[0]).pos
  close(G.dist(A, at(scene, L.a === ids[0] ? L.b : L.a)), G.dist(scene.get(ids[1]).pos, scene.get(ids[2]).pos), 1e-6, 'AL equals BC')

  // Scrubbing back hides the later steps rather than dropping them, so the
  // whole proof stays listed and lettered while only part of it is drawn.
  const partial = run(doc, { upTo: 5 })
  assert.equal(partial.steps.length, scene.steps.length, 'the step list stays whole')
  assert.equal(partial.steps.filter((s) => !s.beyond).length, 5)
  assert.equal(partial.get(L.id).hidden, true, 'later steps are not drawn')
  assert.ok(partial.get(ids[0]).label, 'and what has been drawn keeps its letter')
  const drawn = [...partial.objects.values()].filter((o) => !o.hidden)
  assert.ok(drawn.every((o) => o.stepIndex < 5))
})

test('an intersection falling on a point the figure already has is not doubled', () => {
  const { doc, ids } = docWithPoints([
    { x: 0, y: 0 },
    { x: 100, y: 0 },
  ])
  const [a, b] = ids
  D.addStep(doc, { op: 'circle', id: D.newId(doc, 'c'), o: a, r: b })
  D.addStep(doc, { op: 'segment', id: D.newId(doc, 's'), a, b })
  // The circle meets AB at B, which is already there — one dot, not two.
  const scene = run(doc)
  assert.equal([...scene.objects.values()].filter((o) => o.auto).length, 0)
  assert.equal([...scene.objects.values()].filter((o) => o.type === 'point').length, 2)
})

test('unfolding an applied tool in place keeps whatever was drawn from its results', () => {
  const { doc, ids } = docWithPoints([
    { x: 0, y: 0 },
    { x: 120, y: 30 },
    { x: 40, y: 140 },
  ])
  const step = apply(doc, 'euclid.I.2', ids)
  const chord = D.newId(doc, 's')
  D.addStep(doc, { op: 'segment', id: chord, a: ids[2], b: step.out[0] })
  const before = run(doc)
  const wasAt = { ...before.get(step.out[0]).pos }
  assert.ok(before.get(chord))

  const at = doc.steps.indexOf(step)
  const start = doc.steps.length
  inlineTool(doc, tool('euclid.I.2'), step.args, 'walk', step.out)
  const added = doc.steps.splice(start)
  doc.steps.splice(at, 1, ...added)

  const after = run(doc)
  assert.ok(
    after.steps.every((s) => s.ok),
    'the unfolded steps all stand',
  )
  assert.ok(after.get(chord), 'the line drawn from the result is still there')
  close(G.dist(after.get(step.out[0]).pos, wasAt), 0, 1e-9, 'and the result did not move')
})

test('steps read as prose', () => {
  const { doc, ids } = docWithPoints([
    { x: 0, y: 0 },
    { x: 100, y: 0 },
  ])
  const c1 = D.newId(doc, 'c')
  D.addStep(doc, { op: 'circle', id: c1, o: ids[0], r: ids[1] })
  apply(doc, 'euclid.I.1', ids)
  const scene = run(doc)
  // The sentence names the circle as well as describing it, which is what
  // teaches the reader that ⊙AB means "centre A, distance AB" — and gives the
  // step list something to print in the colour the circle is drawn in.
  assert.equal(scene.steps[2].text, 'With centre A and distance AB let ⊙AB be described.')
  assert.equal(scene.steps[3].text, 'By I.1, applied to A, B, giving C and AC and BC.')
})

test('a tool that closes a figure says so', () => {
  // I.1 on a line already drawn hands back a triangle, and the step says
  // △ABC rather than reciting the point and the two sides.
  const { doc, ids } = docWithPoints([
    { x: 0, y: 0 },
    { x: 100, y: 0 },
  ])
  D.addStep(doc, { op: 'segment', id: D.newId(doc, 's'), a: ids[0], b: ids[1] })
  apply(doc, 'euclid.I.1', ids)
  assert.equal(run(doc).steps[3].text, 'By I.1, applied to A, B, giving △ABC.')
})

test('a name carries the colour and kind of the thing it names', () => {
  const { doc, ids } = docWithPoints([
    { x: 0, y: 0 },
    { x: 100, y: 0 },
  ])
  const seg = D.newId(doc, 's')
  D.addStep(doc, { op: 'segment', id: seg, a: ids[0], b: ids[1], color: 'red' })
  const scene = run(doc)
  const named = scene.steps[2].parts.find((p) => typeof p !== 'string' && p.kind)
  assert.deepEqual(
    { letters: named.letters, kind: named.kind, color: named.color },
    { letters: 'AB', kind: 'segment', color: 'red' },
  )
  assert.equal(scene.steps[2].text, 'Let AB be joined.')
})

test('a figure is only named when this step closed it', () => {
  // The same three points, but the base drawn afterwards: the tool did not
  // hand back a triangle, so it must not claim to have.
  const { doc, ids } = docWithPoints([
    { x: 0, y: 0 },
    { x: 100, y: 0 },
  ])
  apply(doc, 'euclid.I.1', ids)
  const before = run(doc).steps[2].text
  D.addStep(doc, { op: 'segment', id: D.newId(doc, 's'), a: ids[0], b: ids[1] })
  assert.equal(run(doc).steps[2].text, before)
  assert.match(before, /giving C and AC and BC\.$/)
})

/* ------------------------------------------------------------------ *
 * Editing
 * ------------------------------------------------------------------ */

test('removing a curve takes its intersections and everything downstream with it', () => {
  const { doc, ids } = docWithPoints([
    { x: 0, y: 0 },
    { x: 100, y: 0 },
  ])
  const [a, b] = ids
  const c1 = D.newId(doc, 'c')
  D.addStep(doc, { op: 'circle', id: c1, o: a, r: b })
  const c2 = D.newId(doc, 'c')
  D.addStep(doc, { op: 'circle', id: c2, o: b, r: a })
  const seg = D.newId(doc, 's')
  D.addStep(doc, { op: 'segment', id: seg, a, b: D.autoId(c1, c2, 0) })
  assert.equal(doc.steps.length, 5)

  D.removeStep(doc, c2)
  assert.deepEqual(
    doc.steps.map((s) => s.id),
    [a, b, c1],
    'the segment went with the intersection it used',
  )
  assert.ok(run(doc).steps.every((s) => s.ok))
})

test('a document survives a round trip through JSON', () => {
  const { doc, ids } = docWithPoints([
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 10, y: 90 },
  ])
  apply(doc, 'euclid.I.2', ids)
  doc.tools = [tool('euclid.I.1'), tool('euclid.I.2')]
  const back = D.deserializeDoc(D.serializeDoc(doc))
  assert.deepEqual(back.steps, doc.steps)
  assert.ok(back.seq >= doc.seq, 'ids will not collide after loading')
  const before = run(doc)
  const after = solve(back, { tools: TOOLS })
  assert.deepEqual([...after.objects.keys()], [...before.objects.keys()])
})

test('I.11 raises a perpendicular at the given point of the line', () => {
  const random = rng(59)
  let checked = 0
  for (let i = 0; i < 90; i++) {
    const A = { x: random() * 300 - 150, y: random() * 300 - 150 }
    const B = { x: random() * 300 - 150, y: random() * 300 - 150 }
    if (G.dist(A, B) < 20) continue
    const { doc, ids } = docWithPoints([A, B])
    const step = apply(doc, 'euclid.I.11', ids)
    const scene = run(doc)
    assert.ok(scene.steps.every((s) => s.ok), 'I.11 carried out')
    const perp = scene.get(step.out[0])
    close(G.distanceToCurve(perp.geom, A), 0, 1e-6, 'it stands on the given point')
    const along = G.scale(G.sub(B, A), 1 / G.dist(A, B))
    const up = G.scale(perp.geom.d, 1 / G.len(perp.geom.d))
    close(G.dot(along, up), 0, 1e-6, 'and at right angles to the line')
    checked++
  }
  assert.ok(checked > 60, `only ${checked} configurations were exercised`)
})

test('I.12 drops a perpendicular from a point off the line', () => {
  const random = rng(67)
  let checked = 0
  for (let i = 0; i < 90; i++) {
    const C = { x: random() * 300 - 150, y: random() * 300 - 150 }
    const A = { x: random() * 300 - 150, y: random() * 300 - 150 }
    const B = { x: random() * 300 - 150, y: random() * 300 - 150 }
    if (G.dist(A, B) < 30) continue
    const line = G.fullLine(A, B)
    const off = G.distanceToCurve(line, C)
    // Off the line, and not so nearly perpendicular already that the circle
    // about C through A only touches.
    if (off < 15 || Math.abs(G.dist(C, A) - off) < 15) continue

    const { doc, ids } = docWithPoints([C, A, B])
    const step = apply(doc, 'euclid.I.12', ids)
    const scene = run(doc)
    assert.ok(scene.steps.every((s) => s.ok), 'I.12 carried out')
    const foot = scene.get(step.out[0]).pos
    close(G.distanceToCurve(line, foot), 0, 1e-6, 'the foot lands on the line')
    const along = G.scale(G.sub(B, A), 1 / G.dist(A, B))
    const drop = G.sub(foot, C)
    close(G.dot(along, G.scale(drop, 1 / G.len(drop))), 0, 1e-6, 'and CF is at right angles to it')
    close(G.len(drop), off, 1e-6, 'and is the shortest way to it')
    checked++
  }
  assert.ok(checked > 40, `only ${checked} configurations were exercised`)
})

test('I.31 draws a line through the point that never meets the given one', () => {
  const random = rng(71)
  let checked = 0
  for (let i = 0; i < 90; i++) {
    const A = { x: random() * 300 - 150, y: random() * 300 - 150 }
    const B = { x: random() * 300 - 150, y: random() * 300 - 150 }
    const C = { x: random() * 300 - 150, y: random() * 300 - 150 }
    if (G.dist(B, C) < 30) continue
    const line = G.fullLine(B, C)
    const off = G.distanceToCurve(line, A)
    if (off < 15 || Math.abs(G.dist(A, B) - off) < 15) continue

    const { doc, ids } = docWithPoints([A, B, C])
    const step = apply(doc, 'euclid.I.31', ids)
    const scene = run(doc)
    assert.ok(scene.steps.every((s) => s.ok), 'I.31 carried out')
    const parallel = scene.get(step.out[0])
    close(G.distanceToCurve(parallel.geom, A), 0, 1e-6, 'it passes through the given point')
    // Parallel: the same direction, and never meeting.
    const u = G.scale(G.sub(C, B), 1 / G.dist(B, C))
    const w = G.scale(parallel.geom.d, 1 / G.len(parallel.geom.d))
    close(Math.abs(G.cross(u, w)), 0, 1e-6, 'and runs the same way as the given line')
    // intersect always hands back two slots, with null where nothing exists.
    assert.deepEqual(G.intersect(line, parallel.geom).filter(Boolean), [], 'so the two never meet')
    checked++
  }
  assert.ok(checked > 40, `only ${checked} configurations were exercised`)
})

test('I.46 builds a square on the given line', () => {
  const random = rng(83)
  let checked = 0
  for (let i = 0; i < 60; i++) {
    const A = { x: random() * 300 - 150, y: random() * 300 - 150 }
    const B = { x: random() * 300 - 150, y: random() * 300 - 150 }
    if (G.dist(A, B) < 30) continue
    const { doc, ids } = docWithPoints([A, B])
    const step = apply(doc, 'euclid.I.46', ids, { side: 0 })
    const scene = run(doc)
    assert.ok(scene.steps.every((s) => s.ok), 'I.46 carried out')

    const D = at(scene, step.out[0])
    const E = at(scene, step.out[1])
    const side = G.dist(A, B)
    // ABED, going round: AB, BE, ED, DA.
    close(G.dist(A, D), side, side * 1e-7, 'AD')
    close(G.dist(D, E), side, side * 1e-7, 'DE')
    close(G.dist(E, B), side, side * 1e-7, 'EB')
    // Four right angles: each corner's two sides are perpendicular.
    const square = [A, B, E, D]
    for (let k = 0; k < 4; k++) {
      const here = square[k]
      const before = square[(k + 3) % 4]
      const after = square[(k + 1) % 4]
      const u = G.scale(G.sub(before, here), 1 / G.dist(before, here))
      const w = G.scale(G.sub(after, here), 1 / G.dist(after, here))
      close(G.dot(u, w), 0, 1e-7, `the angle at corner ${k}`)
    }
    // And the diagonals are equal, which is the whole of what I.47 needs of it.
    close(G.dist(A, E), G.dist(B, D), side * 1e-7, 'the diagonals')
    checked++
  }
  assert.ok(checked > 40, `only ${checked} configurations were exercised`)
})

test('the square can be made to fall on either side of the line', () => {
  const A = { x: -80, y: 0 }
  const B = { x: 80, y: 0 }
  const sides = [0, 1].map((side) => {
    const { doc, ids } = docWithPoints([A, B])
    const step = apply(doc, 'euclid.I.46', ids, { side })
    const scene = run(doc)
    assert.ok(scene.steps.every((s) => s.ok), `side ${side} carried out`)
    return at(scene, step.out[0]).y
  })
  assert.ok(sides[0] * sides[1] < 0, 'the two choices fall on opposite sides')
})

/* ------------------------------------------------------------------ *
 * Copying an angle, and the figure I.4 supposes
 * ------------------------------------------------------------------ */

/** The angle at `v` between `p` and `q`, however the figure has been jogged. */
function angleAt(scene, v, p, q) {
  const V = at(scene, v)
  const u = G.sub(at(scene, p), V)
  const w = G.sub(at(scene, q), V)
  return Math.acos(G.dot(u, w) / (G.len(u) * G.len(w)))
}

test('I.23 makes an angle equal to the given one, and goes on doing so', () => {
  const random = rng(4919)
  let checked = 0
  for (let round = 0; round < 60; round++) {
    // A and B give the line the angle is to be made on; C, D, E the angle.
    const pts = Array.from({ length: 5 }, () => ({ x: (random() - 0.5) * 400, y: (random() - 0.5) * 400 }))
    const { doc, ids } = docWithPoints(pts)
    const step = apply(doc, 'euclid.I.23', ids, { side: 0 })
    const scene = run(doc)
    if (!scene.steps.every((s) => s.ok)) continue
    const [A, B, C, Dv, E] = ids
    const made = angleAt(scene, A, B, step.out[0])
    close(made, angleAt(scene, Dv, C, E), 1e-7, `round ${round}`)
    checked++
  }
  assert.ok(checked > 40, `only ${checked} configurations were exercised`)
})

test('I.23 can put the angle on either side of the line', () => {
  const pts = [
    { x: -240, y: 60 }, { x: -160, y: 60 },
    { x: 200, y: 90 }, { x: 60, y: 120 }, { x: 120, y: 10 },
  ]
  const sides = [0, 1].map((side) => {
    const { doc, ids } = docWithPoints(pts)
    const step = apply(doc, 'euclid.I.23', ids, { side })
    const scene = run(doc)
    assert.ok(scene.steps.every((s) => s.ok), `side ${side} carried out`)
    // AB runs due east here, so the two answers must straddle it.
    return at(scene, step.out[0]).y - 60
  })
  assert.ok(sides[0] * sides[1] < 0, 'the two choices fall on opposite sides')
})

test('what a tool is asked for only as working keeps its scaffolding unlettered', () => {
  // I.4 uses I.2 twice for nothing but a length. If the points it hands back
  // took letters, the second triangle's corners would be called G and I rather
  // than E and F, and the figure would stop matching the enunciation.
  const app = freshI4()
  assert.ok(app.scene.steps.every((s) => s.ok), app.scene.steps.find((s) => !s.ok)?.error)
  const lettered = [...app.scene.objects.values()].filter((o) => o.label).map((o) => o.label).sort()
  assert.deepEqual(lettered, ['A', 'B', 'C', 'D', 'E', 'F'])
})

test('a written-out proposition keeps the names its tool gives things', () => {
  // Applied as one move, I.4's circles are hidden and never named. Written out
  // they are on the page, and "a circle" is no use to a reader — the name has
  // to travel with the steps, not only with the macro.
  const said = freshI4().scene.steps.map((s) => s.text).join('\n')
  assert.match(said, /the circle about D with radius AB/)
  assert.match(said, /the circle about D with radius CA/)
  assert.match(said, /the arm at D making an angle equal to the angle at A/)
})

test('the figure I.4 supposes goes on supposing it however it is shaken', () => {
  const app = freshI4()
  const id = (l) => labelledIn(app, l)
  const scene = app.scene
  const len = (p, q) => G.dist(at(scene, id(p)), at(scene, id(q)))
  close(len('A', 'B'), len('D', 'E'), 1e-6, 'AB and DE')
  close(len('C', 'A'), len('F', 'D'), 1e-6, 'CA and FD')
  close(angleAt(scene, id('A'), id('B'), id('C')), angleAt(scene, id('D'), id('E'), id('F')), 1e-9, 'the angles')
  // And what I.4 asserts: the bases too.
  close(len('B', 'C'), len('E', 'F'), 1e-6, 'BC and EF')
})

/* ------------------------------------------------------------------ *
 * The figures the theorems suppose
 * ------------------------------------------------------------------ */

/** Jog every point the figure was started from, and run it again. */
function jog(app, random) {
  for (const step of app.doc.steps) {
    if (step.op !== 'point') continue
    step.x += (random() - 0.5) * 160
    step.y += (random() - 0.5) * 160
  }
  app.changed()
}

test('every written-out proposition opens with a figure that stands', () => {
  for (const prop of PROPOSITIONS) {
    const app = createSketch()
    app.walkProposition(prop.id)
    const broken = app.scene.steps.find((s) => !s.ok)
    assert.equal(broken, undefined, `${prop.ref}: ${broken && broken.error}`)
    assert.ok(app.scene.steps.length > 0, `${prop.ref} drew nothing`)
    // Every input the proposition names should have found its way onto the
    // paper as a lettered point: a figure nobody can refer to is no figure.
    const letters = [...app.scene.objects.values()].filter((o) => o.label).length
    assert.ok(letters >= (prop.inputs || []).length, `${prop.ref} lettered only ${letters} points`)
  }
})

test('I.37 keeps its two triangles on one base and between one pair of parallels', () => {
  const random = rng(7717)
  const app = createSketch()
  app.walkProposition('euclid.I.37')
  const area = (p, q, r) => {
    const [P, Q, R] = [p, q, r].map((l) => at(app.scene, labelledIn(app, l)))
    return Math.abs((Q.x - P.x) * (R.y - P.y) - (Q.y - P.y) * (R.x - P.x)) / 2
  }
  for (let round = 0; round < 40; round++) {
    if (app.scene.steps.some((s) => !s.ok)) continue
    // C and D are on one parallel to AB, so the triangles on AB have the same
    // height — which is the whole of what "between the same parallels" means,
    // and it is true by construction rather than by eye.
    close(area('A', 'B', 'C'), area('A', 'B', 'D'), 1e-6, `round ${round}`)
    jog(app, random)
  }
})

test('I.16 keeps the produced side straight, and D beyond C', () => {
  const random = rng(3313)
  const app = createSketch()
  app.walkProposition('euclid.I.16')
  for (let round = 0; round < 40; round++) {
    if (app.scene.steps.some((s) => !s.ok)) continue
    const [A, C, D] = ['A', 'C', 'D'].map((l) => at(app.scene, labelledIn(app, l)))
    close(G.cross(G.sub(C, A), G.sub(D, A)), 0, 1e-6, `round ${round}: ACD collinear`)
    assert.ok(G.dist(A, D) > G.dist(A, C), `round ${round}: D falls beyond C`)
    jog(app, random)
  }
})
