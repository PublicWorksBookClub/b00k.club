/**
 * Builds the "base" SVG: everything that gets baked into raster tiles.
 *
 * Two things have to be repaired before the saved document can be rendered
 * outside the generator:
 *
 *  1. FMG serialises `#map` straight out of the live DOM, so every declaration
 *     that came from `interactive/index.css` is missing. Some of those are load
 *     bearing — without `#routes {fill: none}` the Argo's voyage renders as a
 *     filled black wedge across the Black Sea, and without the `mask` on
 *     `#rivers` the rivers run out over open water.
 *  2. The ocean pattern points at a relative `./images/pattern1.png`.
 */

import { readFileSync } from 'node:fs'
import { findGroup, removeGroups, setGroupAttributes } from './svg-utils.js'

/**
 * Declarations that only ever lived in the stylesheet, flattened onto the
 * groups they apply to. `verifyStylesheet` re-reads index.css on every export
 * and reports drift, so upgrading the bundled generator cannot silently change
 * how the tiles render.
 */
export const STYLESHEET_ATTRIBUTES = {
  biomes: { 'stroke-linejoin': 'round', 'fill-rule': 'evenodd' },
  borders: { 'stroke-linejoin': 'round', fill: 'none' },
  cells: { fill: 'none' },
  coastline: { fill: 'none', 'stroke-linejoin': 'round' },
  compass: { fill: 'none' },
  cults: { 'stroke-linejoin': 'round', 'fill-rule': 'evenodd', mask: 'url(#land)' },
  gridOverlay: { fill: 'none' },
  landmass: { 'fill-rule': 'evenodd', mask: 'url(#land)' },
  oceanLayers: { 'fill-rule': 'evenodd' },
  population: { fill: 'none' },
  provincesBody: { 'stroke-linejoin': 'round', 'fill-rule': 'evenodd', mask: 'url(#land)' },
  relig: { 'stroke-linejoin': 'round', 'fill-rule': 'evenodd', mask: 'url(#land)' },
  rivers: { stroke: 'none', mask: 'url(#land)', 'fill-rule': 'nonzero' },
  routes: { fill: 'none' },
  statesBody: { 'stroke-linejoin': 'round', 'fill-rule': 'evenodd', mask: 'url(#land)' },
  statesHalo: { fill: 'none', 'stroke-linejoin': 'round' },
  temperature: { 'fill-rule': 'evenodd' },
  terrs: { 'fill-rule': 'evenodd' },
}

/**
 * Layers that move to the interactive vector overlay instead of being baked
 * into the tiles, so their text stays crisp and their shapes stay clickable.
 */
export const OVERLAY_LAYERS = [
  'labels',
  'icons',
  'markers',
  'routes',
  'legend',
  'scaleBar',
  'coordinateLabels',
  'emblems',
  'armies',
  'ruler',
  'provinceLabels',
  'fogging-cont',
]

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

/**
 * @param {object} map parsed `.map` file
 * @param {string} fmgDir path to the FMG install, for resolving relative assets
 */
export function buildBaseSvg(map, fmgDir) {
  const dropped = {}
  let svg = map.svg

  const hidden = removeHiddenGroups(svg)
  svg = hidden.svg
  Object.assign(dropped, hidden.removed)

  // `#textPaths` only exists to carry the label arcs, which live in the overlay.
  const overlay = removeGroups(svg, [...OVERLAY_LAYERS, 'textPaths'])
  svg = overlay.svg
  Object.assign(dropped, overlay.removed)

  for (const [id, attributes] of Object.entries(STYLESHEET_ATTRIBUTES)) {
    svg = setGroupAttributes(svg, id, attributes)
  }

  svg = inlineOceanPattern(svg, fmgDir)

  return { svg, dropped }
}

function inlineOceanPattern(svg, fmgDir) {
  const reference = 'href="./images/pattern1.png"'
  if (!svg.includes(reference)) return svg

  const encoded = readFileSync(`${fmgDir}/images/pattern1.png`).toString('base64')
  return svg.replace(reference, `href="data:image/png;base64,${encoded}"`)
}
