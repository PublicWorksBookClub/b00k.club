/**
 * Builds the interactive layer that sits on top of the raster tiles.
 *
 * Everything that carries meaning rather than terrain stays vector: place
 * labels (so type stays crisp at every zoom), settlement icons, markers, and
 * the Argo's route. Together they are a few tens of kilobytes, against the
 * ~15 MB of coastline and relief geometry that the tiles absorb.
 */

import { getGroup, pathMidpoint, setGroupAttributes } from './svg-utils.js'
import { STYLESHEET_ATTRIBUTES } from './base-svg.js'

/** Group ids that are real layers; any other `<g id>` gets demoted to a data attribute. */
const LAYER_IDS = new Set([
  'routes',
  'roads',
  'trails',
  'searoutes',
  'icons',
  'burgIcons',
  'anchors',
  'labels',
  'states',
  'addedLabels',
  'burgLabels',
  'inconclusive',
  'todo',
  'peoples',
  'markers',
])

/** Layers copied into the overlay, in paint order. */
const OVERLAY_GROUPS = ['routes', 'icons', 'labels', 'markers']

/**
 * Reader-facing names for the label layers. FMG's own ids ("addedLabels") are
 * fine in the editor but read as jargon in a popup, and what a layer means is a
 * property of the data, not of the viewer.
 */
const LAYER_LABELS = {
  states: 'state',
  addedLabels: 'place',
  peoples: 'people',
  inconclusive: 'uncertain location',
  todo: 'unplaced',
}

export function buildOverlay(map, { symbols }) {
  const groups = OVERLAY_GROUPS.map((id) => {
    // These layers are lifted straight out of the saved document, so they need
    // the same stylesheet repair the base SVG gets — without `#routes
    // {fill: none}` the Argo's voyage renders as a filled black wedge.
    const markup = setGroupAttributes(getGroup(map.svg, id), id, STYLESHEET_ATTRIBUTES[id] ?? {})
    return deduplicateIds(markup)
  }).filter(Boolean)

  const usedSymbols = collectSymbols(groups.join(''), symbols)

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"`,
    ` viewBox="0 0 ${map.width} ${map.height}" preserveAspectRatio="none">`,
    `<defs>${getGroup(map.svg, 'filters')}${getGroup(map.svg, 'textPaths')}${usedSymbols}</defs>`,
    ...groups,
    `</svg>`,
  ].join('')
}

/**
 * FMG reuses ids like `village` across `#burgIcons`, `#anchors` and
 * `#burgLabels`. That is harmless inside the generator but produces an invalid
 * document once the layers are lifted out on their own, so non-layer ids become
 * `data-group` instead.
 */
function deduplicateIds(markup) {
  return markup.replace(/<g([^>]*?)\sid="([^"]+)"/g, (match, before, id) => (LAYER_IDS.has(id) ? match : `<g${before} data-group="${id}"`))
}

