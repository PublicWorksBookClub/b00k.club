/**
 * Drawing the figure.
 *
 * The visual hierarchy is the one a printed figure uses: straight lines that
 * were joined are ink, circles and produced lines are fainter because they are
 * scaffolding, and points that have earned a letter are solid while the merely
 * knowable intersections stay small and grey until something uses them.
 */

import * as G from './geometry.js'
import * as C from './camera.js'
import { BYRNE_COLORS } from './book1.js'

/**
 * Byrne's four colours, straight from his class file. In the book the colour is
 * not decoration — a line's colour is how the proof refers to it.
 */
export const PALETTE = {
  black: '#2f2929',
  red: BYRNE_COLORS.red,
  blue: BYRNE_COLORS.blue,
  yellow: BYRNE_COLORS.yellow,
}

export const THEME = {
  paper: '#faf5ea',
  ink: '#2f2929',
  construction: '#a89a8b',
  ghost: '#d6cabb',
  faint: '#bdb1a3',
  accent: '#b8622a',
  accentSoft: 'rgba(184, 98, 42, 0.34)',
  accentFaint: 'rgba(184, 98, 42, 0.16)',
  labelFont: 'italic 15px "Junicode", "New CM10", "Source Serif", Georgia, "Times New Roman", serif',
  badgeFont: '600 10px ui-sans-serif, system-ui, sans-serif',
}

export function render(canvas, scene, view) {
  const ctx = canvas.getContext('2d')
  const { w, h, dpr, cam } = view
  ctx.save()
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = THEME.paper
  ctx.fillRect(0, 0, w, h)

  const S = (p) => C.toScreen(cam, p, w, h)
  const clip = C.visibleRect(cam, w, h, 80)

  const curves = []
  const points = []
  for (const id of scene.order) {
    const o = scene.objects.get(id)
    if (!o || o.hidden) continue
    if (o.type === 'curve') curves.push(o)
    else points.push(o)
  }

  drawChoice(ctx, view, S, clip)
  for (const o of curves) if (o.ghost) strokeCurve(ctx, o, S, clip, ghostStyle())
  for (const o of curves) if (!o.ghost) strokeCurve(ctx, o, S, clip, curveStyle(o, view))
  drawPending(ctx, scene, view, S, clip)
  for (const o of points) drawPoint(ctx, o, S, view)
  drawSnap(ctx, view, S)
  drawLabels(ctx, points, curves, S, view)
  drawPickBadges(ctx, scene, view, S)
  drawLasso(ctx, view, S)
  ctx.restore()
}

/**
 * The rectangle being swept over the figure.
 *
 * Drawn from its four corners rather than as a screen-aligned box, because the
 * paper can be turned: the lasso is a rectangle on the paper, and it should
 * look like one however the paper is lying.
 */
function drawLasso(ctx, view, S) {
  const r = view.lasso
  if (!r) return
  const corners = [
    S({ x: r.x0, y: r.y0 }), S({ x: r.x1, y: r.y0 }),
    S({ x: r.x1, y: r.y1 }), S({ x: r.x0, y: r.y1 }),
  ]
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(corners[0].x, corners[0].y)
  for (const c of corners.slice(1)) ctx.lineTo(c.x, c.y)
  ctx.closePath()
  ctx.fillStyle = THEME.accentFaint
  ctx.fill()
  ctx.strokeStyle = THEME.accentSoft
  ctx.lineWidth = 1
  ctx.setLineDash([4, 3])
  ctx.stroke()
  ctx.restore()
}

/* ------------------------------------------------------------------ *
 * Curves
 * ------------------------------------------------------------------ */

function curveStyle(o, view) {
  const state = stateOf(o.id, view)
  const solidLine = o.def && o.def.op === 'segment'
  const named = o.color && PALETTE[o.color]
  const base = {
    color: named || (solidLine ? THEME.ink : THEME.construction),
    width: solidLine ? 1.7 : 1.4,
    dash: o.dash ? [6, 5] : null,
  }
  // Selection is shown with a halo behind the line rather than by recolouring
  // it. Painting a selected line accent-coloured hid the very thing you had
  // selected it to change.
  if (state === 'selected' || state === 'picked') return { ...base, halo: THEME.accentSoft, haloWidth: base.width + 7 }
  if (state === 'hover') return { ...base, halo: THEME.accentFaint, haloWidth: base.width + 6 }
  return base
}

const ghostStyle = () => ({ color: THEME.ghost, width: 1, dash: [3, 4] })

function strokeCurve(ctx, o, S, clip, style) {
  ctx.save()
  ctx.lineCap = 'round'
  ctx.beginPath()
  pathOfCurve(ctx, o.geom, S, clip)
  if (style.halo) {
    ctx.strokeStyle = style.halo
    ctx.lineWidth = style.haloWidth
    ctx.stroke()
  }
  if (style.dash) ctx.setLineDash(style.dash)
  ctx.strokeStyle = style.color
  ctx.lineWidth = style.width
  ctx.stroke()
  ctx.restore()
}

