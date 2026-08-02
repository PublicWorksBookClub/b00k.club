/**
 * Small string-level helpers for surgery on the serialised SVG that FMG stores
 * in field 5 of a `.map` file.
 *
 * The document is ~16 MB, so it is treated as text rather than parsed into a
 * DOM: every operation here is a bounded scan, which keeps a full export in the
 * low seconds rather than minutes.
 */

/**
 * Locate a `<g id="...">` element and return the `[start, end)` offsets of the
 * whole element, including its closing tag. Handles nesting and self-closing
 * tags. Returns `null` when the group is absent.
 *
 * `from` picks up the search at an offset. FMG reuses ids such as `village`
 * across `#burgIcons`, `#anchors` and `#burgLabels`, so a caller that already
 * knows which occurrence it means must say so rather than take the first.
 */
export function findGroup(svg, id, from = 0) {
  const start = svg.indexOf(`<g id="${id}"`, from)
  if (start === -1) return null

  const openTagEnd = svg.indexOf('>', start)
  if (openTagEnd === -1) return null
  if (svg[openTagEnd - 1] === '/') return [start, openTagEnd + 1]

  const tags = /<g[\s>]|<\/g>/g
  tags.lastIndex = openTagEnd + 1
  let depth = 1
  let match
  while ((match = tags.exec(svg))) {
    if (match[0] === '</g>') {
      depth -= 1
      if (depth === 0) return [start, match.index + '</g>'.length]
    } else if (svg[svg.indexOf('>', match.index) - 1] !== '/') {
      depth += 1
    }
  }
  return null
}

/** Return the markup of a group, or `''` if it is not present. */
export function getGroup(svg, id) {
  const span = findGroup(svg, id)
  return span ? svg.slice(span[0], span[1]) : ''
}

/** Whether a group actually contains any elements, as opposed to being an empty shell. */
export function groupHasContent(svg, id) {
  const markup = getGroup(svg, id)
  if (!markup) return false

  const body = markup.slice(markup.indexOf('>') + 1, markup.lastIndexOf('</g>'))
  return body.includes('<')
}

/**
 * Remove a list of groups. Returns the new markup plus the byte count removed
 * per id, which the CLI reports so it stays obvious what an export threw away.
 */
export function removeGroups(svg, ids) {
  const removed = {}
  for (const id of ids) {
    const span = findGroup(svg, id)
    if (!span) continue
    removed[id] = span[1] - span[0]
    svg = svg.slice(0, span[0]) + svg.slice(span[1])
  }
  return { svg, removed }
}

/**
 * Add presentation attributes to a group's opening tag, skipping any attribute
 * that is already set inline so the saved document always wins.
 */
export function setGroupAttributes(svg, id, attributes) {
  const start = svg.indexOf(`<g id="${id}"`)
  if (start === -1) return svg

  const tagEnd = svg.indexOf('>', start)
  const insertAt = svg[tagEnd - 1] === '/' ? tagEnd - 1 : tagEnd
  const openTag = svg.slice(start, insertAt)

  const additions = Object.entries(attributes)
    .filter(([name]) => !new RegExp(`[\\s"]${name}=`).test(openTag))
    .map(([name, value]) => ` ${name}="${value}"`)
    .join('')

  return additions ? svg.slice(0, insertAt) + additions + svg.slice(insertAt) : svg
}

/**
 * Pull the ordered coordinate pairs out of a path `d` attribute. Good enough
 * for finding a representative point on a label arc or a river; not a general
 * path parser.
 */
export function pathPoints(d) {
  const numbers = d.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)
  if (!numbers) return []
  const points = []
  for (let i = 0; i + 1 < numbers.length; i += 2) {
    points.push([Number(numbers[i]), Number(numbers[i + 1])])
  }
  return points
}

/** The point halfway along a path's coordinate list, used to anchor popups. */
export function pathMidpoint(d) {
  const points = pathPoints(d)
  return points.length ? points[Math.floor(points.length / 2)] : null
}
