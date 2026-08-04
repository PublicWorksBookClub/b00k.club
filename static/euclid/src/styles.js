/**
 * Styles for the shadow root.
 *
 * Kept in one string so the element has no stylesheet to fetch and nothing to
 * leak in or out of the host page. Colours are warm and paper-like to sit
 * comfortably inside a page of text.
 */

export const STYLES = `
:host {
  --eu-paper: #faf5ea;
  --eu-chrome: #f2ebdd;
  --eu-ink: #2f2929;
  --eu-muted: #7a6f64;
  --eu-rule: #ded2c0;
  --eu-accent: #b8622a;
  --eu-accent-soft: rgba(184, 98, 42, 0.12);
  --eu-trouble: #a33a2f;
  --eu-sans: "Fira Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --eu-serif: "Junicode", "New CM10", "Source Serif", Georgia, "Times New Roman", serif;

  display: block;
  color: var(--eu-ink);
  font-family: var(--eu-sans);
  font-size: 14px;
  line-height: 1.45;
  contain: layout paint;
}
:host([hidden]) { display: none; }
* { box-sizing: border-box; }

.frame {
  position: relative;
  /* Sized against the element's own width, not the window's: embedded in a
     column of prose the panel has to stack even on a wide screen. */
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 240px;
  border: 1px solid var(--eu-rule);
  background: var(--eu-paper);
  overflow: hidden;
}

/* ------------------------------------------------------------ toolbar */

.bar {
  display: flex;
  align-items: center;
  gap: 2px;
  /* One row, always: a bar that wraps shoves the figure down the page, and the
     toolbox only ever grows. The tools give way first, and if even that is not
     enough the whole bar scrolls. */
  flex-wrap: nowrap;
  overflow-x: auto;
  scrollbar-width: none;
  /* A scroll container's automatic minimum size is nothing, so without this the
     bar collapses to half its own buttons inside the column. */
  flex: 0 0 auto;
  padding: 5px 6px;
  background: var(--eu-chrome);
  border-bottom: 1px solid var(--eu-rule);
}
.bar::-webkit-scrollbar { display: none; }
.bar > .btn, .bar > .rule, .bar > .swatches, .bar > .relations { flex: 0 0 auto; }
.bar .rule {
  width: 1px;
  align-self: stretch;
  margin: 2px 6px;
  background: var(--eu-rule);
}
.bar .spacer { flex: 1 1 auto; }
/* What has been proved only accumulates, so the tools scroll rather than
   wrapping the bar onto a second row and shoving the figure down the page. */
.bar .tools {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 0 1 auto;
  /* Room for two or three, at least; below that the bar itself scrolls. */
  min-width: 5.5rem;
  overflow-x: auto;
  scrollbar-width: thin;
}
.bar .tools::-webkit-scrollbar { height: 3px; }
.bar .tools::-webkit-scrollbar-thumb { background: var(--eu-rule); border-radius: 2px; }
/* A hint that there is more to the right, when there is. */
.bar .tools { scroll-padding: 0 4px; }
.bar .tools .btn { flex: 0 0 auto; }
/* Nothing proved yet: no scroller, and no gap where one would be. */
.bar .tools:empty { display: none; }

button {
  font: inherit;
  color: inherit;
  background: none;
  border: 1px solid transparent;
  border-radius: 3px;
  cursor: pointer;
}
button:disabled { opacity: 0.35; cursor: default; }
button:not(:disabled):hover { background: rgba(0, 0, 0, 0.05); }
button:focus-visible { outline: 2px solid var(--eu-accent); outline-offset: 1px; }

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-width: 32px;
  height: 30px;
  padding: 0 7px;
}
.btn svg { width: 17px; height: 17px; display: block; }
.btn[aria-pressed='true'] {
  background: var(--eu-accent-soft);
  border-color: var(--eu-accent);
  color: var(--eu-accent);
}
.btn.wide { padding: 0 9px; }
.btn .abbr {
  font-family: var(--eu-serif);
  font-size: 14px;
  line-height: 1;
}
.btn .ref {
  font-size: 10px;
  letter-spacing: 0.02em;
  color: var(--eu-muted);
}
.btn[aria-pressed='true'] .ref { color: inherit; }
.btn.add { font-size: 17px; line-height: 1; padding-bottom: 2px; }

/* ------------------------------------------------------------ stage */

.body { display: flex; flex: 1 1 auto; min-height: 0; }
.stage { position: relative; flex: 1 1 auto; min-width: 0; }
canvas {
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
  cursor: crosshair;
}
.stage[data-mode='select'] canvas { cursor: default; }
/* The tool you are holding, with the crosshair sitting on the hotspot. */
.stage[data-mode='segment'] canvas,
.stage[data-mode='ray'] canvas,
.stage[data-mode='line'] canvas { cursor: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><g fill='none' stroke='%23faf5ea' stroke-width='3.4' stroke-linecap='round' stroke-linejoin='round'><path d='M2 8h12M8 2v12'/><g transform='rotate(-40 21 21)'><rect x='11' y='17.5' width='20' height='7' rx='1'/><path d='M15 17.5v3M19 17.5v4M23 17.5v3M27 17.5v4'/></g></g><g fill='none' stroke='%232f2929' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='M2 8h12M8 2v12'/><g transform='rotate(-40 21 21)'><rect x='11' y='17.5' width='20' height='7' rx='1'/><path d='M15 17.5v3M19 17.5v4M23 17.5v3M27 17.5v4'/></g></g></svg>") 8 8, crosshair; }
.stage[data-mode='circle'] canvas { cursor: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><g fill='none' stroke='%23faf5ea' stroke-width='3.4' stroke-linecap='round' stroke-linejoin='round'><path d='M2 8h12M8 2v12'/><path d='M21 14l-5 13M21 14l5 13'/><circle cx='21' cy='14' r='1.8'/></g><g fill='none' stroke='%232f2929' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='M2 8h12M8 2v12'/><path d='M21 14l-5 13M21 14l5 13'/><circle cx='21' cy='14' r='1.8'/></g></svg>") 8 8, crosshair; }

.hint {
  position: absolute;
  left: 10px;
  bottom: 10px;
  right: 42px;
  pointer-events: none;
  font-family: var(--eu-serif);
  font-size: 14px;
  font-style: italic;
  color: var(--eu-muted);
  text-shadow: 0 0 4px var(--eu-paper), 0 0 8px var(--eu-paper);
}
.hint.trouble { color: var(--eu-trouble); font-style: normal; }

/* Always to hand, never in the way: the corner of the paper furthest from
   everything else the reader is doing. */
.ask {
  position: absolute;
  right: 10px;
  bottom: 10px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid var(--eu-rule);
  background: var(--eu-chrome);
  color: var(--eu-muted);
  font-family: var(--eu-serif);
  font-style: italic;
  font-size: 14px;
  line-height: 1;
  opacity: 0.6;
  transition: opacity 0.12s ease;
}
.ask:hover { opacity: 1; color: var(--eu-accent); border-color: var(--eu-accent); background: var(--eu-paper); }
:host([readonly]) .ask { display: none; }

/* ------------------------------------------------------------ panel */

.panel {
  width: 264px;
  flex: 0 0 264px;
  border-left: 1px solid var(--eu-rule);
  background: var(--eu-chrome);
  display: flex;
  flex-direction: column;
  min-height: 0;
}
:host([panel='none']) .panel { display: none; }
.panel[hidden] { display: none; }

/* A read-only figure keeps the scrubber — it is there to be read through, not drawn on. */
:host([readonly]) .bar { display: none; }
:host([readonly]) canvas { cursor: default; }

/* ------------------------------------------------------------ sidebar */

.sidebar {
  width: 290px;
  flex: 0 0 290px;
  border-right: 1px solid var(--eu-rule);
  background: var(--eu-chrome);
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
.sidebar[hidden] { display: none; }

.side-head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  border-bottom: 1px solid var(--eu-rule);
}
.side-head select.books { flex: 1 1 auto; }
.side-collapse {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  color: var(--eu-muted);
  border-color: transparent;
}
.side-collapse svg { width: 16px; height: 16px; }
.side-collapse:hover { color: var(--eu-ink); }
.side-head select.books {
  width: 100%;
  font: inherit;
  font-family: var(--eu-serif);
  font-size: 14px;
  padding: 3px 6px;
  color: inherit;
  background: var(--eu-paper);
  border: 1px solid var(--eu-rule);
  border-radius: 3px;
}

.side-list { overflow: auto; flex: 1 1 auto; }
.side-section { border-bottom: 1px solid var(--eu-rule); }
.side-section > summary {
  /* Stays put while a long section scrolls, so the next one is always a click
     away rather than a scroll away. */
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--eu-chrome);
  border-bottom: 1px solid transparent;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  cursor: pointer;
  list-style: none;
  font-size: 11px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--eu-muted);
  user-select: none;
}
.side-section > summary::-webkit-details-marker { display: none; }
.side-section > summary::before {
  content: '›';
  display: inline-block;
  font-size: 13px;
  transition: transform 0.12s ease;
}
.side-section[open] > summary::before { transform: rotate(90deg); }
/* Opaque: a translucent hover would let the scrolling text show through the
   heading that is sticking to the top. */
.side-section > summary:hover { background: #e8dfcd; }
.side-section[open] > summary { color: var(--eu-ink); border-bottom-color: var(--eu-rule); }
.side-section > summary .name { flex: 1 1 auto; }
.side-section > summary .count { font-variant-numeric: tabular-nums; opacity: 0.7; }

.side-section .gloss {
  margin: 0;
  padding: 0 10px 8px 24px;
  font-family: var(--eu-serif);
  font-size: 12.5px;
  font-style: italic;
  line-height: 1.4;
  color: var(--eu-muted);
}
.side-section .entry {
  display: flex;
  gap: 9px;
  width: 100%;
  text-align: left;
  padding: 5px 10px 5px 24px;
  border-radius: 0;
  font: inherit;
}
.side-section .entry.plain { cursor: default; }
.side-section button.entry:not(:disabled):hover { background: var(--eu-accent-soft); }
.side-section .entry.unavailable { opacity: 0.4; }
/* Not written out in the sketchpad, but still yours to work: dimmed enough to
   tell the two apart, not so much that it reads as out of reach. */
.side-section .entry.unworked .said { color: var(--eu-muted); }
.side-section .entry.unworked .num { opacity: 0.75; }
.side-section .entry .num {
  flex: 0 0 4.3em;
  font-family: var(--eu-serif);
  font-size: 12.5px;
  color: var(--eu-accent);
  line-height: 1.35;
}
.side-section .entry .num.glyph { font-size: 15px; text-align: left; color: var(--eu-ink); }
.side-section .entry .num em {
  display: block;
  font-size: 9px;
  font-style: normal;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--eu-muted);
}
.side-section .entry .said {
  flex: 1 1 auto;
  font-family: var(--eu-serif);
  font-size: 12.5px;
  line-height: 1.4;
}
/* Byrne sets his figures in the margin and lets the definition run round them. */
.side-section .entry .said .cut {
  float: left;
  shape-outside: margin-box;
  margin: 2px 9px 2px 0;
  line-height: 0;
}
.side-section .entry .said .cut canvas { display: block; }
/* A line's colour is how Byrne refers to it; the letters borrow it. */
.side-section .entry .said .named { font-weight: 600; }

.side-foot {
  margin: 0;
  padding: 6px 10px;
  border-top: 1px solid var(--eu-rule);
  font-size: 10px;
  line-height: 1.45;
  color: var(--eu-muted);
}
.side-foot a { color: var(--eu-accent); }

/* ------------------------------------------------------------ colour */

.swatches { display: inline-flex; gap: 3px; align-items: center; }
.swatch {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.25);
  padding: 0;
}
.swatch[aria-pressed='true'] { box-shadow: 0 0 0 2px var(--eu-paper), 0 0 0 3.5px var(--eu-accent); }

.tabs { display: flex; border-bottom: 1px solid var(--eu-rule); }
.tabs button {
  flex: 1;
  padding: 7px 4px;
  font-size: 12px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--eu-muted);
  border-radius: 0;
}
.tabs button[aria-selected='true'] {
  color: var(--eu-ink);
  box-shadow: inset 0 -2px 0 var(--eu-accent);
}
.tabpanel { overflow: auto; flex: 1 1 auto; padding: 4px 0 10px; }

ol.steps { list-style: none; margin: 0; padding: 0; counter-reset: step; }
ol.steps li {
  position: relative;
  display: flex;
  gap: 7px;
  padding: 4px 9px 4px 8px;
  font-family: var(--eu-serif);
  font-size: 13.5px;
  line-height: 1.4;
  border-left: 2px solid transparent;
  cursor: pointer;
}
ol.steps li:hover { background: rgba(0, 0, 0, 0.035); }
ol.steps li[aria-current='true'] { border-left-color: var(--eu-accent); background: var(--eu-accent-soft); }
ol.steps li.beyond { opacity: 0.38; }
ol.steps li.trouble { color: var(--eu-trouble); }
ol.steps .n {
  flex: 0 0 auto;
  min-width: 1.4em;
  text-align: right;
  color: var(--eu-muted);
  font-family: var(--eu-sans);
  font-size: 11px;
  padding-top: 2px;
}
ol.steps .what { flex: 1 1 auto; min-width: 0; }
/* Under the step, not over it: the buttons used to cover the words they belong
   to, and a step you cannot read is worse than one you have to reach under.
   The × is the exception — every step has one, so it keeps a fixed place in
   the corner instead of shuffling along behind whatever else is offered. */
ol.steps .acts {
  display: none;
  gap: 4px;
  margin-top: 4px;
}
ol.steps li:hover .acts, ol.steps li:focus-within .acts { display: flex; }
ol.steps .kill {
  position: absolute;
  top: 3px;
  right: 6px;
  font-family: var(--eu-sans);
  font-size: 10px;
  padding: 1px 5px;
  color: var(--eu-muted);
  border-color: var(--eu-rule);
  background: var(--eu-chrome);
  opacity: 0;
  pointer-events: none;
}
ol.steps li:hover .kill, ol.steps li:focus-within .kill { opacity: 1; pointer-events: auto; }
ol.steps li[aria-current='true'] .kill { background: #f4e6d8; }
/* The corner is kept clear whether or not the × is showing, so that hovering a
   step does not reflow the words underneath the pointer. */
ol.steps .what { padding-right: 22px; }
/* A name in the prose wears the mark of the thing it names: a bar over a
   straight line, an arrow if it runs on, a ring for a circle — in the colour
   the thing is drawn in, so the words and the paper agree. */
.drawn { white-space: nowrap; }
.drawn.segment .letters, .drawn.ray .letters, .drawn.line .letters {
  text-decoration: overline;
  text-decoration-thickness: 1.5px;
}
.drawn .mark { font-style: normal; }
.drawn.circle .mark { margin-right: 0.5px; }
/* The arrow belongs to the letters, not beside them. */
.drawn.ray .mark, .drawn.line .mark { font-size: 0.8em; margin: 0 0 0 -1px; vertical-align: 0.06em; }

/* A claim asserts rather than builds, so it is set apart from the steps that
   draw: indented under them, with a rule down its left. */
ol.steps li.asserted { background: rgba(0, 0, 0, 0.018); }
ol.steps li.asserted .what { font-style: italic; }
ol.steps li.asserted .n { color: transparent; }
ol.steps li.asserted .n::before { content: '∴'; color: var(--eu-muted); font-style: normal; }
ol.steps li.asserted.shaken { box-shadow: inset 2px 0 0 var(--eu-accent); }
/* The thing the proposition set out to show, which the rest leads up to. The
   Q. E. D. itself belongs at the foot of the page, as Byrne sets it. */
ol.steps li.qed { background: var(--eu-accent-soft); }
ol.steps li.asserted.broken { box-shadow: inset 2px 0 0 var(--eu-trouble); }
/* Choosing what allows a claim, from the book. */
.why { display: flex; gap: 4px; margin-top: 5px; flex-wrap: wrap; }
.why select {
  font-family: var(--eu-sans);
  font-size: 10.5px;
  max-width: 168px;
  border: 1px solid var(--eu-rule);
  border-radius: 4px;
  background: var(--eu-paper);
  color: var(--eu-ink);
  padding: 1px 3px;
}
.why button { font-family: var(--eu-sans); font-size: 10px; padding: 1px 5px; border-color: var(--eu-rule); }
/* Saying how two magnitudes stand to one another. */
.relations { display: flex; gap: 4px; align-items: center; }
.relations .readings { display: flex; gap: 2px; align-items: center; }
.relations .readings .relation { font-size: 11.5px; padding: 0 5px; min-width: 0; }
.relations .readings .relation[aria-pressed='true'] { background: var(--eu-accent-soft); border-color: var(--eu-accent); }
.relations .relation {
  font-family: var(--eu-serif);
  font-size: 14px;
  min-width: 22px;
  height: 26px;
  border: 1px solid var(--eu-rule);
  border-radius: 5px;
  background: var(--eu-paper);
  color: var(--eu-ink);
}
.relations .relation:not(:disabled):hover { background: var(--eu-accent-soft); }
.relations .relation:disabled { opacity: 0.35; }
.relations .relation.drop { font-size: 12px; color: var(--eu-muted); }
ol.steps .acts button {
  font-family: var(--eu-sans);
  font-size: 10px;
  padding: 1px 5px;
  color: var(--eu-muted);
  border-color: var(--eu-rule);
}
/* Byrne's page opens with the heading and the enunciation, and everything
   under it is in service of that one sentence. */
.enunciated {
  padding: 9px 12px 10px;
  border-bottom: 1px solid var(--eu-rule);
  background: rgba(0, 0, 0, 0.016);
}
.enunciated .num {
  display: block;
  font-size: 10.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--eu-muted);
  margin-bottom: 3px;
}
.enunciated .num em { font-style: italic; text-transform: none; letter-spacing: 0; margin-left: 4px; }
.enunciated p { margin: 0; font-family: var(--eu-serif); font-size: 12.5px; line-height: 1.45; }
.enunciated .named { font-weight: 600; }

/* \hfill\qedstr — the foot of the page, once what was to be shown is shown. */
.finis {
  margin: 0;
  padding: 9px 12px 12px;
  border-top: 1px solid var(--eu-rule);
  font-family: var(--eu-serif);
  text-align: right;
}
.finis .qedstr {
  display: block;
  white-space: nowrap;
  font-size: 13px;
  letter-spacing: 0.08em;
  color: var(--eu-accent);
}
.finis .held { display: block; margin-top: 2px; font-size: 11px; font-style: italic; color: var(--eu-muted); }
.finis.waiting {
  text-align: left;
  font-size: 11.5px;
  font-style: italic;
  color: var(--eu-muted);
}

.given-figure { border-bottom: 1px solid var(--eu-rule); }
.given-figure > summary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  cursor: pointer;
  list-style: none;
  font-size: 10.5px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--eu-muted);
  user-select: none;
}
.given-figure > summary::-webkit-details-marker { display: none; }
.given-figure > summary::before { content: '›'; font-size: 13px; transition: transform 0.12s ease; }
.given-figure[open] > summary::before { transform: rotate(90deg); }
.given-figure > summary:hover { background: #e8dfcd; }
.given-figure > summary .name { flex: 1 1 auto; }
.given-figure > summary .count { font-variant-numeric: tabular-nums; opacity: 0.7; }
.given-figure ol.steps li .n { color: var(--eu-muted); opacity: 0.6; }

.empty {
  padding: 14px 12px;
  color: var(--eu-muted);
  font-family: var(--eu-serif);
  font-style: italic;
}

/* What the run of cards beneath it is a list of. */
.section-note {
  margin: 0;
  padding: 9px 12px 6px;
  font-family: var(--eu-serif);
  font-style: italic;
  font-size: 11.5px;
  color: var(--eu-muted);
}
.section-note + .proved, .section-note + .tool-card { border-top: 1px solid var(--eu-rule); }

.tool-card {
  padding: 8px 10px;
  border-bottom: 1px solid var(--eu-rule);
}
.tool-card h4 {
  margin: 0 0 2px;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.tool-card h4 .ref { color: var(--eu-accent); font-size: 11px; }
.tool-card p {
  margin: 0;
  font-family: var(--eu-serif);
  font-size: 12.5px;
  color: var(--eu-muted);
}
.tool-card .acts { margin-top: 5px; display: flex; gap: 4px; flex-wrap: wrap; align-items: center; }
.tool-card.fact { border-left: 2px solid var(--eu-accent); }
.tool-card .evidence { color: var(--eu-muted); font-size: 11px; }
.tool-card .trouble { color: var(--eu-trouble); }
.tool-card .acts input {
  font: inherit;
  font-size: 11px;
  width: 4.5em;
  padding: 2px 5px;
  border: 1px solid var(--eu-rule);
  border-radius: 4px;
  background: var(--eu-paper);
  color: var(--eu-ink);
}
.tool-card .acts button { font-size: 11px; padding: 2px 7px; border-color: var(--eu-rule); }

/* ------------------------------------------------------------ scrubber */

.scrub {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 9px;
  border-top: 1px solid var(--eu-rule);
  background: var(--eu-chrome);
  font-size: 12px;
  color: var(--eu-muted);
}
.scrub input[type='range'] { flex: 1 1 auto; accent-color: var(--eu-accent); min-width: 60px; }
.scrub .count { font-variant-numeric: tabular-nums; white-space: nowrap; }
/* Nothing to scrub through yet — still there, so the paper does not move when
   the first thing is drawn. */
.scrub.idle { opacity: 0.4; }

/* ------------------------------------------------------------ help */

.help { display: flex; flex-direction: column; min-height: 0; height: 100%; }
.help-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--eu-rule);
}
.help-head h3 { margin: 0; font-size: 12px; letter-spacing: 0.05em; text-transform: uppercase; color: var(--eu-muted); font-weight: 500; }
.help-head button { font-size: 11px; padding: 2px 7px; border-color: var(--eu-rule); color: var(--eu-muted); }
.help-sheet { overflow: auto; padding: 4px 12px 14px; }
.help-sheet section { padding: 10px 0; border-bottom: 1px solid var(--eu-rule); }
.help-sheet section:last-of-type { border-bottom: 0; }
.help-sheet h4 { margin: 0 0 5px; font-family: var(--eu-serif); font-size: 14px; font-weight: 600; }
.help-sheet p { margin: 0 0 6px; font-family: var(--eu-serif); font-size: 12.5px; line-height: 1.45; }
.help-sheet dl { margin: 4px 0 0; display: grid; grid-template-columns: auto 1fr; gap: 3px 10px; align-items: baseline; }
.help-sheet dt { font-size: 10.5px; color: var(--eu-accent); white-space: nowrap; }
.help-sheet dd { margin: 0; font-family: var(--eu-serif); font-size: 12px; line-height: 1.35; color: var(--eu-muted); }
.help-foot { color: var(--eu-muted); font-style: italic; padding-top: 10px; }

/* The walkthrough, over the paper: the reader's eyes are on the figure. */
.walkthrough {
  position: absolute;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%);
  width: min(430px, calc(100% - 36px));
  padding: 11px 14px 10px;
  background: var(--eu-chrome);
  border: 1px solid var(--eu-rule);
  border-radius: 7px;
  box-shadow: 0 6px 18px rgba(47, 41, 41, 0.14);
  pointer-events: auto;
}
.walkthrough .count { margin: 0 0 4px; font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--eu-accent); }
.walkthrough .say { margin: 0; font-family: var(--eu-serif); font-size: 13.5px; line-height: 1.45; }
.walkthrough .acts { display: flex; gap: 6px; justify-content: flex-end; margin-top: 8px; }
.walkthrough .acts button { font-size: 11px; padding: 2px 8px; border-color: var(--eu-rule); color: var(--eu-muted); }
.menu-rule { display: block; height: 1px; margin: 4px 0; background: var(--eu-rule); }

/* ------------------------------------------------------------ dialogs */

.veil {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(47, 41, 41, 0.28);
  z-index: 5;
}
.card {
  background: var(--eu-paper);
  border: 1px solid var(--eu-rule);
  box-shadow: 0 12px 40px rgba(47, 41, 41, 0.24);
  max-width: 440px;
  width: 100%;
  max-height: 100%;
  overflow: auto;
  padding: 14px 16px 12px;
}
.card h3 {
  margin: 0 0 4px;
  font-family: var(--eu-serif);
  font-size: 18px;
  font-weight: 600;
}
.card p.lede {
  margin: 0 0 10px;
  font-family: var(--eu-serif);
  color: var(--eu-muted);
}
.card label,
.tool-card label { display: block; margin: 8px 0 2px; font-size: 12px; color: var(--eu-muted); }
.card input[type='text'],
.card textarea,
.tool-card input[type='text'] {
  width: 100%;
  font: inherit;
  padding: 5px 7px;
  border: 1px solid var(--eu-rule);
  border-radius: 3px;
  background: #fff;
  color: inherit;
}
.card .row { display: flex; gap: 8px; }
.card .row > * { flex: 1; }
.card .acts { display: flex; justify-content: flex-end; gap: 6px; margin-top: 14px; }
.tool-card .acts button.primary { padding: 3px 10px; }
.card .acts button { border-color: var(--eu-rule); padding: 4px 12px; height: 30px; }
.card .acts button.primary,
.tool-card .acts button.primary {
  background: var(--eu-accent);
  border-color: var(--eu-accent);
  color: var(--eu-paper);
}
.card .acts button.primary:not(:disabled):hover,
.tool-card .acts button.primary:not(:disabled):hover { background: #a2551f; }
.card .acts .spacer { flex: 1; }
.chips { display: flex; flex-wrap: wrap; gap: 4px; margin: 6px 0 2px; min-height: 26px; }
.chip {
  font-family: var(--eu-serif);
  font-size: 13px;
  padding: 2px 8px;
  border: 1px solid var(--eu-accent);
  border-radius: 999px;
  color: var(--eu-accent);
  background: var(--eu-accent-soft);
}
.chips .none { color: var(--eu-muted); font-style: italic; font-family: var(--eu-serif); }
.problem {
  margin: 8px 0 0;
  padding: 7px 9px;
  border-left: 2px solid var(--eu-trouble);
  background: rgba(163, 58, 47, 0.07);
  color: var(--eu-trouble);
  font-size: 13px;
}
.problem button {
  display: block;
  margin-top: 5px;
  border-color: currentColor;
  font-size: 12px;
  padding: 2px 8px;
}
.menu {
  position: absolute;
  right: 8px;
  top: 42px;
  z-index: 6;
  background: var(--eu-paper);
  border: 1px solid var(--eu-rule);
  box-shadow: 0 8px 24px rgba(47, 41, 41, 0.18);
  padding: 4px;
  min-width: 170px;
}
.menu button { display: block; width: 100%; text-align: left; padding: 5px 9px; font-size: 13px; }
.nav-menu { right: auto; top: auto; min-width: 230px; }
.menu-head {
  margin: 2px 0 4px;
  padding: 2px 9px;
  font-size: 10px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--eu-muted);
}
.nav-row { display: flex !important; align-items: baseline; gap: 10px; }
.nav-row .what { flex: 1 1 auto; }
.nav-row kbd {
  font-family: var(--eu-sans);
  font-size: 10px;
  color: var(--eu-muted);
  border: 1px solid var(--eu-rule);
  border-radius: 3px;
  padding: 1px 4px;
  white-space: nowrap;
}
.swatch.dash {
  background: none !important;
  border-color: var(--eu-rule);
  position: relative;
}
.swatch.dash::after {
  content: '';
  position: absolute;
  inset: 8px 3px;
  border-top: 2px dashed var(--eu-ink);
}

/* ------------------------------------------------------------ narrow */

@container (max-width: 660px) {
  /* Too narrow to give the book a column of its own, so it slides over the
     figure instead of squeezing it. */
  .sidebar {
    position: absolute;
    inset: 0 auto 0 0;
    z-index: 4;
    width: 86%;
    max-width: 300px;
    box-shadow: 6px 0 24px rgba(47, 41, 41, 0.18);
  }
  .body { flex-direction: column; }
  .panel {
    width: auto;
    flex: 0 0 42%;
    border-left: none;
    border-top: 1px solid var(--eu-rule);
  }
}
@container (max-width: 420px) {
  .btn { min-width: 28px; padding: 0 5px; }
  .panel { flex-basis: 46%; }
}
`
