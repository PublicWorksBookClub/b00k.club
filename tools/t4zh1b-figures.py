"""Build the figures for Commentary #10, t4zh1b.

    python3 tools/t4zh1b-figures.py [--lib /path/to/t4zh1b]

Writes SVG into static/illo/t4zh1b/. Everything here is a call into the
library; nothing is drawn by hand and nothing is traced. Rerun it after the
library changes and the commentary is current again.
"""

from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SITE = HERE.parent
OUT = SITE / "static" / "illo" / "t4zh1b"
DEFAULT_LIB = SITE.parent / "t4zh1b"

#: A display face for the heading. TrueType, because the reader takes `glyf`
#: outlines and not OpenType/CFF; ArabianNight is the alternative and is CFF, so
#: it would have to come through an SVG path instead.
FONT = Path("/Users/spence/Library/Fonts/aAhlanWasahlan.ttf")

#: A plain Roman face for the figure about a letter's four regions. The display
#: face above has a bowl the size of a full stop, and the whole point of that
#: figure is what happens inside a bowl -- so it uses a letter that has one.
PLAIN = Path("/System/Library/Fonts/Supplemental/Times New Roman.ttf")

PAPER = "#faf7f0"


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--lib", default=str(DEFAULT_LIB), help="path to the t4zh1b checkout")
    a = ap.parse_args()
    sys.path.insert(0, a.lib)
    OUT.mkdir(parents=True, exist_ok=True)

    global c, g, w, dv, L, pig
    import compose as c            # noqa: E402
    import devices as dv           # noqa: E402
    import girih as g              # noqa: E402
    import letters as L            # noqa: E402
    import pigments as pig         # noqa: E402
    import relief as rl            # noqa: E402
    import windows as w            # noqa: E402

    for fn in (heading, construction, tilings, tips, tinctures, palettes,
               weave, relief_figure, regions, devices_figure, window):
        fn()


# --------------------------------------------------------------------------- #
# helpers
# --------------------------------------------------------------------------- #


def save(comp, name: str, *, background: str = PAPER) -> None:
    dst = comp.save(OUT / f"{name}.svg", background=background)
    print(f"  {dst.name:22s} {dst.stat().st_size / 1024:6.0f} KB")


def row(name: str, parts: list, *, gap: float = 22.0, background: str = PAPER,
        labels: list[str] | None = None, label_size: float = 11.0) -> None:
    """Lay finished compositions side by side, aligned on their tops."""
    frags, marks, x, height = [], [], 0.0, 0.0
    tmp = OUT / "_tmp.svg"
    for i, part in enumerate(parts):
        part.save(tmp, background=None)
        svg = tmp.read_text()
        inner = svg[svg.index(">", svg.index("<svg")) + 1: svg.rindex("</svg>")]
        frags.append(f'<g transform="translate({x:.3f},0)">{inner}</g>')
        if labels:
            marks.append((x + part.width / 2, labels[i]))
        x += part.width + gap
        height = max(height, part.height)
    tmp.unlink(missing_ok=True)
    # One baseline for every label, under the tallest part, rather than each
    # hanging off its own figure -- a ragged row of captions reads as an
    # accident.
    for cx, text in marks:
        frags.append(
            f'<text x="{cx:.3f}" y="{height + label_size + 6:.3f}" '
            f'text-anchor="middle" font-family="Georgia,serif" '
            f'font-size="{label_size}" fill="#6b675e">{text}</text>')
    x -= gap
    if labels:
        height += label_size + 10
    pad = 8.0
    doc = (f'<svg xmlns="http://www.w3.org/2000/svg" '
           f'xmlns:xlink="http://www.w3.org/1999/xlink" '
           f'viewBox="{-pad} {-pad} {x + 2 * pad:.3f} {height + 2 * pad:.3f}">'
           f'<rect x="{-pad}" y="{-pad}" width="{x + 2 * pad:.3f}" '
           f'height="{height + 2 * pad:.3f}" fill="{background}"/>'
           + "".join(frags) + "</svg>")
    dst = OUT / f"{name}.svg"
    dst.write_text(doc)
    print(f"  {dst.name:22s} {dst.stat().st_size / 1024:6.0f} KB")


def pat(tiling="dodecagon", tip=60.0, cell=34.0, stroke=0.9, **kw):
    return c.Pattern(tiling, cell=cell, stroke=stroke, **kw).with_tip(tip)


