#!/usr/bin/env node
/**
 * Export an Azgaar Fantasy Map Generator project into something a reader can
 * actually open.
 *
 * The generator stays the editing tool: edit at /maps/interactive/, save the
 * `.map` file back over the source, then run this. It splits the project into
 *
 *   tiles/{z}/{x}_{y}.webp   the painted base — coastlines, relief, rivers
 *   overlay.svg              labels, settlements, markers, the voyage
 *   map.json                 names, notes and positions for search and popups
 *
 * so that /maps/viewer/ can show the map without shipping a 20 MB project file
 * and a 46 MB editor to every reader.
 *
 * Usage: node tools/map-export/export.js [map-name...] [--max-zoom N] [--quality N]
 */

import { mkdirSync, writeFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { readMapFile } from './lib/mapfile.js'
import { buildBaseSvg, descendantGroupIds, groupIds, WITHHELD_LAYERS } from './lib/base-svg.js'
import { readLayerStyles, findUnappliedRules } from './lib/stylesheet.js'
import { renderTiles } from './lib/tiles.js'
import { buildOverlay, buildFeatures, buildRoutes, buildLegend } from './lib/overlay.js'
import { groupHasContent } from './lib/svg-utils.js'
import { readSymbols, buildFontFaces } from './lib/fmg-assets.js'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '../..')
const fmgDir = join(repoRoot, 'static/maps/interactive')

/**
 * Maps to export. `nativeZoom` is the Leaflet zoom at which one FMG map unit is
 * one screen pixel; `maxZoom` two above it means the deepest tiles are 4x.
 */
const MAPS = {
  argonautica: {
    source: 'static/maps/argonautica.map',
    outDir: 'static/maps/argonautica',
    title: 'The Voyage of the Argo',
    nativeZoom: 2,
    maxZoom: 4,
    tileSize: 512,
    quality: 82,
  },
}

async function exportMap(name, config, overrides) {
  const settings = { ...config, ...overrides }
  const sourcePath = join(repoRoot, settings.source)
  const outDir = join(repoRoot, settings.outDir)

  console.log(`\n${name}`)
  console.log(`  source   ${settings.source} (${mb(statSync(sourcePath).size)})`)

  const map = readMapFile(sourcePath)
  console.log(`  project  "${map.mapName}" · FMG ${map.version} · saved ${map.savedOn} · ${map.width}x${map.height}`)

  const layerStyles = readLayerStyles(join(fmgDir, 'index.css'))
  const { svg: baseSvg, dropped, visible } = buildBaseSvg(map, fmgDir, layerStyles)
  reportDropped(dropped)
  console.log(`  base     ${mb(map.svg.length)} of SVG reduced to ${mb(baseSvg.length)}`)

  mkdirSync(outDir, { recursive: true })

  const tiles = await renderTiles({
    svg: baseSvg,
    width: map.width,
    height: map.height,
    outDir: join(outDir, 'tiles'),
    maxZoom: settings.maxZoom,
    nativeZoom: settings.nativeZoom,
    tileSize: settings.tileSize,
    quality: settings.quality,
  })
  reportTiles(tiles)

  const fonts = await buildFontFaces(map.fonts, {
    cacheDir: join(here, '.cache/fonts'),
    outDir: join(outDir, 'fonts'),
    // Resolved against the stylesheet's own URL, so it survives a base-url build.
    publicPath: 'fonts',
  })
  if (fonts.css) writeFileSync(join(outDir, 'fonts.css'), fonts.css)
  if (fonts.embedded.length) console.log(`  fonts    mirrored ${fonts.embedded.join(', ')}`)
  if (fonts.failed.length) {
    console.warn(`  WARNING  could not download ${fonts.failed.join(', ')}; the map will request them from Google Fonts`)
  }

  const overlay = buildOverlay(map, { symbols: readSymbols(join(fmgDir, 'index.html')), layerStyles })
  writeFileSync(join(outDir, 'overlay.svg'), overlay)

  reportCoverage(map, visible, baseSvg, overlay, join(fmgDir, 'index.css'))

  const { features, orphaned } = buildFeatures(map)
  const routes = buildRoutes(map)

  const manifest = {
    name,
    title: settings.title,
    mapName: map.mapName,
    generator: `FMG ${map.version}`,
    savedOn: map.savedOn,
    source: settings.source,
    width: map.width,
    height: map.height,
    tileSize: settings.tileSize,
    minZoom: 0,
    maxZoom: settings.maxZoom,
    nativeZoom: settings.nativeZoom,
    fontsCss: fonts.css ? 'fonts.css' : null,
    // FMG measures distance as mapUnits * distanceScale.
    unitsToDistance: map.distanceScale,
    distanceUnit: map.distanceUnit,
    coordinates: map.coordinates,
    legend: buildLegend(map.svg),
    routes,
    features,
  }
  writeFileSync(join(outDir, 'map.json'), JSON.stringify(manifest))

  const withNotes = features.filter((feature) => feature.note).length
  console.log(`  overlay  ${kb(overlay.length)}`)
  console.log(
    `  data     ${kb(JSON.stringify(manifest).length)} · ${features.length} features (${withNotes} annotated) · ${routes.length} routes`,
  )
  for (const route of routes) console.log(`             ${route.name}: ${route.points.length} points`)
  if (orphaned.length) {
    console.warn(`  WARNING  ${orphaned.length} note(s) reference shapes not on the map: ${orphaned.map((n) => n.id).join(', ')}`)
  }

  const total = tiles.levels.reduce((sum, level) => sum + level.bytes, 0) + overlay.length + JSON.stringify(manifest).length
  console.log(`  TOTAL    ${mb(total)} published, from a ${mb(statSync(sourcePath).size)} project`)
}