/** Pull in only the `<symbol>` definitions the copied layers actually reference. */
function collectSymbols(markup, symbols) {
  const referenced = new Set([...markup.matchAll(/href="#(icon-[^"]+)"/g)].map((match) => match[1]))
  return [...referenced]
    .map((id) => symbols[id])
    .filter(Boolean)
    .join('')
}

/**
 * Everything the viewer needs to make the overlay explorable: what each shape
 * is called, where to centre on it, and the note the author wrote for it.
 */
export function buildFeatures(map) {
  const notes = new Map(map.notes.map((note) => [note.id, note]))
  const placed = new Set()
  const features = []

  const push = (feature) => {
    placed.add(feature.id)
    features.push(feature)
  }

  for (const burg of map.burgs) {
    if (!burg || !burg.i || burg.removed) continue
    const note = notes.get(`burg${burg.i}`)
    push({
      id: `burg${burg.i}`,
      kind: 'burg',
      name: burg.name,
      x: round(burg.x),
      y: round(burg.y),
      note: note?.legend || '',
      detail: [burg.type, burg.capital ? 'capital' : null, burg.port ? 'port' : null].filter(Boolean).join(' · '),
    })
  }

  for (const marker of map.markers) {
    const note = notes.get(`marker${marker.i}`)
    push({
      id: `marker${marker.i}`,
      kind: 'marker',
      name: note?.name || marker.type || 'Marker',
      icon: marker.icon,
      x: round(marker.x),
      y: round(marker.y),
      note: note?.legend || '',
      detail: marker.type || '',
    })
  }

  for (const label of readLabels(map.svg)) {
    const note = notes.get(label.id)
    push({
      id: label.id,
      kind: 'label',
      name: note?.name || label.name,
      x: label.x,
      y: label.y,
      note: note?.legend || '',
      detail: LAYER_LABELS[label.layer] ?? label.layer,
    })
  }

  // Only rivers the author annotated; the map has over a thousand of them.
  for (const [id, position] of readRiverPositions(map.svg)) {
    const note = notes.get(id)
    if (!note) continue
    push({ id, kind: 'river', name: note.name, x: position[0], y: position[1], note: note.legend, detail: 'river' })
  }

  // Writing attached to a shape that has since been deleted or renumbered would
  // otherwise vanish from the published map without anyone noticing.
  const orphaned = map.notes.filter((note) => !placed.has(note.id) && note.legend?.trim())

  return { features, orphaned }
}

/**
 * Label positions come from the text arc in `#textPaths`, offset by the
 * `transform` FMG puts on the `<text>` element when the author drags a label.
 */
function readLabels(svg) {
  const arcs = new Map()
  for (const [, id, d] of getGroup(svg, 'textPaths').matchAll(/<path id="textPath_([^"]+)" d="([^"]+)"/g)) {
    const midpoint = pathMidpoint(d)
    if (midpoint) arcs.set(id, midpoint)
  }

  const labels = []
  const layers = ['states', 'addedLabels', 'inconclusive', 'todo', 'peoples']
  const labelsGroup = getGroup(svg, 'labels')

  for (const layer of layers) {
    const markup = getGroup(labelsGroup, layer)
    for (const [, id, attributes, body] of markup.matchAll(/<text[^>]*id="(label[^"]+)"([^>]*)>([\s\S]*?)<\/text>/g)) {
      const arc = arcs.get(id)
      if (!arc) continue

      const translate = attributes.match(/translate\(\s*(-?[\d.]+)[ ,]+(-?[\d.]+)\s*\)/)
      const dx = translate ? Number(translate[1]) : 0
      const dy = translate ? Number(translate[2]) : 0

      labels.push({
        id,
        layer,
        name: textContent(body),
        x: round(arc[0] + dx),
        y: round(arc[1] + dy),
      })
    }
  }

  // Settlement labels are plain positioned text rather than arcs, and their
  // note lives on the burg, so they are covered by the burg pass above.
  return labels
}

function readRiverPositions(svg) {
  const positions = []
  for (const [, id, d] of getGroup(svg, 'rivers').matchAll(/<path id="(river\d+)" d="([^"]+)"/g)) {
    const midpoint = pathMidpoint(d)
    if (midpoint) positions.push([id, [round(midpoint[0]), round(midpoint[1])]])
  }
  return positions
}

export function buildRoutes(map) {
  return map.routes.map((route) => ({
    id: `route${route.i}`,
    name: route.name || 'Route',
    group: route.group || 'routes',
    // Route points are `[x, y, cellId]`; the cell id is of no use to a viewer.
    points: route.points.map(([x, y]) => [round(x), round(y)]),
  }))
}

/** The cultures/states key FMG draws on the map, as data the viewer can lay out itself. */
export function buildLegend(svg) {
  const legend = getGroup(svg, 'legend')
  if (!legend) return null

  const data = legend.match(/\sdata="([^"]*)"/)
  if (!data?.[1]) return null

  const items = data[1]
    .split('|')
    .map((entry) => entry.split(','))
    .filter((parts) => parts.length >= 3)
    .map(([, color, ...name]) => ({ color, name: name.join(',') }))

  const heading = legend.match(/<text[^>]*class="legendHeader"[^>]*>([^<]*)<\/text>/)
  return { title: heading?.[1] || 'Legend', items }
}

function textContent(markup) {
  return markup
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function round(value) {
  return Math.round(Number(value) * 10) / 10
}