def scheme(name: str) -> dict:
    """A palette's ink and ground as colours -- the studio's `scheme`, here."""
    q = pig.palette(name)
    ground = pig.PIGMENTS[q.ground].colour if q.ground else pig.PIGMENTS["paper"].colour
    return {"ink": pig.PIGMENTS[q.ink].colour, "ground": ground,
            "reverse": ground, "label": q.label}


# --------------------------------------------------------------------------- #
# the figures
# --------------------------------------------------------------------------- #


def heading() -> None:
    """The word, reserved out of a field. The commentary's own title."""
    print("heading")
    if not FONT.exists():
        print(f"  !! {FONT} not found; skipping")
        return
    ink = pig.PIGMENTS["carbon"].colour
    gold = pig.PIGMENTS["gold"].colour
    paper = pig.PIGMENTS["paper"].colour
    lapis = pig.PIGMENTS["lazurite"].colour
    contours = L.word(FONT, "t4zh1b", 132.0, tracking=9.0)
    comp = L.initial(
        contours,
        L.panel_rings(
            16.0,
            # The field: strapwork reversed out of solid lapis, so the letters --
            # which are holes -- come back as paper. An inlay was tried and the
            # letterforms went to blotches; a reserve is what a reserve is for.
            pattern=pat("dodecagon", 60.0, cell=27.0, stroke=0.9, colour=paper),
            rule=1.3,
            field=c.Fill(pat("dodecagon", 60.0, cell=27.0, stroke=0.9, colour=paper),
                         tone=c.Tone("solid", colour=lapis), rule_colour=gold),
            border=c.Fill(pat("octagon", 90.0, cell=15.0, stroke=0.55, colour=ink),
                          tone=c.Tone("stipple", spacing=5.0, stroke=0.5, colour=gold),
                          rule_colour=gold),
        ),
        margin=(28.0, 28.0, 22.0, 22.0),
        outline=1.2,
        outline_colour=gold,
    )
    save(comp, "heading")


def construction() -> None:
    """Three steps: the tiling, the rays off each edge, the pattern they make.

    The claim of the whole library in one row -- that the pattern is not drawn.
    """
    print("construction")
    edge = 26.0
    box = (0.0, 0.0, 190.0, 150.0)
    tiles = g.tiling_octagon_square(edge, box, origin=(95.0, 75.0))
    keep = [t for t in tiles
            if all(box[0] - 6 <= p[0] <= box[2] + 6 and box[1] - 6 <= p[1] <= box[3] + 6
                   for p in t)]
    frame = g.rect(*box)

    # 1. the grid
    a = c.Composition(width=box[2], height=box[3])
    a.layers.append(g.Layer(keep, stroke=0.7, colour="#9a9285", closed=True))

    # 2. the grid, with two rays out of every edge midpoint at the contact angle
    b = c.Composition(width=box[2], height=box[3])
    b.layers.append(g.Layer(keep, stroke=0.5, colour="#cfc7b8", closed=True))
    rays = []
    for t in keep:
        for i in range(len(t)):
            p, q = t[i], t[(i + 1) % len(t)]
            mid = ((p[0] + q[0]) / 2, (p[1] + q[1]) / 2)
            ex, ey = q[0] - p[0], q[1] - p[1]
            n = math.hypot(ex, ey) or 1.0
            ex, ey = ex / n, ey / n
            inx, iny = -ey, ex
            cen = g._centroid(t)
            if (cen[0] - mid[0]) * inx + (cen[1] - mid[1]) * iny < 0:
                inx, iny = -inx, -iny
            th = math.radians(67.5)
            for s in (1, -1):
                dx = inx * math.sin(th) + s * ex * math.cos(th)
                dy = iny * math.sin(th) + s * ey * math.cos(th)
                rays.append([mid, (mid[0] + dx * edge * 0.42, mid[1] + dy * edge * 0.42)])
    b.layers.append(g.Layer(rays, stroke=0.7, colour="#a8281c"))

    # 3. what the rays make when they are paired and joined
    d = c.Composition(width=box[2], height=box[3])
    d.layers.append(g.Layer(g.pattern(keep, 67.5), stroke=1.0, colour="#1a1a1a",
                            clip=(frame,)))

    row("construction", [a, b, d],
        labels=["a tiling", "two rays off every edge", "where they meet"])


