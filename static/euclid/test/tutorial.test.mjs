/**
 * The walk through the first proposition.
 *
 * The tutorial never draws anything: it watches, and moves on when the reader
 * has done the thing. So what there is to test is that each stage recognises
 * its own step and no other's.
 */

import test from 'node:test'
import assert from 'node:assert/strict'

import { createSketch } from '../src/app.js'
import { hitTest } from '../src/interactions.js'
import { TUTORIAL, beginTutorial, advanceTutorial } from '../src/tutorial.js'
import { HELP } from '../src/help.js'

const at = (app, world) => hitTest(app.scene, world, app.camera)

test('the walkthrough follows a reader building I.1 by hand', () => {
  const app = createSketch()
  let walk = beginTutorial(app)
  const stageNow = () => (walk ? TUTORIAL[walk.at].id : 'done')
  const step = () => { walk = advanceTutorial(app, walk) }

  assert.equal(stageNow(), 'points')
  app.setMode('point')
  app.click({ x: -100, y: 0 }, null)
  step()
  assert.equal(stageNow(), 'points', 'one point is not two')
  app.click({ x: 100, y: 0 }, null)
  step()
  assert.equal(stageNow(), 'join')

  app.setMode('segment')
  app.click({ x: -100, y: 0 }, at(app, { x: -100, y: 0 }))
  step()
  assert.equal(stageNow(), 'join', 'a line half drawn is not a line')
  app.click({ x: 100, y: 0 }, at(app, { x: 100, y: 0 }))
  step()
  assert.equal(stageNow(), 'circle')

  app.setMode('circle')
  app.click({ x: -100, y: 0 }, at(app, { x: -100, y: 0 }))
  app.click({ x: 100, y: 0 }, at(app, { x: 100, y: 0 }))
  step()
  assert.equal(stageNow(), 'circle2')
  app.setMode('circle')
  app.click({ x: 100, y: 0 }, at(app, { x: 100, y: 0 }))
  app.click({ x: -100, y: 0 }, at(app, { x: -100, y: 0 }))
  step()
  assert.equal(stageNow(), 'sides')

  const apex = [...app.scene.objects.values()].find((o) => o.auto && o.pos.y > 0)
  app.setMode('segment')
  app.click({ x: -100, y: 0 }, at(app, { x: -100, y: 0 }))
  app.click(apex.pos, { point: apex })
  step()
  assert.equal(stageNow(), 'sides', 'one side of the triangle is not two')
  app.setMode('segment')
  app.click({ x: 100, y: 0 }, at(app, { x: 100, y: 0 }))
  app.click(apex.pos, { point: apex })
  step()
  assert.equal(stageNow(), 'drag')

  // Selecting a point is not dragging it.
  app.setMode('select')
  app.click({ x: -100, y: 0 }, at(app, { x: -100, y: 0 }))
  step()
  assert.equal(stageNow(), 'drag')
  const drag = app.beginDrag(app.doc.steps[0].id)
  app.updateDrag(drag, { x: -140, y: 40 })
  step()
  assert.equal(stageNow(), 'tool')

  // And the last stage waits for a tool to reach the toolbox.
  step()
  assert.equal(stageNow(), 'tool')
  app.addTool({ ...app.tools[0], id: 'mine', ref: 'mine' })
  step()
  assert.equal(stageNow(), 'done', 'and then the walk is over')
})

test('the walkthrough can be picked up on a figure already begun', () => {
  const app = createSketch()
  app.startingPoints([{ x: 0, y: 0 }, { x: 100, y: 0 }])
  // Two points are already down, but the first stage asks for two more rather
  // than counting the ones that were there when it began.
  const walk = beginTutorial(app)
  assert.equal(advanceTutorial(app, walk).at, 0)
})

test('every stage says what to do, and the help sheet covers every part', () => {
  for (const stage of TUTORIAL) {
    assert.ok(stage.say.length > 40, `${stage.id} should say what to do`)
    assert.equal(typeof stage.done, 'function')
  }
  const titles = HELP.map((s) => s.title.toLowerCase()).join(' ')
  for (const word of ['rules', 'drawing', 'choosing', 'paper', 'construction', 'proving']) {
    assert.ok(titles.includes(word), `the help sheet says nothing about ${word}`)
  }
  for (const section of HELP) {
    assert.ok(section.body || section.rows.length, `${section.title} is empty`)
    for (const row of section.rows) assert.equal(row.length, 2)
  }
})
