"""Build the playable studio demo for Commentary #10.

    python3 tools/t4zh1b-demo.py [--lib /path/to/t4zh1b]

Writes static/demos/t4zh1b.html and its modules in static/demos/t4zh1b/.

**Why not the library's single-file build.** This site sends

    script-src 'self' 'wasm-unsafe-eval' static.cloudflareinsights.com …

with no `'unsafe-inline'`, so an inline `<script>` is refused by the browser
before it runs. The studio's `ornament-studio.html` is one enormous inline
module and would come up as a blank page here. `script-src 'self'` *does* allow
same-origin files, so the demo goes the other way from self-contained: the
modules are shipped beside the page and loaded by src, which needs no change to
the site's policy.

Two other things change, and nothing else:

* the header, which in the library's build talks about rebuilding the bundle;
* the font, which the studio otherwise expects you to hand over from disk. A
  visitor has no font to hand, so the demo offers the ones this site already
  serves and loads one on arrival; the file input stays for anyone who wants to
  bring their own.

Everything the page pulls in is same-origin, which is checked at the end here
rather than assumed.
"""

from __future__ import annotations

import argparse
import re
import shutil
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SITE = HERE.parent
PAGE = SITE / "static" / "demos" / "t4zh1b.html"
ASSETS = SITE / "static" / "demos" / "t4zh1b"
DEFAULT_LIB = SITE.parent / "t4zh1b"

#: The studio's own modules, copied beside the page. `studio.mjs` is the
#: program that `index.html` carries inline; it is lifted out into a file of its
#: own because inline is what the policy refuses.
MODULES = ["core.mjs", "devices.mjs", "letters.mjs", "pigments.mjs", "provenance.mjs"]

#: Fonts this site already serves that the reader can actually read: TrueType
#: `glyf` outlines, not OpenType/CFF. Site-absolute, so they resolve on the same
#: origin wherever the page is served from -- which `connect-src 'self'` needs.
FONTS = [
    ("/font/Playfair_Display/static/PlayfairDisplay-Black.ttf", "Playfair Display Black"),
    ("/font/Playfair_Display/static/PlayfairDisplay-Regular.ttf", "Playfair Display"),
    ("/font/Playfair_Display/static/PlayfairDisplay-BlackItalic.ttf", "Playfair Display Black Italic"),
    ("/font/Junicode/VAR/JunicodeVF-Roman.ttf", "Junicode"),
]

HEADER = (
    '<p class="sub">Every mark below is <b>constructed</b> — a tiling, two rays off '
    'every edge at one angle, and wherever they meet. Nothing is traced and nothing '
    'is a bitmap. The sliders carry their provenance: ticks mark values measured off '
    'real objects, and the note says when you have left them. Touch a ring and it '
    'becomes yours; <b>Randomise</b> redraws everything you have not touched. '
    '<a href="/commentary/t4zh1b/">Read the commentary</a> · '
    '<a href="https://github.com/PublicWorksBookClub/t4zh1b">source</a></p>'
)

FONT_ROW = (
    '<div class="row"><div class="lbl"><b>Font</b></div>'
    '<select id="fontPreset">'
    + "".join(f'<option value="{src}">{label}</option>' for src, label in FONTS)
    + '<option value="">Choose a file…</option></select>'
    '<div id="fontFileRow" class="hide" style="margin-top:6px">'
    '<input type="file" id="fontFile" accept=".ttf,.ttc" class="filepick">'
    '</div>'
    '<div class="advice" id="fontAdvice">TrueType only — the reader takes '
    '<code>glyf</code> outlines, not OpenType/CFF. These are the faces this site '
    'already serves; bring your own with <i>Choose a file…</i>.</div>'
    '</div>'
)

#: Loaded by src, not inline, for the same reason as everything else. It does
#: not reach into the studio's state -- that is module-scoped and rightly not
#: reachable -- it feeds the file input the studio already listens on, so this
#: patch cannot rot when the studio changes.
LOADER = """/**
 * Hand the studio a font it can read, from this site's own font directory.
 *
 * The studio expects a file from disk, which is right for a tool run locally
 * and useless to a visitor who has no font to hand. Same-origin, because
 * `connect-src 'self'` allows that and nothing else.
 */
(function () {
  const preset = document.getElementById("fontPreset");
  const fileRow = document.getElementById("fontFileRow");
  const fileInput = document.getElementById("fontFile");
  const advice = document.getElementById("fontAdvice");

  async function load(src) {
    const name = src.split("/").pop();
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const buf = await res.arrayBuffer();
      const dt = new DataTransfer();
      dt.items.add(new File([buf], name, { type: "font/ttf" }));
      fileInput.files = dt.files;
      fileInput.onchange({ target: fileInput });
    } catch (e) {
      advice.className = "advice bad";
      advice.textContent = `Could not load ${name}: ${e.message}`;
    }
  }

  preset.onchange = () => {
    const own = preset.value === "";
    fileRow.classList.toggle("hide", !own);
    if (!own) load(preset.value);
  };

  // On arrival, so picking Letterset draws a letter rather than asking for a
  // file the visitor does not have. The studio's own module is deferred by
  // being a module, so its file input exists by the time this runs.
  load(preset.value);
})();
"""

