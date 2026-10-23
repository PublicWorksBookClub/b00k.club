/**
 * Image occlusion notes, from Anki's storage format into what the study page draws.
 *
 * Anki keeps every mask of a note in one cloze field, one cloze per shape:
 *
 *   {{c3::image-occlusion:rect:left=.14:top=.5107:width=.8164:height=.0454:oi=1}}
 *
 * The number is the card the shape belongs to (several shapes may share one,
 * and `c1,2` puts one shape on two cards). Positions are fractions of the
 * image's width and height, so they hold at any size. `oi=1` ("occlude
 * inactive") keeps the shape covered on the other cards too, which is Anki's
 * "hide all, guess one"; without it the shape is only drawn on its own card.
 *
 * The reading of each property follows Anki's reviewer (`imageOcclusion` in
 * aqt/data/web/js/reviewer.js), so a deck looks the same here as in Anki.
 */

import { IO_FIELD_TAGS, STOCK_KIND_IMAGE_OCCLUSION } from './apkg.js'

/** Anki stores a shape's rotation in ten-thousandths of a turn. */
const ANGLE_UNITS = 10000

/** Field names of Anki's stock notetype, for collections too old to carry field tags. */
const IO_FIELD_NAMES = { occlusion: 'Occlusion', image: 'Image', header: 'Header', backExtra: 'Back Extra', comments: 'Comments' }

/** The shape colours a notetype's CSS can override, as the CSS custom properties Anki reads them from. */
const STYLE_PROPERTIES = {
  '--active-shape-color': 'activeColor',
  '--inactive-shape-color': 'inactiveColor',
  '--highlight-shape-color': 'highlightColor',
  '--active-shape-border': 'activeBorder',
  '--inactive-shape-border': 'inactiveBorder',
  '--highlight-shape-border': 'highlightBorder',
}

export function isImageOcclusion(notetype) {
  return notetype.stockKind === STOCK_KIND_IMAGE_OCCLUSION || notetype.templates.some((t) => t.qfmt.includes('imageOcclusion.setup'))
}

/** Field role → index into a note's fields, by Anki's field tags where present, otherwise by name. */
export function fieldRoles(notetype) {
  const roles = {}
  for (const field of notetype.fields) {
    const role = field.tag !== null ? IO_FIELD_TAGS[field.tag] : Object.keys(IO_FIELD_NAMES).find((r) => IO_FIELD_NAMES[r] === field.name)
    if (role && !(role in roles)) roles[role] = field.ord
  }
  return roles
}

/** Shape colours set in the notetype's CSS, if any; the page falls back to Anki's defaults. */
export function shapeStyle(css) {
  const style = {}
  for (const [, property, value] of css.matchAll(/(--[a-z-]+)\s*:\s*([^;}]+)/g)) {
    if (STYLE_PROPERTIES[property]) style[STYLE_PROPERTIES[property]] = value.trim()
  }
  return style
}

/** Every shape in an occlusion field, each with the card numbers it belongs to. */
export function parseShapes(field) {
  const shapes = []
  for (const [, cards, kind, rest] of field.matchAll(
    /\{\{c(\d+(?:,\d+)*)::image-occlusion:(rect|ellipse|polygon|text)((?::[^}]*)?)\}\}/g,
  )) {
    const props = {}
    // split only at a colon that starts the next `name=`, so a text label may contain colons
    for (const part of rest.slice(1).split(/:(?=[A-Za-z]+=)/)) {
      const eq = part.indexOf('=')
      if (eq > 0) props[part.slice(0, eq)] = decodeEntities(part.slice(eq + 1))
    }
    const shape = {
      cards: cards.split(',').map(Number),
      shape: kind,
      left: number(props.left),
      top: number(props.top),
      oi: props.oi === '1',
    }
    const angle = ((number(props.angle) % ANGLE_UNITS) / ANGLE_UNITS) * 360
    if (angle) shape.angle = round(angle)
    if (props.fill) shape.fill = props.fill

    if (kind === 'rect') Object.assign(shape, { width: number(props.width), height: number(props.height) })
    else if (kind === 'ellipse') Object.assign(shape, { rx: number(props.rx), ry: number(props.ry) })
    else if (kind === 'polygon')
      shape.points = (props.points ?? '')
        .split(' ')
        .filter(Boolean)
        .map((p) => p.split(',').map(number))
    else if (kind === 'text') {
      Object.assign(shape, { text: props.text ?? '', scale: number(props.scale) || 1 })
      if (props.fs) shape.fs = number(props.fs)
    }
    shapes.push(shape)
  }
  return shapes
}

/** The first `<img src>` in a field: the picture being occluded. */
export function imageName(field) {
  const match = field.match(/<img[^>]*?\ssrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i)
  return match ? decodeEntities(match[1] ?? match[2] ?? match[3]) : null
}

function number(value) {
  const n = parseFloat(value)
  return Number.isFinite(n) ? n : 0
}

function round(n) {
  return Math.round(n * 1e4) / 1e4
}

export function decodeEntities(text) {
  return text.replace(/&(?:#(\d+)|#x([0-9a-f]+)|(amp|lt|gt|quot|apos|nbsp));/gi, (_, dec, hex, name) => {
    if (dec) return String.fromCodePoint(Number(dec))
    if (hex) return String.fromCodePoint(parseInt(hex, 16))
    return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }[name.toLowerCase()]
  })
}
