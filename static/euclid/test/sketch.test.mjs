/**
 * The controller. app.js touches no DOM, so the commands the interface issues
 * can be exercised here rather than only through a browser.
 */

import test from 'node:test'
import assert from 'node:assert/strict'

import { createSketch } from '../src/app.js'
import { hitTest } from '../src/interactions.js'
import * as G from '../src/geometry.js'

const at = (app, world) => hitTest(app.scene, world, app.camera)
const labelled = (app, label) => [...app.scene.objects.values()].find((o) => o.label === label)

function twoPoints() {
  const app = createSketch()
  app.startingPoints([
    { x: 0, y: 0 },
    { x: 100, y: 0 },
  ])
  return app
}

test('a fresh sketch has the first three propositions to hand', () => {
  const app = createSketch()
  assert.deepEqual(
    app.tools.map((t) => t.ref),
    ['I.1', 'I.2', 'I.3'],
  )
})

test('only the propositions asked for are given, with whatever they stand on', () => {
  const app = createSketch({ toolIds: ['euclid.I.3'] })
  // I.3 needs I.2, which needs I.1 — they come along or it could not be replayed.
  assert.deepEqual(
    app.tools.map((t) => t.ref),
    ['I.1', 'I.2', 'I.3'],
  )
})

test('drawing a straight line between two new points is one gesture, and one undo', () => {
  const app = createSketch()
  app.setMode('segment')
  app.click({ x: 0, y: 0 }, null)
  assert.equal(app.doc.steps.length, 1, 'the first point appears at once')
  assert.ok(app.state.pending, 'and the line is waiting for its second point')
  app.click({ x: 120, y: 40 }, null)
  assert.equal(app.doc.steps.length, 3)
  assert.equal(app.state.pending, null)

  app.undo()
  assert.equal(app.doc.steps.length, 0, 'both points and the line go back together')
  app.redo()
  assert.equal(app.doc.steps.length, 3)
})

test('abandoning a half-drawn line takes back the point it set down', () => {
  const app = twoPoints()
  app.setMode('circle')
  app.click({ x: 40, y: 90 }, null)
  assert.equal(app.doc.steps.length, 3)
  app.setMode('select')
  assert.equal(app.doc.steps.length, 2, 'the stray centre does not linger')
})

test('a click on a line puts the point on that line, and it stays there when dragged', () => {
  const app = twoPoints()
  app.setMode('segment')
  app.click({ x: 0, y: 0 }, at(app, { x: 0, y: 0 }))
  app.click({ x: 100, y: 0 }, at(app, { x: 100, y: 0 }))

  app.setMode('point')
  app.click({ x: 50, y: 3 }, at(app, { x: 50, y: 3 }))
  const step = app.doc.steps[app.doc.steps.length - 1]
  assert.equal(step.op, 'onCurve', 'taken on the line, not loose beside it')

  const drag = app.beginDrag(step.id)
  app.updateDrag(drag, { x: 90, y: 60 })
  const moved = app.scene.get(step.id).pos
  assert.ok(Math.abs(moved.y) < 1e-9, 'it slid along AB instead of leaving it')
  assert.ok(moved.x > 50)

  app.updateDrag(drag, { x: 400, y: 0 })
  assert.ok(app.scene.get(step.id).pos.x <= 100 + 1e-9, 'and it cannot slide off the end')
})

test('a tool may be defined, used, and refused a hand-placed point', () => {
  const app = twoPoints()
  const [a, b] = app.doc.steps.map((s) => s.id)

  app.setMode('circle')
  app.click({ x: 0, y: 0 }, at(app, { x: 0, y: 0 }))
  app.click({ x: 100, y: 0 }, at(app, { x: 100, y: 0 }))
  app.setMode('circle')
  app.click({ x: 100, y: 0 }, at(app, { x: 100, y: 0 }))
  app.click({ x: 0, y: 0 }, at(app, { x: 0, y: 0 }))
  const apex = [...app.scene.objects.values()].find((o) => o.auto && o.pos.y > 0)
  assert.ok(apex, 'the circles cut, with nothing asked for')

  app.startDefinition()
  app.definitionPick({ point: app.scene.get(a) })
  app.definitionPick({ point: app.scene.get(b) })
  app.definitionStage('outputs')
  app.definitionPick({ point: apex })
  app.definitionStage('details')
  const tool = app.createTool({ name: 'Equilateral apex', abbr: '△' })
  assert.ok(tool, app.state.definition && app.state.definition.error)
  assert.equal(app.state.noticeKind, 'info')
  assert.equal(app.tools.length, 4)

  // Use it on fresh ground: the givens may be clicked out of thin air.
  app.setMode('tool', tool.id)
  app.pickForTool({ x: -200, y: 200 }, null)
  app.pickForTool({ x: -80, y: 260 }, null)
  const applied = app.doc.steps[app.doc.steps.length - 1]
  assert.equal(applied.op, 'macro')
  assert.ok(app.scene.steps.every((s) => s.ok))

  const P = app.scene.get(applied.args[0]).pos
  const Q = app.scene.get(applied.args[1]).pos
  const R = app.scene.get(applied.out[0]).pos
  const side = G.dist(P, Q)
  assert.ok(Math.abs(G.dist(P, R) - side) < 1e-6 && Math.abs(G.dist(Q, R) - side) < 1e-6)

  // One undo takes back the whole application, points and all.
  const before = app.doc.steps.length
  app.undo()
  assert.equal(app.doc.steps.length, before - 3)
})

