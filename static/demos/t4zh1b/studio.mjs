import * as core from "./core.mjs";
import * as dv from "./devices.mjs";
import * as pig from "./pigments.mjs";
import * as L from "./letters.mjs";
import { MARKS, ARCH_NOTES, TINCTURE_NOTES, nearestMark, strokeAdvice } from "./provenance.mjs";

// Set from state at the top of every render. Trim size changes the measure,
// so everything downstream -- margins, band widths, where a window centres --
// is relative to these rather than to the edition's own 6 x 9.
let PAGE_W = 432, PAGE_H = 648;

// Trim sizes worth having to hand, in points. The first is the trade page
// this library was written against.
const PAGE_SIZES = {
  "432x648": "6 × 9 in — trade",
  "396x612": "5.5 × 8.5 in",
  "360x576": "5 × 8 in",
  "420x595": "A5",
  "612x792": "US Letter",
};
const measureCtx = document.createElement("canvas").getContext("2d");
const MARK_INK = "#b07b2a";

const CONTROLS = {
  span:        { label: "Span", min: 80, max: 280, step: 1, value: 150, unit: "pt" },
  height:      { label: "Height (sill to apex)", min: 150, max: 520, step: 1, value: 300, unit: "pt" },
  offsetRatio: { label: "Centre offset", min: .05, max: .5, step: .001, value: 1/6, unit: "× span", prov: "pointed.offsetRatio", fmt: v => v.toFixed(3) },
  overshoot:   { label: "Overshoot past springing", min: 0, max: 70, step: .5, value: 45, unit: "°", prov: "horseshoe.overshoot" },
  lobes:       { label: "Foils", min: 5, max: 15, step: 1, value: 9, unit: "" },
  riseRatio4:  { label: "Rise", min: .26, max: .48, step: .005, value: .42, unit: "× span", fmt: v => v.toFixed(3) },
  riseRatioOg: { label: "Rise", min: .56, max: .94, step: .005, value: .8, unit: "× span", fmt: v => v.toFixed(3) },
  depth:       { label: "Nesting depth", min: 1, max: 5, step: 1, value: 2, unit: "ring(s)" },
  bands:       { label: "Border bands", min: 0, max: 4, step: 1, value: 1, unit: "" },
  margin:      { label: "Margin from page edge", min: 0, max: 90, step: 1, value: 24, unit: "pt" },
  band:        { label: "Ring width", min: 10, max: 52, step: 1, value: 22, unit: "pt" },
  cell:        { label: "Repeat", min: 10, max: 70, step: 1, value: 24, unit: "pt" },
  stroke:      { label: "Weight", min: .25, max: 1.6, step: .01, value: .55, unit: "pt", prov: "stroke", fmt: v => v.toFixed(2) },
  rule:        { label: "Rule", min: 0, max: 2.5, step: .05, value: 1, unit: "pt", fmt: v => v.toFixed(2) },
  // The track runs to the legibility limit at both ends, so the half-round tick
  // sits on it rather than off the end.
  pageBulge:   { label: "Relief", min: -85, max: 85, step: 1, value: 0, unit: "°", prov: "bulge" },
  winBulge:    { label: "Relief", min: -85, max: 85, step: 1, value: 0, unit: "°", prov: "bulge" },
  pageShadow:  { label: "Shading", min: 0, max: 1, step: .01, value: 0, unit: "", fmt: v => v.toFixed(2) },
  winShadow:   { label: "Shading", min: 0, max: 1, step: .01, value: 0, unit: "", fmt: v => v.toFixed(2) },
  lightAz:     { label: "Light, from", min: 0, max: 359, step: 1, value: 315, unit: "° clockwise from top" },
  lightElev:   { label: "Light, height", min: 5, max: 90, step: 1, value: 35, unit: "° above the page" },
  letterSize:  { label: "Em size", min: 24, max: 200, step: 1, value: 78, unit: "pt" },
  letterTrack: { label: "Tracking", min: -8, max: 40, step: .5, value: 0, unit: "pt / letter" },
  marginL:     { label: "Margin left", min: 0, max: 60, step: .5, value: 11, unit: "pt" },
  marginR:     { label: "Margin right", min: 0, max: 60, step: .5, value: 11, unit: "pt" },
  marginT:     { label: "Margin top", min: 0, max: 60, step: .5, value: 11, unit: "pt" },
  marginB:     { label: "Margin bottom", min: 0, max: 60, step: .5, value: 11, unit: "pt" },
  letterRule:  { label: "Rule round the letter", min: 0, max: 2.5, step: .05, value: .8, unit: "pt", fmt: v => v.toFixed(2) },
  letterBand:  { label: "Border band", min: 0, max: 40, step: .5, value: 0, unit: "pt" },
  devRadius:   { label: "Radius to the cusps", min: 5, max: 160, step: .5, value: 60, unit: "pt" },
  devLobes:    { label: "Lobes", min: 3, max: 32, step: 1, value: 16, unit: "" },
  devDepth:    { label: "Lobe depth", min: .04, max: .34, step: .005, value: .16, unit: "× radius", fmt: v => v.toFixed(3) },
  devBand:     { label: "Band", min: 3, max: 60, step: .5, value: 15, unit: "pt" },
  devPoints:   { label: "Star points", min: 5, max: 16, step: 1, value: 8, unit: "" },
  devSkip:     { label: "Star skip", min: 2, max: 7, step: 1, value: 3, unit: "" },
  devRatio:    { label: "Height", min: 1, max: 3.5, step: .05, value: 1.9, unit: "× width", fmt: v => v.toFixed(2) },
  pageWidth:   { label: "Trim width", min: 240, max: 720, step: 1, value: 432, unit: "pt" },
  pageHeight:  { label: "Trim height", min: 320, max: 1000, step: 1, value: 648, unit: "pt" },
};

const RING_CONTROLS = {
  tip:    { label: "Tip", min: 30, max: 140, step: 1, unit: "°" },
  band:   { label: "Width", min: 10, max: 52, step: 1, unit: "pt" },
  cell:   { label: "Repeat", min: 10, max: 70, step: 1, unit: "pt" },
  stroke: { label: "Weight", min: .25, max: 1.6, step: .01, unit: "pt", fmt: v => v.toFixed(2) },
  rule:   { label: "Rule", min: 0, max: 2.5, step: .05, unit: "pt", fmt: v => v.toFixed(2) },
  delta:  { label: "Two-point split", min: 0, max: .5, step: .01, unit: "× repeat", fmt: v => v.toFixed(2) },
  toneSpacing: { label: "Tone pitch", min: 1.5, max: 12, step: .1, unit: "pt", fmt: v => v.toFixed(1) },
  toneStroke:  { label: "Tone weight", min: .15, max: 1.2, step: .05, unit: "pt", fmt: v => v.toFixed(2) },
  // The alternation is a second hatching, laid inside the odd-crossed runs, and
  // it wants its own pitch and weight for the same reason the ground does: two
  // hatchings at one pitch beat against each other, and the alternation is
  // usually the one that should give way.
  altSpacing: { label: "Alternation pitch", min: 1.5, max: 12, step: .1, unit: "pt", fmt: v => v.toFixed(1) },
  altStroke:  { label: "Alternation weight", min: .15, max: 1.2, step: .05, unit: "pt", fmt: v => v.toFixed(2) },
  // Where the repeat is registered. The pattern does not resize; it slides, so
  // a different part of it lands in the region -- which is the whole question in
  // a letterform, where there is only room for one or two repeats and *which*
  // part falls in the stem of a B decides whether a star sits in it.
  shiftX: { label: "Shift across", min: -1, max: 1, step: .02, unit: "× repeat", fmt: v => v.toFixed(2) },
  shiftY: { label: "Shift down", min: -1, max: 1, step: .02, unit: "× repeat", fmt: v => v.toFixed(2) },
};

