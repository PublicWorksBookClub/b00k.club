/**
 * The study view of /flashcards/ (templates/flashcards.html).
 *
 * ?deck=<id> names a deck in /flashcards/index.json, which
 * tools/flashcards/export.js writes. Studying a deck goes through every one of
 * its cards, its subdecks' included: show the answer, then
 *
 *   Again   the card comes back a few cards later
 *   Good    the card is put away for this session
 *
 * until none are left. That is all the scheduling there is; nothing is kept
 * about anyone's studying beyond the session in front of them. The session is
 * saved in localStorage per deck, so a reload or a later visit picks it up
 * where it was left, and Reset starts it over.
 *
 * Each card is drawn by its note's kind (`kinds` below), one entry per kind of
 * Anki note the exporter understands. Only image occlusion so far.
 *
 * The site's content security policy allows no inline style, so nothing here
 * writes element.style: visibility is the `hidden` attribute, and the masks
 * are SVG attributes.
 */

const SVG = 'http://www.w3.org/2000/svg'

/** How many other cards come before one marked Again is seen again. */
const AGAIN_GAP = 3

/** Anki's colours for occlusion masks, used unless the deck's notetype sets its own. */
const ANKI_STYLE = {
  activeColor: '#ff8e8e',
  inactiveColor: '#ffeba2',
  highlightColor: '#ff8e8e00',
  activeBorder: '1px #212121',
  inactiveBorder: '1px #212121',
  highlightBorder: '1px #ff8e8e',
}

const root = document.querySelector('[data-fc-study]')
const part = (name) => root.querySelector(`[data-fc-${name}]`)

/** Card kinds: each takes a card and resolves to its face, `{ element, draw(revealed, masked), canToggle }`. */
const kinds = {
  'image-occlusion': occlusion,
}

let session = null
let face = null
let revealed = false
let masked = true
let drawing = 0

const deckId = new URLSearchParams(location.search).get('deck')
if (root && deckId !== null) start(deckId).catch(fail)

async function start(id) {
  document.querySelector('[data-fc-list]').hidden = true
  root.hidden = false

  const indexUrl = new URL(root.dataset.fcIndex, location.href)
  const index = await getJson(indexUrl)
  const deck = findDeck(index.decks, id)
  if (!deck) throw new Error(`There's no deck called “${id}”.`)
  part('title').textContent = deck.title
  document.title = `${deck.title} | PWBC Flashcards`

  const cards = await loadCards(deck, indexUrl)
  if (!cards.length) throw new Error('This deck has no cards that can be shown here yet.')
  session = openSession(`flashcards:${deck.id}`, cards)

  part('show').addEventListener('click', reveal)
  part('again').addEventListener('click', again)
  part('good').addEventListener('click', good)
  part('toggle').addEventListener('click', toggleMasks)
  // as in Anki on a phone, tapping the card turns it over
  part('face').addEventListener('click', reveal)
  part('reset').addEventListener('click', () => reset(true))
  part('restart').addEventListener('click', () => reset(false))
  part('shuffle').addEventListener('change', (e) => reorder(e.target.checked))
  document.addEventListener('keydown', onKey)
  show()
}

function findDeck(decks, id) {
  for (const deck of decks) {
    if (deck.id === id) return deck
    const found = findDeck(deck.children, id)
    if (found) return found
  }
  return null
}

/** Every card of a deck, in deck order: its own, then its subdecks'. */
async function loadCards(deck, base) {
  const files = new Map()
  for (const source of deck.sources) {
    const url = new URL(source.deck, base).href
    if (!files.has(url)) files.set(url, getJson(url))
  }
  const cards = new Map()
  for (const source of deck.sources) {
    const url = new URL(source.deck, base).href
    const data = await files.get(url)
    for (const card of data.cards) {
      if (cards.has(card.id) || !source.within.every((name, i) => card.deck[i] === name)) continue
      const note = data.notes[card.note]
      if (kinds[note.kind]) cards.set(card.id, { id: card.id, cloze: card.cloze, note, base: url })
    }
  }
  return [...cards.values()]
}

async function getJson(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Couldn't load ${url} (${response.status}).`)
  return response.json()
}

// ── the session ────────────────────────────────────────────────────────────

/**
 * The saved session, or a new one. Saved sessions are trusted only as far as
 * the deck still agrees with them: cards no longer in it are dropped, and any
 * added since join the end of the queue.
 */
function openSession(key, cards) {
  const order = new Map(cards.map((card, i) => [card.id, i]))
  const s = { key, cards: new Map(cards.map((card) => [card.id, card])), order, queue: [], done: [], again: {}, shuffle: false }
  let saved = null
  try {
    saved = JSON.parse(localStorage.getItem(key))
  } catch {}
  if (saved?.v === 1) {
    const seen = new Set()
    const keep = (id) => order.has(id) && !seen.has(id) && seen.add(id)
    s.done = (saved.done ?? []).filter(keep)
    s.queue = (saved.queue ?? []).filter(keep)
    s.again = Object.fromEntries(Object.entries(saved.again ?? {}).filter(([id]) => order.has(id)))
    s.shuffle = !!saved.shuffle
    s.queue.push(...cards.map((card) => card.id).filter((id) => !seen.has(id)))
  } else {
    s.queue = cards.map((card) => card.id)
  }
  return s
}

