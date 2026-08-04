/**
 * Planar geometry primitives.
 *
 * Pure functions only — no DOM, no imports. This module (and doc/solve/macros)
 * must stay runnable under plain Node so the constructions can be unit tested.
 *
 * Curves come in exactly two flavours, matching Euclid's first three postulates:
 *
 *   line   { kind: 'line', a, b, d, t0, t1 }   P(t) = a + t·d,  d = b − a
 *                                              segment t ∈ [0,1]
 *                                              ray     t ∈ [0,∞)
 *                                              line    t ∈ (−∞,∞)
 *   circle { kind: 'circle', c, r, a0 }        P(θ) = c + r·(cos(a0+θ), sin(a0+θ))
 *
 * `a0` is the angle of the point the circle was drawn through. Keeping it means
 * a point taken "at random" on a circle is stored relative to the circle's own
 * frame, so it travels correctly when the construction is dragged.
 */

export const EPS = 1e-9

export const v = (x, y) => ({ x, y })
export const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y })
export const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y })
export const scale = (a, k) => ({ x: a.x * k, y: a.y * k })
export const dot = (a, b) => a.x * b.x + a.y * b.y
export const cross = (a, b) => a.x * b.y - a.y * b.x
export const len2 = (a) => a.x * a.x + a.y * a.y
export const len = (a) => Math.hypot(a.x, a.y)
export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
export const perp = (a) => ({ x: -a.y, y: a.x })
export const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })

/** Smallest distance at which two derived points are considered the same point. */
export const MERGE_TOLERANCE = 1e-7

export function lineThrough(a, b, t0, t1) {
  const d = sub(b, a)
  if (len2(d) < EPS) return null
  return { kind: 'line', a, b, d, t0, t1 }
}

export const segment = (a, b) => lineThrough(a, b, 0, 1)
export const ray = (a, b) => lineThrough(a, b, 0, Infinity)
export const fullLine = (a, b) => lineThrough(a, b, -Infinity, Infinity)

export function circleThrough(c, through) {
  const rv = sub(through, c)
  const r = len(rv)
  if (r < EPS) return null
  return { kind: 'circle', c, r, a0: Math.atan2(rv.y, rv.x) }
}

/** Is parameter `t` inside the curve's drawn extent? */
export function inRange(curve, t) {
  if (curve.kind === 'circle') return true
  return t >= curve.t0 - EPS && t <= curve.t1 + EPS
}

export function pointAt(curve, t) {
  if (curve.kind === 'line') return add(curve.a, scale(curve.d, t))
  return { x: curve.c.x + curve.r * Math.cos(curve.a0 + t), y: curve.c.y + curve.r * Math.sin(curve.a0 + t) }
}

/** Inverse of pointAt: the parameter of the point on `curve` nearest to `p`. */
export function paramAt(curve, p) {
  if (curve.kind === 'line') return dot(sub(p, curve.a), curve.d) / len2(curve.d)
  return normalizeAngle(Math.atan2(p.y - curve.c.y, p.x - curve.c.x) - curve.a0)
}

export function clampParam(curve, t) {
  if (curve.kind === 'circle') return normalizeAngle(t)
  return Math.min(curve.t1, Math.max(curve.t0, t))
}

/**
 * A parameter drawn at random from the whole of a curve.
 *
 * The parameter means different things on different curves — an angle round a
 * circle, a fraction along a segment, a distance along a ray — so a figure
 * cannot be shaken properly without asking the curve what its own range is.
 * A curve that runs off to infinity is sampled over a few times its own scale,
 * which is as far as anything on the page will ever be.
 */
export function randomParam(kind, random = Math.random) {
  if (kind === 'circle') return normalizeAngle(random() * Math.PI * 2)
  const FAR = 3
  const t0 = kind === 'line' ? -FAR : 0
  const t1 = kind === 'segment' ? 1 : FAR
  return t0 + random() * (t1 - t0)
}

export function normalizeAngle(a) {
  const tau = Math.PI * 2
  return a - tau * Math.floor((a + Math.PI) / tau)
}

/** Nearest point of `curve` to `p`, respecting the curve's extent. */
export function project(curve, p) {
  return pointAt(curve, clampParam(curve, paramAt(curve, p)))
}

export function distanceToCurve(curve, p) {
  return dist(project(curve, p), p)
}

/**
 * Intersect two curves.
 *
 * Always returns a 2-slot array indexed by *branch*, with `null` in slots that
 * do not currently exist. The branch index is the thing that makes the whole
 * app work: it has to name the same intersection before and after the figure is
 * dragged, otherwise everything downstream of a two-circle intersection would
 * flip sides whenever the figure moved. So branches are ordered by a rule that
 * varies continuously with the input:
 *
 *   line × line    one solution, always branch 0
 *   line × circle  by parameter along the line (branch 0 = smaller t). Roots are
 *                  numbered from the *unclipped* quadratic, then clipped to the
 *                  line's extent, so clipping never renumbers the survivor.
 *   circle × circle branch 0 is left of the vector from the first centre to the
 *                  second, branch 1 is right. Argument order therefore matters,
 *                  and callers must always pass the pair in its stored order.
 */