test('a construction that can go either way waits for the reader to say which', () => {
  const app = createSketch()
  app.startingPoints([
    { x: 0, y: 0 },
    { x: 120, y: 0 },
  ])
  const givens = app.doc.steps.map((s) => s.id)
  app.applyTool(
    app.tools.find((t) => t.ref === 'I.1'),
    givens,
  )

  // Blocked: the step is there but has not been carried out.
  assert.ok(app.state.choice, 'a choice is pending')
  assert.equal(app.state.choice.key, 'apex')
  assert.equal(app.scene.steps.at(-1).ok, false)
  assert.match(app.hint(), /which way/i)

  // Both ways are worked out so both can be shown at once.
  const options = app.choiceOptions()
  assert.equal(options.length, 2)
  assert.ok(options.every((o) => o.objects.length > 0 && o.point))
  assert.ok(options[0].point.y * options[1].point.y < 0, 'the two candidates fall on opposite sides')

  // Clicking near one of them settles it.
  app.pickChoice(options[1].point, 20)
  assert.equal(app.state.choice, null)
  assert.ok(app.scene.steps.every((s) => s.ok))
  const applied = app.doc.steps.find((s) => s.op === 'macro')
  const apex = app.scene.get(applied.out[0]).pos
  assert.ok(G.dist(apex, options[1].point) < 1e-9, 'and the one that was clicked is the one that was built')

  // The decision is part of the document, so it survives being written out.
  assert.deepEqual(applied.picks, { apex: 1 })
  const step = applied
  const reopened = createSketch()
  reopened.load(app.serialize())
  assert.ok(reopened.scene.steps.every((s) => s.ok))
  assert.ok(G.dist(reopened.scene.get(step.out[0]).pos, apex) < 1e-9)
})

test('a proposition settles the choices of the propositions it stands on', () => {
  const app = createSketch()
  app.startingPoints([
    { x: 0, y: 0 },
    { x: 120, y: 30 },
    { x: 40, y: 140 },
  ])
  // I.2 leans on I.1, whose apex could go either way — but I.2 says which, so
  // the reader is not asked about scaffolding they never see.
  app.applyTool(
    app.tools.find((t) => t.ref === 'I.2'),
    app.doc.steps.map((s) => s.id),
  )
  assert.equal(app.state.choice, null)
  assert.ok(app.scene.steps.every((s) => s.ok))
})

test('undo takes back what was drawn, not what was proved', () => {
  const app = twoPoints()
  app.setMode('segment')
  app.click({ x: 0, y: 0 }, at(app, { x: 0, y: 0 }))
  app.click({ x: 100, y: 0 }, at(app, { x: 100, y: 0 }))

  const seg = app.doc.steps[app.doc.steps.length - 1]
  app.startDefinition()
  app.definitionPick({ point: app.scene.get(app.doc.steps[0].id) })
  app.definitionPick({ point: app.scene.get(app.doc.steps[1].id) })
  app.definitionStage('outputs')
  app.definitionPick({ curve: app.scene.get(seg.id) })
  app.definitionStage('details')
  assert.ok(app.createTool({ name: 'Join two points', abbr: 'J' }))
  assert.equal(app.tools.length, 4)

  app.undo()
  assert.equal(app.doc.steps.length, 2, 'the line and nothing else went back')
  assert.equal(app.tools.length, 4, 'and the toolbox stayed put')
  // The two points a sketch opens with are setting-up, not a move, so there is
  // nothing further to undo.
  assert.equal(app.canUndo, false)
})

