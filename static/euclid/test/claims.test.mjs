/**
 * Magnitudes and claims.
 *
 * A construction can be checked by dragging it: if the figure still stands in
 * every configuration, it stands. A claim is checked the same way — this is
 * the whole of what the sketchpad can honestly say about a theorem, so it had
 * better say it accurately.
 */

import test from 'node:test'
import assert from 'node:assert/strict'

import { createSketch } from '../src/app.js'
import { hitTest } from '../src/interactions.js'
import * as MAG from '../src/magnitudes.js'
import * as G from '../src/geometry.js'

const at = (app, world) => hitTest(app.scene, world, app.camera)
const labelled = (app, label) => [...app.scene.objects.values()].find((o) => o.label === label)
const pick = (app, ...labels) => {
  app.state.selection.clear()
  for (const l of labels) app.state.selection.add(labelled(app, l).id)
}

/**
 * Euclid's I.5 figure, as the sketchpad can honestly build it: the hypothesis
 * "let ABC be isosceles" is not asserted but constructed — C is taken on the
 * circle centred A through B, so AB = AC by definition and stays so however
 * the figure is dragged.
 */
function isosceles() {
  const app = createSketch()
  app.startingPoints([
    { x: 0, y: 140 },
    { x: -90, y: -60 },
  ])
  const [a, b] = app.doc.steps.map((s) => s.id)
  app.setMode('circle')
  app.click({ x: 0, y: 140 }, at(app, { x: 0, y: 140 }))
  app.click({ x: -90, y: -60 }, at(app, { x: -90, y: -60 }))
  const circle = app.doc.steps.at(-1).id
  // C on that circle: the third vertex, wherever it slides to.
  app.setMode('point')
  const onCircle = app.scene.get(circle)
  app.click({ x: 90, y: -60 }, { curve: onCircle })
  const c = app.doc.steps.at(-1).id
  app.setMode('segment')
  for (const [p, q] of [[a, b], [a, c], [b, c]]) {
    app.click(app.scene.get(p).pos, at(app, app.scene.get(p).pos))
    app.click(app.scene.get(q).pos, at(app, app.scene.get(q).pos))
  }
  app.setMode('select')
  return app
}

test('a length, an angle and a triangle are read off the figure', () => {
  const app = isosceles()
  const id = (l) => labelled(app, l).id
  const scene = app.scene
  assert.ok(Math.abs(MAG.measure(MAG.magnitude('length', [id('A'), id('B')]), scene)
    - MAG.measure(MAG.magnitude('length', [id('A'), id('C')]), scene)) < 1e-9)
  const angle = MAG.measure(MAG.magnitude('angle', [id('A'), id('B'), id('C')]), scene)
  assert.ok(angle > 0 && angle < Math.PI)
  assert.equal(MAG.measure(MAG.magnitude('triangle', [id('A'), id('B'), id('C')]), scene).length, 3)
})

test('a selection is read as the figure it looks like', () => {
  const app = isosceles()
  pick(app, 'A', 'B')
  assert.deepEqual(app.magnitudeFromSelection().kind, 'length')
  // A triangle with all three sides drawn can be meant two ways: as a figure
  // with a content, or as a shape to be matched in every respect. Book I turns
  // on the difference, so both are offered, the content first.
  pick(app, 'A', 'B', 'C')
  assert.deepEqual(app.readings().map((m) => m.kind), ['area', 'triangle', 'angle', 'angle', 'angle'])
})

test('three points with two sides drawn are read as the angle where they meet', () => {
  const app = createSketch()
  app.startingPoints([
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 40, y: 90 },
  ])
  const [a, b, c] = app.doc.steps.map((s) => s.id)
  app.setMode('segment')
  app.click(app.scene.get(b).pos, at(app, app.scene.get(b).pos))
  app.click(app.scene.get(a).pos, at(app, app.scene.get(a).pos))
  app.setMode('segment')
  app.click(app.scene.get(b).pos, at(app, app.scene.get(b).pos))
  app.click(app.scene.get(c).pos, at(app, app.scene.get(c).pos))
  app.setMode('select')
  pick(app, 'A', 'B', 'C')
  const mag = app.magnitudeFromSelection()
  assert.equal(mag.kind, 'angle')
  assert.equal(mag.pts[1], b, 'the vertex is where the two drawn lines meet')
})