#: `style-src-attr 'self'` refuses a `style` attribute in the markup, so the few
#: the studio writes by hand become classes. Anything the studio sets through
#: `element.style` at run time is CSSOM rather than an attribute and is not
#: touched by the policy.
EXTRA_CSS = """
  .hide { display: none !important; }
  .filepick { font: inherit; font-size: 11px; }
  .stack { margin-top: 8px; display: flex; gap: 7px; }
  .tick span { white-space: nowrap; }
"""

ATTR_CLASSES = [
    ('<div style="margin-top:8px;display:flex;gap:7px;">', '<div class="stack">'),
    ('style="font:inherit;font-size:11px"', 'class="filepick"'),
    ('<span style="white-space:nowrap">', "<span>"),
]


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--lib", default=str(DEFAULT_LIB), help="path to the t4zh1b checkout")
    a = ap.parse_args()
    lib = Path(a.lib).resolve()
    studio = lib / "studio"
    src = studio / "index.html"
    if not src.exists():
        print(f"no studio at {src}", file=sys.stderr)
        return 1

    ASSETS.mkdir(parents=True, exist_ok=True)
    html = src.read_text()

    # 1. Lift the inline module out into a file of its own.
    m = re.search(r'<script type="module">(.*?)</script>', html, re.S)
    if not m:
        print("could not find the studio's module", file=sys.stderr)
        return 1
    (ASSETS / "studio.mjs").write_text(m.group(1).strip() + "\n")
    html = (html[:m.start()]
            + '<script type="module" src="t4zh1b/studio.mjs"></script>\n'
            + '<script src="t4zh1b/demo.js" defer></script>'
            + html[m.end():])

    for name in MODULES:
        shutil.copyfile(studio / name, ASSETS / name)
    (ASSETS / "demo.js").write_text(LOADER)

    # 2. The header, and the font row.
    html, n = re.subn(r'<p class="sub">The sliders carry their provenance.*?</p>',
                      HEADER, html, count=1, flags=re.S)
    if n != 1:
        print("could not find the studio's header paragraph", file=sys.stderr)
        return 1
    html, n = re.subn(
        r'<div class="row"><div class="lbl"><b>Font</b></div>.*?</div>\s*</div>',
        lambda _: FONT_ROW, html, count=1, flags=re.S)
    if n != 1:
        print("could not find the studio's font row", file=sys.stderr)
        return 1

    # 3. Style attributes the policy would drop, and the classes replacing them.
    for old, new in ATTR_CLASSES:
        html = html.replace(old, new)
    html = html.replace("</style>", EXTRA_CSS + "</style>", 1)

    html = html.replace("<title>t4zh1b — studio</title>",
                        "<title>t4zh1b — studio | PWBC</title>", 1)

    problems = external_refs(html) + inline_scripts(html)
    for path in [ASSETS / "studio.mjs", ASSETS / "demo.js"]:
        problems += [f"{path.name}: {p}" for p in external_refs(path.read_text())]
    if problems:
        for p in problems:
            print(f"  !! {p}", file=sys.stderr)
        return 1

    PAGE.write_text(html)
    total = len(html.encode()) + sum(
        (ASSETS / f).stat().st_size for f in [*MODULES, "studio.mjs", "demo.js"])
    print(f"  wrote {PAGE.relative_to(SITE)} + {len(MODULES) + 2} modules "
          f"({total / 1024:.0f} KB, all same-origin)")

    missing = [s for s, _ in FONTS if not (SITE / "static" / s.lstrip("/")).exists()]
    for f in missing:
        print(f"  !! font not served by this site: {f}", file=sys.stderr)
    left = re.findall(r'\sstyle="[^"]*"', html)
    for s in sorted(set(left)):
        print(f"  -- style attribute left in the markup, will be dropped:{s}")
    return 1 if missing else 0


def inline_scripts(html: str) -> list[str]:
    """Script elements with a body, which `script-src 'self'` refuses."""
    return [f"inline <script> ({len(m.group(1))} chars) — blocked by the site's CSP"
            for m in re.finditer(r"<script(?![^>]*\ssrc=)[^>]*>(.+?)</script>", html, re.S)
            if m.group(1).strip()]


def external_refs(text: str) -> list[str]:
    """Anything the page would *pull in* from another origin.

    A plain ``<a href>`` is not that: it is somewhere the reader may choose to
    go. What matters is what the browser fetches on its own — a script, a
    stylesheet, an image, a font, an ``@import``, a ``url()``, a ``fetch``. The
    XML namespace on an ``<svg>`` looks like a URL and is only a name.
    """
    out = []
    for tag in re.finditer(r"<(\w+)([^>]*)>", text):
        name, attrs = tag.group(1).lower(), tag.group(2)
        for attr in re.finditer(r'(src|href)\s*=\s*"([^"]+)"', attrs):
            which, url = attr.group(1).lower(), attr.group(2)
            if which == "href" and name != "link":
                continue
            if url.startswith(("http://", "https://", "//")) and "w3.org" not in url:
                out.append(f"external <{name} {which}={url}>")
    for m in re.finditer(r'@import|url\((?:"|\')?https?:', text):
        out.append(f"external {m.group(0)}")
    for m in re.finditer(r'fetch\(\s*["\'`]([^"\'`]+)', text):
        if m.group(1).startswith(("http://", "https://", "//")):
            out.append(f"external fetch {m.group(1)}")
    return out


if __name__ == "__main__":
    raise SystemExit(main())
