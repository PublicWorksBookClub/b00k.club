/**
 * Roman initials set as a reserve in a field of ornament.
 * Port of letters.py -- see there for why a decorated initial is not an Islamic
 * form, and what *mushkil* has to do with it anyway.
 *
 * The one real difference from the Python is where the font comes from. A
 * browser cannot read a path, so the font arrives as an ArrayBuffer from a file
 * input; everything after that is the same sfnt reading, byte for byte.
 */

import * as core from "./core.mjs";

export class FontError extends Error {}

const tag4 = (dv, at) =>
  String.fromCharCode(dv.getUint8(at), dv.getUint8(at + 1),
                      dv.getUint8(at + 2), dv.getUint8(at + 3));

/** Table directory: tag -> {off, len}. Must match letters.py. */
export function tables(dv, index = 0) {
  const head = tag4(dv, 0);
  let base;
  if (head === "ttcf") {
    const count = dv.getUint32(8);
    if (index >= count) throw new FontError(`font ${index} of a collection holding ${count}`);
    base = dv.getUint32(12 + 4 * index);
  } else if (head === "\x00\x01\x00\x00" || head === "true") {
    base = 0;
  } else if (head === "OTTO") {
    throw new FontError(
      "OpenType/CFF outlines are not read here -- only TrueType `glyf`. "
      + "Export the letter as an SVG path instead.");
  } else {
    throw new FontError(`not an sfnt font (starts ${JSON.stringify(head)})`);
  }
  const num = dv.getUint16(base + 4);
  const out = {};
  for (let i = 0; i < num; i++) {
    const rec = base + 12 + 16 * i;
    out[tag4(dv, rec)] = { off: dv.getUint32(rec + 8), len: dv.getUint32(rec + 12) };
  }
  return out;
}

function cmapGid(dv, cmap, char) {
  const code = char.codePointAt(0);
  const num = dv.getUint16(cmap + 2);
  let best = null;
  for (let i = 0; i < num; i++) {
    const rec = cmap + 4 + 8 * i;
    const pid = dv.getUint16(rec), eid = dv.getUint16(rec + 2), off = dv.getUint32(rec + 4);
    const key = `${pid},${eid}`;
    const rank = { "3,1": 0, "3,10": 1, "0,3": 2, "0,4": 2 }[key] ?? (pid === 0 ? 3 : 9);
    if (best === null || rank < best[0]) best = [rank, cmap + off];
  }
  if (best === null) throw new FontError("font has no character map");
  const sub = best[1];
  const fmt = dv.getUint16(sub);

  if (fmt === 4) {
    const seg2 = dv.getUint16(sub + 6);
    const n = seg2 / 2;
    const ends = sub + 14, startsAt = sub + 16 + seg2;
    const deltasAt = startsAt + seg2, rangesAt = startsAt + 2 * seg2;
    for (let i = 0; i < n; i++) {
      const end = dv.getUint16(ends + 2 * i);
      const start = dv.getUint16(startsAt + 2 * i);
      if (code <= end && code >= start) {
        const delta = dv.getInt16(deltasAt + 2 * i);
        const range = dv.getUint16(rangesAt + 2 * i);
        if (range === 0) return (code + delta) & 0xffff;
        const at = rangesAt + 2 * i + range + 2 * (code - start);
        const gid = dv.getUint16(at);
        return gid === 0 ? 0 : (gid + delta) & 0xffff;
      }
    }
    return 0;
  }
  if (fmt === 12) {
    const groups = dv.getUint32(sub + 12);
    for (let i = 0; i < groups; i++) {
      const rec = sub + 16 + 12 * i;
      const lo = dv.getUint32(rec), hi = dv.getUint32(rec + 4), gid = dv.getUint32(rec + 8);
      if (code >= lo && code <= hi) return gid + (code - lo);
    }
    return 0;
  }
  throw new FontError(`character map format ${fmt} is not read here`);
}

