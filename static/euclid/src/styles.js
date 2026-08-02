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
  flex-wrap: wrap;
  padding: 5px 6px;
  background: var(--eu-chrome);
  border-bottom: 1px solid var(--eu-rule);
}
.bar .rule {
  width: 1px;
  align-self: stretch;
  margin: 2px 6px;
  background: var(--eu-rule);
}
.bar .spacer { flex: 1 1 auto; }

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

.hint {
  position: absolute;
  left: 10px;
  bottom: 10px;
  right: 10px;
  pointer-events: none;
  font-family: var(--eu-serif);
  font-size: 14px;
  font-style: italic;
  color: var(--eu-muted);
  text-shadow: 0 0 4px var(--eu-paper), 0 0 8px var(--eu-paper);
}
.hint.trouble { color: var(--eu-trouble); font-style: normal; }

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

/* A read-only figure keeps the scrubber — it is there to be read through, not drawn on. */
:host([readonly]) .bar { display: none; }
:host([readonly]) canvas { cursor: default; }

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
ol.steps .what { flex: 1 1 auto; }
/* Floated over the step rather than beside it, so the prose keeps the full
   column width when the buttons are not showing. */
ol.steps .acts {
  position: absolute;
  right: 6px;
  top: 3px;
  display: flex;
  gap: 2px;
  opacity: 0;
  pointer-events: none;
  background: var(--eu-chrome);
  box-shadow: -6px 0 6px -2px var(--eu-chrome);
}
ol.steps li:hover .acts, ol.steps li:focus-within .acts { opacity: 1; pointer-events: auto; }
ol.steps li[aria-current='true'] .acts { background: #f4e6d8; box-shadow: -6px 0 6px -2px #f4e6d8; }
ol.steps .acts button {
  font-family: var(--eu-sans);
  font-size: 10px;
  padding: 1px 5px;
  color: var(--eu-muted);
  border-color: var(--eu-rule);
}
.empty {
  padding: 14px 12px;
  color: var(--eu-muted);
  font-family: var(--eu-serif);
  font-style: italic;
}

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
.tool-card .acts { margin-top: 5px; display: flex; gap: 4px; flex-wrap: wrap; }
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

/* ------------------------------------------------------------ narrow */

@container (max-width: 660px) {
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
