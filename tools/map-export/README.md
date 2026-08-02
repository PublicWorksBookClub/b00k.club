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
declaration that came from its stylesheet is missing from the saved file. Several
of those are load-bearing: without `#routes {fill: none}` the Argo's voyage
renders as a filled black wedge across the Black Sea, and without the mask on
`#rivers` the rivers run out over open water. `lib/base-svg.js` flattens those
declarations back onto the elements, and `lib/verify-stylesheet.js` re-reads
`index.css` on every run and reports any drift, so upgrading the bundled
generator cannot silently change how the tiles look.

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
