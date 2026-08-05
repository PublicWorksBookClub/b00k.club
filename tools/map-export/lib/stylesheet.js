/**
 * Recovers the rendering declarations that the generator's stylesheet supplies
 * and the saved `.map` file does not.
 *
 * FMG serialises `#map` straight out of the live DOM, so anything that came
 * from `interactive/index.css` is simply absent from the saved document. A lot
 * of that is load bearing:
 *
 *   #routes  { fill: none }                     without it the Argo's voyage
 *                                               fills as a black wedge
 *   #rivers  { mask: url(#land) }               without it rivers run out to sea
 *   #markers { text-anchor: middle;             without it every marker's emoji
 *              dominant-baseline: central }     sits down and to the right
 *
 * These were originally transcribed into a table by hand, which is how the
 * marker one went unnoticed. Reading them out of the stylesheet instead means
 * there is nothing to keep in sync: whatever the bundled generator says is what
 * gets applied.
 */

import { readFileSync } from 'node:fs'

/**
 * CSS properties that are also SVG presentation attributes *and* change what is
 * drawn. Interaction and layout properties are deliberately excluded: `cursor`,
 * `user-select` and `pointer-events` belong to whichever application is showing
 * the map — the viewer decides for itself what a reader can click — and
 * `display`/`visibility` would let a stray UI rule blank out a layer.
 */
const RENDERED_PROPERTIES = new Set([
  'alignment-baseline',
  'baseline-shift',
  'clip-path',
  'clip-rule',
  'color',
  'direction',
  'dominant-baseline',
  'fill',
  'fill-opacity',
  'fill-rule',
  'filter',
  'font-family',
  'font-size',
  'font-stretch',
  'font-style',
  'font-variant',
  'font-weight',
  'letter-spacing',
  'marker-end',
  'marker-mid',
  'marker-start',
  'mask',
  'opacity',
  'paint-order',
  'shape-rendering',
  'stop-color',
  'stop-opacity',
  'stroke',
  'stroke-dasharray',
  'stroke-dashoffset',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-miterlimit',
  'stroke-opacity',
  'stroke-width',
  'text-anchor',
  'text-decoration',
  'text-rendering',
  'vector-effect',
  'word-spacing',
  'writing-mode',
])

function eachRule(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)
}

/** Resolve `var(--name)` against the custom properties declared in the same file. */
function resolveVariables(css) {
  const variables = new Map()
  for (const [, , body] of eachRule(css)) {
    for (const [, name, value] of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+)/g)) {
      variables.set(name, value.trim())
    }
  }
  return (value) => value.replace(/var\(\s*(--[\w-]+)\s*\)/g, (whole, name) => variables.get(name) ?? whole)
}

/**
 * Read the stylesheet's rendering declarations, keyed by element id.
 *
 * Only plain `#id` selectors are collected, because those are the only ones
 * that map cleanly onto an attribute on the group itself. Anything more
 * specific is reported by `findUnappliedRules` rather than guessed at.
 *
 * @returns {Record<string, Record<string, string>>}
 */
export function readLayerStyles(cssPath) {
  const css = readFileSync(cssPath, 'utf8')
  const resolve = resolveVariables(css)
  const styles = {}

  for (const [, selectorList, body] of eachRule(css)) {
    const ids = selectorList
      .split(',')
      .map((selector) => selector.trim())
      .filter((selector) => /^#[\w-]+$/.test(selector))
      .map((selector) => selector.slice(1))
    if (!ids.length) continue

    for (const declaration of body.split(';')) {
      const separator = declaration.indexOf(':')
      if (separator === -1) continue

      const property = declaration.slice(0, separator).trim()
      if (!RENDERED_PROPERTIES.has(property)) continue

      // `!important` has no meaning as an attribute.
      const value = resolve(
        declaration
          .slice(separator + 1)
          .replace(/!important/, '')
          .trim(),
      )
      // Later rules win, matching the cascade for selectors of equal specificity.
      for (const id of ids) (styles[id] ??= {})[property] = value
    }
  }

  return styles
}

/**
 * Rules that affect the given ids but are too specific to express as an
 * attribute on the group (`#armies text`, `#debug > text`). None apply to the
 * layers this exporter publishes today; reporting them means a future generator
 * that adds one is noticed rather than quietly mis-rendered.
 *
 * @returns {string[]} human-readable descriptions
 */
export function findUnappliedRules(cssPath, ids) {
  const wanted = new Set(ids)
  const found = []

  for (const [, selectorList, body] of eachRule(readFileSync(cssPath, 'utf8'))) {
    const rendered = body
      .split(';')
      .map((declaration) => declaration.split(':')[0]?.trim())
      .filter((property) => RENDERED_PROPERTIES.has(property))
    if (!rendered.length) continue

    for (const raw of selectorList.split(',')) {
      const selector = raw.trim().replace(/\s+/g, ' ')
      if (/^#[\w-]+$/.test(selector)) continue

      const id = selector.match(/^#([\w-]+)[\s>~+]/)?.[1]
      if (id && wanted.has(id)) found.push(`${selector} { ${rendered.join('; ')} }`)
    }
  }

  return found
}
