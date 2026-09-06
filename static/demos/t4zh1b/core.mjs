/**
 * Ornament geometry, ported from the Python core.
 *
 * This exists so the design studio can render at 60fps while a slider is being
 * dragged, which a round trip to Python cannot do. It is a second
 * implementation of the same geometry, which is a liability unless the two are
 * held together: `crosscheck.mjs` renders the same specs through both and fails
 * if any coordinate differs by more than 1e-9. Python remains the reference --
 * it is the one with the research in its docstrings and the property tests
 * behind it. If the two disagree, this file is wrong.
 *
 * Runs unmodified in the browser and in Node (no imports, no DOM).
 *
 * Coordinates are SVG's: y increases downward, so an arch rises to smaller y.
 * Units are points (1/72in) throughout.
 */

const EPS = 1e-9;

// --------------------------------------------------------------------------- //
// Tilings
// --------------------------------------------------------------------------- //

export function regularPolygon(cx, cy, radius, n, phase = 0) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = phase + (2 * Math.PI * i) / n;
    out.push([cx + radius * Math.cos(a), cy + radius * Math.sin(a)]);
  }
  return out;
}

export function tilingSquare(edge, bounds, origin = [0, 0]) {
  const [x0, y0, x1, y1] = bounds;
  const [ox, oy] = origin;
  const tiles = [];
  const i0 = Math.floor((x0 - ox) / edge) - 1, i1 = Math.ceil((x1 - ox) / edge) + 1;
  const j0 = Math.floor((y0 - oy) / edge) - 1, j1 = Math.ceil((y1 - oy) / edge) + 1;
  for (let i = i0; i <= i1; i++) {
    for (let j = j0; j <= j1; j++) {
      const px = ox + i * edge, py = oy + j * edge;
      tiles.push([[px, py], [px + edge, py], [px + edge, py + edge], [px, py + edge]]);
    }
  }
  return tiles;
}

export function tilingHexagon(edge, bounds, origin = [0, 0]) {
  const [x0, y0, x1, y1] = bounds;
  const [ox, oy] = origin;
  const dx = 1.5 * edge, dy = edge * Math.sqrt(3);
  const tiles = [];
  const i0 = Math.floor((x0 - ox) / dx) - 1, i1 = Math.ceil((x1 - ox) / dx) + 1;
  const j0 = Math.floor((y0 - oy) / dy) - 1, j1 = Math.ceil((y1 - oy) / dy) + 1;
  for (let i = i0; i <= i1; i++) {
    for (let j = j0; j <= j1; j++) {
      const cx = ox + i * dx;
      const cy = oy + j * dy + (((i % 2) + 2) % 2) * dy / 2;
      tiles.push(regularPolygon(cx, cy, edge, 6, 0));
    }
  }
  return tiles;
}

export function tilingOctagonSquare(edge, bounds, origin = [0, 0]) {
  const [x0, y0, x1, y1] = bounds;
  const [ox, oy] = origin;
  const pitch = edge * (1 + Math.sqrt(2));
  const rOct = edge / (2 * Math.sin(Math.PI / 8));
  const rSq = edge / Math.sqrt(2);
  const tiles = [];
  const i0 = Math.floor((x0 - ox) / pitch) - 1, i1 = Math.ceil((x1 - ox) / pitch) + 1;
  const j0 = Math.floor((y0 - oy) / pitch) - 1, j1 = Math.ceil((y1 - oy) / pitch) + 1;
  for (let i = i0; i <= i1; i++) {
    for (let j = j0; j <= j1; j++) {
      tiles.push(regularPolygon(ox + i * pitch, oy + j * pitch, rOct, 8, Math.PI / 8));
      tiles.push(regularPolygon(ox + (i + 0.5) * pitch, oy + (j + 0.5) * pitch, rSq, 4, 0));
    }
  }
  return tiles;
}

export function tilingDodecagonTriangle(edge, bounds, origin = [0, 0]) {
  const [x0, y0, x1, y1] = bounds;
  const [ox, oy] = origin;
  const pitch = edge * (2 + Math.sqrt(3));
  const rDod = edge / (2 * Math.sin(Math.PI / 12));
  const rowH = (pitch * Math.sqrt(3)) / 2;

  const j0 = Math.floor((y0 - oy) / rowH) - 1, j1 = Math.ceil((y1 - oy) / rowH) + 1;
  const i0 = Math.floor((x0 - ox) / pitch) - 2, i1 = Math.ceil((x1 - ox) / pitch) + 2;
  const centres = new Map();
  const key = (i, j) => `${i},${j}`;
  for (let j = j0; j <= j1; j++) {
    for (let i = i0; i <= i1; i++) {
      centres.set(key(i, j), [ox + i * pitch + (((j % 2) + 2) % 2) * pitch / 2, oy + j * rowH]);
    }
  }
  const tiles = [];
  for (const [cx, cy] of centres.values()) {
    tiles.push(regularPolygon(cx, cy, rDod, 12, Math.PI / 12));
  }

  // Each gap corner belongs to two dodecagons at once, so it is found from the
  // shared edge between a *pair* of centres, not from one centre's vertices.
  const sharedCorner = (ca, cb, toward) => {
    const mid = [(ca[0] + cb[0]) / 2, (ca[1] + cb[1]) / 2];
    const perp = [-(cb[1] - ca[1]), cb[0] - ca[0]];
    const d = Math.hypot(perp[0], perp[1]);
    const half = [(perp[0] / d) * (edge / 2), (perp[1] / d) * (edge / 2)];
    const p = [mid[0] + half[0], mid[1] + half[1]];
    const q = [mid[0] - half[0], mid[1] - half[1]];
    return Math.hypot(p[0] - toward[0], p[1] - toward[1]) <
      Math.hypot(q[0] - toward[0], q[1] - toward[1]) ? p : q;
  };

  for (let j = j0; j < j1; j++) {
    for (let i = i0; i < i1; i++) {
      const odd = ((j % 2) + 2) % 2;
      const up = [[i, j], [i + 1, j], [i + odd, j + 1]];
      const down = [[i + 1 - odd, j], [i, j + 1], [i + 1, j + 1]];
      for (const triple of [up, down]) {
        if (!triple.every(([a, b]) => centres.has(key(a, b)))) continue;
        const pts = triple.map(([a, b]) => centres.get(key(a, b)));
        const g = [(pts[0][0] + pts[1][0] + pts[2][0]) / 3, (pts[0][1] + pts[1][1] + pts[2][1]) / 3];
        tiles.push([0, 1, 2].map((k) => sharedCorner(pts[k], pts[(k + 1) % 3], g)));
      }
    }
  }
  return tiles;
}

export const TILINGS = {
  square: { make: tilingSquare, edgeOf: (cell) => cell, fold: 4 },
  hex: { make: tilingHexagon, edgeOf: (cell) => cell, fold: 6 },
  octagon: { make: tilingOctagonSquare, edgeOf: (cell) => cell / (1 + Math.sqrt(2)), fold: 8 },
  dodecagon: { make: tilingDodecagonTriangle, edgeOf: (cell) => cell / (2 + Math.sqrt(3)), fold: 12 },
};

// --------------------------------------------------------------------------- //
// Hankin's polygons-in-contact
// --------------------------------------------------------------------------- //

function raysForTile(poly, contactAngle, delta) {
  const n = poly.length;
  let cx = 0, cy = 0;
  for (const p of poly) { cx += p[0]; cy += p[1]; }
  cx /= n; cy /= n;
  const theta = (contactAngle * Math.PI) / 180;
  const rays = [];
  for (let i = 0; i < n; i++) {
    const a = poly[i], b = poly[(i + 1) % n];
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const along = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
    let normal = [-along[1], along[0]];
    if (normal[0] * (cx - mid[0]) + normal[1] * (cy - mid[1]) < 0) normal = [-normal[0], -normal[1]];
    for (const sign of [1, -1]) {
      const origin = [mid[0] + along[0] * (-sign * delta / 2), mid[1] + along[1] * (-sign * delta / 2)];
      const dx = along[0] * sign * Math.cos(theta) + normal[0] * Math.sin(theta);
      const dy = along[1] * sign * Math.cos(theta) + normal[1] * Math.sin(theta);
      const dl = Math.hypot(dx, dy);
      rays.push({ origin, dir: [dx / dl, dy / dl] });
    }
  }
  return rays;
}

function join(r1, r2) {
  const [o1, d1] = [r1.origin, r1.dir];
  const [o2, d2] = [r2.origin, r2.dir];
  const denom = d1[0] * d2[1] - d1[1] * d2[0];
  const diff = [o2[0] - o1[0], o2[1] - o1[1]];
  if (Math.abs(denom) > EPS) {
    const t1 = (diff[0] * d2[1] - diff[1] * d2[0]) / denom;
    const t2 = (diff[0] * d1[1] - diff[1] * d1[0]) / denom;
    if (t1 > EPS && t2 > EPS) {
      const p = [o1[0] + d1[0] * t1, o1[1] + d1[1] * t1];
      return [t1 + t2, [o1, p, o2]];
    }
    return null;
  }
  const dn = Math.hypot(diff[0], diff[1]);
  const u = dn > EPS ? [diff[0] / dn, diff[1] / dn] : d1;
  if (Math.abs(u[0] * d1[1] - u[1] * d1[0]) > 1e-6) return null;
  if (d1[0] * d2[0] + d1[1] * d2[1] < 0 && diff[0] * d1[0] + diff[1] * d1[1] > 0) {
    return [dn, [o1, o2]];
  }
  return null;
}