function pathOfCurve(ctx, geom, S, clip) {
  if (geom.kind === 'circle') {
    const centre = S(geom.c)
    const edge = S(G.add(geom.c, { x: geom.r, y: 0 }))
    const r = Math.hypot(edge.x - centre.x, edge.y - centre.y)
    // A circle zoomed to absurdity is a straight line as far as the screen is
    // concerned, and asking the canvas to draw it is a good way to hang a tab.
    if (r > 1e6) return
    ctx.moveTo(centre.x + r, centre.y)
    ctx.arc(centre.x, centre.y, r, 0, Math.PI * 2)
    return
  }
  const ends = G.clipLineToRect(geom, clip)
  if (!ends) return
  const a = S(ends[0])
  const b = S(ends[1])
  ctx.moveTo(a.x, a.y)
  ctx.lineTo(b.x, b.y)
}

/* ------------------------------------------------------------------ *
 * Points
 * ------------------------------------------------------------------ */

function stateOf(id, view) {
  if (view.picked && view.picked.includes(id)) return 'picked'
  if (view.selection && view.selection.has(id)) return 'selected'
  if (view.hover === id) return 'hover'
  return null
}

function drawPoint(ctx, o, S, view) {
  const p = S(o.pos)
  const state = stateOf(o.id, view)
  const lettered = !!o.label
  if (o.ghost) {
    dot(ctx, p, 1.8, THEME.ghost)
    return
  }
  if (state === 'hover' || state === 'selected' || state === 'picked') {
    ring(ctx, p, 7.5, THEME.accent, state === 'hover' ? 1 : 1.6)
  }
  if (lettered) {
    dot(ctx, p, 4.6, THEME.paper)
    dot(ctx, p, 3.4, THEME.ink)
  } else {
    dot(ctx, p, 3.4, THEME.paper)
    dot(ctx, p, 2.1, state ? THEME.accent : THEME.faint)
  }
}

/** Which way a curve runs at a point, in screen terms. */
function screenTangentAt(geom, at, S) {
  const t = G.paramAt(geom, at)
  const step = geom.kind === 'circle' ? 0.01 : 0.01
  const a = S(G.pointAt(geom, t - step))
  const b = S(G.pointAt(geom, t + step))
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy)
  return len > 1e-9 ? { x: dx / len, y: dy / len } : null
}

const LABEL_DIRECTIONS = 24
const LABEL_REACH = 14

/**
 * Letter the points.
 *
 * The letter is placed by trying directions around the point and keeping the
 * one that lies furthest from every line through it — worked out in screen
 * terms, so turning the paper moves the letters out of the way rather than
 * carrying them round onto the lines they were avoiding. Ties are settled by
 * leaning away from the middle of the figure and away from letters already
 * placed.
 */
function drawLabels(ctx, points, curves, S, view) {
  const lettered = points.filter((o) => o.label && !o.ghost)
  if (!lettered.length) return

  const at = new Map(lettered.map((o) => [o.id, S(o.pos)]))
  let cx = 0
  let cy = 0
  for (const p of at.values()) {
    cx += p.x
    cy += p.y
  }
  const centre = { x: cx / at.size, y: cy / at.size }
  const onPoint = 1.5 / (view.cam ? view.cam.k : 1)

  ctx.save()
  ctx.font = THEME.labelFont
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'

  const placed = []
  for (const o of lettered) {
    const p = at.get(o.id)
    const through = []
    for (const c of curves) {
      if (c.ghost || G.distanceToCurve(c.geom, o.pos) > onPoint) continue
      const tangent = screenTangentAt(c.geom, o.pos, S)
      if (tangent) through.push(tangent)
    }
    let away = { x: p.x - centre.x, y: p.y - centre.y }
    const span = Math.hypot(away.x, away.y)
    away = span > 1e-6 ? { x: away.x / span, y: away.y / span } : { x: 0.7, y: -0.7 }

    let best = null
    for (let i = 0; i < LABEL_DIRECTIONS; i++) {
      const angle = (i / LABEL_DIRECTIONS) * Math.PI * 2
      const d = { x: Math.cos(angle), y: Math.sin(angle) }
      // Lying along a line through the point is the thing to avoid.
      let cost = 0
      for (const t of through) cost += 2.2 * Math.abs(d.x * t.x + d.y * t.y)
      cost -= 0.5 * (d.x * away.x + d.y * away.y)
      const spot = { x: p.x + d.x * LABEL_REACH, y: p.y + d.y * LABEL_REACH }
      for (const q of placed) if (Math.hypot(q.x - spot.x, q.y - spot.y) < 16) cost += 4
      for (const [id, q] of at) if (id !== o.id && Math.hypot(q.x - spot.x, q.y - spot.y) < 12) cost += 3
      if (!best || cost < best.cost) best = { cost, spot }
    }

    placed.push(best.spot)
    ctx.lineWidth = 3.5
    ctx.strokeStyle = THEME.paper
    ctx.strokeText(o.label, best.spot.x, best.spot.y)
    ctx.fillStyle = stateOf(o.id, view) ? THEME.accent : THEME.ink
    ctx.fillText(o.label, best.spot.x, best.spot.y)
  }
  ctx.restore()
}

