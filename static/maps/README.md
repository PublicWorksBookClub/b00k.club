# Maps

Interactive maps, each an [Azgaar Fantasy Map Generator][fmg] project exported
into a fast, readable form.

## What's here

- `<name>.map` — the FMG source project. **Edit these.**
- `<name>/` — the published export (tiles, `overlay.svg`, `map.json`, fonts). **Generated; don't hand-edit.**
- `<name>/tour.json` — optional guided tour (see below).
- `viewer/` — the reader that displays any exported map.
- `interactive/` — the bundled FMG editor.

## Update a map

1. Edit at `/maps/interactive/?maplink=/maps/<name>.map` (run `pnpm serve` first).
2. Save the project over `static/maps/<name>.map`.
3. `pnpm map:export <name>`
4. Commit the `.map` with the regenerated `<name>/`.

## Add a map

1. Build the project in the editor; save as `static/maps/<name>.map`.
2. Register it in the `MAPS` table in [`tools/map-export/export.js`](../../tools/map-export/export.js).
3. `pnpm map:export <name>`
4. Show it: link to `/maps/viewer/?map=<name>`, or embed it by copying the block in
   [`content/commentary/002_Map-of-Apollonius-Argonautica.md`](../../content/commentary/002_Map-of-Apollonius-Argonautica.md) and changing `data-map`.

Export internals (tiles, fidelity, options): [`tools/map-export/README.md`](../../tools/map-export/README.md).

## Tours (optional)

A guided walk through stops, in `<name>/tour.json`:

```json
{ "defaultZoom": 3.5, "flyDuration": 0.6,
  "stops": [{ "feature": "marker1", "$comment": "editor note, ignored" }] }
```

Each stop names a feature already on the map; `$comment` (and any extra key) is ignored. No file → the viewer shows the plain zoom control instead of the stepper.

[fmg]: https://azgaar.github.io/Fantasy-Map-Generator/