function save() {
  const { key, queue, done, again, shuffle } = session
  try {
    localStorage.setItem(key, JSON.stringify({ v: 1, queue, done, again, shuffle }))
  } catch {}
}

function again() {
  if (!revealed) return
  const id = session.queue.shift()
  session.again[id] = (session.again[id] ?? 0) + 1
  session.queue.splice(Math.min(AGAIN_GAP, session.queue.length), 0, id)
  save()
  show()
}

function good() {
  if (!revealed) return
  session.done.push(session.queue.shift())
  save()
  show()
}

function reset(ask) {
  const started = session.done.length || Object.keys(session.again).length
  if (ask && started && !confirm('Start this deck over from the beginning?')) return
  session.queue = [...session.cards.keys()]
  session.done = []
  session.again = {}
  if (session.shuffle) shuffle(session.queue)
  save()
  show()
}

/** Shuffle, or restore deck order, everything after the card being shown. */
function reorder(shuffled) {
  session.shuffle = shuffled
  const [current, ...rest] = session.queue
  if (shuffled) shuffle(rest)
  else rest.sort((a, b) => session.order.get(a) - session.order.get(b))
  session.queue = current === undefined ? [] : [current, ...rest]
  save()
}

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[list[i], list[j]] = [list[j], list[i]]
  }
}

// ── showing it ─────────────────────────────────────────────────────────────

function show() {
  draw().catch(fail)
}

async function draw() {
  const total = session.cards.size
  const done = session.done.length
  const marked = Object.keys(session.again).length
  part('progress').max = total
  part('progress').value = done
  part('shuffle').checked = session.shuffle
  part('status').textContent =
    `${done} of ${total} done` +
    (session.queue.length ? ` · ${session.queue.length} to go` : '') +
    (marked ? ` · ${marked} marked Again` : '')

  const finished = !session.queue.length
  part('card').hidden = finished
  part('done').hidden = !finished
  if (finished) {
    face = null
    part('summary').textContent =
      `All ${total} card${total === 1 ? '' : 's'} done` +
      (marked ? `; ${marked} needed another look.` : ', every one right the first time.')
    return
  }

  const card = session.cards.get(session.queue[0])
  const ticket = ++drawing
  // nothing answers the keyboard until the new card is up
  face = null
  revealed = false
  masked = true
  setButtons()
  const next = await kinds[card.note.kind](card)
  if (ticket !== drawing) return
  face = next
  part('face').replaceChildren(face.element)
  setHtml(part('header'), card.note.header, card.base)
  setHtml(part('back-extra'), '', card.base)
  face.draw(revealed, masked)

  const following = session.cards.get(session.queue[1])
  if (following?.note.image) image(new URL(following.note.image, following.base).href).catch(() => {})
}

function reveal() {
  if (revealed || !face) return
  revealed = true
  face.draw(revealed, masked)
  const card = session.cards.get(session.queue[0])
  setHtml(part('back-extra'), card.note.backExtra, card.base)
  setButtons()
  part('good').focus({ preventScroll: true })
}

function toggleMasks() {
  if (!revealed || !face?.canToggle) return
  masked = !masked
  face.draw(revealed, masked)
}

function setButtons() {
  part('show').hidden = revealed
  part('again').hidden = !revealed
  part('good').hidden = !revealed
  part('toggle').hidden = !revealed || !face?.canToggle
}

function onKey(e) {
  if (e.altKey || e.ctrlKey || e.metaKey || !session?.queue.length) return
  // a focused control already answers Space and Enter itself
  const onControl = e.target.closest?.('button, input, select, textarea, a')
  if ((e.key === ' ' || e.key === 'Enter') && !onControl) revealed ? good() : reveal()
  else if (e.key === '1') again()
  else if (e.key === 'm' || e.key === 'M') toggleMasks()
  else return
  e.preventDefault()
}

/** A note's own HTML (a header, the back extra) with anything active taken out and its pictures pointed at the deck. */
function setHtml(target, html, base) {
  const template = document.createElement('template')
  template.innerHTML = html ?? ''
  for (const node of template.content.querySelectorAll('script, style, link, iframe, object, embed')) node.remove()
  for (const node of template.content.querySelectorAll('*')) {
    for (const { name } of [...node.attributes]) if (name.startsWith('on') || name === 'style') node.removeAttribute(name)
  }
  for (const img of template.content.querySelectorAll('img[src]')) img.setAttribute('src', new URL(img.getAttribute('src'), base).href)
  target.replaceChildren(template.content)
  target.hidden = !html
}

function fail(error) {
  console.error(error)
  part('card').hidden = true
  part('done').hidden = true
  part('error').hidden = false
  part('error').textContent = error.message
}

// ── image occlusion ────────────────────────────────────────────────────────

