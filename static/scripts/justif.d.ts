/** Protrusion codes in thousandths of the glyph's own advance (pdfTeX).
 * `l`/`r` are LOGICAL line-start/line-end sides: the renderer maps them to
 * physical margins via inline-start/end, so in an RTL paragraph an `l`
 * code hangs at the right edge and an `r` code at the left. */
interface ProtrusionCodes {
    l?: number;
    r?: number;
}
type ProtrusionTable = Readonly<Record<string, ProtrusionCodes>>;
interface ExpansionOptions {
    /** Max glyph stretch as a fraction (0.02 → font-stretch up to 102%). */
    max: number;
    /** Max glyph shrink as a fraction (0.02 → down to 98%). */
    shrink: number;
    /** Quantization step as a fraction (0.005 → 0.5% increments). */
    step: number;
}
interface TrackingOptions {
    /** Max letterfit opening as a fraction of the line's set width. */
    max: number;
    /** Max letterfit closing as a fraction of the line's set width. */
    shrink: number;
}

interface JustifyOptions {
    /** Word splitter, e.g. `hyphenateEnUS` from "justif/hyphenate/en-us".
     * Never called for RTL paragraphs (Arabic joining makes fragment
     * measurement invalid; Hebrew convention breaks without hyphens). */
    hyphenate?: (word: string) => readonly string[];
    tolerance?: number;
    pretolerance?: number;
    hyphenPenalty?: number;
    exHyphenPenalty?: number;
    linePenalty?: number;
    adjDemerits?: number;
    doubleHyphenDemerits?: number;
    finalHyphenDemerits?: number;
    emergencyStretch?: number | "auto";
    /**
     * Keep paragraph endings and lines terminated by `<br>` at least this
     * fraction of the measure wide (0.33 ≈ Bringhurst's "at least a third").
     * Two mechanisms compose.
     * The breaker prefers arrangements whose endings reach the threshold
     * naturally — cost pressure that escalates into hyphenation when
     * needed, and prices endings by exactly what will render, so it steers
     * into arrangements the render floor can finish. An ending that still
     * falls short is then RENDERED with its word spaces widened to the
     * threshold — within a willingness that scales with the setting:
     * rectangles (`1`) work the spaces up to TeX's underfull-reporting
     * standard (≈ 2× natural at the default `spacing`), a gentle `0.33`
     * floor barely opens them. An ending that would need more keeps fully
     * natural spacing instead: all or nothing, never stretched AND still
     * short. The same principle holds for the whole paragraph: a threshold
     * ending is never bought with a worse-than-tolerance body line, and the
     * option never renders a shorter ending than it would produce switched
     * off (the breaker compares and keeps the better solution). The top of
     * the range can still be non-monotone per paragraph — one may satisfy
     * `0.5` yet revert to its natural ending at `1`. At `1` every paragraph
     * that can afford it sets as a perfect rectangle, including a one-line
     * paragraph. Values below `1` apply only to multi-line paragraphs: a
     * naturally one-line element stays in native layout because it has no
     * short ending to repair. Defaults to `0.33` (Bringhurst); pass `0` to
     * disable.
     */
    lastLineMinWidth?: number;
    /** true = built-in Latin table; an object merges over it; false disables. */
    protrusion?: boolean | ProtrusionTable;
    /**
     * Full hanging punctuation: quotes, stops, and opening brackets hang
     * entirely outside the measure. "first-line" (the DEFAULT, = `true`)
     * hangs left-edge marks fully only on the paragraph's FIRST line —
     * mid-paragraph line starts keep their partial microtype protrusion —
     * while stops and closing quotes hang fully at every line end;
     * "all-lines" extends the full left hangs to every line (classical
     * Gutenberg style); `false` disables full hangs, leaving microtype's
     * partial protrusion only. Requires `protrusion` enabled.
     */
    hangingPunctuation?: boolean | "first-line" | "all-lines";
    /** Glyph expansion limits via the wdth axis; false disables. */
    expansion?: ExpansionOptions | false;
    /**
     * Inter-word glue flexibility as fractions of the space width. `pull`
     * (0–1, default 0.7) is the downward pressure on secondary-font spaces
     * wider than the paragraph base font's: 0 keeps each font's natural
     * space, 1 converges them fully to the base (risks dissolving word
     * boundaries in loose-fitting fonts like monospace). `boundaryShrink`
     * (0–1, default 0) multiplies the shrink of spaces at font-FAMILY
     * boundaries: chips and pills (inline code, <kbd>) live there, their
     * insets occupy part of the adjacent gap, and native CSS justification
     * never shrinks a space — so by default those gaps stretch but hold
     * their natural width. 1 restores TeX semantics.
     */
    spacing?: {
        stretch: number;
        shrink: number;
        pull?: number;
        boundaryShrink?: number;
    };
    /**
     * Letterfit tracking: lets inter-character space open or close each
     * line's set width, participating in break decisions like expansion.
     * `true` (the DEFAULT) allows ±3% — Bringhurst's tolerance for
     * letterspacing variation in justified text (The Elements of Typographic
     * Style); `false` disables. Word space and glyph expansion remain the
     * primary flexes (tracking saturates at its budget), and the last line
     * always keeps its natural letterfit. Beyond TeX: microtype's
     * letterspacing is static styling, never a per-line justification
     * variable. Always off for RTL paragraphs (letterspacing cursive Arabic
     * is typographically wrong and renders inconsistently across engines).
     */
    tracking?: boolean | Partial<TrackingOptions>;
    /**
     * Last-line color matching (eTeX's \lastlinefit): the paragraph ending's
     * spaces are set at this fraction (0–1) of the paragraph's average
     * looseness, instead of always natural width — a connoisseur's
     * refinement mainstream DTP tools only approximate with a static
     * "desired spacing" value. Lines terminated by `<br>` contribute their
     * justified body lines to the average but do not receive last-line fitting
     * themselves. 0 (default) = off.
     */
    lastLineFit?: number;
    /**
     * Clean library-introduced characters out of copied text (default true).
     * Wrap determinism renders mid-line run-boundary spaces as NBSP and rare
     * dash junctions carry a U+2060 word joiner — plumbing that shouldn't
     * survive into the clipboard. Word joiners are always removed; NBSPs are
     * normalized back to spaces only when the selection's paragraphs
     * contained no author NBSPs (author intent like `Fig.&nbsp;7` wins over
     * cleanup). `false` restores raw copies.
     */
    cleanClipboard?: boolean;
    /**
     * Re-layout managed paragraphs when their content width changes
     * (default true). With `false`, width changes after enhancement are
     * not tracked — including ones caused by OTHER elements' late-loading
     * fonts resizing a shared shrink-to-fit container; call `refresh()`
     * after such changes.
     */
    observeResize?: boolean;
    /**
     * Called after a paragraph's rendered layout changes — initial
     * enhancement, resize re-layout, promotion from a native one-line state,
     * restoration when it fits on one line again, refresh, and re-measures
     * triggered by fonts finishing to load. Use it to keep overlays or
     * annotations positioned over the text in sync. NOT fired for the deferred
     * wrap-guarantee corrections: those reconcile sub-pixel painted-edge drift
     * with small spacing changes but do not alter chosen breaks or paragraph
     * structure.
     */
    onRelayout?: (paragraph: HTMLElement) => void;
    /**
     * Called once per paragraph that justif declines to manage, with a short
     * human-readable reason ("inline <kbd> has a horizontal margin",
     * "font-variation-settings on a run", "threw while rendering: …").
     * Declines are otherwise silent by design — the paragraph keeps its
     * native CSS rendering — which makes "skipped" indistinguishable from
     * "broken" while integrating; this is the diagnosis channel.
     */
    onSkip?: (paragraph: HTMLElement, reason: string) => void;
}
interface JustifyController {
    /**
     * Resolves once the content's font faces have settled (loaded or
     * failed) and the layout converged on them. The text is enhanced
     * earlier than this — justify() commits synchronously against
     * whatever fonts are rendering at call time, so a still-loading
     * webfont shows its fallback justified until the faces settle.
     */
    readonly ready: Promise<void>;
    /**
     * Re-measure with the currently loaded font files and re-layout (also runs
     * automatically when webfonts finish loading). For content or CSS changes,
     * destroy() and justify() again — the original scan is reused here.
     */
    refresh(): void;
    /** Restore the original DOM and disconnect observers. */
    destroy(): void;
    readonly paragraphs: readonly HTMLElement[];
}
declare function justify(targets: Element | Iterable<Element>, options?: JustifyOptions): JustifyController;
/** Restore paragraphs enhanced by any controller to their original DOM. */
declare function unjustify(targets: Element | Iterable<Element>): void;

