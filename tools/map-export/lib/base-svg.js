/**
 * Builds the "base" SVG: everything that gets baked into raster tiles.
 *
 * Two things have to be repaired before the saved document can be rendered
 * outside the generator:
 *
 *  1. Every declaration that came from `interactive/index.css` is missing,
 *     because FMG serialises `#map` out of the live DOM. `lib/stylesheet.js`
 *     recovers them.
 *  2. The ocean pattern points at a relative `./images/pattern1.png`.
 */

import { readFileSync } from 'node:fs'
import { findGroup, getGroup, removeGroups, setGroupAttributes } from './svg-utils.js'

/**
 * Layers that move to the interactive vector overlay instead of being baked
 * into the tiles, so their text stays crisp and their shapes stay clickable.
 *
 * `coordinateLabels` is nested inside `#coordinates` alongside the graticule
 * itself. The lines stay in the raster, where their paint order below the
 * rivers and coastline is preserved; only the degree markings are lifted out.
 */
export const OVERLAY_LAYERS = [
  'labels',
  'icons',
  'markers',
  'routes',
  'coordinateLabels',
  'legend',
  'scaleBar',
  'emblems',
  'armies',
  'ruler',
  'provinceLabels',
  'fogging-cont',
]

/**
 * Lifted out of the tiles and then deliberately not redrawn on the map.
 *
 * The legend and scale bar are rebuilt as page furniture from `map.json`, so
 * they hold still while the reader pans instead of drifting off with the
 * terrain. The rest are editing aids — measuring rulers, army counters, the
 * fog-of-war cover — that have no business in a published map.
 */
export const WITHHELD_LAYERS = ['legend', 'scaleBar', 'emblems', 'armies', 'ruler', 'provinceLabels', 'fogging-cont']

/** Group ids inside the given groups, so a caller can account for their children too. */
export function descendantGroupIds(svg, ids) {
  return new Set(ids.flatMap((id) => groupIds(getGroup(svg, id))))
}

/**
 * Strip every group the author has switched off in the generator. This is what
 * keeps the export honest: whatever is toggled on in FMG when the map is saved
 * is what ends up in the tiles, with no list here to keep up to date.
 */
export function removeHiddenGroups(svg) {
  const removed = {}
  const openTag = /<g id="([^"]+)"[^>]*>/g
  let match

  while ((match = openTag.exec(svg))) {
    if (!/display:\s*none/.test(match[0])) continue

    // Anchor on the tag the scan actually matched, not the first group that
    // happens to share this id.
    const span = findGroup(svg, match[1], match.index)
    if (!span) continue

    removed[match[1]] = (removed[match[1]] ?? 0) + span[1] - span[0]
    svg = svg.slice(0, span[0]) + svg.slice(span[1])
    openTag.lastIndex = span[0]
  }

  return { svg, removed }
}

/** Every `<g id>` still present, so callers can report on what they are shipping. */
export function groupIds(svg) {
  return [...new Set([...svg.matchAll(/<g id="([^"]+)"/g)].map((match) => match[1]))]
}

/**
 * @param {object} map parsed `.map` file
 * @param {string} fmgDir path to the FMG install, for resolving relative assets
 * @param {Record<string, Record<string, string>>} layerStyles from `readLayerStyles`
 */
export function buildBaseSvg(map, fmgDir, layerStyles) {
  const dropped = {}
  let svg = map.svg

  const hidden = removeHiddenGroups(svg)
  svg = hidden.svg
  Object.assign(dropped, hidden.removed)
  const visible = groupIds(svg)

  // `#textPaths` only exists to carry the label arcs, which live in the overlay.
  const overlay = removeGroups(svg, [...OVERLAY_LAYERS, 'textPaths'])
  svg = overlay.svg
  Object.assign(dropped, overlay.removed)

  svg = applyLayerStyles(svg, layerStyles)
  svg = inlineOceanPattern(svg, fmgDir)

  return { svg, dropped, visible }
}

/**
 * Write the stylesheet's declarations onto the groups they apply to, as
 * presentation attributes. Anything already set inline in the saved document
 * wins, since that is the author's own choice rather than a default.
 */
export function applyLayerStyles(svg, layerStyles) {
  for (const [id, attributes] of Object.entries(layerStyles)) {
    if (!svg.includes(`<g id="${id}"`)) continue
    svg = setGroupAttributes(svg, id, attributes)
  }
  return svg
}

function inlineOceanPattern(svg, fmgDir) {
  const reference = 'href="./images/pattern1.png"'
  if (!svg.includes(reference)) return svg

  const encoded = readFileSync(`${fmgDir}/images/pattern1.png`).toString('base64')
  return svg.replace(reference, `href="data:image/png;base64,${encoded}"`)
}
