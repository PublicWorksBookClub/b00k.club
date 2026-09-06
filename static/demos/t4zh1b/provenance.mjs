/**
 * Where each default came from.
 *
 * The point of the studio is not that it has sliders; it is that the sliders
 * know the history. Each entry below marks the values that come off an actual
 * object, so the control can show tick marks at them and say plainly when you
 * have left attested ground. The research file is otherwise a document nobody
 * reopens once the building starts.
 *
 * `note` is shown when the value is on a mark. `source` is where to go and
 * check. `caution` marks values that are defensible but untethered -- a
 * reasonable construction rather than a measurement.
 */

export const MARKS = {
  "pointed.offsetRatio": [
    {
      value: 1 / 6,
      label: "span/6",
      note: "Ibn Tulun & al-Hakim window grilles: heads rise ≈0.645 of their span",
      source: "Bourgoin, Les Arts arabes (1873), plate 81",
    },
    {
      value: 1 / 4,
      label: "span/4",
      note: "The library's own default. Taller at 0.707 — a construction, not a measurement",
      caution: true,
    },
    {
      value: 1 / 2,
      label: "span/2",
      note: "The equilateral arch: centres sit on the springing points",
      source: "Standard drafting construction",
    },
  ],
  "horseshoe.overshoot": [
    {
      value: 45,
      label: "45°",
      note: "“About three quarters of a circle” — opening = cos 45° = 0.707 of span",
      source: "Umayyad arches at Madinat al-Zahra, 10th c.",
    },
  ],
  "tip.dodecagon": [
    {
      value: 60,
      label: "60°",
      note: "Twelve-pointed star with 60° tips ⇒ contact 75°",
      source: "Mamluk Qur'an frontispiece, c. 1300 (Met; tilingsearch MA1)",
    },
  ],
  "tip.octagon": [
    {
      value: 90,
      label: "90°",
      note: "The square-tipped khatam of Mamluk border bands ⇒ contact 67.5°",
      source: "Ubiquitous in Mamluk Cairo and Damascus",
    },
  ],
  "tip.hex": [
    { value: 100, label: "100°", note: "Ladder default — chosen to descend, not measured", caution: true },
  ],
  "tip.square": [
    { value: 110, label: "110°", note: "Ladder default — chosen to descend, not measured", caution: true },
  ],
  bulge: [
    {
      value: 0,
      label: "flat",
      note: "The band lies in the page. Everything else in this library assumes this.",
    },
    {
      value: 60,
      label: "60°",
      note: "A 2:1 magnification across the band — strong enough to read as depth at print size, shallow enough that the rim keeps its detail. A drawing decision, not a section measured off a building.",
      caution: true,
    },
    {
      value: 85,
      label: "half-round",
      note: "The torus or bead, the commonest moulding section framing an arch, is a true half-circle — which is 90° here. Drawn head-on its rims turn edge-on and vanish, so this stops just short of the section the mason actually cut.",
      caution: true,
    },
  ],
  stroke: [
    {
      value: 0.62,
      label: "0.62pt",
      note: "Full-page field. A whole page at border weight goes grey",
      source: "Bourgoin's full-page plates are fine line engraving for this reason",
    },
    {
      value: 0.9,
      label: "0.9pt",
      note: "Border band — ≈3.75px at 300dpi, safely above POD hairline loss",
    },
  ],
};

/**
 * The heraldic hatchings: a ready-made scheme for saying "this was a colour"
 * in black and white, which is the problem a monochrome print run has.
 *
 * Settled into standard use from Silvester Petra Sancta's tables of the 1630s,
 * though several competing systems circulated first — Zangrius (1600) onward —
 * and at least one swapped gules and azure. It is a convention that stabilised
 * rather than a single invention, so the attribution is softer than, say, the
 * three-quarter circle at Madinat al-Zahra.
 */
export const TINCTURE_NOTES = {
  argent: { note: "Silver or white — left blank. The paper does the work.", source: "Heraldic hatching" },
  or: { note: "Gold — a field of dots. This is the one to reach for if the colour version is gold on lapis.", source: "Heraldic hatching, after Petra Sancta (1630s)" },
  azure: { note: "Blue — horizontal ruling. The other half of a gold-and-lapis scheme.", source: "Heraldic hatching, after Petra Sancta (1630s)" },
  gules: { note: "Red — vertical ruling.", source: "Heraldic hatching, after Petra Sancta (1630s)" },
  vert: { note: "Green — diagonal ruling.", source: "Heraldic hatching, after Petra Sancta (1630s)" },
  purpure: { note: "Purple — the opposite diagonal.", source: "Heraldic hatching, after Petra Sancta (1630s)" },
  sable: { note: "Black — crosshatch. The darkest step short of a solid.", source: "Heraldic hatching, after Petra Sancta (1630s)" },
  solid: { note: "Solid ground with the strapwork reversed to white. Not heraldry — but Bourgoin's own plates do it, and it is the strongest contrast available.", source: "Bourgoin, Les Arts arabes (1873), panel plates" },
};

/** Notes on each arch form, shown when it is selected. */
export const ARCH_NOTES = {
  semicircular: { note: "One centre, on the springing line.", source: "Umayyad onward, ubiquitous" },
  horseshoe: {
    note: "The arc continues below the springing, so the opening is narrower than the arch's widest point.",
    source: "Madinat al-Zahra; the Great Mosque of Córdoba",
  },
  pointed: {
    note: "Two centres on the springing line, moved off the axis.",
    source: "Ibn Tulun, Cairo (876–79) onward",
  },
  four_centred: {
    note: "Small arcs rise from the springings into wide arcs struck from below the line. Depressed by definition — needs rise < span/2.",
    source: "Abbasid and Fatimid, then Persianate",
  },
  multifoil: {
    note: "Foils cut into the intrados — “leaf shapes defined by overlapping circles”. Framed by a plain archivolt, because a constant-width offset of a cusped curve does not exist.",
    source: "Córdoba maqsura (10th c.), Aljafería (11th c.), Bab Zuwayla (1091)",
  },
  ogee: {
    note: "A convex haunch reversing into a concave upper limb.",
    source: "Fatimid Cairo",
  },
};

/** How close counts as “on the mark”, per parameter. */
const TOLERANCE = { "pointed.offsetRatio": 0.004, "horseshoe.overshoot": 0.4, stroke: 0.015 };

export function nearestMark(key, value) {
  const marks = MARKS[key];
  if (!marks) return null;
  const tol = TOLERANCE[key] ?? 0.6;
  let best = null;
  for (const m of marks) {
    const d = Math.abs(m.value - value);
    if (d <= tol && (best === null || d < Math.abs(best.value - value))) best = m;
  }
  return best;
}

/**
 * Print-safety opinion on a stroke weight at final size.
 * POD presses lose very fine lines; grey tints halftone badly, which is why
 * this library draws line art only.
 */
export function strokeAdvice(pt) {
  const px300 = (pt / 72) * 300;
  if (pt < 0.4) return { level: "bad", px300, text: `${px300.toFixed(1)}px at 300dpi — too fine, POD will drop parts of it` };
  if (pt < 0.55) return { level: "warn", px300, text: `${px300.toFixed(1)}px at 300dpi — marginal on uncoated stock` };
  if (pt > 1.4) return { level: "warn", px300, text: `${px300.toFixed(1)}px at 300dpi — heavy; a full field will read grey` };
  return { level: "ok", px300, text: `${px300.toFixed(1)}px at 300dpi — prints cleanly` };
}