def tilings() -> None:
    """Four grids, one contact angle each, taken from objects."""
    print("tilings")
    named = [("square", 110.0), ("hex", 100.0), ("octagon", 90.0), ("dodecagon", 60.0)]
    parts = []
    for name, tip in named:
        comp = c.compose(c.rect_outline(0, 0, 150.0, 150.0),
                         [c.Ring(None, pat(name, tip, cell=44.0, stroke=1.0), rule=1.0)],
                         width=150.0, height=150.0)
        parts.append(comp)
    row("tilings", parts,
        labels=[f"{n} · {int(t)}° tips" for n, t in named])


def tips() -> None:
    """One grid, three tip angles. The single design decision in the family."""
    print("tips")
    parts, labels = [], []
    for tip in (60.0, 90.0, 120.0):
        comp = c.compose(c.rect_outline(0, 0, 150.0, 150.0),
                         [c.Ring(None, pat("dodecagon", tip, cell=68.0, stroke=1.1), rule=1.0)],
                         width=150.0, height=150.0)
        parts.append(comp)
        labels.append(f"{int(tip)}°")
    row("tips", parts, labels=labels)


def tinctures() -> None:
    """The heraldic hatchings, which are a notation for colour in one ink.

    Drawn large, and with the strapwork kept light, because the point of the
    figure is the ground and not the pattern over it.
    """
    print("tinctures")
    names = ["argent", "or", "azure", "gules", "vert", "purpure", "sable"]
    parts = []
    for name in names:
        comp = c.compose(
            c.rect_outline(0, 0, 118.0, 118.0),
            [c.Ring(None, pat("octagon", 90.0, cell=52.0, stroke=0.8),
                    rule=1.0, tone=c.TINCTURES[name])],
            width=118.0, height=118.0)
        parts.append(comp)
    row("tinctures", parts, gap=14.0, labels=names)

    # The same seven again as the pigments they stand for, side by side with the
    # notation, so the substitution is visible rather than asserted.
    parts = []
    for name in names:
        tone = c.tincture(name, pigment=True, palette="mamluk-red")
        comp = c.compose(
            c.rect_outline(0, 0, 118.0, 118.0),
            [c.Ring(None, pat("octagon", 90.0, cell=52.0, stroke=0.8,
                              colour="#f7f2e7" if tone else "#1a1a1a"),
                    rule=1.0, tone=tone)],
            width=118.0, height=118.0)
        parts.append(comp)
    row("tinctures-laid", parts, gap=14.0,
        labels=[pig.palette("mamluk-red").colour(n) and
                pig.PIGMENTS[pig.palette("mamluk-red").tinctures[n]].name or "paper"
                for n in names])


def palettes() -> None:
    """The same panel, four ways. One geometry, four sets of materials."""
    print("palettes")
    keys = ["wire", "mamluk", "persian", "andalusi"]
    parts = []
    for k in keys:
        sch = scheme(k)
        rings = [
            c.Ring(19.0, pat("octagon", 90.0, cell=19.0, stroke=0.6,
                             colour=pig.PIGMENTS["paper"].colour if k != "wire" else None),
                   rule=1.0, tone=c.tincture("azure", pigment=k != "wire", palette=k)),
            c.Ring(None, pat("dodecagon", 60.0, cell=42.0, stroke=0.8),
                   rule=1.0, tone=c.tincture("or", pigment=k != "wire", palette=k)),
        ]
        comp = c.compose(c.rect_outline(0, 0, 148.0, 148.0), rings,
                         width=148.0, height=148.0, rule_colour=sch["ink"],
                         pigment=k != "wire", palette=k)
        parts.append(comp)
    row("palettes", parts, gap=16.0,
        labels=[pig.palette(k).label.split("—")[0].strip() for k in keys])


def weave() -> None:
    """A strand is a ribbon. Drawn unbroken it is only a line."""
    print("weave")
    parts = []
    for woven in (False, True):
        comp = c.compose(
            c.rect_outline(0, 0, 236.0, 118.0),
            [c.Ring(None, pat("octagon", 90.0, cell=38.0, stroke=1.7), rule=1.0,
                    interlace=woven)],
            width=236.0, height=118.0)
        parts.append(comp)
    row("weave", parts, labels=["drawn", "woven"])


def relief_figure() -> None:
    """The same band three times, one number changed."""
    print("relief")
    parts, labels = [], []
    for label, bulge in (("flat", 0.0), ("raised", 62.0), ("sunk", -55.0)):
        comp = c.compose(
            c.rect_outline(0, 0, 150.0, 150.0),
            [c.Ring(34.0, pat("octagon", 90.0, cell=26.0, stroke=0.75), rule=1.0),
             c.Ring(None, None, rule=1.0)],
            width=150.0, height=150.0, bulge=bulge, shadow=0.75, light=(315.0, 32.0))
        parts.append(comp)
        labels.append(label)
    row("relief", parts, labels=labels)