function glyphContours(dv, tbl, gid, loca, depth = 0) {
  if (depth > 5) return [];
  const goff = tbl.glyf.off;
  const start = loca[gid], end = loca[gid + 1];
  if (end <= start) return [];
  const at = goff + start;
  const ncont = dv.getInt16(at);

  if (ncont < 0) {                       // composite
    const out = [];
    let p = at + 10;
    for (;;) {
      const flags = dv.getUint16(p), sub = dv.getUint16(p + 2);
      p += 4;
      let a1, a2;
      if (flags & 1) { a1 = dv.getInt16(p); a2 = dv.getInt16(p + 2); p += 4; }
      else { a1 = dv.getInt8(p); a2 = dv.getInt8(p + 1); p += 2; }
      let sx = 1, sy = 1, s01 = 0, s10 = 0;
      if (flags & 8) { sx = sy = dv.getInt16(p) / 16384; p += 2; }
      else if (flags & 0x40) { sx = dv.getInt16(p) / 16384; sy = dv.getInt16(p + 2) / 16384; p += 4; }
      else if (flags & 0x80) {
        sx = dv.getInt16(p) / 16384; s01 = dv.getInt16(p + 2) / 16384;
        s10 = dv.getInt16(p + 4) / 16384; sy = dv.getInt16(p + 6) / 16384; p += 8;
      }
      const dx = flags & 2 ? a1 : 0, dy = flags & 2 ? a2 : 0;
      for (const cont of glyphContours(dv, tbl, sub, loca, depth + 1)) {
        out.push(cont.map(([x, y, on]) => [x * sx + y * s10 + dx, x * s01 + y * sy + dy, on]));
      }
      if (!(flags & 0x20)) break;
    }
    return out;
  }

  let p = at + 10;
  const ends = [];
  for (let i = 0; i < ncont; i++) { ends.push(dv.getUint16(p)); p += 2; }
  p += 2 + dv.getUint16(p);              // instructions
  const npts = ends.length ? ends[ends.length - 1] + 1 : 0;

  const flags = [];
  while (flags.length < npts) {
    const f = dv.getUint8(p++);
    flags.push(f);
    if (f & 8) { const r = dv.getUint8(p++); for (let k = 0; k < r; k++) flags.push(f); }
  }
  flags.length = npts;

  const coords = (shortBit, sameBit) => {
    const vals = [];
    let v = 0;
    for (const f of flags) {
      if (f & shortBit) { const d = dv.getUint8(p++); v += (f & sameBit) ? d : -d; }
      else if (!(f & sameBit)) { v += dv.getInt16(p); p += 2; }
      vals.push(v);
    }
    return vals;
  };
  const xs = coords(2, 16);
  const ys = coords(4, 32);

  const out = [];
  let first = 0;
  for (const e of ends) {
    const cont = [];
    for (let i = first; i <= e; i++) cont.push([xs[i], ys[i], !!(flags[i] & 1)]);
    out.push(cont);
    first = e + 1;
  }
  return out;
}

/**
 * One contour's quadratic B-spline as a polygon.
 *
 * TrueType omits the on-curve point between two consecutive controls -- it is
 * their midpoint -- and putting those back is the whole conversion.
 */
function flatten(contour, steps) {
  if (!contour.length) return [];
  const pts = [];
  const n = contour.length;
  for (let i = 0; i < n; i++) {
    const [x, y, on] = contour[i];
    const [nx, ny, non] = contour[(i + 1) % n];
    pts.push([x, y, on]);
    if (!on && !non) pts.push([(x + nx) / 2, (y + ny) / 2, true]);
  }
  const startc = pts.findIndex((p) => p[2]);
  if (startc < 0) return [];
  const q = pts.slice(startc).concat(pts.slice(0, startc));
  const out = [[q[0][0], q[0][1]]];
  const m = q.length;
  let i = 1;
  while (i <= m) {
    const [x, y, on] = q[i % m];
    if (on) { out.push([x, y]); i += 1; continue; }
    const [ex, ey] = q[(i + 1) % m];
    const [sx, sy] = out[out.length - 1];
    for (let s = 1; s <= steps; s++) {
      const t = s / steps, u = 1 - t;
      out.push([u * u * sx + 2 * u * t * x + t * t * ex,
                u * u * sy + 2 * u * t * y + t * t * ey]);
    }
    i += 2;
  }
  if (out.length > 1 && Math.hypot(out[0][0] - out[out.length - 1][0],
                                   out[0][1] - out[out.length - 1][1]) < 1e-9) out.pop();
  return out;
}

/**
 * A character's outline in points, y running down. `buffer` is an ArrayBuffer.
 *
 * The glyph sits with its origin at (0,0) and the baseline at y = 0, so most of
 * a capital has *negative* y. Contours come back in the font's own winding,
 * which is what leaves a counter open when they are combined even-odd.
 */
