/**
 * The things a proof compares.
 *
 * Book I is almost entirely a book of equalities: this line equals that one,
 * this angle equals that one, these triangles are equal in every respect. None
 * of that can be said with points and lines alone, so a magnitude is what a
 * claim is about.
 *
 * A magnitude is not an object in the figure. It is a way of reading the figure
 * — the distance between these two points, the angle at that vertex — so it is
 * written as its kind and the points it is read from, and evaluated afresh
 * whenever the figure moves. That is what lets a claim be dragged and still
 * mean the same thing.
 *
 *   { kind: 'length',   pts: [a, b] }        the straight line from a to b
 *   { kind: 'angle',    pts: [a, v, b] }     the angle at v, between va and vb
 *   { kind: 'triangle', pts: [a, b, c] }     the triangle, compared by congruence
 *
 * Euclid compares triangles "in every respect", meaning all three sides and all
 * three angles — which for triangles follows from the sides alone, so that is
 * what is measured.
 */

import * as G from './geometry.js'

export const KINDS = ['length', 'angle', 'triangle']

/** How many points each kind is read from. */
export const ARITY = { length: 2, angle: 3, triangle: 3 }

export const magnitude = (kind, pts) => ({ kind, pts })

/** The same magnitude written the same way, so two of them can be compared. */
export function canonical(mag) {
  if (mag.kind === 'length') return { kind: 'length', pts: [...mag.pts].sort() }
  // An angle is named by its vertex and its two arms; the arms may be given
  // either way round.
  if (mag.kind === 'angle') {
    const [a, v, b] = mag.pts
    return { kind: 'angle', pts: a <= b ? [a, v, b] : [b, v, a] }
  }
  return { kind: mag.kind, pts: [...mag.pts].sort() }
}

export const sameMagnitude = (x, y) => {
  const a = canonical(x)
  const b = canonical(y)
  return a.kind === b.kind && a.pts.length === b.pts.length && a.pts.every((p, i) => p === b.pts[i])
}

/**
 * Read a magnitude off a scene.
 *
 * Returns null when the figure does not currently support it — a point that
 * has gone, or an angle whose arms have collapsed onto its vertex — so that a
 * claim about it can say it cannot be read rather than quietly reporting zero.
 */
export function measure(mag, scene) {
  const pts = mag.pts.map((id) => {
    const o = scene.get ? scene.get(id) : scene.objects.get(id)
    return o && o.type === 'point' ? o.pos : null
  })
  if (pts.some((p) => !p)) return null
  if (mag.kind === 'length') return G.dist(pts[0], pts[1])
  if (mag.kind === 'angle') {
    const [a, v, b] = pts
    const u = G.sub(a, v)
    const w = G.sub(b, v)
    const lu = G.len(u)
    const lw = G.len(w)
    if (lu < G.EPS || lw < G.EPS) return null
    // Through the cross product as well as the dot, so a very small or very
    // wide angle is read as accurately as a middling one.
    return Math.atan2(Math.abs(G.cross(u, w)), G.dot(u, w))
  }
  if (mag.kind === 'triangle') {
    const [a, b, c] = pts
    const sides = [G.dist(a, b), G.dist(b, c), G.dist(c, a)].sort((x, y) => x - y)
    if (sides[0] < G.EPS) return null
    return sides
  }
  return null
}

/**
 * How two magnitudes stand to one another: -1, 0 or 1, or null if either
 * cannot be read.
 *
 * Two triangles are equal when their sides match, and otherwise simply unequal
 * — Euclid never says one triangle is greater than another, only that they are
 * or are not equal in every respect.
 */
export function compare(x, y, scene, tolerance = 1e-7) {
  const a = measure(x, scene)
  const b = measure(y, scene)
  if (a == null || b == null) return null
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return null
    const scale = Math.max(...a, ...b, 1)
    return a.every((v, i) => Math.abs(v - b[i]) <= tolerance * scale) ? 0 : 1
  }
  const scale = Math.max(Math.abs(a), Math.abs(b), 1)
  if (Math.abs(a - b) <= tolerance * scale) return 0
  return a < b ? -1 : 1
}

export const RELATIONS = {
  eq: { symbol: '=', holds: (c) => c === 0, says: 'equals' },
  gt: { symbol: '>', holds: (c) => c === 1, says: 'is greater than' },
  lt: { symbol: '<', holds: (c) => c === -1, says: 'is less than' },
}

/** Does a claim hold as the figure now stands? */
export function holds(claim, scene, tolerance) {
  const relation = RELATIONS[claim.rel]
  if (!relation) return null
  const c = compare(claim.of[0], claim.of[1], scene, tolerance)
  if (c == null) return null
  // Triangles are equal or not; there is no greater.
  if (claim.of.some((m) => m.kind === 'triangle') && claim.rel !== 'eq') return null
  return relation.holds(c)
}

/** What a magnitude is called, given a way of lettering points. */
export function nameOf(mag, letter) {
  const p = mag.pts.map(letter)
  if (mag.kind === 'length') return p.join('')
  if (mag.kind === 'angle') return `∠${p[0]}${p[1]}${p[2]}`
  return `△${p.join('')}`
}

/**
 * Everything a selection could reasonably be taken to mean, likeliest first.
 *
 * Two points can only be a length. Three are genuinely ambiguous — a triangle,
 * or the angle at any one of its three corners — and a triangle drawn on the
 * page does not settle it, since Book I is largely about the angles of
 * triangles. So all the readings are offered and the reader says which.
 *
 * The order is a guess at what was meant: with only two of the three sides
 * drawn, the angle where they meet comes first, because that is the figure in
 * front of you. With all three drawn, the triangle leads.
 */
export function readingsOf(ids, joined = () => false) {
  if (ids.length === 2) return [magnitude('length', ids)]
  if (ids.length !== 3) return []
  const [a, b, c] = ids
  const sides = [[a, b], [b, c], [c, a]].filter(([x, y]) => joined(x, y))
  const angles = [
    magnitude('angle', [b, a, c]),
    magnitude('angle', [a, b, c]),
    magnitude('angle', [a, c, b]),
  ]
  if (sides.length >= 3) return [magnitude('triangle', ids), ...angles]
  if (sides.length === 2) {
    // Two sides drawn: the angle between them is what is being looked at.
    const counts = new Map()
    for (const [x, y] of sides) {
      counts.set(x, (counts.get(x) || 0) + 1)
      counts.set(y, (counts.get(y) || 0) + 1)
    }
    const found = [...counts].find(([, n]) => n === 2)
    if (found) {
      const here = angles.find((m) => m.pts[1] === found[0])
      return [here, ...angles.filter((m) => m !== here)]
    }
  }
  return angles
}

/** The likeliest reading of a selection, or null if it is not a magnitude. */
export function fromPoints(ids, joined) {
  return readingsOf(ids, joined)[0] || null
}
