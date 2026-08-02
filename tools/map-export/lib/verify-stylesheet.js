/**
 * Guard against the bundled generator drifting away from the declarations that
 * `base-svg.js` flattens by hand.
 *
 * FMG's saved SVG relies on `interactive/index.css` for a handful of rendering
 * declarations (`fill`, `fill-rule`, `stroke`, `mask`, `stroke-linejoin`). If a
 * future version of the generator adds, drops or changes one of those, the
 * tiles would quietly start rendering differently. Rather than trust a comment,
 * every export re-derives the rules from the stylesheet and diffs them.
 */

import { readFileSync } from 'node:fs'

/** Only these properties change what the renderer draws; the rest are UI-only. */
const RENDERING_PROPERTIES = new Set(['fill', 'fill-rule', 'stroke', 'stroke-linejoin', 'mask'])

/**
 * Collect the rendering declarations index.css applies to each `#id` selector.
 * Later rules win, matching cascade order for selectors of equal specificity.
 */
export function readStylesheetRules(cssPath, ids) {
  const css = readFileSync(cssPath, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  const wanted = new Set(ids.map((id) => `#${id}`))
  const rules = {}

  for (const [, selectorList, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = selectorList.split(',').map((selector) => selector.trim())
    const matched = selectors.filter((selector) => wanted.has(selector))
    if (!matched.length) continue

    for (const declaration of body.split(';')) {
      const [property, ...rest] = declaration.split(':')
      const name = property.trim()
      if (!RENDERING_PROPERTIES.has(name)) continue

      const value = rest.join(':').trim()
      for (const selector of matched) {
        rules[selector.slice(1)] ??= {}
        rules[selector.slice(1)][name] = value
      }
    }
  }

  return rules
}

/**
 * Compare the stylesheet against the hand-maintained table.
 *
 * `presentIds` should be every group id that survives into the base SVG, so a
 * rule the generator adds for a layer we never thought about is reported too.
 *
 * @returns {string[]} human-readable drift descriptions; empty means in sync
 */
export function verifyStylesheet(cssPath, flattened, presentIds) {
  const ids = [...new Set([...Object.keys(flattened), ...presentIds])]
  const actual = readStylesheetRules(cssPath, ids)
  const problems = []

  for (const id of ids) {
    const expected = flattened[id] ?? {}
    const found = actual[id] ?? {}

    for (const [property, value] of Object.entries(expected)) {
      if (!(property in found)) {
        problems.push(`#${id} { ${property}: ${value} } is flattened but no longer in index.css`)
      } else if (found[property] !== value) {
        problems.push(`#${id} { ${property} } is "${found[property]}" in index.css but "${value}" in base-svg.js`)
      }
    }

    for (const [property, value] of Object.entries(found)) {
      if (!(property in expected)) {
        problems.push(`#${id} { ${property}: ${value} } is in index.css but not flattened by base-svg.js`)
      }
    }
  }

  return problems
}