// "As the page" is the default for both, so a card is not obliged to have an
// opinion; the page's palette and rendering carry until one is given.
const AS_PAGE = "";

const TINCTURES = ["argent", "or", "azure", "gules", "vert", "purpure", "sable", "solid"];
// Two-tone alternation, which fills the even-odd interior of the chained
// strands. "none" is off; the rest name the tincture the filled half takes.
// Every tincture, not a shortlist. `Ring.alternate` has always accepted any of
// them -- the studio was offering four, which is why gules and purpure could not
// be had at all, and argent (which fills with nothing) could not be chosen to
// turn one off. `solid` is the ink itself, whatever the palette's ink is.
const ALTERNATES = ["none", "solid", ...TINCTURES.filter((t) => t !== "solid")];

const state = Object.fromEntries(Object.entries(CONTROLS).map(([k, c]) => [k, c.value]));
state.arch = "pointed";
state.marginFill = false;
state.ladderTips = { dodecagon: 60, octagon: 90, hex: 100, square: 110 };
state.subject = "page";
state.fontBuf = null;
state.fontName = "";
state.letter = "A";
state.devKind = "shamsa";
state.marginLock = true;
state.init = { rings: [] };
state.dev = { rings: [] };
state.page = { on: true, rings: [] };
state.win  = { on: true, rings: [] };
let view = "fit", hover = null;   // {grp, i}

// Each group's composition is cached on everything that feeds it. Dragging a
// window slider then costs the window only: the page ground -- much the larger
// half of the work -- is reused unless its own inputs or the window's outline
// actually moved. The hover highlight is deliberately part of the key, since it
// repaints one ring in a different ink.
const cache = { page: { key: null, val: null }, win: { key: null, val: null } };
// Emptied, not replaced by null. Setting `cache.page = null` -- which is what
// changing subject used to do -- left `cached` to dereference it on the next
// page render, and it threw before anything was drawn.
function invalidate() {
  cache.page = { key: null, val: null };
  cache.win = { key: null, val: null };
}
function cached(grp, key, build) {
  const c = cache[grp];
  if (c.key !== key) { c.val = build(); c.key = key; }
  return c.val;
}
const roundPoly = (poly) => poly.map(([x, y]) => [Math.round(x * 64), Math.round(y * 64)]);

// The two groups differ only in how many rings they have, which one is a field,
// and how a ring index maps to a ladder rung. Everything else is shared.
const GROUPS = {
  page: {
    box: "ringsPage",
    count: () => Math.round(state.bands) + 1,       // bands, then the field
    isField: (i) => i === Math.round(state.bands),
    rung: (i) => i + 1,                              // walked inward from the trim
    label(i) {
      if (this.isField(i)) return ["Field", "fills whatever is left inside the bands"];
      return [`Band ${i + 1}`, i === 0 ? "outermost" : `${i} in from the edge`];
    },
  },
  init: {
    // A decorated initial has four regions and they are four decisions: the
    // border, the field it encloses, the letterform, and the space the
    // letterform encloses. All four cards are kept in state whether or not they
    // are showing, so turning a border off and on again does not lose what was
    // set on it; `active` decides which are drawn.
    box: "ringsInit",
    count: () => 4,
    isField: () => true,          // the border's width is the panel's own slider
    rung: (i) => (i < 2 ? 1 : 2),
    active: (i) => [state.letterBand > 0, true,
                    state.letterMode === "own", state.counterMode === "own"][i],
    // The letterform and its counter are regions, not rings: there is no edge
    // of theirs to rule. The letter's own contour is the panel's slider, since
    // it belongs to the letterform whether or not the letterform is filled.
    hides: (i) => (i >= 2 ? ["rule"] : []),
    label: (i) => [
      ["Border", "the band inside the panel edge"],
      ["Field", "the ornament round the letter"],
      ["Letterform", "the pattern inside the letter itself"],
      ["Counter", "the space the letter encloses \u2014 the bowl of a D"],
    ][i],
  },
  dev: {
    box: "ringsDev",
    count: () => 1,
    isField: () => false,
    rung: () => 1,
    label: () => ["Band", "the ornament in the ring"],
  },
  win: {
    box: "ringsWin",
    count: () => Math.round(state.depth),
    isField: () => false,
    rung: (i) => Math.round(state.depth) - i,        // walked outward from the opening
    label(i) {
      const n = this.count();
      return [`Ring ${i + 1}`,
        i === 0 ? "this tale's own grid" : (n - i === 1 ? "the frame tale" : `${i} level(s) out`)];
    },
  },
};

function derived(grp, i) {
  const d = GROUPS[grp].rung(i);
  const rung = (d - 1 + 99 * core.TILING_LADDER.length) % core.TILING_LADDER.length;
  const tiling = core.TILING_LADDER[rung];
  // The letterform and its counter start finer than the field. Two grids at one
  // repeat line up and read as one, so an inlay at the field's own cell is
  // invisible; it is the difference in scale that puts figure against ground.
  const fine = grp === "init" && i >= 2;
  return { tiling, tip: state.ladderTips[tiling], band: state.band,
           cell: state.cell * (fine ? 0.55 : 1),
           stroke: state.stroke * (fine ? 0.8 : 1),
           rule: state.rule, delta: 0, blank: false,
           tincture: "argent", toneSpacing: 3, toneStroke: 0.3,
           alternate: "none", altSpacing: 3, altStroke: 0.3,
           shiftX: 0, shiftY: 0,
           palette: AS_PAGE, pigment: AS_PAGE,
           interlace: false };
}
function syncRings(grp) {
  const arr = state[grp].rings, n = GROUPS[grp].count();
  while (arr.length < n) arr.push({ custom: false });
  arr.length = n;
}
// Three layers, outermost wins: what the user set (`custom`), what the dice
// last gave (`rolled`), and what the ladder derives. A card's own reset drops
// both of the first two, which is what puts it back in the draw.
const ringValues = (grp, i) => {
  const r = state[grp].rings[i];
  return r.custom ? r : { ...derived(grp, i), ...(r.rolled || {}) };
};

// ---- panel -----------------------------------------------------------------
const archSel = document.getElementById("arch");
for (const k of core.ARCH_KINDS) archSel.insertAdjacentHTML("beforeend", `<option value="${k}">${k.replace("_", "-")}</option>`);
const sizeSel = document.getElementById("pageSize");
sizeSel.innerHTML = Object.entries(PAGE_SIZES)
  .map(([k, v]) => `<option value="${k}">${v}</option>`).join("") +
  `<option value="custom">Custom</option>`;