test('a true claim stands, and stands up to being shaken', () => {
  const app = isosceles()
  pick(app, 'A', 'B')
  app.holdMagnitude()
  pick(app, 'A', 'C')
  const step = app.claim('eq', { kind: 'def', n: 15 })
  assert.ok(step)
  const info = app.scene.steps.at(-1)
  assert.equal(info.ok, true)
  assert.equal(info.text, 'AB = AC (def. 15).')

  const report = app.shake(60)
  assert.equal(report.claims, 1)
  assert.deepEqual(report.failed, [], 'AB = AC by construction, so no drag can break it')
  assert.ok(report.rounds > 0, 'and some of the shaken figures stood up')
})

test('a claim that only happens to be true is caught by shaking', () => {
  const app = isosceles()
  // BC is the base. It equals the equal sides only for one particular figure,
  // and the sketchpad should not be fooled by that figure.
  pick(app, 'A', 'B')
  app.holdMagnitude()
  pick(app, 'B', 'C')
  app.claim('eq')
  const report = app.shake(60)
  assert.equal(report.failed.length, 1, 'the claim fails somewhere')
  assert.equal(report.failed[0], app.doc.steps.at(-1).id)
})

test('a claim that is false where it stands says so at once', () => {
  const app = isosceles()
  // The equal sides are the longer ones in this figure, so saying AB is less
  // than the base is false on the paper in front of you — no shaking needed.
  pick(app, 'A', 'B')
  app.holdMagnitude()
  pick(app, 'B', 'C')
  app.claim('lt')
  const info = app.scene.steps.at(-1)
  assert.equal(info.ok, false)
  assert.match(info.error, /does not hold/)
  // And the true direction is accepted.
  app.undo()
  pick(app, 'A', 'B')
  app.holdMagnitude()
  pick(app, 'B', 'C')
  app.claim('gt')
  assert.equal(app.scene.steps.at(-1).ok, true)
})

test('the angles at the base of an isosceles triangle are equal — I.5, checked', () => {
  const app = isosceles()
  pick(app, 'A', 'B', 'C')
  // ∠ABC, at B, between BA and BC.
  const id = (l) => labelled(app, l).id
  app.state.heldMagnitude = MAG.magnitude('angle', [id('A'), id('B'), id('C')])
  app.state.selection.clear()
  for (const l of ['A', 'C', 'B']) app.state.selection.add(id(l))
  app.state.heldMagnitude = MAG.magnitude('angle', [id('A'), id('B'), id('C')])
  const doc = app.doc
  doc.steps.push({
    op: 'claim',
    id: 'q1',
    rel: 'eq',
    of: [MAG.magnitude('angle', [id('A'), id('B'), id('C')]),
      MAG.magnitude('angle', [id('A'), id('C'), id('B')])],
    because: { kind: 'prop', n: 5 },
  })
  app.changed()
  assert.equal(app.scene.steps.at(-1).ok, true)
  assert.equal(app.scene.steps.at(-1).text, '∠ABC = ∠ACB (I.5).')
  assert.deepEqual(app.shake(60).failed, [])
})

test('like is compared with like, and nothing with itself', () => {
  const app = isosceles()
  pick(app, 'A', 'B')
  app.holdMagnitude()
  pick(app, 'A', 'B', 'C')
  assert.equal(app.claim('eq'), null)
  assert.match(app.state.notice, /like with like/)

  pick(app, 'A', 'B')
  app.holdMagnitude()
  pick(app, 'B', 'A')
  assert.equal(app.claim('eq'), null)
  assert.match(app.state.notice, /same thing twice/)
})

test('a claim goes when a point it reads goes', () => {
  const app = isosceles()
  pick(app, 'A', 'B')
  app.holdMagnitude()
  pick(app, 'A', 'C')
  app.claim('eq')
  const claim = app.doc.steps.at(-1).id
  app.deleteStep(app.doc.steps.find((s) => s.op === 'point').id)
  assert.equal(app.doc.steps.some((s) => s.id === claim), false)
})