export function intersect(a, b) {
  if (!a || !b) return [null, null]
  if (a.kind === 'line' && b.kind === 'line') return [lineLine(a, b), null]
  if (a.kind === 'line' && b.kind === 'circle') return lineCircle(a, b)
  if (a.kind === 'circle' && b.kind === 'line') return lineCircle(b, a)
  return circleCircle(a, b)
}

function lineLine(L, M) {
  const den = cross(L.d, M.d)
  if (Math.abs(den) < EPS * Math.max(1, len(L.d) * len(M.d))) return null
  const w = sub(M.a, L.a)
  const t = cross(w, M.d) / den
  const u = cross(w, L.d) / den
  if (!inRange(L, t) || !inRange(M, u)) return null
  return pointAt(L, t)
}

function lineCircle(L, C) {
  const f = sub(L.a, C.c)
  const qa = len2(L.d)
  if (qa < EPS) return [null, null]
  const qb = 2 * dot(f, L.d)
  const qc = len2(f) - C.r * C.r
  const disc = qb * qb - 4 * qa * qc
  if (disc < 0) return [null, null]
  const s = Math.sqrt(disc)
  const ts = [(-qb - s) / (2 * qa), (-qb + s) / (2 * qa)]
  return ts.map((t) => (inRange(L, t) ? pointAt(L, t) : null))
}

function circleCircle(A, B) {
  const dv = sub(B.c, A.c)
  const dd = len(dv)
  if (dd < EPS) return [null, null] // concentric (or the same circle)
  if (dd > A.r + B.r) return [null, null]
  if (dd < Math.abs(A.r - B.r)) return [null, null]
  const m = (A.r * A.r - B.r * B.r + dd * dd) / (2 * dd)
  const h2 = A.r * A.r - m * m
  const h = h2 > 0 ? Math.sqrt(h2) : 0
  const base = add(A.c, scale(dv, m / dd))
  const off = scale(perp(dv), h / dd)
  return [add(base, off), sub(base, off)]
}

/** Bounding box of a set of world points, padded by `pad` world units. */
export function boundsOf(points, pad = 0) {
  if (!points.length) return null
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of points) {
    if (p.x < minX) minX = p.x
    if (p.y < minY) minY = p.y
    if (p.x > maxX) maxX = p.x
    if (p.y > maxY) maxY = p.y
  }
  return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad }
}

/**
 * Does any part of a curve lie inside a rectangle?
 *
 * What a lasso ought to catch: sweeping across a circle's rim catches the
 * circle, without having to enclose the whole of it.
 */
export function meetsRect(curve, rect) {
  const box = { minX: rect.x0, minY: rect.y0, maxX: rect.x1, maxY: rect.y1 }
  if (curve.kind === 'line') return !!clipLineToRect(curve, box)
  // A circle meets the rectangle unless it is wholly outside or wholly inside
  // the empty middle — so compare the nearest and furthest corners to the ring.
  const near = {
    x: Math.max(box.minX, Math.min(curve.c.x, box.maxX)),
    y: Math.max(box.minY, Math.min(curve.c.y, box.maxY)),
  }
  if (dist(curve.c, near) > curve.r) return false
  const far = Math.max(
    dist(curve.c, { x: box.minX, y: box.minY }),
    dist(curve.c, { x: box.maxX, y: box.minY }),
    dist(curve.c, { x: box.minX, y: box.maxY }),
    dist(curve.c, { x: box.maxX, y: box.maxY }),
  )
  return far >= curve.r
}

/**
 * Clip an infinite/semi-infinite line to a rectangle, returning the drawable
 * end points, or null when the line misses the rectangle entirely.
 */
export function clipLineToRect(curve, rect) {
  let t0 = curve.t0
  let t1 = curve.t1
  const p = [-curve.d.x, curve.d.x, -curve.d.y, curve.d.y]
  const q = [curve.a.x - rect.minX, rect.maxX - curve.a.x, curve.a.y - rect.minY, rect.maxY - curve.a.y]
  for (let i = 0; i < 4; i++) {
    if (Math.abs(p[i]) < EPS) {
      if (q[i] < 0) return null // parallel to this edge and outside it
      continue
    }
    const t = q[i] / p[i]
    if (p[i] < 0) t0 = Math.max(t0, t)
    else t1 = Math.min(t1, t)
  }
  if (t0 > t1) return null
  return [pointAt(curve, t0), pointAt(curve, t1)]
}