export function glyph(buffer, char, size, { steps = 8, index = 0 } = {}) {
  const dv = new DataView(buffer);
  const tbl = tables(dv, index);
  for (const need of ["head", "maxp", "loca", "glyf", "cmap"]) {
    if (!tbl[need]) throw new FontError(`font has no '${need}' table`);
  }
  const upem = dv.getUint16(tbl.head.off + 18);
  const longLoca = dv.getInt16(tbl.head.off + 50);
  const nglyphs = dv.getUint16(tbl.maxp.off + 4);
  const loca = [];
  for (let i = 0; i <= nglyphs; i++) {
    loca.push(longLoca ? dv.getUint32(tbl.loca.off + 4 * i)
                       : dv.getUint16(tbl.loca.off + 2 * i) * 2);
  }
  const gid = cmapGid(dv, tbl.cmap.off, char);
  if (!gid) throw new FontError(`font has no glyph for ${JSON.stringify(char)}`);
  const k = size / upem;
  const out = [];
  for (const cont of glyphContours(dv, tbl, gid, loca)) {
    const poly = flatten(cont, steps);
    if (poly.length >= 3) out.push(poly.map(([x, y]) => [x * k, -y * k]));
  }
  return out;
}

/**
 * Each glyph's advance width in font units, from `hhea` and `hmtx`.
 * `hmtx` stores a full record for the first numberOfHMetrics glyphs and then
 * widths alone, so the last full width repeats. Must match letters.py.
 */
function advances(dv, tbl, nglyphs) {
  if (!tbl.hhea || !tbl.hmtx) return new Array(nglyphs).fill(0);
  const n = dv.getUint16(tbl.hhea.off + 34);
  const out = [];
  for (let i = 0; i < Math.min(n, nglyphs); i++) out.push(dv.getUint16(tbl.hmtx.off + 4 * i));
  const last = out.length ? out[out.length - 1] : 0;
  while (out.length < nglyphs) out.push(last);
  return out;
}

/** The parts of a font this module needs, read once. */
function openFont(buffer, index) {
  const dv = new DataView(buffer);
  const tbl = tables(dv, index);
  for (const need of ["head", "maxp", "loca", "glyf", "cmap"]) {
    if (!tbl[need]) throw new FontError(`font has no '${need}' table`);
  }
  const upem = dv.getUint16(tbl.head.off + 18);
  const longLoca = dv.getInt16(tbl.head.off + 50);
  const nglyphs = dv.getUint16(tbl.maxp.off + 4);
  const loca = [];
  for (let i = 0; i <= nglyphs; i++) {
    loca.push(longLoca ? dv.getUint32(tbl.loca.off + 4 * i)
                       : dv.getUint16(tbl.loca.off + 2 * i) * 2);
  }
  return { dv, tbl, upem, nglyphs, loca };
}

/**
 * A whole word's outlines, set on one baseline.
 *
 * The same reserve as a single letter, only longer -- and worth having, because
 * what a title page most often wants ornamented is a word rather than a
 * capital. Advanced by the font's own widths, so the spacing is the type
 * designer's. No kerning: kern pairs live in GPOS, a small language of its own,
 * worth a fraction of a point at these sizes. Must match letters.py.
 */
export function word(buffer, text, size, { tracking = 0, steps = 8, index = 0 } = {}) {
  const { dv, tbl, upem, nglyphs, loca } = openFont(buffer, index);
  const adv = advances(dv, tbl, nglyphs);
  const k = size / upem;
  const out = [];
  let pen = 0;
  for (const ch of text) {
    const gid = cmapGid(dv, tbl.cmap.off, ch);
    if (gid) {
      for (const cont of glyphContours(dv, tbl, gid, loca)) {
        const poly = flatten(cont, steps);
        if (poly.length >= 3) out.push(poly.map(([x, y]) => [pen + x * k, -y * k]));
      }
      pen += adv[gid] * k + tracking;
    } else {
      pen += size * 0.3 + tracking;
    }
  }
  if (!out.length) throw new FontError(`nothing to set from ${JSON.stringify(text)}`);
  return out;
}