export function hankinMotif(poly, contactAngle = 45, delta = 0) {
  const rays = raysForTile(poly, contactAngle, delta);
  const candidates = [];
  for (let i = 0; i < rays.length; i++) {
    for (let j = i + 1; j < rays.length; j++) {
      const r = join(rays[i], rays[j]);
      if (r) candidates.push([r[0], i, j, r[1]]);
    }
  }
  // Sorted on (quantised cost, i, j). A regular tile's symmetric pairings have
  // costs that are equal in exact arithmetic and differ by ~1e-15 in floating
  // point; sorting on the raw cost lets that noise permute the output. Rounding
  // to 1e-6pt puts genuine ties in one bucket and lets the ray indices decide.
  // Must stay identical to girih.py's key.
  const q = (x) => Math.round(x * 1e6) / 1e6;
  candidates.sort((a, b) => q(a[0]) - q(b[0]) || a[1] - b[1] || a[2] - b[2]);
  const used = new Set();
  const motif = [];
  for (const [, i, j, path] of candidates) {
    if (used.has(i) || used.has(j)) continue;
    used.add(i); used.add(j);
    motif.push(path);
  }
  return motif;
}

export function pattern(tiles, contactAngle = 45, delta = 0) {
  const paths = [];
  for (const tile of tiles) paths.push(...hankinMotif(tile, contactAngle, delta));
  return paths;
}

/** Chain strand fragments end to end into continuous runs. Must match girih.py. */
/**
 * How sharply taking `cand` would bend the strand. Smaller is straighter.
 * Must match girih.py.
 */
function turnCost(run, paths, cand) {
  const [j, atEnd] = cand;
  const seg = paths[j];
  const a = run[run.length - 2], b = run[run.length - 1];
  const nxt = atEnd ? seg[seg.length - 2] : seg[1];
  const ux = b[0] - a[0], uy = b[1] - a[1];
  const vx = nxt[0] - b[0], vy = nxt[1] - b[1];
  const lu = Math.hypot(ux, uy) || 1, lv = Math.hypot(vx, vy) || 1;
  return 1 - (ux * vx + uy * vy) / (lu * lv);
}

/**
 * Chain strand fragments end to end.
 *
 * `straight` changes what happens at a junction: four ends meet at every tile
 * edge midpoint, and by default the chain takes whichever is free, which is
 * fine for closed loops to fill. It is not fine for weaving -- a ribbon goes
 * straight on through a crossing -- so `interlace` asks for the continuation
 * that turns least. Must match girih.py.
 */
export function joinStrands(paths, tol = 1e-6, straight = false) {
  if (!paths.length) return [];
  const key = (p) => `${Math.round(p[0] / tol)},${Math.round(p[1] / tol)}`;
  const ends = new Map();
  paths.forEach((p, i) => {
    for (const [pt, atEnd] of [[p[0], false], [p[p.length - 1], true]]) {
      const k = key(pt);
      if (!ends.has(k)) ends.set(k, []);
      ends.get(k).push([i, atEnd]);
    }
  });
  const used = new Array(paths.length).fill(false);
  const runs = [];
  for (let i = 0; i < paths.length; i++) {
    if (used[i]) continue;
    used[i] = true;
    let run = paths[i].slice();
    for (let pass = 0; pass < 2; pass++) {
      for (;;) {
        const cands = (ends.get(key(run[run.length - 1])) || []).filter(([j]) => !used[j]);
        let nxt = null;
        if (cands.length === 1 || (cands.length > 1 && !(straight && run.length > 1))) {
          nxt = cands[0];
        } else if (cands.length > 1) {
          nxt = cands.reduce((best, cc) =>
            turnCost(run, paths, cc) < turnCost(run, paths, best) ? cc : best);
        }
        if (!nxt) break;
        const [j, atEnd] = nxt;
        used[j] = true;
        const seg = paths[j].slice();
        if (atEnd) seg.reverse();
        run = run.concat(seg.slice(1));
      }
      run.reverse();
    }
    runs.push(run);
  }
  return runs;
}

export function contactForTip(fold, tipAngle) {
  return (180 + 360 / fold - tipAngle) / 2;
}

export function tipForContact(fold, contact) {
  return 180 + 360 / fold - 2 * contact;
}

// --------------------------------------------------------------------------- //
// Arches
// --------------------------------------------------------------------------- //

function arc(cx, cy, r, a0, a1, steps) {
  const out = [];
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps;
    out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return out;
}

export function semicircular(cx, y, span, steps = 128) {
  return arc(cx, y, span / 2, Math.PI, 2 * Math.PI, steps);
}

export function horseshoe(cx, y, span, overshoot = 45, steps = 160) {
  const phi = (overshoot * Math.PI) / 180;
  return arc(cx, y, span / 2, Math.PI - phi, 2 * Math.PI + phi, steps);
}

export function pointed(cx, y, span, offset = null, steps = 96) {
  if (offset === null || offset === undefined) offset = span / 4;
  const half = span / 2;
  const r = half + offset;
  const rise = Math.sqrt(Math.max(r * r - offset * offset, 0));
  const mod2pi = (a) => ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const left = arc(cx + offset, y, r, Math.PI, mod2pi(Math.atan2(-rise, -offset)), steps);
  const right = arc(cx - offset, y, r, mod2pi(Math.atan2(-rise, offset)), 2 * Math.PI, steps);
  return left.concat(right.slice(1));
}

export function fourCentred(cx, y, span, rise, haunch = null, steps = 96) {
  const half = span / 2;
  const r = haunch === null || haunch === undefined ? span / 4 : haunch;
  if (rise <= r) throw new Error("rise must exceed the haunch radius");
  if (rise >= half) throw new Error("four-centred arch needs rise < span/2 (it is a depressed arch)");
  const t = ((half - r) ** 2 - (rise - r) ** 2) / (2 * (rise - r));
  const bigR = rise + t;
  const s = [-(half - r), 0];
  const lc = [0, -t];
  // Internal tangency: they touch on the ray from the wide centre *through* the
  // small centre and out the far side, not on the segment between them.
  const ux = s[0] - lc[0], uy = s[1] - lc[1];
  const d = Math.hypot(ux, uy);
  const tp = [s[0] + (r * ux) / d, s[1] + (r * uy) / d];
  const smallA0 = Math.PI;
  const smallA1 = Math.atan2(tp[1] - s[1], tp[0] - s[0]);
  const bigA0 = Math.atan2(tp[1] - lc[1], tp[0] - lc[0]);
  const bigA1 = Math.PI / 2;
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const a = smallA0 + ((smallA1 - smallA0) * i) / steps;
    pts.push([s[0] + r * Math.cos(a), s[1] + r * Math.sin(a)]);
  }
  for (let i = 1; i <= steps; i++) {
    const a = bigA0 + ((bigA1 - bigA0) * i) / steps;
    pts.push([lc[0] + bigR * Math.cos(a), lc[1] + bigR * Math.sin(a)]);
  }
  const left = pts.map(([px, py]) => [cx + px, y - py]);
  const right = pts.slice(0, -1).reverse().map(([px, py]) => [cx - px, y - py]);
  return left.concat(right);
}

function foil(a, b, inward, depth, steps) {
  const cxx = b[0] - a[0], cyy = b[1] - a[1];
  const c = Math.hypot(cxx, cyy);
  const ux = cxx / c, uy = cyy / c;
  const out = [];
  for (let i = 0; i <= steps; i++) {
    const s = i / steps;
    const along = (c / 2) * (1 - Math.cos(Math.PI * s));
    const off = (c / 2) * Math.sin(Math.PI * s) * depth;
    out.push([a[0] + ux * along + inward[0] * off, a[1] + uy * along + inward[1] * off]);
  }
  return out;
}

export function multifoil(cx, y, span, lobes = 9, depth = 1.0, base = "round", steps = 24) {
  const r = span / 2;
  const cusps = [];
  if (base === "round") {
    for (let k = 0; k <= lobes; k++) {
      const a = Math.PI + (Math.PI * k) / lobes;
      cusps.push([cx + r * Math.cos(a), y + r * Math.sin(a)]);
    }
  } else {
    // An odd count straddles the apex with a foil, blunting the point the
    // pointed base exists to make.
    if (lobes % 2) lobes += 1;
    const curve = pointed(cx, y, span, null, 240);
    for (let k = 0; k <= lobes; k++) {
      cusps.push(curve[Math.round((k * (curve.length - 1)) / lobes)]);
    }
  }
  const centre = [cx, y];
  let out = [];
  for (let k = 0; k < lobes; k++) {
    const a = cusps[k], b = cusps[k + 1];
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const vx = centre[0] - mid[0], vy = centre[1] - mid[1];
    const d = Math.hypot(vx, vy) || 1;
    const f = foil(a, b, [vx / d, vy / d], depth, steps);
    out = out.length ? out.concat(f.slice(1)) : f;
  }
  return out;
}