sizeSel.value = `${state.pageWidth}x${state.pageHeight}`;
sizeSel.onchange = () => {
  if (sizeSel.value === "custom") return;
  const [w, h] = sizeSel.value.split("x").map(Number);
  state.pageWidth = w; state.pageHeight = h;
  for (const k of ["pageWidth", "pageHeight"]) {
    document.getElementById(`r-${k}`).value = state[k];
  }
  render();
};

const palSel = document.getElementById("palette");
palSel.innerHTML = Object.entries(pig.PALETTES)
  .map(([k, v]) => `<option value="${k}">${v.label}</option>`).join("");
state.palette = "wire";
palSel.onchange = () => { state.palette = palSel.value; render(); };

const subjectSel = document.getElementById("subject");
subjectSel.onchange = () => {
  state.subject = subjectSel.value;
  syncVisibility();
  invalidate();                       // the canvas changes; nothing carries over
  render();
};

const fontInput = document.getElementById("fontFile");
fontInput.onchange = async (e) => {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  state.fontBuf = await f.arrayBuffer();
  state.fontName = f.name;
  render();
};

const letterInput = document.getElementById("letterChar");
letterInput.oninput = () => {
  state.letter = letterInput.value || "A";
  render();
};

state.letterMode = "blank";
state.counterMode = "inherit";
for (const k of ["letterMode", "counterMode"]) {
  const el = document.getElementById(k);
  el.value = state[k];
  el.onchange = () => { state[k] = el.value; buildCards("init"); render(); };
}

const lockBox = document.getElementById("marginLock");
lockBox.onchange = (e) => { state.marginLock = e.target.checked; render(); };
for (const k of ["marginL", "marginR", "marginT", "marginB"]) {
  document.addEventListener("input", (e) => {
    if (e.target.id !== `r-${k}` || !state.marginLock) return;
    // One margin all round: the common case, and four sliders moving together
    // is easier to read than one slider that secretly sets four.
    for (const j of ["marginL", "marginR", "marginT", "marginB"]) {
      state[j] = state[k];
      const el = document.getElementById(`r-${j}`);
      if (el) el.value = state[j];
      // All four are set together, so all four are pinned together -- otherwise
      // the randomiser would move the three the user did not touch and the lock
      // would appear to have come undone.
      pin(j);
    }
  }, true);
}

const devSel = document.getElementById("devKind");
devSel.onchange = () => { state.devKind = devSel.value; syncVisibility(); render(); };

const pigSel = document.getElementById("pigment");
state.pigment = false;
pigSel.onchange = () => { state.pigment = pigSel.value === "pigment"; render(); };

archSel.value = state.arch;
archSel.onchange = () => { state.arch = archSel.value; syncVisibility(); render(); };

for (const [key, id] of [["page", "onPage"], ["win", "onWin"]]) {
  document.getElementById(id).onchange = (e) => {
    state[key].on = e.target.checked; syncVisibility(); render();
  };
}
document.getElementById("marginFill").onchange = (e) => { state.marginFill = e.target.checked; schedule(); };

function slider(id, c, value, provKey, pinned) {
  const marks = provKey ? (MARKS[provKey] ?? []) : [];
  return `<div class="lbl"><b${pinned ? ' class="set"' : ""}>${c.label}</b>` +
    (pinned ? `<a class="rst" id="x-${id}">reset</a>` : "") +
    `<span class="val" id="v-${id}"></span></div>` +
    `<input type="range" id="r-${id}" min="${c.min}" max="${c.max}" step="${c.step}" value="${value}">` +
    `<div class="gutter">` + marks.map(m => {
      const pct = ((m.value - c.min) / (c.max - c.min)) * 100;
      return (pct < 0 || pct > 100) ? "" :
        `<i class="tick${m.caution ? " caution" : ""}" style="left:${pct}%"><span>${m.label}</span></i>`;
    }).join("") + `</div>` +
    (provKey ? `<div class="prov" id="p-${id}"></div>` : "");
}

// A control the user has moved is **pinned**, and the randomiser leaves pinned
// things alone. That is the whole contract, and it is why every control needs a
// way back: unpinning is how you hand something back to the dice.
state.pinned = new Set();

// Marked *in place*, never by rebuilding the row. The first `input` event of a
// drag is what pins a slider, and replacing the element under the pointer at
// that moment ends the drag -- the slider would jump once and then go dead.
function markPinned(key) {
  const row = document.querySelector(`[data-ctl="${key}"]`);
  if (!row || row.querySelector(".rst")) return;
  const lbl = row.querySelector(".lbl");
  if (!lbl) return;
  lbl.querySelector("b").classList.add("set");
  const a = document.createElement("a");
  a.className = "rst"; a.textContent = "reset";
  a.onclick = () => unpin(key);
  lbl.insertBefore(a, lbl.querySelector(".val"));
}

function unpin(key) {
  state.pinned.delete(key);
  state[key] = CONTROLS[key].value;
  buildControl(key);
  afterControl(key);
}

function pin(key) {
  if (state.pinned.has(key)) return;
  state.pinned.add(key);
  markPinned(key);
}

function buildControl(key) {
  const c = CONTROLS[key];
  const row = document.querySelector(`[data-ctl="${key}"]`);
  if (!row) return;
  const pinned = state.pinned.has(key);
  row.innerHTML = slider(key, c, state[key], c.prov, pinned);
  row.querySelector("input").addEventListener("input", (e) => {
    state[key] = parseFloat(e.target.value);
    pin(key);
    afterControl(key);
  });
  const rst = row.querySelector(`#x-${key}`);
  if (rst) rst.onclick = () => unpin(key);
}

// Three controls decide how many cards there are, and one whether the border
// card exists at all; everything else only needs a repaint.
function afterControl(key) {
  if (key === "depth") { syncRings("win"); buildCards("win"); }
  if (key === "bands") { syncRings("page"); buildCards("page"); }
  if (key === "letterBand") buildCards("init");
  schedule();
}

for (const key of Object.keys(CONTROLS)) buildControl(key);

// --------------------------------------------------------------------------
// The dice
// --------------------------------------------------------------------------
//
// A uniform draw over every control gives noise, not ornament: a 70pt repeat in
// a 12pt band, a crosshatch at printing-plate weight, two-point splits
// everywhere. So the draw is weighted towards what the rest of this studio is
// for -- most rings are plain strapwork on paper, some are toned, a few are
// woven -- and the odd ones stay odd. What it is *not* is a search for
// something good; it is a way of being shown a corner of the space you would
// not have turned the dials towards.
//
// Trim size is never drawn. It is a physical fact about the book, not a design
// choice, and everything downstream is measured relative to it.
const NEVER_ROLLED = new Set(["pageWidth", "pageHeight"]);

const pick = (xs) => xs[Math.floor(Math.random() * xs.length)];
const chance = (p) => Math.random() < p;

// Triangular about the default, not uniform over the track. The defaults here
// are considered values and several are measured off real objects, so a draw
// that treats them as no likelier than the extremes throws away the one thing
// the studio knows. This still reaches the ends -- it just does not spend most
// of its time there, which a uniform draw over a dozen controls at once does.
function rollNumber(c, centre = c.value) {
  const t = (Math.random() + Math.random()) / 2;
  const v = t < 0.5 ? c.min + (centre - c.min) * t * 2
                    : centre + (c.max - centre) * (t - 0.5) * 2;
  const snapped = Math.round(v / c.step) * c.step;
  // Snapping in floating point gives 0.30000000000000004 and the readout says
  // so; the step is never finer than a thousandth of anything here.
  return +Math.min(c.max, Math.max(c.min, snapped)).toFixed(4);
}

