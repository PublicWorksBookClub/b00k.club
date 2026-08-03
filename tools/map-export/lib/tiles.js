/**
 * Rasterises the base SVG once at the deepest zoom and slices a WebP tile
 * pyramid out of it.
 *
 * Rendering once and downsampling (rather than re-rendering per level) keeps
 * the export to a few seconds and gives cleanly antialiased low zooms, since
 * a Lanczos reduction of the full-detail raster beats asking the rasteriser to
 * draw sub-pixel contours.
 */

import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { Resvg } from '@resvg/resvg-js'
import sharp from 'sharp'

/**
 * @param {object} options
 * @param {string} options.svg base SVG markup
 * @param {number} options.width map width in FMG units
 * @param {number} options.height map height in FMG units
 * @param {string} options.outDir directory to write `{z}/{x}_{y}.webp` into
 * @param {number} options.maxZoom deepest Leaflet zoom level to generate
 * @param {number} options.nativeZoom zoom at which one map unit is one pixel
 * @param {number} options.tileSize edge length of a tile, in pixels
 * @param {number} options.quality WebP quality, 0-100
 */
export async function renderTiles({ svg, width, height, outDir, maxZoom, nativeZoom, tileSize, quality }) {
  const scale = 2 ** (maxZoom - nativeZoom)
  const renderedWidth = Math.round(width * scale)

  const startedAt = Date.now()
  const source = new Resvg(svg, { fitTo: { mode: 'width', value: renderedWidth } }).render().asPng()
  const renderMs = Date.now() - startedAt

  rmSync(outDir, { recursive: true, force: true })

  const levels = []
  for (let z = maxZoom; z >= 0; z -= 1) {
    levels.push(await sliceLevel({ source, z, width, height, nativeZoom, outDir, tileSize, quality }))
  }

  return { levels: levels.reverse(), renderedWidth, renderMs }
}

async function sliceLevel({ source, z, width, height, nativeZoom, outDir, tileSize, quality }) {
  const levelScale = 2 ** (z - nativeZoom)
  const levelWidth = Math.max(1, Math.round(width * levelScale))
  const levelHeight = Math.max(1, Math.round(height * levelScale))

  const levelDir = join(outDir, String(z))
  mkdirSync(levelDir, { recursive: true })

  // Materialise the resized level once; `extract` on a shared raw buffer is far
  // cheaper than re-running the resize for every tile.
  const resized = await sharp(source).resize(levelWidth, levelHeight, { kernel: 'lanczos3' }).png().toBuffer()

  const columns = Math.ceil(levelWidth / tileSize)
  const rows = Math.ceil(levelHeight / tileSize)
  let bytes = 0

  for (let x = 0; x < columns; x += 1) {
    for (let y = 0; y < rows; y += 1) {
      const width = Math.min(tileSize, levelWidth - x * tileSize)
      const height = Math.min(tileSize, levelHeight - y * tileSize)

      const tile = await sharp(resized)
        .extract({ left: x * tileSize, top: y * tileSize, width, height })
        // Tiles along the right and bottom edges are short. Leaflet positions
        // every tile as a full `tileSize` square, so an undersized image would
        // be stretched to fit; pad to square with transparency instead.
        .extend({
          right: tileSize - width,
          bottom: tileSize - height,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .webp({ quality, effort: 5, alphaQuality: 100 })
        .toBuffer()

      writeFileSync(join(levelDir, `${x}_${y}.webp`), tile)
      bytes += tile.length
    }
  }

  return { z, width: levelWidth, height: levelHeight, columns, rows, tiles: columns * rows, bytes }
}