/**
 * Every layer the author left switched on should end up in the tiles, in the
 * overlay, or on the deliberate withheld list. Anything else is content quietly
 * missing from the published map — which is exactly how `#coordinateLabels`
 * went astray once.
 */
function reportCoverage(map, visible, baseSvg, overlay, cssPath) {
  const published = [...groupIds(baseSvg), ...groupIds(overlay)]
  const accounted = new Set([...published, 'textPaths', ...WITHHELD_LAYERS, ...descendantGroupIds(map.svg, WITHHELD_LAYERS)])

  const missing = visible.filter((id) => !accounted.has(id))
  if (missing.length) {
    console.warn(`  WARNING  visible in the editor but not published: ${missing.join(', ')}`)
  }

  // Declarations too specific to become an attribute on the group itself. Only
  // layers that actually carry shapes matter; a rule on an empty group cannot
  // change anything.
  const drawn = published.filter((id) => groupHasContent(overlay, id) || groupHasContent(baseSvg, id))
  const unapplied = findUnappliedRules(cssPath, drawn)
  if (unapplied.length) {
    console.warn(`  WARNING  stylesheet rules that cannot be flattened onto a published layer:`)
    for (const rule of unapplied) console.warn(`             ${rule}`)
  }
}

function reportDropped(dropped) {
  const entries = Object.entries(dropped)
    .filter(([, bytes]) => bytes > 1024)
    .sort((a, b) => b[1] - a[1])
  if (entries.length) {
    console.log(`  dropped  ${entries.map(([id, bytes]) => `${id} (${mb(bytes)})`).join(', ')}`)
  }
}

function reportTiles({ levels, renderedWidth, renderMs }) {
  console.log(`  render   ${renderedWidth}px wide in ${(renderMs / 1000).toFixed(1)}s`)
  for (const level of levels) {
    console.log(
      `    z${level.z}  ${String(level.width).padStart(5)}x${String(level.height).padEnd(5)} ${String(level.tiles).padStart(4)} tiles  ${kb(level.bytes)}`,
    )
  }
}

const mb = (bytes) => `${(bytes / 1e6).toFixed(2)} MB`
const kb = (bytes) => `${Math.round(bytes / 1024)} KB`

function parseArguments(argv) {
  const names = []
  const overrides = {}

  for (let i = 0; i < argv.length; i += 1) {
    const argument = argv[i]
    if (argument === '--max-zoom') overrides.maxZoom = Number(argv[(i += 1)])
    else if (argument === '--quality') overrides.quality = Number(argv[(i += 1)])
    else if (argument.startsWith('--')) throw new Error(`unknown option ${argument}`)
    else names.push(argument)
  }

  return { names: names.length ? names : Object.keys(MAPS), overrides }
}

const { names, overrides } = parseArguments(process.argv.slice(2))
for (const name of names) {
  if (!MAPS[name]) throw new Error(`unknown map "${name}"; known maps: ${Object.keys(MAPS).join(', ')}`)
  await exportMap(name, MAPS[name], overrides)
}
console.log()