def regions() -> None:
    """A letter has four regions. Each is a separate decision."""
    print("regions")
    if not PLAIN.exists():
        print(f"  !! {PLAIN} not found; skipping")
        return
    field = pat("octagon", 90.0, cell=17.0, stroke=0.7)
    fine = pat("hex", 100.0, cell=8.0, stroke=0.45)
    inner = pat("dodecagon", 60.0, cell=12.0, stroke=0.45)
    cases = [
        ("field through", dict(), dict(), 0.0),
        ("counter closed", dict(counter=False), dict(), 0.0),
        ("counter its own", dict(counter=c.Fill(fine)), dict(), 0.0),
        ("all four", dict(counter=c.Fill(fine), inlay=c.Fill(inner)),
         dict(border=c.Fill(pat("square", 110.0, cell=11.0, stroke=0.5))), 13.0),
    ]
    parts, labels = [], []
    for label, kw, rings, band in cases:
        parts.append(L.initial(L.glyph(PLAIN, "D", 104.0),
                               L.panel_rings(band, pattern=field, **rings),
                               margin=13.0, **kw))
        labels.append(label)
    row("regions", parts, labels=labels)


def devices_figure() -> None:
    """Shamsa, verse marker, marginal almond."""
    print("devices")
    parts = [
        dv.shamsa(58.0, lobes=16, depth=0.16, band=15.0,
                  pattern=pat("octagon", 90.0, cell=15.0, stroke=0.6)),
        dv.shamsa(52.0, lobes=12, depth=0.28, band=14.0,
                  pattern=pat("dodecagon", 60.0, cell=17.0, stroke=0.6)),
        dv.verse_marker(9.0, points=8, skip=3, lobes=8, depth=0.2),
        dv.verse_marker(9.0, points=12, skip=5, lobes=12, depth=0.16),
        dv.marginal(19.0, 38.0, band=8.0,
                    pattern=pat("hex", 100.0, cell=11.0, stroke=0.5)),
    ]
    row("devices", parts, gap=20.0,
        labels=["shamsa", "shamsa", "verse", "verse", "almond"])