export function ogee(cx, y, span, rise, haunch = null, steps = 96) {
  const half = span / 2;
  if (!(0.55 * span <= rise && rise <= 0.95 * span)) {
    throw new Error("ogee rise should be between 0.55 and 0.95 of the span");
  }
  const r1 = haunch === null || haunch === undefined ? half * 0.45 : haunch;
  const c1 = [-half + r1, 0];
  const turn = (125 * Math.PI) / 180;
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const a = Math.PI - ((Math.PI - turn) * i) / steps;
    pts.push([c1[0] + r1 * Math.cos(a), c1[1] + r1 * Math.sin(a)]);
  }
  const j = pts[pts.length - 1];
  let nx = j[0] - c1[0], ny = j[1] - c1[1];
  const nd = Math.hypot(nx, ny);
  nx /= nd; ny /= nd;
  const vx = -j[0], vy = rise - j[1];
  const denom = 2 * (vx * nx + vy * ny);
  if (Math.abs(denom) < 1e-9) throw new Error("no ogee arc for this rise");
  const r2 = (vx * vx + vy * vy) / denom;
  const c2 = [j[0] + r2 * nx, j[1] + r2 * ny];
  const a0 = Math.atan2(j[1] - c2[1], j[0] - c2[0]);
  const a1 = Math.atan2(rise - c2[1], -c2[0]);
  const delta = ((a1 - a0 + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
  for (let i = 1; i <= steps; i++) {
    const a = a0 + (delta * i) / steps;
    pts.push([c2[0] + Math.abs(r2) * Math.cos(a), c2[1] + Math.abs(r2) * Math.sin(a)]);
  }
  const left = pts.map(([px, py]) => [cx + px, y - py]);
  const right = pts.slice(0, -1).reverse().map(([px, py]) => [cx - px, y - py]);
  return left.concat(right);
}

export const ARCH_KINDS = ["semicircular", "horseshoe", "pointed", "four_centred", "multifoil", "ogee"];

export function profile(kind, cx, y, span, kw = {}) {
  switch (kind) {
    case "semicircular": return semicircular(cx, y, span);
    case "horseshoe": return horseshoe(cx, y, span, kw.overshoot ?? 45);
    case "pointed": return pointed(cx, y, span, kw.offset ?? null);
    case "four_centred": return fourCentred(cx, y, span, kw.rise ?? span * 0.42, kw.haunch ?? null);
    case "multifoil": return multifoil(cx, y, span, kw.lobes ?? 9, kw.depth ?? 1.0, kw.base ?? "round");
    case "ogee": return ogee(cx, y, span, kw.rise ?? span * 0.8, kw.haunch ?? null);
    default: throw new Error(`unknown arch kind ${kind}`);
  }
}

export function headRise(kind, span, kw = {}) {
  return -Math.min(...profile(kind, 0, 0, span, kw).map((p) => p[1]));
}

export function headDrop(kind, span, kw = {}) {
  return Math.max(0, Math.max(...profile(kind, 0, 0, span, kw).map((p) => p[1])));
}

export function concentric(kind, span, inset, kw = {}) {
  const out = { ...kw };
  const keepFoils = out.keep_foils ?? false;
  delete out.keep_foils;
  const innerSpan = span - 2 * inset;
  if (innerSpan <= 0) throw new Error(`inset ${inset} is too deep for a span of ${span}`);

  if (kind === "pointed") {
    // Pin the offset before carrying it across, or it re-defaults against the
    // new span and the centres move.
    out.offset = out.offset ?? span / 4;
  } else if (kind === "four_centred") {
    out.haunch = (out.haunch ?? span / 4) - inset;
    out.rise = (out.rise ?? span * 0.42) - inset;
  } else if (kind === "ogee") {
    out.haunch = (out.haunch ?? (span / 2) * 0.45) - inset;
    out.rise = (out.rise ?? span * 0.8) - inset;
  } else if (kind === "multifoil" && !keepFoils) {
    // A constant-width offset of a cusped curve does not exist, so the offset
    // returns the plain base arch the foils were cut from -- the archivolt.
    const base = out.base ?? "round";
    return base === "pointed"
      ? ["pointed", innerSpan, { offset: span / 4 }]
      : ["semicircular", innerSpan, {}];
  } else if (kind === "multifoil") {
    out.depth = (out.depth ?? 1.0) * (innerSpan / span);
  }
  return [kind, innerSpan, out];
}

export function windowOutline(kind, cx, springing, span, jamb, kw = {}) {
  const head = profile(kind, cx, springing, span, kw);
  const sill = springing + jamb;
  return [[head[0][0], sill], ...head, [head[head.length - 1][0], sill]];
}

export class WindowSpec {
  constructor(kind = "pointed", span = 120, height = 260, kw = {}) {
    if (!ARCH_KINDS.includes(kind)) throw new Error(`unknown arch kind ${kind}`);
    this.kind = kind; this.span = span; this.height = height; this.kw = kw;
    const need = this.rise + this.drop;
    if (height <= need) {
      throw new Error(`height ${height} leaves no jamb: the ${kind} head needs ${need.toFixed(1)}`);
    }
  }
  get rise() { return headRise(this.kind, this.span, this.kw); }
  get drop() { return headDrop(this.kind, this.span, this.kw); }
  get jamb() { return this.height - this.rise; }
  get opening() {
    const p = profile(this.kind, 0, 0, this.span, this.kw);
    return Math.abs(p[p.length - 1][0] - p[0][0]);
  }
  outline(cx, top, inset = 0) {
    const [kind, span, kw] = inset
      ? concentric(this.kind, this.span, inset, this.kw)
      : [this.kind, this.span, { ...this.kw }];
    const rise = headRise(kind, span, kw);
    const springing = top + inset + rise;
    const jamb = this.height - 2 * inset - rise;
    if (jamb <= 0) throw new Error(`inset ${inset} is too deep for a height of ${this.height}`);
    return windowOutline(kind, cx, springing, span, jamb, kw);
  }
}

// --------------------------------------------------------------------------- //
// Tone — ruled and stippled grounds. Must match girih.py / compose.py.
// --------------------------------------------------------------------------- //

export function hatch(bounds, angle = 45, spacing = 3, phase = 0) {
  const [x0, y0, x1, y1] = bounds;
  const a = (angle * Math.PI) / 180;
  const ux = Math.cos(a), uy = Math.sin(a);
  const nx = -uy, ny = ux;
  const corners = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const ts = corners.map(([x, y]) => x * nx + y * ny);
  const reach = Math.hypot(x1 - x0, y1 - y0);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const mid = cx * nx + cy * ny;
  const out = [];
  const k0 = Math.floor((Math.min(...ts) - mid - phase) / spacing);
  const k1 = Math.ceil((Math.max(...ts) - mid - phase) / spacing);
  for (let k = k0; k <= k1; k++) {
    const t = phase + k * spacing;
    const px = cx + nx * t, py = cy + ny * t;
    out.push([[px - ux * reach, py - uy * reach], [px + ux * reach, py + uy * reach]]);
  }
  return out;
}

/** Dots as degenerate segments; round line caps render them as circles. */
export function stipple(bounds, spacing = 3, stagger = true) {
  const [x0, y0, x1, y1] = bounds;
  const rowH = stagger ? (spacing * Math.sqrt(3)) / 2 : spacing;
  const out = [];
  const j0 = Math.floor(y0 / rowH) - 1, j1 = Math.ceil(y1 / rowH) + 1;
  for (let j = j0; j <= j1; j++) {
    const y = j * rowH;
    const shift = stagger && ((j % 2) + 2) % 2 ? spacing / 2 : 0;
    const i0 = Math.floor((x0 - shift) / spacing) - 1;
    const i1 = Math.ceil((x1 - shift) / spacing) + 1;
    for (let i = i0; i <= i1; i++) {
      const x = shift + i * spacing;
      out.push([[x, y], [x, y]]);
    }
  }
  return out;
}

// The two diagonals come off the 1885 Benares frontmatter, not from 45
// degrees. The 1885 Benares Volume I Kufic panel hatches at 35 and 47 degrees
// from the vertical -- deliberately not mirrors, because at a shared 45 every
// boundary between the two families resolves into an unbroken chevron and the
// field reads as waves. Converted to degrees from the horizontal, y down.
// Must match compose.py.
export const BENARES_DIAGONALS = [43, -55];

export const TINCTURES = {
  argent:  null,
  or:      { kind: "stipple", angle: 0,  spacing: 4, stroke: 0.5 },
  azure:   { kind: "hatch",   angle: 0,  spacing: 3, stroke: 0.3 },
  gules:   { kind: "hatch",   angle: 90, spacing: 3, stroke: 0.3 },
  vert:    { kind: "hatch",   angle: BENARES_DIAGONALS[0], spacing: 3, stroke: 0.3 },
  purpure: { kind: "hatch",   angle: BENARES_DIAGONALS[1], spacing: 3, stroke: 0.3 },
  sable:   { kind: "cross",   angle: 0,  spacing: 3, stroke: 0.3 },
};

/**
 * The star polygon {n/skip} as a single closed path.
 *
 * `n` and `skip` must be coprime. Where they are not, {n/skip} is a *compound* --
 * {6/2} is two triangles, the Seal of Solomon -- and walking it as one path
 * silently visits only n/gcd of the points and returns that smaller figure
 * instead. Must match girih.py.
 */
export function starPolygon(cx, cy, radius, n, skip, phase = 0) {
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  if (gcd(n, skip) !== 1) {
    throw new Error(`{${n}/${skip}} is a compound of ${gcd(n, skip)} figures, not a `
                    + `star polygon; draw them separately`);
  }
  const step = (2 * Math.PI) / n;
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = phase + step * ((i * skip) % n);
    out.push([cx + radius * Math.cos(a), cy + radius * Math.sin(a)]);
  }
  return out;
}

/** Roughly what share of a toned area is ink. ~1/3 is the Kufic plate's tone. */
export function inkFraction(tone) {
  if (!tone) return 0;
  if (tone.kind === "solid") return 1;
  if (tone.kind === "stipple") {
    const cell = tone.spacing * tone.spacing * Math.sqrt(3) / 2;
    return Math.min(1, (Math.PI * (tone.stroke / 2) ** 2) / cell);
  }
  const r = tone.stroke / tone.spacing;
  return Math.min(1, tone.kind === "cross" ? 2 * r : r);
}