/**
 * Drop-in auto-enhancement — the zero-config entry:
 *
 *   <script type="module" src="https://cdn.jsdelivr.net/npm/justif"></script>
 *
 * The page's own CSS decides what gets enhanced: every candidate element
 * whose computed `text-align` is `justify` (the fallback rendering justif
 * recommends anyway) is upgraded in place; nothing else is touched, so
 * adding the script never changes the alignment of anything.
 *
 * Hyphenation follows the page's declared languages: en-US is inlined
 * (English or unlabeled content costs no extra request), and content whose
 * nearest `lang` attribute matches one of the other bundled languages
 * loads that pattern module on demand — a sibling file on the same CDN,
 * one small request per distinct language. Languages we don't bundle (and
 * failed loads, e.g. when only this one file was copied to a static host)
 * justify with spacing only: wrong-language hyphenation is worse than
 * none. For full control use the API: `import { justify } from "justif"`.
 *
 * Optional overrides on the script tag:
 *   data-justif-selector="article p"   candidate elements (default below)
 *
 * Controllers are exposed at `window.justif.controllers` (with `justify`
 * and `unjustify`) as an escape hatch for debugging or teardown, and
 * `window.justif.booted` settles once every group's fonts settled and its
 * layout converged. FULL teardown must await `booted` first: language
 * groups whose patterns load on demand may not have pushed their final
 * controller yet (tearing down an interim-committed group by any route —
 * destroy(), unjustify(), a manual restore — cancels its pending
 * upgrade, but a group that committed no interim has nothing to tear
 * down until its pattern module lands).
 */

declare global {
    interface Window {
        justif?: {
            justify: typeof justify;
            unjustify: typeof unjustify;
            controllers: ReturnType<typeof justify>[];
            /** Settles once every group's fonts have settled and its layout
             * converged. The text is justified earlier — as soon as every
             * group has committed against the fonts rendering at that moment. */
            booted: Promise<void>;
        };
    }
}