def window() -> None:
    """Everything at once, on a very tall opening.

    A page ground with a bordered margin over it, a five-ring ogee window
    standing off that surface in relief and shaded, and a shamsa on the sill.

    On *paper*, not on a coloured ground, so that the two ways of saying the
    same thing sit side by side and can be told apart: four rings laid as actual
    pigment -- lapis, gold, red lead, malachite -- and two left in the heraldic
    hatching that stands in for colour when there is only one ink. Same tincture
    names either way; only the press changes.

    The page itself is left flat. Relief costs: a rolled tone is resampled along
    every ruled line, and a crosshatch over a whole page then runs to a hundred
    thousand points. The window is the thing meant to stand off the surface, so
    it is the only part that rolls.
    """
    print("window")
    PW, PH = 470.0, 940.0
    ink = pig.PIGMENTS["carbon"].colour
    gold = pig.PIGMENTS["gold"].colour
    paper = pig.PIGMENTS["paper"].colour
    lapis = pig.PIGMENTS["lazurite"].colour

    # The rings grow *outward* from the opening, so the window's footprint is
    # span + 2*band*depth wide and height + 2*band*depth tall. Sized against the
    # page's own margin and border, or the outermost ring runs off the sheet --
    # which it did, and the top three rings were cut off by the trim.
    band, depth = 26.0, 4
    grow = band * depth
    frame = 46.0                                   # margin ring + border band
    spec = w.WindowSpec("ogee", span=130.0, height=590.0, rise=108.0)
    top = frame + grow + (PH - 2 * frame - spec.height - 2 * grow) / 2

    # Outward from the opening. The innermost ring is the finest and the richest,
    # which is the direction that reads as importance.
    rings = [
        # Reversed out of solid lapis: paper-coloured strapwork on blue.
        c.Ring(band, pat("dodecagon", 60.0, cell=23.0, stroke=0.75, colour=paper),
               rule=1.1, rule_colour=gold,
               tone=c.Tone("solid", colour=lapis)),
        # Woven, over gold's own stipple -- coarsened so the dots read as a
        # ground rather than as grey.
        c.Ring(band, pat("octagon", 90.0, cell=21.0, stroke=0.9, colour=ink),
               rule=1.0, rule_colour=ink, interlace=True,
               tone=c.Tone("stipple", spacing=6.0, stroke=0.6, colour=gold)),
        # THE NOTATION, beside the colour: `vert` as the diagonal ruling it
        # stands for, at the angle the 1885 Benares plate actually rules.
        c.Ring(band, pat("hex", 100.0, cell=20.0, stroke=0.62, colour=ink),
               rule=1.0, rule_colour=ink,
               tone=c.Tone("hatch", angle=c.BENARES_DIAGONALS[0], spacing=5.0,
                           stroke=0.42, colour=ink)),
        # Two-tone: the odd-crossed compartments in red lead, the rest paper.
        c.Ring(band, pat("square", 110.0, cell=17.0, stroke=0.6, colour=ink),
               rule=1.0, rule_colour=ink,
               alternate=c.tincture("gules", pigment=True, palette="mamluk-red")),
    ]
    win = c.compose(c.window_outline(spec, PW / 2, top, grow=True), rings,
                    width=PW, height=PH, rule_colour=ink,
                    bulge=56.0, shadow=0.42, light=(315.0, 34.0),
                    pigment=True, palette="mamluk-red")
    rim = spec.outline(PW / 2, top, -(band * depth))

    # The page under it: a crosshatched margin, a border band reversed out of
    # lapis, then the field the window sits in. The rim is a hole, so nothing
    # paints through the opening.
    page = c.compose(
        c.rect_outline(0, 0, PW, PH),
        [c.Ring(20.0, pat("hex", 100.0, cell=20.0, stroke=0.45, colour=ink),
                rule=None, tone=c.Tone("cross", angle=0.0, spacing=6.0,
                                       stroke=0.32, colour=ink)),
         c.Ring(26.0, pat("octagon", 90.0, cell=26.0, stroke=0.65, colour=paper),
                rule=1.3, rule_colour=gold, alternate="solid",
                tone=c.Tone("solid", colour=lapis)),
         c.Ring(None, pat("dodecagon", 60.0, cell=40.0, stroke=0.4, colour=ink),
                rule=1.0, rule_colour=ink)],
        width=PW, height=PH, holes=[rim], rule_colour=ink,
        pigment=True, palette="mamluk-red")

    comp = c.stack(page, win, rule_colour=ink)

    # The furniture goes in the reserve, which is the opening: a shamsa under the
    # head, where an illuminated page carries its headpiece, and a verse marker
    # either side of the sill.
    open_top = top + spec.rise
    shamsa = dv.shamsa(38.0, lobes=16, depth=0.17, band=12.0, rule=0.9,
                       pattern=pat("octagon", 90.0, cell=12.0, stroke=0.5,
                                   colour=ink))
    _paste(comp, shamsa, PW / 2 - shamsa.width / 2, open_top + 26.0)
    for cx in (PW / 2 - 38.0, PW / 2 + 38.0):
        marker = dv.verse_marker(11.0, points=8, skip=3, lobes=8, depth=0.2,
                                 rule=0.6)
        _paste(comp, marker, cx - marker.width / 2,
               top + spec.height - 46.0)

    save(comp, "window", background=paper)
    _png("window", height=1500)


def _png(name: str, height: int = 1200) -> None:
    """A raster beside the vector, since the window runs to megabytes.

    The SVG is the thing to open in a drawing program; the PNG is the thing to
    put on a page. Needs `rsvg-convert`; skipped with a note if it is not there.
    """
    import shutil
    import subprocess

    exe = shutil.which("rsvg-convert")
    if not exe:
        print("  !! rsvg-convert not found; no PNG written")
        return
    src, dst = OUT / f"{name}.svg", OUT / f"{name}.png"
    subprocess.run([exe, "-h", str(height), str(src), "-o", str(dst)], check=True)
    print(f"  {dst.name:22s} {dst.stat().st_size / 1024:6.0f} KB")


def _paste(into, part, dx: float, dy: float) -> None:
    """Drop a finished composition into another at an offset."""
    shift = lambda pts: [[(x + dx, y + dy) for x, y in p] for p in pts]  # noqa: E731
    for layer in part._all_layers():
        into.layers.append(g.Layer(
            shift(layer.paths), stroke=layer.stroke, colour=layer.colour,
            closed=layer.closed,
            clip=tuple(shift(layer.clip)) if layer.clip else None,
            clip_inner=tuple(shift(layer.clip_inner)) if layer.clip_inner else None,
            fill=layer.fill, masked=False))


if __name__ == "__main__":
    main()