export function toneMarks(tone, bounds) {
  if (!tone) return [];
  if (tone.kind === "hatch") return hatch(bounds, tone.angle, tone.spacing);
  if (tone.kind === "cross") {
    return hatch(bounds, tone.angle, tone.spacing).concat(hatch(bounds, tone.angle + 90, tone.spacing));
  }
  if (tone.kind === "stipple") return stipple(bounds, tone.spacing);
  return [];
}

// --------------------------------------------------------------------------- //
// Composition
// --------------------------------------------------------------------------- //

export const TILING_LADDER = ["dodecagon", "octagon", "hex", "square"];
export const LADDER_TIPS = [60, 90, 100, 110];

export function ladderPattern(depth, cell, stroke = 0.7) {
  const rung = (depth - 1) % TILING_LADDER.length;
  const tiling = TILING_LADDER[rung];
  return {
    tiling, cell, stroke,
    contact: contactForTip(TILINGS[tiling].fold, LADDER_TIPS[rung]),
    delta: 0,
  };
}

/** Rings ordered for an outward composition: own grid nearest the opening. */
export function nestingRings(depth, band, cell = null, stroke = 0.7) {
  const rings = [];
  for (let d = depth; d >= 1; d--) {
    rings.push({ width: band, pattern: ladderPattern(d, cell ?? band, stroke), rule: 1.0, depth: d });
  }
  return rings;
}

function bbox(poly) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of poly) {
    if (x < x0) x0 = x; if (x > x1) x1 = x;
    if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return [x0, y0, x1, y1];
}

export function pointInPolygon(poly, pt) {
  const [x, y] = pt;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// Drops only tiles the clip would discard anyway, so it must never change what
// is drawn. The keep test is a bounding box, which is sound. The hole test
// cannot be: for a curved hole the box corners lie outside the shape, so tiles
// in an arch's shoulders were dropped though they were needed -- the holes in
// the pattern. Must match girih.py.
function restrictOutside(tiles, keep, hole, slack) {
  const [kx0, ky0, kx1, ky1] = bbox(keep);
  const out = [];
  for (const t of tiles) {
    const [x0, y0, x1, y1] = bbox(t);
    if (x1 < kx0 - slack || x0 > kx1 + slack || y1 < ky0 - slack || y0 > ky1 + slack) continue;
    if (t.every((v) => pointInPolygon(hole, v))) continue;
    out.push(t);
  }
  return out;
}

/**
 * Draw rings from the outside in along boundaries given by `outlineAt`.
 * Returns { layers, rules, reserved } -- geometry only, no markup.
 */
import * as pig from "./pigments.mjs";

/* ------------------------------------------------------------------------- *
 * Relief: the ring stack read as a moulding standing off the wall
 * Port of relief.py -- see there for the derivation.
 * ------------------------------------------------------------------------- */

export const BULGE_LIMIT = 85.0;
export const ARRIS_ANGLE = 25.0;

/**
 * How far each sector reaches past its mitre, in points, when it is drawn.
 *
 * Two clip paths that abut exactly do not meet exactly once rasterised: each is
 * antialiased to partial coverage along the shared edge, so a hairline of paper
 * shows through and reads as a faint line ruled diagonally across every corner.
 * Overlapping by a hair removes it and costs nothing visible. Must match
 * relief.py.
 */
export const MITRE_BLEED = 0.2;

/** How far in to look for a curve the family really is parallel to. */
export const PROBE = 0.5;

/** Shading constants. Must match relief.py. */
export const SHADE_MAX_INK = 0.34;
export const SHADE_STROKE = 0.3;
/**
 * Where the light is: degrees clockwise from the top, then degrees above.
 * The elevation matters more than the azimuth -- at 90 the light sits on the
 * viewing axis, both rims turn away from it equally, and the shading comes out
 * symmetric, which reads as two dark edges rather than a round thing. Must
 * match relief.py.
 */
export const DEFAULT_LIGHT = [315.0, 35.0];
export const SHADE_LEVELS = 7;
export const SHADE_MIN_STROKE = 0.08;

/** Unit vector pointing at the light. Page coordinates, so y runs down. */
export function lightVector(azimuth = DEFAULT_LIGHT[0], elevation = DEFAULT_LIGHT[1]) {
  const a = (azimuth * Math.PI) / 180, e = (elevation * Math.PI) / 180;
  return [Math.sin(a) * Math.cos(e), -Math.cos(a) * Math.cos(e), Math.sin(e)];
}

/**
 * The curve to measure depth from, and the inset it sits at. Must match
 * relief.py, where the reasoning is written out.
 *
 * Normally outline(0). The multifoil is the exception: its offsets return the
 * plain archivolt the foils were cut from, which is nowhere parallel to the
 * lobed opening, so depth is measured from the archivolt -- the thing that
 * actually stands off the wall -- and the foils are shapes cut into its edge.
 */
export function offsetReference(outlineAt, span, probe = PROBE) {
  const ref = outlineAt(0);
  if (span <= 0 || probe <= 0 || probe >= span) return [ref, 0];
  let near;
  try { near = outlineAt(probe); } catch { return [ref, 0]; }
  if (near.length !== ref.length) return [near, probe];
  const field = new Field([...ref, ref[0]], Math.max(span, 1));
  const step = Math.max(1, Math.floor(near.length / 48));
  const devs = [];
  for (let i = 0; i < near.length; i += step) {
    const hit = field.nearest(near[i]);
    devs.push(hit === null ? probe : Math.abs(hit[0] - probe));
  }
  if (!devs.length) return [ref, 0];
  // The median, not the worst: at a convex corner the offset turns through a
  // mitre whose apex is further from the original curve than the offset
  // distance, so a few samples near every arris deviate however parallel the
  // family is. Judging by the maximum called every profile non-parallel.
  devs.sort((a, b) => a - b);
  return devs[devs.length >> 1] <= probe * 0.1 ? [ref, 0] : [near, probe];
}

/**
 * Index lists, one per run, cutting `poly` at its arrises.
 *
 * Indices rather than points because the same split has to apply to every curve
 * in the outline family, and those curves do not agree about their own arrises:
 * growing a two-centred arch outward flattens its apex below the threshold
 * within one band's width. The families here sample to a constant number of
 * points, so the reference's indices carry across exactly. Must match relief.py.
 */
export function runIndices(poly, arris = ARRIS_ANGLE) {
  const n = poly.length;
  if (n < 3) return [[...poly.keys()]];
  const turn = (arris * Math.PI) / 180;
  const corners = [];
  for (let i = 0; i < n; i++) {
    const a = poly[(i - 1 + n) % n], b = poly[i], c = poly[(i + 1) % n];
    const ux = b[0] - a[0], uy = b[1] - a[1];
    const vx = c[0] - b[0], vy = c[1] - b[1];
    if ((ux || uy) && (vx || vy)) {
      const ang = Math.abs(Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy));
      if (ang > turn) corners.push(i);
    }
  }
  if (!corners.length) return [[...poly.keys(), 0]];
  const out = [];
  for (let k = 0; k < corners.length; k++) {
    const start = corners[k], end = corners[(k + 1) % corners.length];
    const idx = [start];
    let j = start;
    while (j !== end) { j = (j + 1) % n; idx.push(j); }
    out.push(idx);
  }
  return out;
}

/** The runs of `poly` as polylines. See `runIndices`. */
export function splitRuns(poly, arris = ARRIS_ANGLE) {
  return runIndices(poly, arris).map((idx) => idx.map((i) => poly[i]));
}

function nearestOnSegment(a, b, p) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const L2 = dx * dx + dy * dy;
  let t = 0;
  if (L2 !== 0) t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2));
  const qx = a[0] + t * dx, qy = a[1] + t * dy;
  return [Math.hypot(p[0] - qx, p[1] - qy), qx, qy];
}

/**
 * Nearest point on an open run, within a fixed reach.
 *
 * Every segment is registered in each cell within `reach` of it, so a query is
 * one lookup: anything that could be within reach of the point is by
 * construction in the point's own cell. Beyond reach the answer does not
 * matter, because a run further off than the band's depth displaces by zero.
 */
class Field {
  constructor(run, reach) {
    this.reach = reach;
    this.cell = Math.max(reach / 2, 1e-6);
    this.segs = [];
    for (let i = 0; i < run.length - 1; i++) this.segs.push([run[i], run[i + 1]]);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of run) {
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    this.bbox = [x0, y0, x1, y1];
    this.buckets = new Map();
    const c = this.cell;
    this.segs.forEach(([a, b], i) => {
      const sx0 = Math.min(a[0], b[0]) - reach, sx1 = Math.max(a[0], b[0]) + reach;
      const sy0 = Math.min(a[1], b[1]) - reach, sy1 = Math.max(a[1], b[1]) + reach;
      for (let gx = Math.floor(sx0 / c); gx <= Math.floor(sx1 / c); gx++) {
        for (let gy = Math.floor(sy0 / c); gy <= Math.floor(sy1 / c); gy++) {
          const k = gx + "," + gy;
          const list = this.buckets.get(k);
          if (list) list.push(i); else this.buckets.set(k, [i]);
        }
      }
    });
  }

  nearest(p) {
    const c = this.cell;
    const list = this.buckets.get(Math.floor(p[0] / c) + "," + Math.floor(p[1] / c));
    if (!list) return null;
    let bd = Infinity, bx = 0, by = 0;
    for (let n = 0; n < list.length; n++) {
      const seg = this.segs[list[n]];
      const [d, qx, qy] = nearestOnSegment(seg[0], seg[1], p);
      if (d < bd) { bd = d; bx = qx; by = qy; }
    }
    return bd === Infinity ? null : [bd, bx, by];
  }
}

