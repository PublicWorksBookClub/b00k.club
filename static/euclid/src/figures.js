/**
 * Byrne's marginal figures, drawn.
 *
 * These are illustrations, not constructions: they may show an angle as a
 * coloured wedge or an arc as a thing in itself, which the construction model
 * has no word for. So they get their own small format — a flat list of things
 * to draw, with coordinates in figure units — and their own drawing code. The
 * data comes out of Byrne's own MetaPost; see book1-figures.js.
 *
 * The one rule shared with the sketchpad is the palette: a line's colour is how
 * the proof refers to it, so the colours have to be his.
 */

import { PALETTE, THEME } from './renderer.js'

/** How much of the shorter arm an angle's wedge takes up. */
const WEDGE = 0.26
const LABEL_GAP = 9

const rad = (deg) => (deg * Math.PI) / 180

/**
 * An angle mark means the angle between two arms, so it takes the short way
 * round; a bearing pair on its own does not say which way to sweep.
 */
function shortWay(from, to) {
  let turn = (to - from) % 360
  if (turn > 180) turn -= 360
  if (turn < -180) turn += 360
  return turn
}

/**
 * How long the shorter arm of an angle is, so the wedge can be sized against
 * it the way Byrne sizes his. A vertex with nothing drawn from it falls back to
 * the size of the figure.
 */
function armLength(items, vertex, fallback) {
  let shortest = Infinity
  for (const item of items) {
    if (item.k !== 'seg') continue
    for (const [near, far] of [[item.a, item.b], [item.b, item.a]]) {
      if (Math.hypot(near[0] - vertex[0], near[1] - vertex[1]) > 1e-6) continue
      shortest = Math.min(shortest, Math.hypot(far[0] - vertex[0], far[1] - vertex[1]))
    }
  }
  return Number.isFinite(shortest) ? shortest : fallback
}

/**
 * How far the drawing reaches, in figure units.
 *
 * An angle's wedge and a label both stick out past the geometry, but by an
 * amount that depends on the scale we have not chosen yet. They are left out
 * here and paid for with padding instead.
 */
function boundsOf(items) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  const see = (x, y) => {
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }
  for (const item of items) {
    if (item.k === 'seg') {
      see(item.a[0], item.a[1])
      see(item.b[0], item.b[1])
    } else if (item.k === 'circle' || item.k === 'arc') {
      // An arc is bounded by the whole circle, which is generous but keeps the
      // figure the size Byrne drew it, sitting where he put it.
      see(item.c[0] - item.r, item.c[1] - item.r)
      see(item.c[0] + item.r, item.c[1] + item.r)
    } else if (item.k === 'angle') {
      see(item.v[0], item.v[1])
    } else if (item.k === 'label') {
      see(item.at[0], item.at[1])
    }
  }
  if (minX > maxX) return { minX: -1, minY: -1, maxX: 1, maxY: 1 }
  return { minX, minY, maxX, maxY }
}

/**
 * Draw one figure into a box, fitted and centred.
 *
 * y is flipped: the data runs up the page as MetaPost does, the canvas runs
 * down. Everything else is a straight scale.
 */
export function drawFigure(ctx, items, box) {
  const pad = box.pad == null ? 12 : box.pad
  const { minX, minY, maxX, maxY } = boundsOf(items)
  const width = Math.max(maxX - minX, 1e-6)
  const height = Math.max(maxY - minY, 1e-6)
  const k = Math.min((box.w - pad * 2) / width, (box.h - pad * 2) / height)
  const cx = box.x + box.w / 2
  const cy = box.y + box.h / 2
  const midX = (minX + maxX) / 2
  const midY = (minY + maxY) / 2
  const S = (p) => ({ x: cx + (p[0] - midX) * k, y: cy - (p[1] - midY) * k })
  const span = Math.min(width, height)

  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const item of items) {
    const colour = PALETTE[item.color] || THEME.ink
    ctx.strokeStyle = colour
    ctx.fillStyle = colour
    ctx.lineWidth = 2

    if (item.k === 'seg') {
      const a = S(item.a)
      const b = S(item.b)
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.stroke()
    } else if (item.k === 'circle') {
      const c = S(item.c)
      ctx.beginPath()
      ctx.arc(c.x, c.y, item.r * k, 0, Math.PI * 2)
      ctx.stroke()
    } else if (item.k === 'arc') {
      const c = S(item.c)
      ctx.beginPath()
      // Counter-clockwise on the page is clockwise on the canvas, y being down.
      ctx.arc(c.x, c.y, item.r * k, -rad(item.from), -rad(item.to), true)
      ctx.lineWidth = 2.5
      ctx.stroke()
    } else if (item.k === 'angle') {
      const v = S(item.v)
      const turn = shortWay(item.from, item.to)
      const wedge = armLength(items, item.v, span) * WEDGE * k
      const start = -rad(item.from)
      const end = -rad(item.from + turn)
      ctx.beginPath()
      if (item.fill) {
        ctx.moveTo(v.x, v.y)
        ctx.arc(v.x, v.y, wedge, start, end, turn > 0)
        ctx.closePath()
        ctx.fill()
      } else {
        // Byrne marks a right angle with a bare arc rather than a wedge.
        ctx.arc(v.x, v.y, wedge, start, end, turn > 0)
        ctx.lineWidth = 1.5
        ctx.stroke()
      }
    } else if (item.k === 'label') {
      const at = S(item.at)
      // Push the letter away from the middle of the figure so it clears the ink.
      const dx = at.x - cx
      const dy = at.y - cy
      const len = Math.hypot(dx, dy) || 1
      ctx.font = THEME.labelFont
      ctx.fillStyle = THEME.ink
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(item.text, at.x + (dx / len) * LABEL_GAP, at.y + (dy / len) * LABEL_GAP)
    }
  }
  ctx.restore()
}

/**
 * A figure at a fixed size, ready to drop beside a paragraph.
 *
 * Canvases are made here rather than handed in because the caller wants a
 * picture, not a drawing surface, and the device pixel ratio is our business.
 */
export function figureCanvas(document, items, size = 96, options = {}) {
  const canvas = document.createElement('canvas')
  const dpr = Math.min(window.devicePixelRatio || 1, 3)
  const w = options.w || size
  const h = options.h || size
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)
  canvas.style.width = `${w}px`
  canvas.style.height = `${h}px`
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  drawFigure(ctx, items, { x: 0, y: 0, w, h, pad: options.pad })
  return canvas
}