// A number drawn about a centre of its own, for the card fields whose sensible
// range is relative to what the card already derived rather than to a track.
const about = (mid, spread, step) => {
  const t = (Math.random() + Math.random()) / 2;
  return +(Math.round((mid * (1 - spread + t * 2 * spread)) / step) * step).toFixed(4);
};

// Weighted so the common case stays common. `argent` is the paper, and a page
// on which every ring is toned is a page nobody would set.
const rollTincture = () => (chance(0.62) ? "argent" : pick(TINCTURES));
const rollAlternate = () => (chance(0.7) ? "none" : pick(ALTERNATES));

function rollCard(grp, i) {
  const tiling = pick(Object.keys(core.TILINGS));
  const tip = state.ladderTips[tiling];
  const d = derived(grp, i);
  return {
    tiling,
    // Around the grid's own attested tip rather than anywhere on the track: the
    // tip angle is the one parameter here taken from measured objects, and a
    // draw that ignores that is drawing something else.
    tip: Math.max(RING_CONTROLS.tip.min,
         Math.min(RING_CONTROLS.tip.max, tip + Math.round((Math.random() - 0.5) * 44))),
    band: rollNumber(RING_CONTROLS.band, d.band),
    // Anchored on what the card already derived rather than on the slider's
    // whole range: a card's default is scaled to what it fills, and a letterform
    // is a different size of thing from a page border.
    cell: Math.max(RING_CONTROLS.cell.min, about(d.cell, 0.35, 1)),
    stroke: Math.max(RING_CONTROLS.stroke.min, about(d.stroke, 0.4, 0.01)),
    rule: chance(0.15) ? 0 : about(d.rule || 1, 0.5, 0.05),
    // The two-point split reads as scattered fragments at usable sizes, so it is
    // mostly off -- but it is the family's genuine character and worth meeting.
    delta: chance(0.85) ? 0 : Math.round(Math.random() * 30) / 100,
    shiftX: Math.round((Math.random() * 2 - 1) * 50) / 50,
    shiftY: Math.round((Math.random() * 2 - 1) * 50) / 50,
    blank: chance(0.08),
    tincture: rollTincture(),
    toneSpacing: about(3.2, 0.5, 0.1),
    toneStroke: about(0.3, 0.4, 0.05),
    alternate: rollAlternate(),
    altSpacing: about(3.6, 0.5, 0.1),
    altStroke: about(0.3, 0.4, 0.05),
    interlace: chance(0.28),
    // A palette of its own is the exception, not the rule: a page worked in four
    // palettes at once is a colour test, not a design.
    palette: chance(0.18) ? pick(Object.keys(pig.PALETTES)) : AS_PAGE,
    pigment: chance(0.12) ? pick(["hatch", "pigment"]) : AS_PAGE,
  };
}

function randomise() {
  for (const [key, c] of Object.entries(CONTROLS)) {
    if (state.pinned.has(key) || NEVER_ROLLED.has(key)) continue;
    if (!document.querySelector(`[data-ctl="${key}"]`)) continue;
    state[key] = rollNumber(c);
  }
  // The margin lock is a claim about four numbers being one, so honour it.
  if (state.marginLock && !["marginL", "marginR", "marginT", "marginB"].some(k => state.pinned.has(k))) {
    for (const k of ["marginR", "marginT", "marginB"]) state[k] = state.marginL;
  }
  for (const grp of ["page", "win", "init", "dev"]) {
    syncRings(grp);
    state[grp].rings.forEach((r, i) => {
      // A card the user has made custom is pinned in exactly the sense a slider
      // is: it keeps what it was given. Everything else gets a fresh draw, held
      // apart from `custom` so its own reset still means "back to derived".
      if (r.custom) return;
      r.rolled = rollCard(grp, i);
    });
  }
  for (const key of Object.keys(CONTROLS)) buildControl(key);
  for (const grp of ["page", "win", "init", "dev"]) buildCards(grp);
  invalidate();
  render();
}

function resetAll() {
  for (const key of Object.keys(CONTROLS)) {
    state.pinned.delete(key);
    state[key] = CONTROLS[key].value;
  }
  for (const grp of ["page", "win", "init", "dev"]) {
    state[grp].rings = state[grp].rings.map(() => ({ custom: false }));
  }
  for (const key of Object.keys(CONTROLS)) buildControl(key);
  for (const grp of ["page", "win", "init", "dev"]) { syncRings(grp); buildCards(grp); }
  invalidate();
  render();
}

document.getElementById("roll").onclick = randomise;
document.getElementById("unpinAll").onclick = resetAll;