/** Contours from an SVG path. The way in for CFF fonts and drawn letters. */
export function svgPath(d, size = 1, steps = 8) {
  const toks = [];
  let num = "";
  for (const ch of d) {
    if (/[a-zA-Z]/.test(ch)) { if (num) { toks.push(num); num = ""; } toks.push(ch); }
    else if ((ch === "-" || ch === "+") && num && !/[eE]$/.test(num)) { toks.push(num); num = ch; }
    else if (", \t\r\n".includes(ch)) { if (num) { toks.push(num); num = ""; } }
    else num += ch;
  }
  if (num) toks.push(num);

  const out = [];
  let cur = [], x = 0, y = 0, sx = 0, sy = 0, px = null, py = null, cmd = "", i = 0;
  const take = (n) => { const v = toks.slice(i, i + n).map(Number); i += n; return v; };
  while (i < toks.length) {
    const t = toks[i];
    if (/^[a-zA-Z]$/.test(t)) {
      cmd = t; i += 1;
      if (cmd === "Z" || cmd === "z") {
        if (cur.length >= 3) out.push(cur);
        cur = []; x = sx; y = sy;
      }
      continue;
    }
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    if (C === "M") {
      const [ax, ay] = take(2);
      x = rel ? x + ax : ax; y = rel ? y + ay : ay;
      if (cur.length >= 3) out.push(cur);
      cur = [[x, y]]; sx = x; sy = y; cmd = rel ? "l" : "L";
    } else if (C === "L") {
      const [ax, ay] = take(2);
      x = rel ? x + ax : ax; y = rel ? y + ay : ay; cur.push([x, y]);
    } else if (C === "H") { const [ax] = take(1); x = rel ? x + ax : ax; cur.push([x, y]); }
    else if (C === "V") { const [ay] = take(1); y = rel ? y + ay : ay; cur.push([x, y]); }
    else if (C === "Q" || C === "T") {
      let cx, cy, ax, ay;
      if (C === "Q") {
        [cx, cy, ax, ay] = take(4);
        if (rel) { cx += x; cy += y; ax += x; ay += y; }
      } else {
        cx = px !== null ? 2 * x - px : x; cy = py !== null ? 2 * y - py : y;
        [ax, ay] = take(2);
        if (rel) { ax += x; ay += y; }
      }
      for (let s = 1; s <= steps; s++) {
        const t2 = s / steps, u = 1 - t2;
        cur.push([u * u * x + 2 * u * t2 * cx + t2 * t2 * ax,
                  u * u * y + 2 * u * t2 * cy + t2 * t2 * ay]);
      }
      px = cx; py = cy; x = ax; y = ay; continue;
    } else if (C === "C" || C === "S") {
      let c1x, c1y, c2x, c2y, ax, ay;
      if (C === "C") {
        [c1x, c1y, c2x, c2y, ax, ay] = take(6);
        if (rel) { c1x += x; c1y += y; c2x += x; c2y += y; ax += x; ay += y; }
      } else {
        c1x = px !== null ? 2 * x - px : x; c1y = py !== null ? 2 * y - py : y;
        [c2x, c2y, ax, ay] = take(4);
        if (rel) { c2x += x; c2y += y; ax += x; ay += y; }
      }
      for (let s = 1; s <= steps; s++) {
        const t2 = s / steps, u = 1 - t2;
        cur.push([u ** 3 * x + 3 * u * u * t2 * c1x + 3 * u * t2 * t2 * c2x + t2 ** 3 * ax,
                  u ** 3 * y + 3 * u * u * t2 * c1y + 3 * u * t2 * t2 * c2y + t2 ** 3 * ay]);
      }
      px = c2x; py = c2y; x = ax; y = ay; continue;
    } else {
      throw new Error(`path command ${JSON.stringify(cmd)} is not supported`);
    }
    px = null; py = null;
  }
  if (cur.length >= 3) out.push(cur);
  return out.map((poly) => poly.map(([a, b]) => [a * size, b * size]));
}

/** One number for all four, two for horizontal and vertical, or four. */
export function margins(spec) {
  if (typeof spec === "number") return { left: spec, right: spec, top: spec, bottom: spec };
  const v = [...spec];
  if (v.length === 2) return { left: v[0], right: v[0], top: v[1], bottom: v[1] };
  if (v.length === 4) return { left: v[0], right: v[1], top: v[2], bottom: v[3] };
  throw new Error("margin takes one number, two (h, v), or four (l, r, t, b)");
}

