/**
 * Radial devices: the shamsa, the verse marker, the marginal almond.
 * Port of devices.py -- see there for the reasoning.
 *
 * Almost no new machinery, which is the point: `compose` takes an *outline
 * family*, a function from inset to boundary, and does not care what shape it
 * is. A rectangle gives a page border, an arch a window, a lobed disc a shamsa.
 */

import * as core from "./core.mjs";

/**
 * Breathing room round a device, in points. A figure sized exactly to its own
 * canvas touches the edge, and a rule is *centred* on the boundary, so half of
 * it is clipped away -- on an almond, whose widest point is a single tangency,
 * that reads as a flat spot cut off the side. Must match devices.py.
 */
export const PAD = 1.5;

export const SHAMSA_LOBES = [8, 12, 16, 24];
export const DEPTH_RANGE = [0.04, 0.34];

/**
 * Points from p0 to p1 on the circle, the way round that passes `through`.
 *
 * Choosing the *short* way is right only while the arc is under a half-circle.
 * A lobe never gets there -- the sagitta cap prevents it -- but a *wide* almond
 * does: where the width exceeds the height the centre falls on the same side as
 * the widest point, the sweep passes half a circle, and the short way cuts the
 * figure in two. Must match devices.py.
 */
function arcThrough(ox, oy, R, p0, p1, through, steps) {
  const a0 = Math.atan2(p0[1] - oy, p0[0] - ox);
  const a1 = Math.atan2(p1[1] - oy, p1[0] - ox);
  const am = Math.atan2(through[1] - oy, through[0] - ox);
  const two = 2 * Math.PI;
  const mod = (v) => ((v % two) + two) % two;
  let fwd = mod(a1 - a0);
  if (mod(am - a0) > fwd) fwd -= two;
  const out = [];
  for (let k = 0; k < steps; k++) {
    const t = a0 + (fwd * k) / steps;
    out.push([ox + R * Math.cos(t), oy + R * Math.sin(t)]);
  }
  return out;
}

/**
 * A disc with `lobes` circular arcs thrown outward across its edges.
 * `radius` is to the *cusps*; the arcs bulge past it. Must match devices.py.
 */
export function lobedDisc(cx, cy, radius, lobes = 12, depth = 0.16,
                          phase = 0, perArc = 14) {
  if (lobes < 3) throw new Error("a lobed disc needs at least three lobes");
  if (radius <= 0) throw new Error("radius must be positive");
  const step = (2 * Math.PI) / lobes;
  const half = radius * Math.sin(step / 2);
  // A lobe deeper than a half-circle undercuts its own cusps, so the sagitta is
  // capped just short of the chord's half-length: a limit of the figure.
  const sag = Math.max(1e-9, Math.min(depth * radius, half * 0.98));
  const R = (half * half + sag * sag) / (2 * sag);
  const pts = [];
  for (let i = 0; i < lobes; i++) {
    const a0 = phase + step * i;
    const a1 = a0 + step;
    const p0 = [cx + radius * Math.cos(a0), cy + radius * Math.sin(a0)];
    const p1 = [cx + radius * Math.cos(a1), cy + radius * Math.sin(a1)];
    const mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2;
    let ux = mx - cx, uy = my - cy;
    const n = Math.hypot(ux, uy) || 1;
    ux /= n; uy /= n;
    const ox = mx - ux * (R - sag), oy = my - uy * (R - sag);
    pts.push(...arcThrough(ox, oy, R, p0, p1, [mx + ux * sag, my + uy * sag], perArc));
  }
  return pts;
}

/** A mandorla: two circular arcs meeting in cusps. Must match devices.py. */
export function almond(cx, cy, halfWidth, halfHeight, perArc = 40) {
  if (halfWidth <= 0 || halfHeight <= 0) throw new Error("almond needs positive half-axes");
  const R = (halfWidth * halfWidth + halfHeight * halfHeight) / (2 * halfWidth);
  const off = R - halfWidth;
  const top = [cx, cy - halfHeight], bot = [cx, cy + halfHeight];
  return [
    ...arcThrough(cx - off, cy, R, top, bot, [cx + halfWidth, cy], perArc),
    ...arcThrough(cx + off, cy, R, bot, top, [cx - halfWidth, cy], perArc),
  ];
}