test('a tool cannot be thrown away while something leans on it', () => {
  const app = createSketch()
  app.startingPoints([
    { x: 0, y: 0 },
    { x: 200, y: 0 },
    { x: 0, y: 80 },
    { x: 60, y: 80 },
  ])
  const givens = app.doc.steps.map((s) => s.id)

  // Nothing is built on I.3, but the figure uses it.
  app.applyTool(
    app.tools.find((t) => t.ref === 'I.3'),
    givens,
  )
  assert.ok(app.scene.steps.every((s) => s.ok))
  app.removeTool('euclid.I.3')
  assert.equal(app.tools.length, 3, 'refused: it has been used in the figure')
  assert.match(app.state.notice, /used in the figure/)

  // Nothing in the figure uses I.1, but I.2 and I.3 are built on it.
  app.removeTool('euclid.I.1')
  assert.equal(app.tools.length, 3, 'refused: other tools stand on it')
  assert.match(app.state.notice, /stands on this one/)

  app.undo()
  app.removeTool('euclid.I.3')
  app.removeTool('euclid.I.2')
  app.removeTool('euclid.I.1')
  assert.deepEqual(
    app.tools.map((t) => t.ref),
    [],
    'and in the right order they all go',
  )
})

test('reading a proposition through starts a fresh figure but keeps the toolbox', () => {
  const app = twoPoints()
  app.walkProposition('euclid.I.10')
  assert.ok(app.doc.steps.length > 2)
  assert.ok(app.scene.steps.every((s) => s.ok))
  assert.equal(app.state.noticeKind, 'info')
  for (const ref of ['I.1', 'I.2', 'I.3']) {
    assert.ok(
      app.tools.some((t) => t.ref === ref),
      `${ref} is still to hand`,
    )
  }
  // Reading a proof does not hand you the proposition — that is what the
  // library's "add to toolbox" is for.
  assert.ok(!app.tools.some((t) => t.ref === 'I.10'))
  // The midpoint really is the midpoint.
  const last = app.doc.steps[app.doc.steps.length - 1]
  const M = app.scene.get(last.id).pos
  const [A, B] = app.doc.steps.filter((s) => s.op === 'point').map((s) => ({ x: s.x, y: s.y }))
  assert.ok(G.dist(M, G.lerp(A, B, 0.5)) < 1e-6)
})

test('a read-only figure may be dragged and scrubbed, but not drawn on', () => {
  const app = createSketch({ readonly: true })
  app.startingPoints([
    { x: 0, y: 0 },
    { x: 100, y: 0 },
  ])
  const i1 = app.tools.find((t) => t.ref === 'I.1')
  app.applyTool(
    i1,
    app.doc.steps.slice(0, 2).map((s) => s.id),
  )
  app.chooseBranch(0)
  const drawn = app.doc.steps.length

  app.setMode('segment')
  app.click({ x: 40, y: 40 }, null)
  assert.equal(app.doc.steps.length, drawn, 'clicking draws nothing')

  const drag = app.beginDrag(app.doc.steps[0].id)
  assert.ok(drag, 'but a given may still be pulled about')
  app.updateDrag(drag, { x: -60, y: 70 })
  assert.equal(app.doc.steps.length, drawn)
  assert.ok(
    app.scene.steps.every((s) => s.ok),
    'and the construction holds',
  )
  const C = app.scene.get(app.doc.steps[drawn - 1].out[0]).pos
  const A = app.scene.get(app.doc.steps[0].id).pos
  const B = app.scene.get(app.doc.steps[1].id).pos
  assert.ok(Math.abs(G.dist(A, C) - G.dist(A, B)) < 1e-6, 'still equilateral after the drag')

  app.deleteStep(app.doc.steps[0].id)
  assert.equal(app.doc.steps.length, drawn, 'and nothing can be deleted')
})

test('scrubbing hides the later steps without losing them', () => {
  const app = twoPoints()
  const i1 = app.tools.find((t) => t.ref === 'I.1')
  app.applyTool(
    i1,
    app.doc.steps.slice(0, 2).map((s) => s.id),
  )
  app.chooseBranch(0)
  app.unfoldStep(app.doc.steps[2].id)
  const total = app.doc.steps.length
  assert.ok(total > 3, 'the appeal to I.1 was written out')

  app.setUpTo(3)
  assert.equal(app.scene.steps.length, total)
  assert.equal(app.scene.steps.filter((s) => !s.beyond).length, 3)
  assert.ok(labelled(app, 'A'), 'what has been drawn keeps its lettering')

  app.setUpTo(total)
  assert.equal(app.state.upTo, Infinity)
  assert.ok(app.scene.steps.every((s) => !s.beyond))
})