function buildCards(grp) {
  const G = GROUPS[grp], box = document.getElementById(G.box);
  box.innerHTML = "";
  for (let i = 0; i < G.count(); i++) {
    if (G.active && !G.active(i)) continue;
    const v = ringValues(grp, i), custom = state[grp].rings[i].custom;
    const rolled = !custom && !!state[grp].rings[i].rolled;
    const field = G.isField(i);
    const hidden = G.hides ? G.hides(i) : [];
    const region = hidden.includes("rule");     // a region rather than a ring
    const [name, who] = G.label(i);
    const card = document.createElement("div");
    card.className = "ring" + (custom ? " custom" : "") + (v.blank ? " blank" : "");
    const pre = `${grp}-${i}`;
    card.innerHTML =
      `<div class="rhead"><b>${name}</b><span class="who">${who}</span>` +
      `<span class="badge">${custom ? "custom" : rolled ? "rolled" : "derived"}</span>` +
      (custom || rolled ? `<a data-reset="1">reset</a>` : "") + `</div>` +
      `<div class="row"><select id="t-${pre}">` +
        Object.keys(core.TILINGS).map(t =>
          `<option value="${t}"${t === v.tiling ? " selected" : ""}>${t} · ${core.TILINGS[t].fold}-fold</option>`).join("") +
      `</select></div>` +
      `<div class="row">${slider(`${pre}-tip`, RING_CONTROLS.tip, v.tip, `tip.${v.tiling}`)}</div>` +
      `<div class="grid2">` +
        (field ? ["cell", "stroke", "rule"] : ["band", "cell", "stroke", "rule"])
          .filter(k => !hidden.includes(k)).map(k =>
          `<div class="row">${slider(`${pre}-${k}`, RING_CONTROLS[k], v[k], k === "stroke" ? "stroke" : null)}</div>`).join("") +
      `</div>` +
      `<div class="row">${slider(`${pre}-delta`, RING_CONTROLS.delta, v.delta, null)}</div>` +
      `<div class="grid2">` +
        `<div class="row">${slider(`${pre}-shiftX`, RING_CONTROLS.shiftX, v.shiftX, null)}</div>` +
        `<div class="row">${slider(`${pre}-shiftY`, RING_CONTROLS.shiftY, v.shiftY, null)}</div>` +
      `</div>` +
      `<div class="grid2">` +
        `<div class="row"><div class="lbl"><b>Palette</b></div><select id="pl-${pre}">` +
          `<option value="">as the page</option>` +
          Object.entries(pig.PALETTES).map(([k, q]) =>
            `<option value="${k}"${k === v.palette ? " selected" : ""}>${q.label}</option>`).join("") +
        `</select></div>` +
        `<div class="row"><div class="lbl"><b>Tinctures</b></div><select id="pg-${pre}">` +
          ["", "hatch", "pigment"].map(k =>
            `<option value="${k}"${k === v.pigment ? " selected" : ""}>` +
            (k === "" ? "as the page" : k === "hatch" ? "hatched" : "as colour") +
            `</option>`).join("") +
        `</select></div>` +
      `</div>` +
      `<div class="row"><div class="lbl"><b>Tone</b></div><select id="tc-${pre}">` +
        TINCTURES.map(t => `<option value="${t}"${t === v.tincture ? " selected" : ""}>${t}</option>`).join("") +
      `</select><div class="prov" id="pt-${pre}"></div></div>` +
      (v.tincture === "argent" || v.tincture === "solid" ? "" :
        `<div class="grid2">` +
          `<div class="row">${slider(`${pre}-toneSpacing`, RING_CONTROLS.toneSpacing, v.toneSpacing, null)}</div>` +
          `<div class="row">${slider(`${pre}-toneStroke`, RING_CONTROLS.toneStroke, v.toneStroke, null)}</div>` +
        `</div>`) +
      `<div class="row"><div class="lbl"><b>Alternation</b><span class="val">even-odd fill</span></div>` +
        `<select id="al-${pre}">` +
        ALTERNATES.map(a => `<option value="${a}"${a === v.alternate ? " selected" : ""}>${a}</option>`).join("") +
      `</select></div>` +
      // The alternation is a second hatching, so it wants its own pitch and
      // weight. Hidden for the cases that have no hatching to set: `none` draws
      // nothing, `argent` is the paper, `solid` is a flood of ink.
      (["none", "argent", "solid"].includes(v.alternate) ? "" :
        `<div class="grid2">` +
          `<div class="row">${slider(`${pre}-altSpacing`, RING_CONTROLS.altSpacing, v.altSpacing, null)}</div>` +
          `<div class="row">${slider(`${pre}-altStroke`, RING_CONTROLS.altStroke, v.altStroke, null)}</div>` +
        `</div>`) +
      `<label class="chk"><input type="checkbox" id="w-${pre}"${v.interlace ? " checked" : ""}> weave it — over and under at every crossing</label>` +
      `<label class="chk"><input type="checkbox" id="b-${pre}"${v.blank ? " checked" : ""}> ` +
        `${region ? "no pattern here — a ground only" : "plain band, no pattern"}</label>` +
      `<div class="advice" id="a-${pre}"></div>`;
    box.appendChild(card);

    const markCustom = () => {
      card.classList.add("custom");
      card.querySelector(".badge").textContent = "custom";
      if (!card.querySelector("[data-reset]")) {
        const a = document.createElement("a");
        a.dataset.reset = "1"; a.textContent = "reset";
        a.onclick = () => { state[grp].rings[i] = { custom: false }; buildCards(grp); schedule(); };
        card.querySelector(".rhead").appendChild(a);
      }
    };
    const touch = () => {
      if (state[grp].rings[i].custom) return;
      // From whatever it is showing, not from the ladder: a card that has been
      // rolled and is then adjusted should keep the draw and take the change,
      // rather than snapping back to derived under the user's hand.
      state[grp].rings[i] = { custom: true, ...ringValues(grp, i) };
      markCustom();
    };
    card.querySelector(`#t-${pre}`).onchange = (e) => {
      touch(); state[grp].rings[i].tiling = e.target.value;
      // Snap the tip to this grid's attested value rather than carrying the
      // last number into a grid where it means nothing.
      state[grp].rings[i].tip = state.ladderTips[e.target.value] ?? state[grp].rings[i].tip;
      buildCards(grp); schedule();
    };
    for (const k of Object.keys(RING_CONTROLS)) {
      const el = card.querySelector(`#r-${pre}-${k}`);
      if (!el) continue;                       // the field has no width
      el.addEventListener("input", (e) => {
        touch(); state[grp].rings[i][k] = parseFloat(e.target.value); schedule();
      });
    }
    card.querySelector(`#tc-${pre}`).onchange = (e) => {
      touch(); state[grp].rings[i].tincture = e.target.value;
      buildCards(grp); schedule();
    };
    card.querySelector(`#al-${pre}`).onchange = (e) => {
      // Rebuild: the pitch and weight sliders belong to a hatched alternation
      // and appear and disappear with one.
      touch(); state[grp].rings[i].alternate = e.target.value;
      buildCards(grp); schedule();
    };
    for (const [id, key] of [["pl", "palette"], ["pg", "pigment"]]) {
      card.querySelector(`#${id}-${pre}`).onchange = (e) => {
        touch(); state[grp].rings[i][key] = e.target.value;
        buildCards(grp); schedule();
      };
    }
    card.querySelector(`#w-${pre}`).onchange = (e) => {
      touch(); state[grp].rings[i].interlace = e.target.checked; schedule();
    };
    card.querySelector(`#b-${pre}`).onchange = (e) => {
      touch(); state[grp].rings[i].blank = e.target.checked;
      card.classList.toggle("blank", e.target.checked); schedule();
    };
    const rst = card.querySelector("[data-reset]");
    if (rst) rst.onclick = () => { state[grp].rings[i] = { custom: false }; buildCards(grp); schedule(); };
    card.onmouseenter = () => { hover = { grp, i }; schedule(); };
    card.onmouseleave = () => { hover = null; schedule(); };
  }
}

const titleInput = document.getElementById("title");
titleInput.value = "TALE OF THE TRADER AND THE JINNI";
titleInput.addEventListener("input", schedule);

function syncVisibility() {
  const page = state.subject === "page";
  const show = (id, on) => { document.getElementById(id).style.display = on ? "" : "none"; };
  show("fsInitial", state.subject === "letterset");
  show("fsDevice", state.subject === "device");
  show("fsWhat", page);
  show("fsPage", page && state.page.on);
  show("fsWin", page && state.win.on);
  show("fsForm", page && state.win.on);
  show("fsTitle", page && state.win.on);
  // Only a shamsa and an almond carry a band; only a marker carries a star.
  for (const row of document.querySelectorAll("[data-dev]")) {
    row.style.display = row.dataset.dev.split(" ").includes(state.devKind) ? "" : "none";
  }
  // Lobes belong to the round devices, not to the almond.
  for (const k of ["devLobes", "devDepth"]) {
    const row = document.querySelector(`[data-ctl="${k}"]`);
    if (row) row.style.display = state.devKind === "marginal" ? "none" : "";
  }
  const dbox = document.getElementById("devProv");
  dbox.className = "prov on";
  dbox.innerHTML = {
    shamsa: `A medallion on a dedication or ownership page, its centre left for a name.`
          + `<cite>Lobe counts seen on real ones: ${dv.SHAMSA_LOBES.join(", ")}</cite>`,
    marker: `The seal that closes a verse. Eight points skipping three is the khatam of `
          + `Arabic manuscripts.<cite>At this size nothing subtler survives the press</cite>`,
    marginal: `An almond in the outer margin, marking a division. Two arcs meeting in `
            + `cusps — an ellipse through the same points has none.<cite>Also the turunj `
            + `of a binding's central panel</cite>`,
  }[state.devKind];
  for (const row of document.querySelectorAll("[data-only]")) {
    row.style.display = row.dataset.only === state.arch ? "" : "none";
  }
  const n = ARCH_NOTES[state.arch];
  const box = document.getElementById("archProv");
  box.className = "prov on";
  box.innerHTML = n ? `${n.note}<cite>${n.source}</cite>` : "";
}