/**
 * A ring stack bent into a moulding of half-angle `bulge` degrees.
 *
 * Positive is convex, standing toward the viewer; negative is a hollow. Both
 * rims are fixed points of the map, so a rolled composition occupies exactly
 * the footprint the flat one did. Zero is the identity and costs nothing.
 */
export class Roll {
  constructor(reference, span, bulge = 0, base = 0) {
    this.reference = reference;
    this.span = span;
    this.bulge = bulge;
    // The inset at which `reference` sits; zero unless the family is not
    // parallel to its own zero. See offsetReference.
    this.base = base;
    this.active = !!bulge && span > 0 && reference && reference.length >= 2;
    this._runs = null;
    this._idx = null;
  }

  _build() {
    if (this._runs === null) {
      this._idx = runIndices(this.reference);
      this._runs = this._idx.map(
        (idx) => new Field(idx.map((i) => this.reference[i]), Math.max(this.span, 1e-6)));
    }
  }

  get nRuns() {
    if (!this.active) return 1;
    this._build();
    return this._runs.length;
  }

  /**
   * The band divided among the runs, one closed polygon each.
   *
   * A sector is the piece of the band belonging to one length of moulding: the
   * outer boundary along that run, across to the inner boundary, back along it,
   * closed. The two crossing segments are the mitres, and because neighbours
   * are built from the *same* arris vertices they share those segments exactly
   * -- no seam, no overlap. Null when the boundaries do not correspond to the
   * reference index for index. Must match relief.py.
   */
  sectors(outer, inner, bleed = 0) {
    if (!this.active || !inner) return null;
    this._build();
    const n = this.reference.length;
    if (outer.length !== n || inner.length !== n) return null;
    const along = (idx, at, nxt) => {
      const a = outer[idx[at]], b = outer[idx[nxt]];
      const dx = a[0] - b[0], dy = a[1] - b[1];
      const L = Math.hypot(dx, dy);
      return L < 1e-12 ? [0, 0] : [dx / L, dy / L];
    };
    return this._idx.map((idx) => {
      const ring = idx.map((i) => outer[i]);
      for (let k = idx.length - 1; k >= 0; k--) ring.push(inner[idx[k]]);
      if (bleed > 0 && idx.length >= 2) {
        const m = idx.length;
        const head = along(idx, 0, 1), tail = along(idx, m - 1, m - 2);
        for (const [j, d] of [[0, head], [ring.length - 1, head],
                              [m - 1, tail], [m, tail]]) {
          ring[j] = [ring[j][0] + d[0] * bleed, ring[j][1] + d[1] * bleed];
        }
      }
      return ring;
    });
  }

  _theta() {
    return (Math.min(Math.abs(this.bulge), BULGE_LIMIT) * Math.PI) / 180;
  }

  _xi(nu) {
    const v = Math.max(-1, Math.min(1, nu));
    const th = this._theta();
    return this.bulge > 0
      ? Math.sin(v * th) / Math.sin(th)
      : Math.asin(v * Math.sin(th)) / th;
  }

  /** Where the curve at flat inset `i` lands. Identity outside [0, span]. */
  inset(i) {
    if (!this.active || i <= 0 || i >= this.span) return i;
    return (this.span * (this._xi((2 * i) / this.span - 1) + 1)) / 2;
  }

  /**
   * Move a point across the band, perpendicular to one run of the moulding.
   *
   * The footpoint is the nearest point on that run, so `p - footpoint` is
   * exactly perpendicular to it. A point further off than `span` is left alone:
   * it is outside this run's moulding. `run = null` sums every run in reach,
   * which is only the band-as-one-piece fallback -- it compresses a corner by
   * both runs at once and is not the right map for one.
   */
  point(p, run = null) {
    if (!this.active) return p;
    this._build();
    const chosen = run === null ? this._runs : [this._runs[run]];
    let dx = 0, dy = 0;
    for (let k = 0; k < chosen.length; k++) {
      const f = chosen[k];
      const bb = f.bbox;
      if (p[0] < bb[0] - this.span || p[0] > bb[2] + this.span
          || p[1] < bb[1] - this.span || p[1] > bb[3] + this.span) continue;
      const hit = f.nearest(p);
      if (!hit) continue;
      const [d, qx, qy] = hit;
      if (d <= 1e-9) continue;
      const depth = this.base + d;
      if (depth >= this.span) continue;
      // Displacement is (where this depth lands) minus (where it is), along the
      // unit normal -- so the divisor is the measured distance, not the depth.
      const k2 = (this.inset(depth) - depth) / d;
      dx += (p[0] - qx) * k2;
      dy += (p[1] - qy) * k2;
    }
    return [p[0] + dx, p[1] + dy];
  }

  /** A path warped, subdividing first so straight runs can bend. */
  path(pts, step, run = null) {
    if (!this.active || pts.length < 2)
      return this.active ? pts.map((p) => this.point(p, run)) : pts;
    const h = step ?? Math.max(this.span / 12, 1);
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / h));
      for (let k = 0; k < n; k++) {
        const t = k / n;
        out.push(this.point([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], run));
      }
    }
    out.push(this.point(pts[pts.length - 1], run));
    return out;
  }

  /**
   * Warp paths for one run, skipping those it cannot reach.
   *
   * `near` is that run's sector. A path whose bounding box misses it by more
   * than the band's depth cannot land inside once displaced, so it is dropped
   * rather than warped and clipped away -- which keeps the cost of drawing
   * every run near that of drawing the band once. Must match relief.py.
   */
  paths(list, step, run = null, near = null) {
    if (!near) return list.map((p) => this.path(p, step, run));
    let nx0 = Infinity, ny0 = Infinity, nx1 = -Infinity, ny1 = -Infinity;
    for (const q of near) {
      if (q[0] < nx0) nx0 = q[0]; if (q[0] > nx1) nx1 = q[0];
      if (q[1] < ny0) ny0 = q[1]; if (q[1] > ny1) ny1 = q[1];
    }
    const m = this.span * 1.25;
    const x0 = nx0 - m, y0 = ny0 - m, x1 = nx1 + m, y1 = ny1 + m;
    const out = [];
    for (const p of list) {
      let px0 = p[0][0], px1 = p[0][0], py0 = p[0][1], py1 = p[0][1];
      for (const q of p) {
        if (q[0] < px0) px0 = q[0]; else if (q[0] > px1) px1 = q[0];
        if (q[1] < py0) py0 = q[1]; else if (q[1] > py1) py1 = q[1];
      }
      if (px1 < x0 || px0 > x1 || py1 < y0 || py0 > y1) continue;
      out.push(this.path(p, step, run));
    }
    return out;
  }

  /**
   * Where a point at *projected* inset `u` sits on the developed surface --
   * the inverse of `inset`, which is cheap because the convex and concave maps
   * are exact inverses of one another.
   */
  developed(u) {
    if (!this.active || this.span <= 0) return 0;
    const xi = Math.max(-1, Math.min(1, (2 * u) / this.span - 1));
    const th = this._theta();
    return this.bulge > 0
      ? Math.asin(xi * Math.sin(th)) / th
      : Math.sin(xi * th) / Math.sin(th);
  }

  /**
   * How dark the surface is at projected inset `u`, 0 to 1.
   *
   * Lambert, with the light where the viewer is: brightness follows the cosine
   * of the angle between the normal and the line of sight, which here is
   * `nu * Theta`. The crown faces the light squarely and takes none of it; the
   * rims turn away and darken. Flat casts nothing without a special case, and
   * deeper relief is *less diffuse* -- the darkest value goes from 0.06 at
   * twenty degrees to 0.53 at sixty, crowding into the rims.
   *
   * A hollow shades the same way: a head-on light cares about the angle, not
   * its sign. Telling convex from concave by shading needs an off-axis light.
   */
  shade(u) {
    if (!this.active) return 0;
    return 1 - Math.cos(Math.abs(this.developed(u)) * this._theta());
  }

  /**
   * Lambert brightness at projected inset `u` on a run facing `across`.
   *
   * `across` is the in-plane unit vector pointing the way the inset grows, so
   * the surface normal is `sin(nu*Theta)*across + cos(nu*Theta)*z` -- straight
   * at the viewer on the crown, tipped toward one rim or the other away from
   * it. Taking a direction at all is the point: depth alone cannot tell the top
   * of a frame from the bottom. Must match relief.py.
   */
  brightness(u, across, light) {
    if (!this.active) return 1;
    const ang = this.developed(u) * this._theta();
    const s = Math.sin(ang), c = Math.cos(ang);
    return s * (across[0] * light[0] + across[1] * light[1]) + c * light[2];
  }

  /** Local magnification at developed position `nu`; 0 is the crown, 1 a rim. */
  scaleAt(nu) {
    if (!this.active) return 1;
    const th = this._theta();
    const v = Math.max(-1, Math.min(1, nu));
    if (this.bulge > 0) return (th * Math.cos(v * th)) / Math.sin(th);
    const s = Math.sin(th);
    return s / (th * Math.sqrt(Math.max(1e-12, 1 - (v * s) ** 2)));
  }
}

/** Join segments that share an endpoint, in the order produced. */
function chainSegments(segments) {
  const out = [];
  let run = [];
  for (const [a, b] of segments) {
    if (run.length && run[run.length - 1] === a) run.push(b);
    else { if (run.length > 1) out.push(run); run = [a, b]; }
  }
  if (run.length > 1) out.push(run);
  return out;
}