test('deleting a step takes down what stood on it', () => {
  const app = twoPoints()
  app.setMode('circle')
  app.click({ x: 0, y: 0 }, at(app, { x: 0, y: 0 }))
  app.click({ x: 100, y: 0 }, at(app, { x: 100, y: 0 }))
  const circle = app.doc.steps[app.doc.steps.length - 1]

  app.setMode('point')
  app.click({ x: 0, y: 100 }, at(app, { x: 0, y: 100 }))
  const onCircle = app.doc.steps[app.doc.steps.length - 1]
  assert.equal(onCircle.op, 'onCurve')

  app.deleteStep(circle.id)
  assert.equal(
    app.doc.steps.find((s) => s.id === onCircle.id),
    undefined,
  )
  assert.ok(app.scene.steps.every((s) => s.ok))
})

test('the given figure is set aside, and the construction numbers from one', () => {
  const app = createSketch()
  app.walkProposition('euclid.I.2')
  const scene = app.scene
  assert.equal(scene.setupCount, 4, 'three points and the given line BC')
  assert.ok(scene.steps.slice(0, 4).every((s) => s.setup && s.number === null))
  assert.deepEqual(
    scene.steps.filter((s) => !s.setup).map((s) => s.number),
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
  )
  assert.match(scene.steps[4].text, /Let AB be joined/)

  // Scrubbing cannot rub out what the proposition was given.
  app.setUpTo(0)
  assert.equal(app.state.upTo, 4)
  assert.ok(app.scene.steps.slice(0, 4).every((s) => !s.beyond))

  // A figure drawn by hand can be declared the givens after the fact.
  const own = createSketch()
  own.startingPoints([
    { x: 0, y: 0 },
    { x: 100, y: 0 },
  ])
  own.setMode('segment')
  own.click({ x: 0, y: 0 }, at(own, { x: 0, y: 0 }))
  own.click({ x: 100, y: 0 }, at(own, { x: 100, y: 0 }))
  assert.equal(own.scene.setupCount, 0)
  own.markSetup()
  assert.equal(own.scene.setupCount, 3)
  assert.equal(own.scene.moves, 0)
  own.clearSetup()
  assert.equal(own.scene.setupCount, 0)
  assert.equal(own.scene.moves, 3)
})

test('a proposition draws the straight lines it is given', () => {
  // I.1 is "on a given finite straight line": applied to two bare points there
  // is no such line, so it is drawn and the triangle has a base.
  const app = twoPoints()
  const givens = app.doc.steps.map((s) => s.id)
  app.applyTool(
    app.tools.find((t) => t.ref === 'I.1'),
    givens,
  )
  app.chooseBranch(0)
  const base = app.doc.steps.find((s) => s.op === 'segment' && s.given)
  assert.ok(base, 'the given line was drawn')
  assert.deepEqual([base.a, base.b], givens)

  const sides = [...app.scene.objects.values()].filter((o) => o.type === 'curve' && !o.hidden && o.def.op === 'segment')
  assert.equal(sides.length, 3, 'a triangle with all three sides')

  // Applied again to the same two points, the base is not drawn twice.
  app.applyTool(
    app.tools.find((t) => t.ref === 'I.1'),
    givens,
  )
  app.chooseBranch(1)
  assert.equal(app.doc.steps.filter((s) => s.op === 'segment' && s.given).length, 1)
  // And the first apex keeps its letter.
  assert.equal(labelled(app, 'C').pos.y > 0, true)
  assert.ok(labelled(app, 'D'), 'the second apex is lettered next, not first')
})

test('drawing while scrubbed back replaces what came after', () => {
  const app = twoPoints()
  app.setMode('segment')
  app.click({ x: 0, y: 0 }, at(app, { x: 0, y: 0 }))
  app.click({ x: 100, y: 0 }, at(app, { x: 100, y: 0 }))
  app.setMode('circle')
  app.click({ x: 0, y: 0 }, at(app, { x: 0, y: 0 }))
  app.click({ x: 100, y: 0 }, at(app, { x: 100, y: 0 }))
  assert.equal(app.doc.steps.length, 4)

  // Go back to just after the two points and draw something else.
  app.setUpTo(2)
  app.setMode('circle')
  app.click({ x: 100, y: 0 }, at(app, { x: 100, y: 0 }))
  app.click({ x: 0, y: 0 }, at(app, { x: 0, y: 0 }))
  assert.equal(app.doc.steps.length, 3, 'the segment and circle that followed are gone')
  assert.equal(app.doc.steps[2].op, 'circle')
  assert.equal(app.state.upTo, Infinity)
})