/** Numbered badges over the objects chosen so far as a tool's givens. */
function drawPickBadges(ctx, scene, view, S) {
  if (!view.picked || !view.picked.length) return
  ctx.save()
  ctx.font = THEME.badgeFont
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  view.picked.forEach((id, i) => {
    const o = scene.objects.get(id)
    if (!o) return
    const anchor = o.type === 'point' ? o.pos : anchorOfCurve(o.geom)
    const p = S(anchor)
    const at = { x: p.x + 12, y: p.y - 12 }
    dot(ctx, at, 8, THEME.accent)
    ctx.fillStyle = THEME.paper
    ctx.fillText(String(i + 1), at.x, at.y + 0.5)
  })
  ctx.restore()
}

function anchorOfCurve(geom) {
  if (geom.kind === 'circle') return { x: geom.c.x, y: geom.c.y - geom.r }
  return G.pointAt(geom, Number.isFinite(geom.t1) ? 0.5 : 1)
}

/* ------------------------------------------------------------------ *
 * Work in progress
 * ------------------------------------------------------------------ */

function drawPending(ctx, scene, view, S, clip) {
  const pending = view.pending
  if (!pending || !pending.anchor || !view.cursor) return
  ctx.save()
  ctx.strokeStyle = THEME.accent
  ctx.lineWidth = 1.2
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  if (pending.op === 'circle') {
    const centre = S(pending.anchor)
    const edge = S(view.cursor)
    const r = Math.hypot(edge.x - centre.x, edge.y - centre.y)
    if (r < 1e6) ctx.arc(centre.x, centre.y, r, 0, Math.PI * 2)
    ctx.moveTo(centre.x, centre.y)
    ctx.lineTo(edge.x, edge.y)
  } else {
    const t1 = pending.op === 'segment' ? 1 : Infinity
    const t0 = pending.op === 'line' ? -Infinity : 0
    const geom = G.lineThrough(pending.anchor, view.cursor, t0, t1)
    if (geom) pathOfCurve(ctx, geom, S, clip)
  }
  ctx.stroke()
  ctx.restore()
  ring(ctx, S(pending.anchor), 6, THEME.accent, 1.4)
}

/**
 * A construction that can go either way, drawn both ways at once.
 *
 * Each outcome is laid down faintly and the two candidate points are left
 * solid, so what is being asked is visible rather than described: everything
 * that is common to both ways sits still, and only the choice stands out.
 */
function drawChoice(ctx, view, S, clip) {
  if (!view.choice || !view.choice.length) return
  ctx.save()
  for (const option of view.choice) {
    for (const o of option.objects) {
      if (o.type === 'curve') {
        strokeCurve(ctx, o, S, clip, { color: choiceTint(o), width: 1.2, dash: [3, 4] })
      } else if (o.pos) {
        dot(ctx, S(o.pos), 1.8, THEME.ghost)
      }
    }
  }
  // Both candidates carry the letter the point is about to take, told apart by
  // a tick, so the question reads as "which of these is to be C?"
  const marks = ['′', '″']
  ctx.font = THEME.labelFont
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  view.choice.forEach((option, i) => {
    const p = S(option.point)
    dot(ctx, p, 9, THEME.paper)
    ring(ctx, p, 8.5, THEME.accent, 1.6)
    dot(ctx, p, 4, THEME.accent)
    if (!option.label) return
    const text = option.label + (marks[i] || '')
    const at = { x: p.x + 17, y: p.y - 13 }
    ctx.lineWidth = 3.5
    ctx.strokeStyle = THEME.paper
    ctx.strokeText(text, at.x, at.y)
    ctx.fillStyle = THEME.accent
    ctx.fillText(text, at.x, at.y)
  })
  ctx.restore()
}

function choiceTint(o) {
  const base = (o.color && PALETTE[o.color]) || THEME.construction
  return `color-mix(in srgb, ${base} 42%, ${THEME.paper})`
}

/** Where a click would put a point: on an object, or loose on the page. */
function drawSnap(ctx, view, S) {
  if (!view.snap) return
  const p = S(view.snap.pos)
  if (view.snap.kind === 'existing') return
  ctx.save()
  ctx.setLineDash(view.snap.kind === 'onCurve' ? [] : [2, 3])
  ring(ctx, p, 5.5, THEME.accent, 1.2)
  ctx.restore()
}

/* ------------------------------------------------------------------ *
 * Primitives
 * ------------------------------------------------------------------ */

function dot(ctx, p, r, color) {
  ctx.beginPath()
  ctx.fillStyle = color
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
  ctx.fill()
}

function ring(ctx, p, r, color, width) {
  ctx.beginPath()
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
  ctx.stroke()
}

/** Size the backing store to the element and the display density. */
export function resizeCanvas(canvas, w, h, dpr) {
  const pw = Math.max(1, Math.round(w * dpr))
  const ph = Math.max(1, Math.round(h * dpr))
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw
    canvas.height = ph
  }
}