/**
 * One SVG holding the picture and its masks, so the two can't drift apart at
 * any size. Drawn as Anki's reviewer draws it:
 *
 *   front   this card's shapes red; the note's other shapes yellow, if they
 *           are set to stay covered ("hide all, guess one")
 *   back    this card's shapes uncovered, outlined; the others as before
 *
 * and Toggle masks on the back takes every mask away but the text labels.
 */
async function occlusion(card) {
  const { note } = card
  const src = new URL(note.image, card.base).href
  const { naturalWidth: width, naturalHeight: height } = await image(src)
  const style = { ...ANKI_STYLE, ...note.style }

  const masks = svg('g')
  const element = svg('svg', {
    viewBox: `0 0 ${width} ${height}`,
    width,
    height,
    class: 'mx-auto block h-auto max-h-[75vh] max-w-full select-none',
    role: 'img',
    'aria-label': 'Picture with parts masked',
  })
  element.append(svg('image', { href: src, width, height }), masks)

  const mine = note.shapes.filter((s) => s.cards.includes(card.cloze))
  const others = note.shapes.filter((s) => !s.cards.includes(card.cloze) && s.oi)

  function draw(revealed, masked) {
    const layers = [
      [revealed ? [] : mine, style.activeColor, style.activeBorder],
      [others, null, style.inactiveBorder],
      [revealed ? mine : [], style.highlightColor, style.highlightBorder],
    ]
    masks.replaceChildren()
    for (const [shapes, color, border] of layers) {
      for (const s of shapes) {
        if (!masked && s.shape !== 'text') continue
        // a mask may carry its own colour, but only while it isn't the one being asked
        const fill = color ?? (s.fill && s.fill !== ANKI_STYLE.inactiveColor ? s.fill : style.inactiveColor)
        masks.append(shape(s, width, height, fill, border))
      }
    }
  }

  return { element, draw, canToggle: note.shapes.some((s) => s.oi) }
}

function shape(s, width, height, fill, border) {
  const [strokeWidth, stroke] = parseBorder(border)
  const x = s.left * width
  const y = s.top * height
  const paint = {
    fill,
    stroke: strokeWidth ? stroke : 'none',
    'stroke-width': strokeWidth,
    'vector-effect': 'non-scaling-stroke',
    transform: s.angle ? `rotate(${s.angle} ${x} ${y})` : null,
  }
  switch (s.shape) {
    case 'rect':
      return svg('rect', { x, y, width: s.width * width, height: s.height * height, ...paint })
    case 'ellipse':
      return svg('ellipse', { cx: x + s.rx * width, cy: y + s.ry * height, rx: s.rx * width, ry: s.ry * height, ...paint })
    case 'polygon': {
      // Anki moves the outline so that its top-left corner sits at left/top, and never rotates it
      const points = s.points.map(([px, py]) => [px * width, py * height])
      const dx = x - Math.min(...points.map((p) => p[0]))
      const dy = y - Math.min(...points.map((p) => p[1]))
      return svg('polygon', { ...paint, transform: null, points: points.map(([px, py]) => `${px + dx},${py + dy}`).join(' ') })
    }
    case 'text':
      return label(s, width, height)
  }
}

/** A text shape: lines of Arial on a white card, as Anki draws them. */
function label(s, width, height) {
  const scale = s.scale || 1
  const size = s.fs ? s.fs * height : 40
  const x = (s.left * width) / scale
  const y = (s.top * height) / scale
  const lines = s.text.split('\n')
  const lineHeight = size * 1.07
  const measure = document.createElement('canvas').getContext('2d')
  measure.font = `${size}px Arial`
  const textWidth = Math.max(...lines.map((line) => measure.measureText(line).width))

  const group = svg('g', { transform: `scale(${scale})${s.angle ? ` rotate(${s.angle} ${x} ${y})` : ''}` })
  group.append(svg('rect', { x, y, width: textWidth + 5, height: lines.length * lineHeight + 5, fill: '#ffffff' }))
  lines.forEach((line, i) => {
    const text = svg('text', {
      x,
      y: y + i * lineHeight,
      'font-family': 'Arial, sans-serif',
      'font-size': size,
      'dominant-baseline': 'text-before-edge',
      fill: s.fill ?? '#000',
    })
    text.textContent = line
    group.append(text)
  })
  return group
}

function parseBorder(border) {
  const [width, color] = String(border).trim().split(/\s+/)
  const w = parseFloat(width)
  return [Number.isNaN(w) ? 1 : w, color ?? '#212121']
}

function svg(name, attributes = {}) {
  const node = document.createElementNS(SVG, name)
  for (const [key, value] of Object.entries(attributes)) if (value !== null && value !== undefined) node.setAttribute(key, value)
  return node
}

const images = new Map()

/** Load a picture once, however many cards ask for it. */
function image(src) {
  if (!images.has(src)) {
    images.set(
      src,
      new Promise((resolve, reject) => {
        const img = new Image()
        img.addEventListener('load', () => resolve(img))
        img.addEventListener('error', () => {
          images.delete(src)
          reject(new Error(`Couldn't load the picture ${decodeURIComponent(src.split('/').pop())}.`))
        })
        img.src = src
      }),
    )
  }
  return images.get(src)
}