/**
 * Concentric ruling that thickens where the moulding turns from the light.
 *
 * The lines sit at a fixed pitch and the *weight* carries the tone -- the
 * swelled line of an engraving, and the one way to shade a curved surface with
 * lines that still follow it. Varying the spacing instead can only make a tone
 * that is the same all the way round a frame, because a concentric line has no
 * choice but to visit every side of it. Must match relief.py.
 */
export function shading(outlineAt, roll, strength, light = null,
                        levels = SHADE_LEVELS, stroke = SHADE_STROKE,
                        maxInk = SHADE_MAX_INK) {
  if (!roll.active || strength <= 0 || roll.span <= 0) return [];
  const L = light || lightVector();
  const pitch = stroke / maxInk;
  const delta = Math.min(pitch * 0.25, roll.span * 0.02);
  const buckets = new Map();
  for (let u = pitch; u < roll.span; u += pitch) {
    let here, ahead;
    try {
      here = outlineAt(u);
      ahead = outlineAt(Math.min(u + delta, roll.span));
    } catch { break; }
    if (ahead.length !== here.length) break;
    const n = here.length;
    for (let j = 0; j < n; j++) {
      const a = here[j], b = here[(j + 1) % n];
      const dx = ahead[j][0] - a[0], dy = ahead[j][1] - a[1];
      const m = Math.hypot(dx, dy);
      if (m < 1e-12) continue;
      const dark = 1 - roll.brightness(u, [dx / m, dy / m], L);
      const weight = Math.min(maxInk, strength * Math.max(0, dark) * maxInk) * pitch;
      if (weight < SHADE_MIN_STROKE) continue;
      // Quantised over the printable range, not from zero, or the palest bucket
      // gets a representative weight finer than the press can hold.
      const t = (weight - SHADE_MIN_STROKE) / Math.max(1e-9, stroke - SHADE_MIN_STROKE);
      const level = Math.max(0, Math.min(levels - 1, Math.floor(t * levels)));
      if (!buckets.has(level)) buckets.set(level, []);
      buckets.get(level).push([a, b]);
    }
  }
  const step = (stroke - SHADE_MIN_STROKE) / levels;
  return [...buckets.keys()].sort((x, y) => x - y).map((level) => [
    Math.round((SHADE_MIN_STROKE + (level + 0.5) * step) * 1e4) / 1e4,
    chainSegments(buckets.get(level)),
  ]);
}

/**
 * One name, two renderings: ruled in one ink, or laid as actual pigment -- and
 * *which* pigment depends on the palette, because an illuminator did not choose
 * "blue", they ground lapis or azurite or settled for indigo. Must match
 * compose.py.
 */
export function tincture(name, pigment = false, paletteName = null) {
  if (!pigment) return TINCTURES[name] ?? null;
  const colour = pig.tinctureColour(name, paletteName);
  return colour == null ? null : { kind: "solid", angle: 0, spacing: 3, stroke: 0.3, colour };
}

const XKEY = (p, tol) => `${Math.round(p[0] / tol)},${Math.round(p[1] / tol)}`;

/**
 * Every place two strands cross, as [i, vi, j, vj]. Coincident *vertices*, not
 * segment intersections: in polygons-in-contact two rays leave each side of
 * every tile edge at its midpoint, so four ends meet there and joinStrands
 * chains two into one strand and two into another. A segment-intersection test
 * finds nothing at all on a pattern visibly full of crossings. Must match
 * girih.py.
 */
export function crossings(runs, tol = 1e-6) {
  const where = new Map();
  runs.forEach((run, i) => {
    const shut = run.length > 2 && XKEY(run[0], tol) === XKEY(run[run.length - 1], tol);
    const last = shut ? run.length - 1 : run.length;
    for (let v = shut ? 0 : 1; v < last; v++) {
      const k = XKEY(run[v], tol);
      if (!where.has(k)) where.set(k, []);
      where.get(k).push([i, v]);
    }
  });
  const out = [];
  for (const hits of where.values()) {
    if (hits.length === 2) out.push([hits[0][0], hits[0][1], hits[1][0], hits[1][1]]);
  }
  return out;
}

function arcPositions(run) {
  const acc = [0];
  for (let i = 0; i < run.length - 1; i++) {
    acc.push(acc[i] + Math.hypot(run[i + 1][0] - run[i][0], run[i + 1][1] - run[i][1]));
  }
  return acc;
}

function cutRun(run, arc, cuts, gap, closed) {
  const total = arc[arc.length - 1];
  if (!cuts.length || total <= 0) return [run.slice()];
  const pointAt = (d) => {
    d = ((d % total) + total) % total;
    let k = 0;
    while (k < arc.length - 2 && arc[k + 1] <= d) k++;
    const seg = arc[k + 1] - arc[k];
    const t = seg <= 0 ? 0 : (d - arc[k]) / seg;
    const a = run[k], b = run[k + 1];
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  };
  const piece = (lo, hi) => {
    const out = [pointAt(lo)];
    if (hi <= total) {
      for (let k = 0; k < run.length; k++) if (arc[k] > lo && arc[k] < hi) out.push(run[k]);
    } else {
      for (let k = 0; k < run.length; k++) if (arc[k] > lo) out.push(run[k]);
      for (let k = 0; k < run.length; k++) if (arc[k] < hi - total) out.push(run[k]);
    }
    out.push(pointAt(hi));
    return out;
  };
  const cs = [...cuts].sort((a, b) => a - b);
  const spans = [];
  if (closed) {
    for (let n = 0; n < cs.length; n++) {
      const a = cs[n], b = n + 1 < cs.length ? cs[n + 1] : cs[0] + total;
      const lo = a + gap / 2, hi = b - gap / 2;
      if (hi > lo) spans.push([lo, hi]);
    }
  } else {
    let pos = 0;
    for (const cut of cs) {
      const lo = cut - gap / 2, hi = cut + gap / 2;
      if (lo > pos) spans.push([pos, Math.min(lo, total)]);
      pos = Math.max(pos, hi);
    }
    if (pos < total) spans.push([pos, total]);
  }
  const out = [];
  for (const [lo, hi] of spans) {
    if (hi - lo < 1e-9) continue;
    const pts = piece(lo, hi);
    if (pts.length > 1) out.push(pts);
  }
  return out;
}

/**
 * Weave the strands: break whichever passes underneath at each crossing.
 *
 * The weave is not a choice. Along any strand the crossings must alternate, and
 * each crossing constrains two strands, so fixing one propagates through the
 * pattern -- Kaplan: where a pattern admits interlacing the arrangement is
 * determined by the geometry, up to swapping every over for every under. Solved
 * with a union-find carrying a parity bit. Must match girih.py.
 */
export function interlace(runs, gap) {
  if (!runs.length) return [[], 0];
  const cross = crossings(runs);
  if (!cross.length) return [runs.map((r) => r.slice()), 0];
  const arcs = runs.map(arcPositions);
  const along = runs.map(() => []);
  cross.forEach(([i, vi, j, vj], c) => {
    along[i].push([arcs[i][vi], c, 0]);
    along[j].push([arcs[j][vj], c, 1]);
  });
  for (const lst of along) lst.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  const parent = cross.map((_, i) => i);
  const rank = new Array(cross.length).fill(0);
  const par = new Array(cross.length).fill(0);
  const find = (x) => {
    let root = x, p = 0;
    while (parent[root] !== root) { p ^= par[root]; root = parent[root]; }
    let node = x, q = p;
    while (parent[node] !== node) {
      const nxt = parent[node], nq = par[node];
      parent[node] = root; par[node] = q;
      q ^= nq; node = nxt;
    }
    return [root, p];
  };

  let conflicts = 0;
  for (const lst of along) {
    for (let n = 0; n + 1 < lst.length; n++) {
      const [, c1, b1] = lst[n], [, c2, b2] = lst[n + 1];
      const want = 1 ^ b1 ^ b2;
      let [r1, p1] = find(c1);
      let [r2, p2] = find(c2);
      if (r1 === r2) { if ((p1 ^ p2) !== want) conflicts++; continue; }
      if (rank[r1] < rank[r2]) { [r1, r2] = [r2, r1]; [p1, p2] = [p2, p1]; }
      parent[r2] = r1;
      par[r2] = p1 ^ p2 ^ want;
      if (rank[r1] === rank[r2]) rank[r1]++;
    }
  }

  const cuts = runs.map(() => []);
  cross.forEach(([i, vi, j, vj], c) => {
    if (find(c)[1] === 0) cuts[j].push(arcs[j][vj]);
    else cuts[i].push(arcs[i][vi]);
  });

  const out = [];
  runs.forEach((run, i) => {
    const shut = run.length > 2 && XKEY(run[0], 1e-6) === XKEY(run[run.length - 1], 1e-6);
    out.push(...cutRun(run, arcs[i], cuts[i], gap, shut));
  });
  return [out, conflicts];
}

/** The break at an under-crossing, as a multiple of the strand's weight. */
export const INTERLACE_GAP = 2.8;