function archKw() {
  switch (state.arch) {
    case "pointed": return { offset: state.span * state.offsetRatio };
    case "horseshoe": return { overshoot: state.overshoot };
    case "multifoil": return { lobes: Math.round(state.lobes) };
    case "four_centred": return { rise: state.span * state.riseRatio4 };
    case "ogee": return { rise: state.span * state.riseRatioOg };
    default: return {};
  }
}

// The tinctures follow the palette's ink, so a scheme chosen here and a
// tincture chosen on a ring do not fight: `argent` is the paper whatever the
// paper is, and everything else is the ink whatever the ink is.
const paletteNow = () => pig.scheme(state.palette);

// A card may keep a palette and a rendering of its own, or take the page's.
// There is no reason a border and the field it encloses have to be worked in
// one ink -- illumination routinely is not -- and the page's own settings become
// the default rather than the law.
const paletteOf = (v) => pig.scheme(v.palette || state.palette);
const pigmentOf = (v) => (v.pigment ? v.pigment === "pigment" : state.pigment);

function toneFor(v) {
  if (!v.tincture || v.tincture === "argent") return null;
  const ink = paletteOf(v).ink, asColour = pigmentOf(v);
  if (v.tincture === "solid") return { kind: "solid", colour: ink };
  const base = core.tincture(v.tincture, asColour, v.palette || state.palette);
  if (!base) return null;
  // Laid as colour, a tincture *is* its colour; ruled, it is the ink doing an
  // impression of one, so it takes the palette's ink and the ring's spacing.
  return asColour ? base
       : { ...base, spacing: v.toneSpacing, stroke: v.toneStroke, colour: ink };
}

function alternateFor(v) {
  if (!v.alternate || v.alternate === "none") return null;
  const ink = paletteOf(v).ink, asColour = pigmentOf(v);
  if (v.alternate === "solid") return { kind: "solid", colour: ink };
  const base = core.tincture(v.alternate, asColour, v.palette || state.palette);
  if (!base) return null;
  return asColour ? base
       : { ...base, spacing: v.altSpacing, stroke: v.altStroke, colour: ink };
}

// What one card says, as a fill: a ground, strapwork over it, and how it reads.
// A ring is a fill with a width and a rule; a letterform and a counter are the
// same fill with neither. Read in one place so a card means the same thing
// wherever it is used.
function fillFor(grp, i) {
  const v = ringValues(grp, i);
  const pal = paletteOf(v);
  const lit = hover && hover.grp === grp && hover.i === i;
  return {
    tone: toneFor(v),
    alternate: alternateFor(v),
    interlace: !!v.interlace,
    // The rule at this region's edge takes the region's own ink. A band worked
    // in one palette and ruled in another reads as a mistake rather than as a
    // choice, and having to set the two separately is how they come to disagree.
    ruleColour: lit ? MARK_INK : pal.ink,
    pattern: v.blank ? null : {
      tiling: v.tiling, cell: v.cell, stroke: v.stroke,
      contact: core.contactForTip(core.TILINGS[v.tiling].fold, v.tip),
      delta: v.delta * v.cell,
      // The grid slides without resizing, so a different part of the repeat
      // lands in the region. In × repeat, since that is the unit in which a
      // whole shift is the identity.
      offset: [v.shiftX * v.cell, v.shiftY * v.cell],
      // Over a solid ground the strapwork has to be paper-coloured or it
      // vanishes into it. Hover still wins, so the ring being edited is
      // findable even when reversed.
      colour: lit ? MARK_INK : (v.tincture === "solid" ? pal.reverse : pal.ink),
    },
  };
}

function ringsFor(grp) {
  const G = GROUPS[grp];
  return state[grp].rings.map((_, i) => {
    const v = ringValues(grp, i);
    const f = fillFor(grp, i);
    return { width: G.isField(i) ? null : v.band, rule: v.rule || null,
             ...f, ruleColour: f.ruleColour };
  });
}