test('a claim draws nothing, so scrubbing past it changes no ink', () => {
  const app = isosceles()
  const before = app.scene.order.length
  pick(app, 'A', 'B')
  app.holdMagnitude()
  pick(app, 'A', 'C')
  app.claim('eq')
  assert.equal(app.scene.order.length, before)
})

/* ------------------------------------------------------------------ *
 * Keeping what has been proved
 * ------------------------------------------------------------------ */

/** I.5's figure, with the conclusion claimed and marked. */
function proofOfI5() {
  const app = isosceles()
  const id = (l) => labelled(app, l).id
  app.state.heldMagnitude = MAG.magnitude('angle', [id('A'), id('B'), id('C')])
  app.state.selection.clear()
  for (const l of ['A', 'B', 'C']) app.state.selection.add(id(l))
  app.claim('eq', { kind: 'prop', n: 4 }, MAG.magnitude('angle', [id('A'), id('C'), id('B')]))
  return app
}

test('only one claim at a time is what was to be proved', () => {
  const app = proofOfI5()
  pick(app, 'A', 'B')
  app.holdMagnitude()
  pick(app, 'A', 'C')
  app.claim('eq')
  const [first, second] = app.doc.steps.filter((s) => s.op === 'claim')

  app.markConclusion(first.id)
  assert.equal(app.conclusion().step.id, first.id)
  app.markConclusion(second.id)
  assert.equal(app.conclusion().step.id, second.id)
  assert.equal(first.qed, undefined, 'the mark moved rather than multiplied')
  // Marking it again takes the mark off.
  app.markConclusion(second.id)
  assert.equal(app.conclusion(), null)
})

test('a proved theorem is kept, with the evidence it was proved by', () => {
  const app = proofOfI5()
  assert.equal(app.proveFact({ ref: 'I.5' }), null, 'nothing is kept until the conclusion is marked')
  assert.match(app.state.notice, /what was to be proved/)

  app.markConclusion(app.doc.steps.at(-1).id)
  const fact = app.proveFact({ ref: 'I.5' })
  assert.ok(fact)
  assert.equal(fact.ref, 'I.5')
  assert.ok(fact.rounds > 0, 'it says how many configurations it survived')
  assert.deepEqual(app.facts.map((f) => f.ref), ['I.5'])
  assert.ok(app.proved().has('I.5'))
})

test('a claim that shaking breaks is not kept', () => {
  const app = isosceles()
  pick(app, 'A', 'B')
  app.holdMagnitude()
  pick(app, 'B', 'C')
  app.claim('gt')
  app.markConclusion(app.doc.steps.at(-1).id)
  assert.equal(app.proveFact({ ref: 'I.5' }), null)
  assert.match(app.state.notice, /true of your figure, not in general/)
  assert.deepEqual(app.facts, [])
})

test('what has been proved outlives the paper it was proved on', () => {
  const app = proofOfI5()
  app.markConclusion(app.doc.steps.at(-1).id)
  app.proveFact({ ref: 'I.5' })

  app.clear()
  assert.deepEqual(app.facts.map((f) => f.ref), ['I.5'], 'clearing the sheet keeps it')
  app.openProposition(6, { n: 6, kind: 'theorem', text: 'In any triangle…' })
  assert.deepEqual(app.facts.map((f) => f.ref), ['I.5'], 'so does turning to the next proposition')
  app.undo()
  assert.deepEqual(app.facts.map((f) => f.ref), ['I.5'], 'and undo takes back drawings, not proofs')

  // It travels with the document.
  const reopened = createSketch()
  reopened.load(app.serialize())
  assert.deepEqual(reopened.facts.map((f) => f.ref), ['I.5'])
  assert.ok(reopened.proved().has('I.5'))
})

