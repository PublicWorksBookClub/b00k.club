/**
 * Byrne's marginal figures.
 *
 * The drawing is checked against a recording context rather than pixels: what
 * matters is that a figure lands inside its box, and that an angle mark sweeps
 * the short way round while an arc keeps the direction Byrne drew it.
 */

import test from 'node:test'
import assert from 'node:assert/strict'

import { drawFigure } from '../src/figures.js'
import { DEFINITION_FIGURES } from '../src/book1-figures.js'

/** A 2D context that writes down what it was asked to draw. */
function recorder() {
  const calls = []
  const noop = () => {}
  return {
    calls,
    save: noop,
    restore: noop,
    beginPath: noop,
    closePath: noop,
    fill: () => calls.push({ op: 'fill' }),
    stroke: () => calls.push({ op: 'stroke' }),
    moveTo: (x, y) => calls.push({ op: 'moveTo', x, y }),
    lineTo: (x, y) => calls.push({ op: 'lineTo', x, y }),
    arc: (x, y, r, from, to, anti) => calls.push({ op: 'arc', x, y, r, from, to, anti }),
    fillText: (text, x, y) => calls.push({ op: 'fillText', text, x, y }),
    setTransform: noop,
  }
}

const BOX = { x: 0, y: 0, w: 100, h: 100 }

/** Where the ink actually lands, arcs walked rather than bounded by their circle. */
function inkOf(calls) {
  const seen = []
  for (const call of calls) {
    if (call.op === 'arc') {
      const sweep = call.anti && call.to > call.from ? call.to - call.from - Math.PI * 2
        : !call.anti && call.to < call.from ? call.to - call.from + Math.PI * 2
          : call.to - call.from
      for (let i = 0; i <= 16; i += 1) {
        const a = call.from + (sweep * i) / 16
        seen.push({ x: call.x + call.r * Math.cos(a), y: call.y + call.r * Math.sin(a) })
      }
    } else if (call.x != null) {
      seen.push({ x: call.x, y: call.y })
    }
  }
  return seen
}

test('every definition figure fits inside the box it is given', () => {
  for (const [n, items] of Object.entries(DEFINITION_FIGURES)) {
    const ctx = recorder()
    drawFigure(ctx, items, BOX)
    assert.ok(ctx.calls.length, `definition ${n} drew nothing`)
    for (const { x, y } of inkOf(ctx.calls)) {
      assert.ok(x >= -0.5 && x <= 100.5, `definition ${n} spills sideways to ${Math.round(x)}`)
      assert.ok(y >= -0.5 && y <= 100.5, `definition ${n} spills vertically to ${Math.round(y)}`)
    }
  }
})

test('a figure that is all circle is drawn as large as it can be', () => {
  // Definition XVII is a circle and its diameter, so it should very nearly fill
  // the box: a fit that quietly shrank the drawing would still pass the test
  // above, and the figures would come out small and timid.
  const ctx = recorder()
  drawFigure(ctx, DEFINITION_FIGURES[17], { x: 0, y: 0, w: 100, h: 100, pad: 6 })
  const ink = inkOf(ctx.calls)
  const width = Math.max(...ink.map((p) => p.x)) - Math.min(...ink.map((p) => p.x))
  assert.ok(width > 85, `the circle came out ${Math.round(width)} wide in a box of 100`)
})

test('an angle mark sweeps the short way round', () => {
  // Definition IX: the rays run east and north-east, so the yellow wedge is the
  // 45° between them, not the 315° the other way.
  const ctx = recorder()
  drawFigure(ctx, DEFINITION_FIGURES[9], BOX)
  const wedge = ctx.calls.find((c) => c.op === 'arc')
  const swept = Math.abs(wedge.to - wedge.from) * (180 / Math.PI)
  assert.ok(swept < 180, `swept ${Math.round(swept)}°, which is the long way`)
  assert.ok(Math.abs(swept - 45) < 0.001)
})

test('the two right angles of definition X are marked separately', () => {
  const ctx = recorder()
  drawFigure(ctx, DEFINITION_FIGURES[10], BOX)
  const arcs = ctx.calls.filter((c) => c.op === 'arc')
  assert.equal(arcs.length, 2)
  for (const arc of arcs) {
    const swept = Math.abs(arc.to - arc.from) * (180 / Math.PI)
    assert.ok(Math.abs(swept - 90) < 0.001, `a right angle swept ${Math.round(swept)}°`)
  }
  // They mark the angles on either side of the upright, so they face opposite ways.
  assert.notEqual(arcs[0].anti, arcs[1].anti)
})

test('the two arcs of a semicircle go opposite ways round', () => {
  // Definition XVIII: one arc over the diameter, one under, together the circle.
  const ctx = recorder()
  drawFigure(ctx, DEFINITION_FIGURES[18], BOX)
  const arcs = ctx.calls.filter((c) => c.op === 'arc')
  assert.equal(arcs.length, 2)
  const midpoint = (a) => {
    const from = a.from
    const to = a.to < a.from ? a.to : a.to - Math.PI * 2
    return { x: a.x + a.r * Math.cos((from + to) / 2), y: a.y + a.r * Math.sin((from + to) / 2) }
  }
  const [above, below] = arcs.map(midpoint)
  assert.ok(above.y < arcs[0].y, 'the first arc should bulge upward')
  assert.ok(below.y > arcs[1].y, 'the second arc should bulge downward')
})

test('a quadrilateral carries its lettering', () => {
  const ctx = recorder()
  drawFigure(ctx, DEFINITION_FIGURES[22], BOX)
  const letters = ctx.calls.filter((c) => c.op === 'fillText').map((c) => c.text)
  assert.deepEqual(letters.sort(), ['A', 'B', 'C', 'D'])
})

test('the figures use only Byrne\'s four colours', () => {
  const allowed = new Set(['red', 'blue', 'yellow', 'black'])
  for (const [n, items] of Object.entries(DEFINITION_FIGURES)) {
    for (const item of items) {
      if (!item.color) continue
      assert.ok(allowed.has(item.color), `definition ${n} asks for ${item.color}`)
    }
  }
})