export function compose(outlineAt, rings, holes = null, bulge = 0, shadow = 0,
                        light = null) {
  const layers = [], rules = [];
  let cursor = 0, reserved = null;
  // Both ends of the stack are reported. Which one is the blank space depends
  // on which way the outline runs: inward stacks leave the hole at `reserved`,
  // outward stacks (rings grown from a window) leave it at `start`.
  const start = outlineAt(0);
  // The moulding, if one was asked for. Its depth is the finite part of the
  // stack: a ring running to the centre is a field, not a surface. Must match
  // compose.py.
  const span = rings.reduce((t, r) => t + (r.width == null ? 0 : r.width), 0);
  // Depth is measured from a curve the family is genuinely parallel to, which
  // is usually its own zero but is the archivolt for a multifoil.
  const [ref, base] = bulge ? offsetReference(outlineAt, span) : [start, 0];
  const roll = new Roll(ref, span, bulge, base);

  // Laid down first, so the strapwork and its ground sit over the shading: the
  // moulding is shaded and the ornament is carved on the shaded moulding.
  rings.forEach((ring, i) => {
    const last = ring.width === null || ring.width === undefined;
    // Two boundaries per edge: the flat pair bounds the band as developed,
    // which is the shape the pattern is generated to fill, and the rolled pair
    // is where that material lands. Identical when the bulge is zero.
    const outerFlat = outlineAt(cursor);
    const innerFlat = last ? null : outlineAt(cursor + ring.width);
    const rolled = roll.active && !last;
    const outer = rolled ? outlineAt(roll.inset(cursor)) : outerFlat;
    const inner = rolled ? outlineAt(roll.inset(cursor + ring.width)) : innerFlat;

    // A frame is not one bent surface; it is several lengths of moulding mitred
    // at the corners, each foreshortened across its own width only. So the band
    // is divided into one *sector* per run and each drawn separately, with its
    // own displacement and its own clip. The sectors tile the band, so nothing
    // is lost between them, and the pattern breaks across each mitre -- which
    // is what the joint in the stone does. A run is handed the whole band's
    // geometry, not just its sector's: its map does not carry its sector onto
    // itself, so material is drawn from across the band and cut by the clip.
    // Must match compose.py.
    const band = inner ? [outer, inner] : [outer];
    // Drawn with a bleed so neighbouring sectors overlap rather than abut:
    // exact abutment rasterises into a hairline of paper down every mitre.
    const sectors = rolled ? roll.sectors(outer, inner, MITRE_BLEED) : null;
    const pieces = sectors
      ? sectors.map((sec, k) => [[sec], (ps) => roll.paths(ps, undefined, k, sec)])
      : rolled
        ? [[band, (ps) => roll.paths(ps)]]
        : [[band, (ps) => ps]];
    if (ring.rule) rules.push([outer, ring.rule, ring.ruleColour ?? null]);
    if (ring.tone) {
      let [tx0, ty0, tx1, ty1] = bbox(outerFlat);
      if (innerFlat) {
        const [i0, j0, i1, j1] = bbox(innerFlat);
        tx0 = Math.min(tx0, i0); ty0 = Math.min(ty0, j0);
        tx1 = Math.max(tx1, i1); ty1 = Math.max(ty1, j1);
      }
      const marks = toneMarks(ring.tone, [tx0, ty0, tx1, ty1]);
      for (const [tclip, warp] of pieces) {
        if (ring.tone.kind === "solid") {
          layers.push({ paths: tclip, stroke: 0, colour: ring.tone.colour, closed: true,
                        fill: ring.tone.colour ?? "#111111" });
        } else {
          // Warping the ruling is not an extra: a ruled ground lies *on* the
          // surface, so it compresses toward the rims exactly as the strapwork
          // does and the band darkens at its edges with nothing shaded in --
          // and it mitres at the corners with everything else.
          layers.push({ paths: warp(marks), stroke: ring.tone.stroke,
                        colour: ring.tone.colour, clip: tclip });
        }
      }
    }
    if (ring.pattern) {
      const [x0, y0, x1, y1] = bbox(outerFlat);
      const reg = [(x0 + x1) / 2, (y0 + y1) / 2];
      const { make, edgeOf } = TILINGS[ring.pattern.tiling];
      // `outer`/`inner` are walk order, not geometry: when the outline grows,
      // outlineAt(cursor) is the smaller one. The tiling must span both or the
      // band's far half gets no tiles (holes), and restrictOutside wants
      // keep ⊃ hole or it drops the ring it should keep. Must match compose.py.
      let bounds = [x0, y0, x1, y1], keep = null;
      if (innerFlat) {
        const [i0, j0, i1, j1] = bbox(innerFlat);
        bounds = [Math.min(x0, i0), Math.min(y0, j0), Math.max(x1, i1), Math.max(y1, j1)];
        keep = (i1 - i0) * (j1 - j0) > (x1 - x0) * (y1 - y0)
          ? [innerFlat, outerFlat] : [outerFlat, innerFlat];
      }
      const abounds = bounds;
      let tiles = make(edgeOf(ring.pattern.cell), bounds, shifted(reg, ring.pattern));
      if (keep) tiles = restrictOutside(tiles, keep[0], keep[1], ring.pattern.cell);
      if (holes && holes.length) {
        // Tiles wholly inside a hole get masked away at paint time, so pairing
        // their rays is wasted -- and on a ground running under a window that
        // is most of the work. Must match compose.py.
        tiles = tiles.filter((t) => !holes.some((h) => t.every((v) => pointInPolygon(h, v))));
      }
      const strandsFlat = pattern(tiles, ring.pattern.contact, ring.pattern.delta);
      // The strapwork as drawn. The two-tone runs still want the *unbroken*
      // strands: a woven strand no longer closes, so it cannot be filled
      // even-odd. Must match compose.py.
      const drawn = ring.interlace
        ? interlace(joinStrands(strandsFlat, 1e-6, true),
                    ring.pattern.stroke * INTERLACE_GAP)[0]
        : strandsFlat;
      if (ring.alternate) {
        // Two-tone: chain the strands and fill them even-odd. A different and
        // simpler scheme than per-compartment tinting, not an approximation of
        // it -- two classes rather than nine -- but a chain and a hash instead
        // of a full planar subdivision. Chain on the flat construction, where
        // fragments meet exactly at the shared edge midpoints, then warp.
        const chained = joinStrands(strandsFlat);
        const amarks = ring.alternate.kind === "solid"
          ? null : toneMarks(ring.alternate, abounds);
        for (const [aclip, warp] of pieces) {
          const runs = warp(chained);
          if (amarks === null) {
            layers.push({ paths: runs, stroke: 0, closed: true,
                          fill: ring.alternate.colour ?? "#111111", clip: aclip });
          } else {
            // The ruling belongs inside the ring *and* inside the odd-crossed
            // runs, which is an intersection -- so a second, nested clip. Put
            // the runs into `clip` beside the ring and they combine even-odd
            // instead: a point outside the ring but inside one run comes out
            // odd and counts as inside, so the tone spilled across the whole
            // page. `solid` was unaffected because it fills the runs rather
            // than clipping to them. Must match compose.py.
            layers.push({ paths: warp(amarks), stroke: ring.alternate.stroke,
                          colour: ring.alternate.colour, clip: aclip,
                          clipInner: runs });
          }
        }
      }
      for (const [clip, warp] of pieces) {
        layers.push({
          paths: warp(drawn),
          stroke: ring.pattern.stroke,
          colour: ring.pattern.colour,
          clip,
        });
      }
    } else if (!inner) reserved = outer;
    if (!last) cursor += ring.width;
  });
  if (reserved === null && rings.length && rings[rings.length - 1].width != null) {
    const final = outlineAt(roll.active ? roll.inset(cursor) : cursor);
    const lastRing = rings[rings.length - 1];
    if (lastRing.rule) rules.push([final, lastRing.rule, lastRing.ruleColour ?? null]);
    reserved = final;
  }
  // Holes are applied here so a stacked part carries its own mask. Adding them
  // to `clip` instead would not work: that list is combined even-odd, so a
  // shape inside an already-excluded region flips back to painted.
  // The shading goes on last, *over* the ornament: the light falls on the whole
  // carved surface and the ornament is part of it. Underneath does not work
  // either -- a tincture laid as colour is a solid fill and paints it out.
  // Must match compose.py.
  if (shadow > 0 && roll.active) {
    const beam = lightVector(...(light || DEFAULT_LIGHT));
    for (const [weight, paths] of shading(outlineAt, roll, shadow, beam)) {
      layers.push({ paths, stroke: weight });
    }
  }

  const maskOut = holes && holes.length ? holes : null;
  // `masked: false` opts a layer out: one drawn deliberately *inside* a hole --
  // a pattern inlaid into a letter -- is clipped to the letterform, which is
  // also the hole, so the mask would erase exactly what the clip selected.
  if (maskOut) for (const l of layers) if (l.masked !== false) l.maskOut = maskOut;
  return { layers, rules, reserved, start, maskOut };
}

/**
 * Paint a fill into a region -- a closed area combined even-odd.
 *
 * The flat counterpart of what `compose` does to one ring, and in the same
 * order (ground, two-tone runs, strapwork over both), so a region and a band of
 * the same shape come out identical mark for mark. No relief: a region has no
 * two rims to roll it round, and the places this is used -- a letterform, a
 * counter -- lie inside a stack's innermost ring, which is never rolled either.
 *
 * `masked: false` on the layers is for a region drawn *inside* a composition's
 * hole, which is what an inlaid letter is. Must match compose.region_layers.
 */
/**
 * Where a pattern's grid is registered, after its own offset.
 *
 * The pattern does not change size or shape; it slides, so a different part of
 * the repeat lands in the region. It matters most where there is least room --
 * a letterform is one or two repeats across, and which part of the repeat falls
 * inside the stem of a B is the difference between a star sitting in it and a
 * star's leftovers. Must match compose.Pattern.strands.
 */
function shifted(origin, pattern) {
  const off = pattern.offset;
  return off ? [origin[0] + off[0], origin[1] + off[1]] : origin;
}

