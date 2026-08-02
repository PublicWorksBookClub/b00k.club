# Map export

Turns an [Azgaar Fantasy Map Generator][fmg] project into something a reader can
open quickly, without giving up the generator as the editing tool.

## Why

`static/maps/argonautica.map` is a 20 MB project file, and the bundled generator
at `/maps/interactive/` is another 46 MB of application. Opening the map in the
generator means downloading all of it, parsing 15 MB of serialised SVG, inserting
it into the DOM and letting the generator re-derive its layers. That is a fine
price for editing and an unreasonable one for reading.

Almost all of that weight is terrain. In the Argonautica map:

| part of the project                                  | size       |
| ---------------------------------------------------- | ---------- |
| height contours (`landHeights`)                      | 9.4 MB     |
| relief icons (`terrain`) — switched off, still saved | 4.2 MB     |
| rivers                                               | 1.2 MB     |
| cell attribute arrays                                | ~4.8 MB    |
| **everything a reader clicks**                       | **~80 KB** |

So the export splits along that seam. Terrain is painted once, at build time,
into a raster tile pyramid. The handful of things that carry meaning — labels,
settlements, markers, the voyage — stay vector, so their type stays crisp and
their shapes stay clickable.

The published result is about 4.4 MB in total, of which a reader's first view
fetches roughly 300 KB.

## Workflow

1. Edit the map at `/maps/interactive/` (locally: `pnpm serve`, then
   <http://localhost:2665/maps/interactive/?maplink=/maps/argonautica.map>).
2. Save the project over `static/maps/argonautica.map`.
3. Run `pnpm map:export`.
4. Commit the `.map` file together with the regenerated
   `static/maps/argonautica/` directory.

The export is deliberately _not_ part of `pnpm build`. It needs native image
libraries and takes about a minute, while maps change rarely — so the artefacts
are committed and Cloudflare Pages builds stay exactly as they were.

## Output

```
static/maps/argonautica/
  tiles/{z}/{x}_{y}.webp   painted terrain: ocean, relief, rivers, coastlines
  overlay.svg              labels, settlements, markers, the Argo's route
  map.json                 manifest, legend, routes, and every annotated feature
  fonts.css, fonts/        the web fonts the map's labels use, mirrored locally
```

`/maps/viewer/` reads those four things. It takes `?map=<name>`, and understands
the generator's own `?burg=N` / `?marker=N` / `?scale=N` parameters so links
already published against `/maps/interactive/` keep working when repointed.

## Options

```
node tools/map-export/export.js [map-name...] [--max-zoom N] [--quality N]
```

Zoom levels are Leaflet zooms. `nativeZoom` (2) is where one FMG map unit is one
screen pixel; `maxZoom` (4) makes the deepest tiles 4x that. Raising `--max-zoom`
by one quadruples the tile count — measured on the Argonautica map, z4 is 2.5 MB
across 220 tiles, so z5 would add roughly 9 MB for detail the 73k-cell source
does not actually contain.

Maps are registered in the `MAPS` table at the top of `export.js`.

## Notes on fidelity

The generator serialises `#map` straight out of the live DOM, so every
declaration that came from its stylesheet is missing from the saved file. A lot
of those are load-bearing:

| rule                                               | without it                                  |
| -------------------------------------------------- | ------------------------------------------- |
| `#routes { fill: none }`                           | the voyage fills as a black wedge           |
| `#rivers { mask: url(#land) }`                     | rivers run out over open water              |
| `#markers { text-anchor; dominant-baseline }`      | every marker's emoji sits off-centre        |
| `#labels`, `#burgLabels` `{ text-anchor: middle }` | place names hang to the right of their spot |

`lib/stylesheet.js` reads these out of `index.css` and writes them onto the
elements as presentation attributes. It is deliberately derived rather than
transcribed: an earlier version kept the list by hand, and the marker rule was
missed for a while because nobody thought to look for it. Anything the author
set inline in the generator still wins.

Two things are reported on every run rather than assumed:

- **Coverage.** Every layer left switched on has to end up in the tiles, in the
  overlay, or on the `WITHHELD_LAYERS` list. Anything falling between is content
  missing from the published map — which is how `#coordinateLabels` went astray
  once.
- **Unflattenable rules.** Declarations too specific to become an attribute on
  the group itself (`#armies text { … }`). None apply to the layers published
  today; the check is there so a future generator that adds one is noticed.

Layers switched off in the generator are dropped rather than rendered, so what
you toggle on before saving is what gets published.

The export was checked against the generator's own rendering of the same layers:
mean per-channel difference 0.55/255, with the residual confined to one-pixel
antialiasing along coastlines.

Two deliberate differences from the generator:

- The voyage is drawn above the coastline rather than below it, because it moved
  into the vector overlay.
- The scale bar and legend are drawn as page furniture rather than as shapes
  pinned to the map, so they stay put while you pan.

[fmg]: https://azgaar.github.io/Fantasy-Map-Generator/
