/**
 * Assets that live in the bundled generator rather than in the `.map` file:
 * the `<symbol>` sprite the settlement icons point at, and the web fonts the
 * author picked for labels.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/** Extract every `<symbol id="icon-…">` from FMG's index.html, keyed by id. */
export function readSymbols(indexHtmlPath) {
  const html = readFileSync(indexHtmlPath, 'utf8')
  const symbols = {}
  for (const [markup, id] of html.matchAll(/<symbol id="(icon-[^"]+)"[\s\S]*?<\/symbol>/g)) {
    symbols[id] = markup
  }
  return symbols
}

/**
 * Mirror the web fonts the map uses into the export and write a stylesheet for
 * them, so the published map makes no third-party requests and the font files
 * stay separately cacheable rather than bloating every overlay fetch.
 *
 * Downloads are cached on disk between runs. If a font cannot be fetched the
 * rule is still written, pointing at the original URL — the map renders either
 * way, and the caller is told so it can report it instead of silently
 * degrading.
 *
 * @returns {{css: string, files: number, embedded: string[], failed: string[]}}
 */
export async function buildFontFaces(fonts, { cacheDir, outDir, publicPath }) {
  const downloadable = fonts.filter((font) => font.src)
  if (!downloadable.length) return { css: '', files: 0, embedded: [], failed: [] }

  mkdirSync(cacheDir, { recursive: true })
  mkdirSync(outDir, { recursive: true })

  const rules = []
  const embedded = []
  const failed = []

  for (const font of downloadable) {
    const url = font.src.match(/url\(([^)]+)\)/)?.[1]?.replace(/['"]/g, '')
    let src = font.src

    if (url) {
      const data = await fetchCached(url, cacheDir)
      if (data) {
        const filename = `${font.family.replace(/[^\w-]+/g, '-')}.woff2`
        writeFileSync(join(outDir, filename), data)
        src = `url("${publicPath}/${filename}") format("woff2")`
        embedded.push(font.family)
      } else {
        failed.push(font.family)
      }
    }

    const range = font.unicodeRange ? ` unicode-range: ${font.unicodeRange};` : ''
    rules.push(`@font-face { font-family: "${font.family}"; src: ${src}; font-display: swap;${range} }`)
  }

  return { css: `${rules.join('\n')}\n`, files: embedded.length, embedded, failed }
}

async function fetchCached(url, cacheDir) {
  const cachePath = join(cacheDir, url.replace(/[^\w.-]+/g, '_'))
  if (existsSync(cachePath)) return readFileSync(cachePath)

  try {
    const response = await fetch(url)
    if (!response.ok) return null

    const data = Buffer.from(await response.arrayBuffer())
    writeFileSync(cachePath, data)
    return data
  } catch {
    return null
  }
}