export function regionLayers(fill, region, opts = {}) {
  let bounds = opts.bounds;
  if (!bounds) {
    const pts = region.flat();
    if (!pts.length) return [];
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    bounds = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  }
  const origin = opts.origin
    || [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2];
  const masked = opts.masked !== false;
  const clip = region;
  const out = [];

  if (fill.tone) {
    if (fill.tone.kind === "solid") {
      out.push({ paths: clip, stroke: 0, colour: fill.tone.colour, closed: true,
                 fill: fill.tone.colour ?? "#111111", masked });
    } else {
      out.push({ paths: toneMarks(fill.tone, bounds), stroke: fill.tone.stroke,
                 colour: fill.tone.colour, clip, masked });
    }
  }
  if (!fill.pattern) return out;

  const { make, edgeOf } = TILINGS[fill.pattern.tiling];
  let tiles = make(edgeOf(fill.pattern.cell), bounds, shifted(origin, fill.pattern));
  if (opts.drop && opts.drop.length) {
    tiles = tiles.filter((t) => !opts.drop.some((h) => t.every((v) => pointInPolygon(h, v))));
  }
  const flat = pattern(tiles, fill.pattern.contact, fill.pattern.delta ?? 0);
  const drawn = fill.interlace
    ? interlace(joinStrands(flat, 1e-6, true), fill.pattern.stroke * INTERLACE_GAP)[0]
    : flat;

  if (fill.alternate) {
    const chained = joinStrands(flat);
    if (fill.alternate.kind === "solid") {
      out.push({ paths: chained, stroke: 0, closed: true,
                 fill: fill.alternate.colour ?? "#111111", clip, masked });
    } else {
      // Inside the region *and* inside the odd-crossed runs: an intersection,
      // so a second nested clip. Beside the region in one clip they combine
      // even-odd and the tone escapes. Same note as in `compose`.
      out.push({ paths: toneMarks(fill.alternate, bounds), stroke: fill.alternate.stroke,
                 colour: fill.alternate.colour, clip, clipInner: chained, masked });
    }
  }
  out.push({ paths: drawn, stroke: fill.pattern.stroke,
             colour: fill.pattern.colour, clip, masked });
  return out;
}

/** Lay compositions over one another, first painted first. */
export function stack(...parts) {
  const layers = [], rules = [];
  for (const p of parts) {
    for (const l of p.layers) layers.push(l);
    for (const [poly, stroke, ink] of p.rules) {
      layers.push({ paths: [poly], stroke, colour: ink ?? undefined, closed: true,
                    maskOut: p.maskOut ?? null });
    }
  }
  const last = parts[parts.length - 1];
  return { layers, rules, reserved: last.reserved, start: last.start };
}

// --------------------------------------------------------------------------- //
// SVG
// --------------------------------------------------------------------------- //

/**
 * Four decimals, rounded the way Python's `format` rounds.
 *
 * The two languages disagree on exactly one case: a value sitting *exactly* on
 * a half at the fourth decimal. Python rounds half to even, JavaScript's
 * `toFixed` rounds half away from zero, so -19.40625 comes out -19.4062 on one
 * side and -19.4063 on the other. That is eighteen nanometres of point and no
 * printer alive can tell -- but it is enough to make two files that draw the
 * same thing differ, and a check that compares them byte for byte is worth more
 * than the half-ulp it costs to keep. Exact halves are not rare in this
 * geometry, either: a tiling on a whole-number cell puts them everywhere.
 *
 * `toFixed(20)` gives the double's exact decimal wherever that expansion is
 * short, which covers every value that can be a tie at the fourth place.
 * Must match girih._path_data.
 */
export function fixed4(x) {
  if (!Number.isFinite(x)) return x.toFixed(4);
  const neg = x < 0 || Object.is(x, -0);
  const a = Math.abs(x);
  const y = a * 1e4;
  const f = y - Math.floor(y);
  // Nowhere near a tie -- which is almost every coordinate -- and then both
  // languages simply round to nearest and agree. The scaled test can only err
  // towards the slow path, which costs correctness nothing.
  if (Math.abs(f - 0.5) > 1e-6) return (neg ? "-" : "") + a.toFixed(4);

  const s = a.toFixed(100);
  const dot = s.indexOf(".");
  const digits = s.slice(dot + 1);
  let n = Number(s.slice(0, dot) + digits.slice(0, 4));
  const rest = digits.slice(4);
  const half = "5".padEnd(rest.length, "0");
  if (rest > half || (rest === half && n % 2 !== 0)) n += 1;
  const whole = Math.floor(n / 10000);
  return `${neg ? "-" : ""}${whole}.${String(n - whole * 10000).padStart(4, "0")}`;
}

export function pathData(paths, closed = false) {
  return paths
    .map((p) => {
      const head = `M${fixed4(p[0][0])},${fixed4(p[0][1])}`;
      const rest = p.slice(1).map(([x, y]) => `L${fixed4(x)},${fixed4(y)}`).join(" ");
      return `${head} ${rest}${closed ? " Z" : ""}`;
    })
    .join(" ");
}

export function toSvg({ layers, rules, maskOut }, width, height,
                      { colour = "#111111", background = null } = {}) {
  // A layer may override the ink, which the studio uses to pick out the ring
  // being edited without redrawing the rest differently.
  const defs = [], body = [];
  layers.forEach((layer, i) => {
    let clipRef = "";
    if (layer.clip) {
      defs.push(`<clipPath id="c${i}" clip-rule="evenodd"><path d="${pathData(layer.clip, true)}"/></clipPath>`);
      clipRef = ` clip-path="url(#c${i})"`;
    }
    // A *second* clip, nested inside the first so the two intersect. `clip`'s
    // own polygons combine even-odd, which cannot say "inside both of these":
    // adding a shape toggles rather than restricts. Must match girih.py.
    let innerRef = "";
    if (layer.clipInner && layer.clipInner.length) {
      defs.push(`<clipPath id="i${i}" clip-rule="evenodd"><path d="${pathData(layer.clipInner, true)}"/></clipPath>`);
      innerRef = ` clip-path="url(#i${i})"`;
    }
    // A layer appended *after* compose -- an inlay, a counter, a letter's own
    // contour -- never went through the loop that stamps the mask on, so its
    // `masked` flag did nothing at all and it came out unmasked whatever it
    // said. Resolved here instead, which is where girih.Composition._all_layers
    // resolves it: the layer's own mask if it has one, otherwise the
    // composition's, unless the layer has opted out.
    const holes = layer.maskOut ?? (layer.masked === false ? null : maskOut ?? null);
    let maskRef = "";
    if (holes && holes.length) {
      // Everything except the holes: a rectangle over the whole drawing with
      // the holes punched out, even-odd. Nested outside the ring clip so the
      // two intersect.
      const big = [[-width, -height], [2 * width, -height], [2 * width, 2 * height], [-width, 2 * height]];
      defs.push(`<clipPath id="m${i}" clip-rule="evenodd"><path d="${pathData([big, ...holes], true)}"/></clipPath>`);
      maskRef = ` clip-path="url(#m${i})"`;
    }
    // `layer.closed` must be honoured: rules flattened into layers by stack()
    // are rectangles and arch outlines, and drawing one open drops the segment
    // back to the first point -- the left side of a page, the sill of a window.
    const mark =
      `<path d="${pathData(layer.paths, layer.closed)}" fill="${layer.fill ?? "none"}" ` +
      `fill-rule="evenodd" stroke="${layer.colour ?? colour}" ` +
      `stroke-width="${layer.stroke}" stroke-linejoin="round" stroke-linecap="round"/>`;
    // Nested rather than combined: each level intersects the one outside it.
    let inner = innerRef ? `<g${innerRef}>${mark}</g>` : mark;
    inner = `<g${clipRef}>${inner}</g>`;
    body.push(maskRef ? `<g${maskRef}>${inner}</g>` : inner);
  });
  // Rules are masked too. A rule is a line like any other, and one running under
  // a window would draw straight across it -- which it did, on any composition
  // rendered directly rather than through `stack` (which masks them itself).
  // Must match girih.Composition._all_layers, where a rule becomes a layer and
  // takes the mask with everything else.
  rules.forEach(([poly, stroke, ink], j) => {
    const mark = `<path d="${pathData([poly], true)}" fill="none" stroke="${ink ?? colour}" `
               + `stroke-width="${stroke}"/>`;
    if (maskOut && maskOut.length) {
      const big = [[-width, -height], [2 * width, -height], [2 * width, 2 * height], [-width, 2 * height]];
      defs.push(`<clipPath id="mr${j}" clip-rule="evenodd"><path d="${pathData([big, ...maskOut], true)}"/></clipPath>`);
      body.push(`<g clip-path="url(#mr${j})">${mark}</g>`);
    } else {
      body.push(mark);
    }
  });
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">` +
    (defs.length ? `<defs>${defs.join("")}</defs>` : "") +
    (background ? `<rect width="${width}" height="${height}" fill="${background}"/>` : "") +
    body.join("") +
    `</svg>`
  );
}

/** The whole tale page, from one spec object. */
export function talePage(spec) {
  const { pageW = 432, pageH = 648, depth = 1, arch = "pointed", span = 150, height = 300,
          band = 24, cell = null, stroke = 0.62, archKw = {} } = spec;
  const win = new WindowSpec(arch, span, height, archKw);
  const rings = nestingRings(depth, band, cell, stroke);
  const top = (pageH - win.height) / 2;
  const outlineAt = (inset) => win.outline(pageW / 2, top, -inset);
  return { ...compose(outlineAt, rings), win, rings, pageW, pageH };
}