/* ------------------------------------------------------------------ *
 * Selecting more than one thing
 * ------------------------------------------------------------------ */

test('holding the adding key keeps what was already selected', () => {
  const app = twoPoints()
  const a = labelled(app, 'A')
  const b = labelled(app, 'B')
  app.setMode('select')
  app.click(a.pos, at(app, a.pos))
  assert.deepEqual([...app.state.selection], [a.id])
  app.click(b.pos, at(app, b.pos), { additive: true })
  assert.deepEqual([...app.state.selection].sort(), [a.id, b.id].sort())
  // Clicking one of them again with the key down lets that one go.
  app.click(a.pos, at(app, a.pos), { additive: true })
  assert.deepEqual([...app.state.selection], [b.id])
  // Without the key, a click starts over.
  app.click(a.pos, at(app, a.pos))
  assert.deepEqual([...app.state.selection], [a.id])
})

test('the lasso catches what it covers, and lets go of what it leaves', () => {
  const app = twoPoints()
  app.setMode('circle')
  app.click({ x: 0, y: 0 }, at(app, { x: 0, y: 0 }))
  app.click({ x: 100, y: 0 }, at(app, { x: 100, y: 0 }))
  const a = labelled(app, 'A')
  const b = labelled(app, 'B')
  const circle = [...app.scene.objects.values()].find((o) => o.type === 'curve')

  // A rectangle round the centre catches the point but not the circle: it is
  // inside the ring, and being inside a circle is not touching it.
  app.setLasso({ x0: -20, y0: -20, x1: 20, y1: 20 })
  assert.deepEqual([...app.state.selection], [a.id])

  // Widen it to reach B, which is on the rim: now the circle is caught too,
  // without the rectangle having to enclose the whole of it.
  app.setLasso({ x0: -20, y0: -20, x1: 120, y1: 20 })
  assert.ok(app.state.selection.has(b.id))
  assert.ok(app.state.selection.has(circle.id), 'the circle is caught by its rim')

  // Pull it back off B: B and the circle are released rather than kept.
  app.setLasso({ x0: -20, y0: -20, x1: 20, y1: 20 })
  assert.deepEqual([...app.state.selection], [a.id], 'the selection is what the rectangle covers now')

  app.setLasso(null)
  assert.equal(app.state.lasso, null)
})

test('a lasso that adds keeps the selection it started with', () => {
  const app = twoPoints()
  const a = labelled(app, 'A')
  const b = labelled(app, 'B')
  app.setMode('select')
  app.click(a.pos, at(app, a.pos))
  app.setLasso({ x0: 80, y0: -20, x1: 120, y1: 20 }, true)
  assert.deepEqual([...app.state.selection].sort(), [a.id, b.id].sort())
  // Sliding off B again leaves what the lasso started with, and no more.
  app.setLasso({ x0: 200, y0: -20, x1: 240, y1: 20 }, true)
  assert.deepEqual([...app.state.selection], [a.id])
})

test('a lasso can catch a line without covering either end', () => {
  const app = twoPoints()
  app.setMode('segment')
  app.click({ x: 0, y: 0 }, at(app, { x: 0, y: 0 }))
  app.click({ x: 100, y: 0 }, at(app, { x: 100, y: 0 }))
  const seg = [...app.scene.objects.values()].find((o) => o.type === 'curve')
  app.setLasso({ x0: 40, y0: -10, x1: 60, y1: 10 })
  assert.deepEqual([...app.state.selection], [seg.id])
})

test('a proposition the sketchpad has not worked opens a clean sheet and says what to do', () => {
  const app = twoPoints()
  app.addTool({ ...app.tools[0] })
  const toolbox = app.tools.map((t) => t.id)

  const doc = app.openProposition(5, { n: 5, kind: 'theorem', text: 'In any isosceles triangle…' })
  assert.equal(doc.steps.length, 0, 'a clean sheet')
  assert.deepEqual(app.tools.map((t) => t.id), toolbox, 'what was proved stays proved')
  assert.match(app.state.notice, /^I\.5\. In any isosceles triangle…/)
  assert.match(app.state.notice, /the hypothesis is constructed/)

  // A problem is not warned about proving, since there is nothing to prove.
  app.openProposition(22, { n: 22, kind: 'problem', text: 'To make a triangle of three given lines…' })
  assert.match(app.state.notice, /Set out the given figure/)

  // One the sketchpad does know still sets out its construction.
  app.openProposition(1, { n: 1, kind: 'problem', text: 'On a given finite straight line…' })
  assert.ok(app.doc.steps.length > 0, 'I.1 is written out')
})