export function bounds(contours) {
  const xs = contours.flat().map((p) => p[0]);
  const ys = contours.flat().map((p) => p[1]);
  if (!xs.length) throw new Error("empty outline");
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

/**
 * How many other contours each contour is inside.
 *
 * The font records only that the windings alternate, which is enough for an
 * even-odd fill and not enough to say "this contour is a counter" -- which is
 * the question, once the counter is treated apart from the letter and the
 * field. So it is answered geometrically: depth 0 is the outside, 1 a counter,
 * 2 an island standing in a counter. The test point is a vertex, which lies on
 * its own contour but strictly inside or outside every other. Must match
 * letters.py.
 */
export function depths(contours) {
  return contours.map((poly, i) =>
    contours.reduce((n, other, j) =>
      n + (j !== i && core.pointInPolygon(other, poly[0]) ? 1 : 0), 0));
}

/** The outsides alone: the letter's shape with its counters filled in. */
export function silhouette(contours) {
  const d = depths(contours);
  return contours.filter((_, i) => d[i] === 0);
}

/** The enclosed spaces: the bowl of a D, both counters of a B. */
export function counters(contours) {
  const d = depths(contours);
  return contours.filter((_, i) => d[i] >= 1);
}

/**
 * A letter set in a field of ornament, in a panel of its own.
 *
 * Four regions, four decisions: the border and the field are ordinary rings
 * (see `panelRings`), `inlay` is the letterform itself, and `counter` is the
 * space it encloses. `counter` takes true (whatever surrounds it runs through,
 * which is what the even-odd mask gives for nothing), false or null (closed,
 * so the letter reserves as a solid silhouette), or a fill of its own -- and
 * the last two narrow the composition's hole to the silhouette, or the field
 * would be in the bowl before the counter's own treatment reached it.
 * Must match letters.py.
 */
export function initial(contours, rings, opts = {}) {
  const m = margins(opts.margin ?? 8);
  const [x0, y0, x1, y1] = bounds(contours);
  const w = (x1 - x0) + m.left + m.right;
  const h = (y1 - y0) + m.top + m.bottom;
  const dx = m.left - x0, dy = m.top - y0;
  const hole = contours.map((poly) => poly.map(([px, py]) => [px + dx, py + dy]));
  const ownCounter = opts.counter !== true && opts.counter !== undefined;
  const comp = core.compose(
    (inset) => [[inset, inset], [w - inset, inset], [w - inset, h - inset], [inset, h - inset]],
    rings, ownCounter ? silhouette(hole) : hole,
    opts.bulge ?? 0, opts.shadow ?? 0, opts.light ?? null);
  comp.width = w; comp.height = h;
  comp.reserved = hole[0] ?? comp.reserved;

  // Both of these are drawn *inside* the composition's hole and so opt out of
  // its mask: the letterform is at once the clip and the hole, and masking
  // erases exactly what the clip selected.
  if (opts.inlay && (opts.inlay.pattern || opts.inlay.tone)) {
    comp.layers.push(...core.regionLayers(opts.inlay, hole, { masked: false }));
  }
  if (ownCounter && opts.counter) {
    const inner = counters(hole);
    if (inner.length) {
      comp.layers.push(...core.regionLayers(opts.counter, inner, { masked: false }));
    }
  }

  const outline = opts.outline ?? 0.8;
  // Unmasked too, for a plainer reason: this line runs *along* the hole's edge,
  // so half its width falls inside and clipping would shave that half off.
  if (outline) {
    comp.layers.push({ paths: hole, stroke: outline, colour: opts.outlineColour ?? undefined,
                       closed: true, masked: false });
  }
  return comp;
}

/**
 * The usual arrangement: an optional border band, then the field.
 *
 * `base` is what both rings take unless told otherwise; `border` and `field`
 * each override it with true (the base), false (blank), or a fill of their own.
 * Two grids -- a fine border round a coarse field, or the reverse -- is the
 * commonest thing a printer's block does, and it needs the two nameable apart.
 * Must match letters.py.
 */
export function panelRings(band = 0, opts = {}) {
  const base = opts.base ?? {};
  const rule = opts.rule ?? 1;
  const pick = (v) => (v === true || v === undefined ? base : (v || {}));
  const ring = (width, f) => ({ width, rule, pattern: f.pattern ?? null,
                                tone: f.tone ?? null, alternate: f.alternate ?? null,
                                interlace: !!f.interlace,
                                ruleColour: f.ruleColour ?? null });
  if (band <= 0) return [ring(null, pick(opts.field))];
  return [ring(band, pick(opts.border)), ring(null, pick(opts.field))];
}
