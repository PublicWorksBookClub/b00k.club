/**
 * Writing a proposition back out as its own source file.
 *
 * Book I's propositions live one to a file under `propositions/`, and they are
 * ordinary data — so a figure can be corrected in the sketchpad and saved back
 * as the file it came from. Drop the file in, reload, and the correction is
 * what everybody gets: not a sketch kept in one browser, but the app's own
 * starting conditions.
 *
 * The formatting is deliberate and stable. Two people editing the same
 * proposition should produce diffs about the geometry, not about where the
 * line breaks fell.
 */

/** The order a proposition's fields are written in, which is the order they are read in. */
const FIELDS = [
  'id', 'ref', 'name', 'abbr', 'theorem', 'summary', 'note',
  'inputs', 'body', 'outputs', 'names', 'given', 'choices', 'requires', 'uses', 'demo',
]

/** The order a step's fields are written in: what it is, what it is made of, how it looks. */
const STEP_FIELDS = [
  'op', 'id', 'tool', 'x', 'y', 'curve', 't', 'c1', 'c2', 'branch', 'choose',
  'a', 'v', 'b', 'o', 'r', 'args', 'out', 'working', 'picks',
  'color', 'dash', 'thick', 'remark',
]

const quote = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`

/** A number as short as it can be written without changing it. */
const num = (n) => {
  if (!Number.isFinite(n)) return String(n)
  const r = Math.round(n * 1e6) / 1e6
  return String(Object.is(r, -0) ? 0 : r)
}

function value(v, indent) {
  if (v === null) return 'null'
  if (typeof v === 'string') return quote(v)
  if (typeof v === 'number') return num(v)
  if (typeof v === 'boolean') return String(v)
  if (Array.isArray(v)) return `[${v.map((x) => value(x, indent)).join(', ')}]`
  return object(v, indent)
}

function object(obj, indent, order = null) {
  const keys = (order || Object.keys(obj)).filter((k) => obj[k] !== undefined)
  const parts = keys.map((k) => `${k}: ${value(obj[k], indent)}`)
  return `{ ${parts.join(', ')} }`
}

/** One line per step, so a diff points at the move that changed. */
function step(s, indent) {
  const keys = STEP_FIELDS.filter((k) => s[k] !== undefined)
  const extra = Object.keys(s).filter((k) => !STEP_FIELDS.includes(k) && !INTERNAL.has(k) && s[k] !== undefined)
  const parts = [...keys, ...extra].map((k) => `${k}: ${value(s[k], indent)}`)
  return `${indent}{ ${parts.join(', ')} },`
}

/** Fields that belong to a document rather than to a proposition's definition. */
const INTERNAL = new Set(['g', 'setup', 'expanded', 'local', 'given', 'roles', 'role', 'givens', 'colors', 'dashes', 'thicks'])

/** A long string wrapped as a run of concatenated pieces, as the rest of the source is written. */
function prose(text, indent, width = 108) {
  const words = String(text).split(' ')
  const lines = []
  let line = ''
  for (const word of words) {
    if (line && (line + ' ' + word).length > width) {
      lines.push(line)
      line = word
    } else {
      line = line ? line + ' ' + word : word
    }
  }
  if (line) lines.push(line)
  if (lines.length === 1) return quote(text)
  return lines
    .map((l, i) => (i === 0 ? quote(l + ' ') : `${indent}  + ${quote(l + (i === lines.length - 1 ? '' : ' '))}`))
    .join('\n')
}

const LIST_FIELDS = new Set(['inputs', 'body', 'names', 'given', 'choices', 'requires', 'demo'])

function field(key, v, indent) {
  const at = indent + '  '
  if (key === 'body') {
    return `${indent}body: [\n${v.map((s) => step(s, at)).join('\n')}\n${indent}],`
  }
  if (key === 'inputs' || key === 'choices' || key === 'given') {
    if (!v.length) return `${indent}${key}: [],`
    const rows = v.map((x) => `${at}${Array.isArray(x) ? value(x, at) : object(x, at)},`)
    return `${indent}${key}: [\n${rows.join('\n')}\n${indent}],`
  }
  if (key === 'requires') {
    return `${indent}requires: [\n${v.map((x) => `${at}${value(x, at)},`).join('\n')}\n${indent}],`
  }
  if (key === 'names') {
    const rows = Object.entries(v).map(([k, t]) => `${at}${k}: ${quote(t)},`)
    return `${indent}names: {\n${rows.join('\n')}\n${indent}},`
  }
  if (key === 'demo') {
    const rows = (v.points || []).map((p) => `${at}  { x: ${num(p.x)}, y: ${num(p.y)} },`)
    return `${indent}demo: {\n${at}points: [\n${rows.join('\n')}\n${at}],\n${indent}},`
  }
  if ((key === 'note' || key === 'summary') && String(v).length > 100) {
    return `${indent}${key}: ${prose(v, indent)},`
  }
  return `${indent}${key}: ${value(v, indent)},`
}

/**
 * A proposition as the text of its own module.
 *
 * `header` is the sentence or two at the top of the file. It says what the
 * proposition is and, where the sketchpad has taken a different road from
 * Euclid, why — which is exactly the sort of thing that is worth keeping in
 * source control and useless in a browser's local storage.
 */
export function propositionSource(prop) {
  const known = FIELDS.filter((k) => prop[k] !== undefined)
  const rest = Object.keys(prop).filter((k) => !FIELDS.includes(k) && k !== 'header' && prop[k] !== undefined)
  const body = [...known, ...rest].map((k) => field(k, prop[k], '  ')).join('\n')
  const head = prop.header || `${prop.ref}. ${prop.summary || prop.name}`
  return `/**
 * ${wrapComment(head, ' * ')}
 *
 * Book I as the sketchpad carries it out. Editing this file changes the app
 * itself: the figure everybody opens, not a sketch kept in one browser. It can
 * be written by hand or saved out of the sketchpad — ⋯ → "Save this
 * proposition" — which is the same thing, since this is all it ever was.
 */

export default {
${body}
}
`
}

function wrapComment(text, prefix, width = 74) {
  const words = String(text).split(' ')
  const lines = []
  let line = ''
  for (const word of words) {
    if (line && (line + ' ' + word).length > width) {
      lines.push(line)
      line = word
    } else {
      line = line ? line + ' ' + word : word
    }
  }
  if (line) lines.push(line)
  return lines.join('\n' + prefix)
}
