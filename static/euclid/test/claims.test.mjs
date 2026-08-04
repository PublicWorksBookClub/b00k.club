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
  // All three sides drawn: a triangle.
  pick(app, 'A', 'B', 'C')
  assert.equal(app.magnitudeFromSelection().kind, 'triangle')
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