test('a fact can be given up', () => {
  const app = proofOfI5()
  app.markConclusion(app.doc.steps.at(-1).id)
  const fact = app.proveFact({ ref: 'I.5' })
  app.forgetFact(fact.id)
  assert.deepEqual(app.facts, [])
  assert.equal(app.proved().has('I.5'), false)
})

test('shaking moves a point right round the circle it is on', () => {
  // A parameter means an angle on a circle and a fraction on a segment. Sampled
  // as though it were always a fraction, a point on a circle would only ever
  // move through one radian, and a claim that fails on the far side of the
  // figure would go unnoticed.
  const app = isosceles()
  const onCircle = app.doc.steps.find((s) => s.op === 'onCurve')
  const seen = []
  for (let i = 0; i < 200; i++) {
    app.shake(1)
    seen.push(app.scene.get(onCircle.id).pos)
  }
  // The unshaken figure is restored afterwards, so watch where it went instead.
  const angles = []
  const was = onCircle.t
  for (let i = 0; i < 400; i++) {
    onCircle.t = G.randomParam('circle')
    angles.push(onCircle.t)
  }
  onCircle.t = was
  assert.ok(Math.max(...angles) > 2.8, 'it reaches round one way')
  assert.ok(Math.min(...angles) < -2.8, 'and round the other')

  // A claim true only near the top of the circle is caught.
  pick(app, 'A', 'B')
  app.holdMagnitude()
  pick(app, 'B', 'C')
  app.claim('gt')
  assert.equal(app.shake(200).failed.length, 1,
    'the base is not always shorter than the equal sides')
})

/* ------------------------------------------------------------------ *
 * Content, and magnitudes taken together
 * ------------------------------------------------------------------ */

/**
 * A right-angled triangle with a square on each side: Euclid's I.47 figure, as
 * far as the sketchpad can build it. The right angle is constructed, not
 * assumed — B is taken on the perpendicular at A — so it stays a right angle
 * however the figure is shaken.
 */
function pythagoras() {
  const app = createSketch()
  app.startingPoints([{ x: 0, y: 0 }, { x: 120, y: 0 }])
  const [a, c] = app.doc.steps.map((s) => s.id)
  // The perpendicular to AC at A, and B taken on it.
  app.applyTool(app.registry().get('euclid.I.11'), [a, c])
  const perpendicular = app.doc.steps.at(-1).out[0]
  app.setMode('point')
  app.click({ x: 0, y: 90 }, { curve: app.scene.get(perpendicular) })
  const b = app.doc.steps.at(-1).id
  app.setMode('segment')
  for (const [p, q] of [[a, b], [b, c]]) {
    app.click(app.scene.get(p).pos, at(app, app.scene.get(p).pos))
    app.click(app.scene.get(q).pos, at(app, app.scene.get(q).pos))
  }
  app.setMode('select')
  return { app, a, b, c }
}

test('a figure has a content, read off however it is gone round', () => {
  const app = isosceles()
  const id = (l) => labelled(app, l).id
  const one = MAG.measure(MAG.magnitude('area', [id('A'), id('B'), id('C')]), app.scene)
  const other = MAG.measure(MAG.magnitude('area', [id('C'), id('B'), id('A')]), app.scene)
  assert.ok(one > 0)
  assert.ok(Math.abs(one - other) < 1e-9, 'the same figure, gone round the other way')
  assert.ok(MAG.sameMagnitude(
    MAG.magnitude('area', [id('A'), id('B'), id('C')]),
    MAG.magnitude('area', [id('B'), id('C'), id('A')]),
  ), 'and set off from a different corner')
})

test('four corners are put in the order that does not cross itself', () => {
  const app = createSketch()
  app.startingPoints([
    { x: 0, y: 0 },
    { x: 100, y: 100 },
    { x: 100, y: 0 },
    { x: 0, y: 100 },
  ])
  // Selected in an order that would make a bowtie.
  for (const id of app.doc.steps.map((s) => s.id)) app.state.selection.add(id)
  const [square] = app.readings()
  assert.equal(square.kind, 'area')
  assert.ok(Math.abs(MAG.measure(square, app.scene) - 10000) < 1e-6, 'it is the square, not the bowtie')
})