function widthAt(poly, y) {
  const xs = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) {
      xs.push(a[0] + ((y - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
    }
  }
  if (xs.length < 2) return 0;
  xs.sort((p, q) => p - q);
  return xs[xs.length - 1] - xs[0];
}

let pending = false;
function schedule() {
  if (pending) return;
  pending = true;
  const go = () => { if (!pending) return; pending = false; render(); };
  requestAnimationFrame(go);
  // A hidden tab never runs its animation frames, so the flag stayed set for
  // good and the studio came back from a background tab permanently frozen --
  // every slider live, nothing redrawing. A timer is the belt to that brace;
  // whichever arrives first clears the flag and the other returns.
  setTimeout(go, 80);
}

function showProv(id, key, value) {
  const box = document.getElementById(`p-${id}`);
  if (!box) return;
  const m = nearestMark(key, value);
  if (m) {
    box.className = "prov " + (m.caution ? "caution" : "on");
    box.innerHTML = `${m.note}${m.source ? `<cite>${m.source}</cite>` : ""}`;
  } else {
    box.className = "prov off";
    box.innerHTML = `No attested source at this value.<cite>Nearest marks are on the track.</cite>`;
  }
}

function render() {
  for (const [key, c] of Object.entries(CONTROLS)) {
    const el = document.getElementById(`v-${key}`);
    if (el) el.textContent = `${c.fmt ? c.fmt(state[key]) : state[key]}${c.unit ? " " + c.unit : ""}`;
    if (c.prov) showProv(key, c.prov, state[key]);
  }
  const adv = strokeAdvice(state.stroke);
  const advBox = document.getElementById("strokeAdvice");
  advBox.className = "advice " + adv.level;
  advBox.textContent = "Default weight — " + adv.text;
  // The whole visual effect of a relief in two numbers: how much the motif is
  // magnified at the crown against how much it is compressed at the rim. Their
  // ratio is what the eye reads as depth, so it is worth showing rather than
  // leaving the slider to be turned by feel.
  for (const [key, id] of [["pageBulge", "pageBulgeAdvice"], ["winBulge", "winBulgeAdvice"]]) {
    const box = document.getElementById(id);
    const b = state[key];
    if (!b) {
      box.className = "advice";
      box.textContent = "Flat. The band lies in the plane of the page.";
      continue;
    }
    const roll = new core.Roll([[0, 0], [1, 0], [1, 1], [0, 1]], 1, b);
    const crown = roll.scaleAt(0), rim = roll.scaleAt(1);
    const hard = Math.abs(b) >= core.BULGE_LIMIT - 0.5;
    box.className = "advice " + (hard ? "warn" : "ok");
    box.textContent =
      `${b > 0 ? "Convex" : "Hollow"} — motif ${crown.toFixed(2)}× at the crown, ` +
      `${rim.toFixed(2)}× at the rims (${(crown / rim).toFixed(1)}:1 across the band). ` +
      (hard ? "At the limit: the rim is nearly edge-on and its detail is lost."
            : "The whole stack rolls as one; each ring keeps its share of the depth.");
  }

  // Every group, not only the two that started with cards: an initial's four
  // cards had readouts that were built empty and never filled.
  for (const grp of ["page", "win", "init", "dev"]) {
    state[grp].rings.forEach((_, i) => {
      const v = ringValues(grp, i), pre = `${grp}-${i}`;
      for (const [k, c] of Object.entries(RING_CONTROLS)) {
        const el = document.getElementById(`v-${pre}-${k}`);
        if (el) el.textContent = `${c.fmt ? c.fmt(v[k]) : v[k]}${c.unit ? " " + c.unit : ""}`;
      }
      const tn = document.getElementById(`pt-${pre}`);
      if (tn) {
        const note = TINCTURE_NOTES[v.tincture];
        const ink = core.inkFraction(toneFor(v));
        // The Benares Kufic panel runs about a third ink, and its own note says
        // anything much heavier goes solid. Report the share so a tone can be
        // set to a target rather than by squinting.
        const share = v.tincture === "argent" ? ""
          : ` <span style="color:#9a9a9a">· ${(ink * 100).toFixed(0)}% ink` +
            (ink > 0.45 ? " — heavy, will read near-solid" :
             ink < 0.06 && v.tincture !== "solid" ? " — very faint at print size" : "") + "</span>";
        tn.className = "prov " + (v.tincture === "argent" ? "caution" : "on");
        tn.innerHTML = note ? `${note.note}${share}<cite>${note.source}</cite>` : "";
      }
      showProv(`${pre}-tip`, `tip.${v.tiling}`, v.tip);
      showProv(`${pre}-stroke`, "stroke", v.stroke);
      const a = document.getElementById(`a-${pre}`);
      if (!a) return;
      if (v.blank) { a.className = "advice"; a.textContent = "Plain band — a moulding between patterned rings."; }
      else {
        const sv = strokeAdvice(v.stroke);
        a.className = "advice " + sv.level;
        a.textContent = `contact ${core.contactForTip(core.TILINGS[v.tiling].fold, v.tip).toFixed(4)}° · ${sv.text}`;
      }
    });
  }

  PAGE_W = Math.round(state.pageWidth);
  PAGE_H = Math.round(state.pageHeight);
  const key = `${PAGE_W}x${PAGE_H}`;
  sizeSel.value = key in PAGE_SIZES ? key : "custom";
  const pal = pig.scheme(state.palette);
  const beam = [state.lightAz, state.lightElev];
  const lbox = document.getElementById("lightAdvice");
  const overhead = state.lightElev >= 88;
  lbox.className = "advice " + (overhead ? "warn" : "ok");
  lbox.textContent = overhead
    ? "On the viewing axis: both rims turn away from it equally, so the shading "
    + "comes out symmetric and reads as two dark edges rather than as a round thing."
    : `Upper left is the drawing convention, and it is the only choice that makes a `
    + `raised form look different from a sunk one. Lower light, more contrast `
    + `between the sides of a frame.`;
  const pbox = document.getElementById("paletteProv");
  pbox.className = "prov";
  pbox.className = "prov " + (pal.caution ? "off" : "on");
  pbox.innerHTML = `${pal.note}<cite>${pal.caution || pal.source
    || "One ink is what most books print; the heraldic hatchings exist so a "
       + "colour scheme survives it."}</cite>`;

  const t0 = performance.now();
  let win = null, winComp = null, pageComp = null, out;
  try {
  if (state.subject !== "page") {
    // A letterset and a device are their own canvas. Everything else -- rings,
    // patterns, tones, tinctures, weaving, relief, shading -- is the same
    // machinery, because compose only ever wanted an outline family.
    const beamNow = [state.lightAz, state.lightElev];
    if (state.subject === "letterset") {
      if (!state.fontBuf) {
        document.getElementById("stats").textContent =
          "choose a TrueType font to read the letter from";
        return;
      }
      // One letter or a whole word, by the same path: a word is the same
      // reserve, only longer, and the thing a title page most often wants
      // ornamented is a word rather than a capital.
      const contours = [...state.letter].length > 1
        ? L.word(state.fontBuf, state.letter, state.letterSize,
                 { tracking: state.letterTrack })
        : L.glyph(state.fontBuf, state.letter, state.letterSize);
      // Four regions, four cards. The border and the field are ordinary rings;
      // the letterform and the counter are the same fill with no width and no
      // rule. `true` for the counter means "whatever surrounds it", which is
      // what the even-odd mask gives for nothing; anything else narrows the
      // composition's hole to the silhouette first.
      const border = fillFor("init", 0);
      const field = fillFor("init", 1);
      out = L.initial(contours,
        L.panelRings(state.letterBand,
                     { base: field, border, field, rule: state.rule || null }), {
        margin: [state.marginL, state.marginR, state.marginT, state.marginB],
        outline: state.letterRule || null,
        // The contour belongs to the letter, so it takes the letterform's ink
        // when the letterform has one of its own, and the field's when it is a
        // plain reserve and the line reads as the field's own boundary.
        outlineColour: paletteOf(ringValues("init",
          state.letterMode === "own" ? 2 : 1)).ink,
        inlay: state.letterMode === "own" ? fillFor("init", 2) : null,
        counter: state.counterMode === "inherit" ? true
               : state.counterMode === "blank" ? false : fillFor("init", 3),
        bulge: state.winBulge, shadow: state.winShadow, light: beamNow,
      });
    } else {
      const v = ringValues("dev", 0);
      const pat = v.blank ? null : {
        tiling: v.tiling, cell: v.cell, stroke: v.stroke,
        contact: core.contactForTip(core.TILINGS[v.tiling].fold, v.tip),
        delta: v.delta * v.cell,
      };
      const shared = { pattern: pat, rule: state.rule || null,
                       bulge: state.winBulge, shadow: state.winShadow, light: beamNow };
      if (state.devKind === "shamsa") {
        out = dv.shamsa({ radius: state.devRadius, lobes: Math.round(state.devLobes),
                          depth: state.devDepth, band: state.devBand, ...shared });
      } else if (state.devKind === "marker") {
        out = dv.verseMarker({ radius: Math.max(4, state.devRadius / 7),
                               points: Math.round(state.devPoints),
                               skip: Math.round(state.devSkip),
                               lobes: Math.round(state.devLobes),
                               depth: state.devDepth, rule: state.rule || 0.6 });
      } else {
        out = dv.marginal({ halfWidth: state.devRadius / 3,
                            halfHeight: (state.devRadius / 3) * state.devRatio,
                            band: state.devBand, ...shared });
      }
    }
    PAGE_W = out.width; PAGE_H = out.height;
  } else {
    let rim = null;
    if (state.win.on) {
      win = new core.WindowSpec(state.arch, state.span, state.height, archKw());
      const top = (PAGE_H - win.height) / 2;
      const wr = ringsFor("win");
      const wkey = JSON.stringify([state.arch, state.span, state.height, archKw(), wr,
                                   state.winBulge, state.winShadow, PAGE_W, PAGE_H,
                                   state.palette, state.pigment,
                                   state.lightAz, state.lightElev,
                                   hover && hover.grp === "win" ? hover.i : -1]);
      winComp = cached("win", wkey,
        () => core.compose((inset) => win.outline(PAGE_W / 2, top, -inset), wr,
                           null, state.winBulge, state.winShadow, beam));
      // Everything the window occupies, so the ground beneath can be cut away.
      const reach = wr.reduce((a, r) => a + (r.width || 0), 0);
      rim = win.outline(PAGE_W / 2, top, -reach);
    }
    if (state.page.on) {
      const pr = ringsFor("page");
      if (state.margin > 0) {
        const field = pr[pr.length - 1];
        pr.unshift({
          width: state.margin, rule: null,
          pattern: state.marginFill && field ? { ...field.pattern, colour: undefined } : null,
        });
      }
      const rect = (inset) => [[inset, inset], [PAGE_W - inset, inset],
                               [PAGE_W - inset, PAGE_H - inset], [inset, PAGE_H - inset]];
      const pkey = JSON.stringify([pr, rim ? roundPoly(rim) : null, state.pageBulge,
                                   state.pageShadow, PAGE_W, PAGE_H, state.palette,
                                   state.pigment, state.lightAz, state.lightElev,
                                   hover && hover.grp === "page" ? hover.i : -1]);
      pageComp = cached("page", pkey,
        () => core.compose(rect, pr, rim ? [rim] : null, state.pageBulge,
                           state.pageShadow, beam));
    }
    const parts = [pageComp, winComp].filter(Boolean);
    if (!parts.length) { document.getElementById("stats").textContent = "nothing enabled"; return; }
    out = parts.length > 1 ? core.stack(...parts) : parts[0];
  }
  } catch (e) {
    document.getElementById("stats").textContent = `refused: ${e.message}`;
    return;
  }

  const svg = core.toSvg(out, PAGE_W, PAGE_H, { colour: pal.ink, background: pal.ground });
  const ms = performance.now() - t0;

  const stage = document.getElementById("stage");
  // Clamped: a stage smaller than its own padding gives a negative scale, and
  // SVG rejects a negative width outright, so the whole preview disappears with
  // a console error rather than just being small.
  const raw = view === "fit"
    ? Math.min((stage.clientHeight - 90) / PAGE_H, (stage.clientWidth - 70) / PAGE_W)
    : view === "actual" ? 96 / 72 : 300 / 72 / (window.devicePixelRatio || 1);
  const scale = Math.max(0.05, raw);
  const w = PAGE_W * scale, h = PAGE_H * scale;
  const paper = document.getElementById("paper");
  paper.style.width = `${w}px`; paper.style.height = `${h}px`;
  paper.querySelector("svg")?.remove();
  paper.insertAdjacentHTML("afterbegin", svg.replace("<svg ", `<svg width="${w}" height="${h}" `));

  const layer = document.getElementById("titleLayer");
  const tt = document.getElementById("titleText");
  if (state.subject !== "page") { tt.innerHTML = ""; layer.style.display = "none"; }
  else layer.style.display = "";
  // The title is an HTML overlay rather than part of the drawing, so it has to
  // be told the ink: on a lapis ground a near-black title is invisible.
  tt.style.color = pal.ink;
  const opening = state.win.on && winComp ? winComp.start : null;
  const title = titleInput.value.trim();
  let fitNote = "", fitBad = false;
  if (opening && title) {
    const bb = opening.reduce((a, [x, y]) => [Math.min(a[0], x), Math.min(a[1], y), Math.max(a[2], x), Math.max(a[3], y)], [1e9, 1e9, -1e9, -1e9]);
    const cy = (bb[1] + bb[3]) / 2;
    const avail = Math.max(0, widthAt(opening, cy) - 26);
    const fontPt = 11.5;
    measureCtx.font = `${fontPt}pt Georgia, "Times New Roman", serif`;
    const measure = (str) => measureCtx.measureText(str).width * (72 / 96) * 1.05;
    const lines = []; let cur = "", widest = 0;
    for (const word of title.split(/\s+/)) {
      const trial = cur ? `${cur} ${word}` : word;
      if (measure(trial) > avail && cur) { lines.push(cur); cur = word; } else cur = trial;
    }
    if (cur) lines.push(cur);
    for (const l of lines) widest = Math.max(widest, measure(l));
    const tall = lines.length * fontPt * 1.32;
    const room = Math.max(0, bb[3] - bb[1] - 24);
    tt.style.fontSize = `${fontPt * scale}px`;
    tt.style.width = `${avail * scale}px`;
    tt.innerHTML = lines.map(l => `<div style="white-space:nowrap">${l}</div>`).join("");
    layer.style.alignItems = "flex-start";
    layer.style.paddingTop = `${(cy - tall / 2) * scale}px`;
    fitBad = widest > avail + 0.5 || tall > room;
    tt.className = fitBad ? "overflow" : "";
    fitNote = fitBad
      ? `Does not fit: ${lines.length} lines need ${widest.toFixed(0)}×${tall.toFixed(0)}pt, opening gives ${avail.toFixed(0)}×${room.toFixed(0)}pt.`
      : `Fits in ${lines.length} line${lines.length > 1 ? "s" : ""} — opening ${avail.toFixed(0)}×${room.toFixed(0)}pt.`;
  } else tt.innerHTML = "";
  const fitBox = document.getElementById("fitAdvice");
  fitBox.className = "advice " + (fitBad ? "bad" : "ok");
  fitBox.textContent = fitNote;

  const nPaths = out.layers.reduce((a, l) => a + l.paths.length, 0);
  const bits = [`${nPaths.toLocaleString()} paths`, `${ms.toFixed(1)} ms`];
  if (state.page.on) bits.push(`${Math.round(state.bands)} band(s) · margin ${state.margin}pt`);
  if (win) bits.push(`window rise ${win.rise.toFixed(1)}pt · opening ${win.opening.toFixed(1)}pt`);
  document.getElementById("stats").textContent = bits.join(" · ");

  document.getElementById("spec").value = JSON.stringify({
    page: state.page.on ? {
      margin: state.margin, marginFill: state.marginFill, bands: Math.round(state.bands),
      bulge: state.pageBulge,
      rings: state.page.rings.map((r, i) => ({ custom: !!r.custom, ...ringValues("page", i) })),
    } : null,
    window: state.win.on ? {
      arch: state.arch, span: state.span, height: state.height, archKw: archKw(),
      depth: Math.round(state.depth), bulge: state.winBulge,
      rings: state.win.rings.map((r, i) => ({ custom: !!r.custom, ...ringValues("win", i) })),
    } : null,
  }, null, 1);
  window.__svg = svg;
}

for (const [id, v] of [["vFit", "fit"], ["vActual", "actual"], ["vProof", "proof"]]) {
  document.getElementById(id).onclick = () => {
    view = v;
    for (const o of ["vFit", "vActual", "vProof"]) document.getElementById(o).classList.toggle("on", o === id);
    render();
  };
}
document.getElementById("copySpec").onclick = () => navigator.clipboard.writeText(document.getElementById("spec").value);
document.getElementById("dlSvg").onclick = () => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([window.__svg], { type: "image/svg+xml" }));
  a.download = "ornament.svg"; a.click();
};
addEventListener("resize", schedule);

syncVisibility();
for (const grp of ["page", "win", "init", "dev"]) { syncRings(grp); buildCards(grp); }
render();