export class Rosette {
  constructor(radius = 60, lobes = 12, depth = 0.16, phase = 0) {
    if (lobes < 3) throw new Error("a rosette needs at least three lobes");
    if (!(depth > 0 && depth <= DEPTH_RANGE[1] + 1e-9)) {
      throw new Error(`lobe depth ${depth} is outside 0 to ${DEPTH_RANGE[1]}`);
    }
    this.radius = radius; this.lobes = lobes;
    this.depth = depth; this.phase = phase;
  }
  get extent() { return this.radius * (1 + this.depth); }
  outline(cx, cy, inset = 0) {
    const r = this.radius - inset;
    if (r <= 0) throw new Error(`inset ${inset} collapses a radius of ${this.radius}`);
    // Sagitta held constant in points, so the bands of a stack come out even.
    return lobedDisc(cx, cy, r, this.lobes,
                     Math.min(DEPTH_RANGE[1], (this.depth * this.radius) / r), this.phase);
  }
}

export const rosetteOutline = (spec, cx, cy) => (inset) => spec.outline(cx, cy, inset);

export const almondOutline = (cx, cy, hw, hh) => (inset) => {
  const w = hw - inset, h = hh - inset;
  if (w <= 0 || h <= 0) throw new Error(`inset ${inset} collapses the almond`);
  return almond(cx, cy, w, h);
};

/** A radial device on its own canvas, sized to what the figure occupies. */
export function device(outline, rings, extent, opts = {}) {
  return core.compose(outline, rings, opts.holes ?? null, opts.bulge ?? 0,
                      opts.shadow ?? 0, opts.light ?? null);
}

export function shamsa({ radius = 60, lobes = 16, depth = 0.16, band = 14,
                         pattern = null, reserve = true, rule = 1, ...rest } = {}) {
  const spec = new Rosette(radius, lobes, depth);
  const pat = pattern ?? { tiling: "dodecagon", cell: band, stroke: 0.7, delta: 0,
                           contact: core.contactForTip(12, 60) };
  const rings = [{ width: band, rule, pattern: pat },
                 { width: null, rule, pattern: reserve ? null : pat }];
  const c = spec.extent + PAD;
  const comp = device(rosetteOutline(spec, c, c), rings, spec.extent, rest);
  comp.width = comp.height = 2 * (spec.extent + PAD);
  return comp;
}

export function verseMarker({ radius = 7, points = 8, skip = 3, stroke = 0.6,
                              lobes = 8, depth = 0.2, rule = 0.6 } = {}) {
  const spec = new Rosette(radius, lobes, depth);
  const c = spec.extent + PAD;
  const comp = device(rosetteOutline(spec, c, c), [{ width: null, rule, pattern: null }],
                      spec.extent);
  comp.width = comp.height = 2 * (spec.extent + PAD);
  comp.layers.push({ paths: [core.starPolygon(c, c, radius * 0.72, points, skip, -Math.PI / 2)],
                     stroke, closed: true });
  return comp;
}

export function marginal({ halfWidth = 16, halfHeight = 30, band = 6,
                           pattern = null, rule = 0.8, ...rest } = {}) {
  const pat = pattern ?? { tiling: "hex", cell: band * 1.6, stroke: 0.6, delta: 0,
                           contact: core.contactForTip(6, 100) };
  const rings = [{ width: band, rule, pattern: pat },
                 { width: null, rule, pattern: null }];
  const comp = device(almondOutline(halfWidth + PAD, halfHeight + PAD, halfWidth, halfHeight),
                      rings, [halfWidth, halfHeight], rest);
  comp.width = 2 * (halfWidth + PAD); comp.height = 2 * (halfHeight + PAD);
  return comp;
}