test('like is added to like, and a congruence to nothing', () => {
  const app = isosceles()
  pick(app, 'A', 'B')
  app.holdMagnitude()
  pick(app, 'A', 'B', 'C')
  assert.equal(app.addToMagnitude(app.readings()[0]), null, 'a figure is not a length')
  assert.match(app.state.notice, /like to like/)

  // Holding something clears the selection, so choose again before adding.
  pick(app, 'A', 'B', 'C')
  const shape = app.readings().find((m) => m.kind === 'triangle')
  app.holdMagnitude(shape)
  pick(app, 'A', 'B', 'C')
  assert.equal(app.addToMagnitude(app.readings().find((m) => m.kind === 'triangle')), null,
    'a congruence is not a magnitude, so nothing can be added to it')
  assert.match(app.state.notice, /like to like/)

  // Two figures, on the other hand, may be taken together.
  app.dropMagnitude()
  pick(app, 'A', 'B', 'C')
  app.holdMagnitude(app.readings().find((m) => m.kind === 'area'))
  pick(app, 'A', 'B', 'C')
  const together = app.addToMagnitude(app.readings().find((m) => m.kind === 'area'))
  assert.equal(together.kind, 'sum')
  assert.equal(MAG.kindOf(together), 'area')
})

test('two triangles compared in every respect are congruent, not merely equal', () => {
  const app = isosceles()
  const id = (l) => labelled(app, l).id
  app.state.heldMagnitude = MAG.magnitude('triangle', [id('A'), id('B'), id('C')])
  app.state.selection.clear()
  for (const l of ['A', 'B', 'C']) app.state.selection.add(id(l))
  // Against itself is refused, so make the claim by hand against the same shape
  // read the other way round the figure.
  app.doc.steps.push({
    op: 'claim',
    id: 'q9',
    rel: 'eq',
    of: [MAG.magnitude('triangle', [id('A'), id('B'), id('C')]),
      MAG.magnitude('triangle', [id('B'), id('C'), id('A')])],
  })
  app.changed()
  assert.match(app.scene.steps.at(-1).text, /^≡△\w+ ≡ ≡△\w+\.$/)
})

test('the square on the hypotenuse — I.47, checked by shaking', () => {
  const { app, a, b, c } = pythagoras()
  const letter = (id) => app.scene.get(id).label
  // Squares on the three sides, each falling outward.
  const square = (p, q, side) => {
    app.applyTool(app.registry().get('euclid.I.46'), [p, q])
    if (app.state.choice) app.chooseBranch(side)
    const step = app.doc.steps.at(-1)
    return [p, q, step.out[1], step.out[0]]
  }
  const onAB = square(a, b, 1)
  const onBC = square(b, c, 1)
  const onAC = square(c, a, 1)
  assert.ok(app.scene.steps.every((s) => s.ok), 'the three squares stand')

  const areaOf = (corners) => MAG.magnitude('area', corners)
  const value = (m) => MAG.measure(m, app.scene)
  assert.ok(
    Math.abs(value(areaOf(onBC)) - (value(areaOf(onAB)) + value(areaOf(onAC)))) < 1e-6,
    `the squares: ${value(areaOf(onBC))} vs ${value(areaOf(onAB))} + ${value(areaOf(onAC))}`,
  )

  // Said as a claim, and shaken.
  app.doc.steps.push({
    op: 'claim',
    id: 'qed',
    rel: 'eq',
    of: [areaOf(onBC), MAG.sum([areaOf(onAB), areaOf(onAC)])],
    because: { kind: 'prop', n: 47 },
    qed: true,
  })
  app.changed()
  const info = app.scene.steps.at(-1)
  assert.equal(info.ok, true, info.error)
  assert.equal(
    info.text,
    `▭${onBC.map(letter).join('')} = ▭${onAB.map(letter).join('')} + ▭${onAC.map(letter).join('')} (I.47).`,
  )
  const report = app.shake(60)
  assert.deepEqual(report.failed, [], 'and it holds however the figure is shaken')
  assert.ok(report.rounds > 5, `only ${report.rounds} configurations stood up`)
})
