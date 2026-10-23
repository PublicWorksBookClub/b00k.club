#!/usr/bin/env node
/**
 * Turn the Anki packages under static/flashcards/ into decks /flashcards/ can study.
 *
 * Every directory holding an .apkg is a deck, and the directories inside it are
 * its subdecks. Beside each package this writes
 *
 *   deck.json   the cards, in a form the study page reads directly
 *   media/      the pictures those cards use, under their names in Anki
 *
 * and, once for the lot, static/flashcards/index.json: the tree of decks the
 * page lists. All of it is generated; commit it with the package.
 *
 * Subdecks made inside Anki (`Greek::Verbs`) come through as subdecks too, so
 * a deck exported together with its children needs no splitting up.
 *
 * Only image occlusion cards are read so far. Any other kind is counted and
 * left out, and the run says so.
 *
 * Usage: pnpm flashcards
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { readApkg } from './lib/apkg.js'
import { fieldRoles, imageName, isImageOcclusion, parseShapes, shapeStyle } from './lib/image-occlusion.js'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '../../static/flashcards')

/** Bump when deck.json or index.json change shape, so a stale page and fresh data can tell. */
const FORMAT = 1

/** Directory names that are never decks: our own output, and anything hidden. */
const isDeckDir = (name) => name !== 'media' && !name.startsWith('.') && !name.startsWith('_')

function main() {
  if (!existsSync(root)) throw new Error(`${root} does not exist`)
  const decks = readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory() && isDeckDir(e.name))
    .map((e) => e.name)
    .sort(collate)
    .map((name) => walk(name))
    .filter(Boolean)
  writeJson(join(root, 'index.json'), { format: FORMAT, decks })
  console.log(`\nwrote static/flashcards/index.json (${decks.length} top-level deck${decks.length === 1 ? '' : 's'})`)
}

/** One directory of the tree: its own package, if it has one, and its subdirectories. */
function walk(rel) {
  const dir = join(root, rel)
  const entries = readdirSync(dir, { withFileTypes: true })
  const packages = entries.filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.apkg')).map((e) => e.name)
  if (packages.length > 1) throw new Error(`${rel}/ holds ${packages.length} packages (${packages.join(', ')}); a deck directory takes one`)

  const deck = packages.length ? exportDeck(rel, packages[0]) : removeStale(rel)
  const children = entries
    .filter((e) => e.isDirectory() && isDeckDir(e.name))
    .map((e) => e.name)
    .sort(collate)
    .map((name) => walk(`${rel}/${name}`))
    .filter(Boolean)
  if (!deck && !children.length) return null

  const own = deck ? [{ deck: `${href(rel)}/deck.json`, within: [] }] : []
  return {
    id: rel,
    title: deck?.title ?? basename(rel),
    cards: (deck?.cards.length ?? 0) + children.reduce((n, c) => n + c.cards, 0),
    ...(deck && { apkg: `${href(rel)}/${encodeURIComponent(packages[0])}` }),
    sources: [...own, ...children.flatMap((c) => c.sources)],
    children: [...(deck ? subdecks(rel, deck.cards, []) : []), ...children],
  }
}

/** Subdecks made inside Anki, as nodes of the same tree, studied from the parent's deck.json. */
function subdecks(rel, cards, within) {
  const names = [...new Set(cards.filter((c) => c.deck.length > within.length).map((c) => c.deck[within.length]))].sort(collate)
  return names.map((name) => {
    const path = [...within, name]
    const inside = cards.filter((c) => path.every((p, i) => c.deck[i] === p))
    return {
      id: `${rel}::${path.join('::')}`,
      title: name,
      cards: inside.length,
      sources: [{ deck: `${href(rel)}/deck.json`, within: path }],
      children: subdecks(rel, inside, path),
    }
  })
}

function exportDeck(rel, file) {
  const dir = join(root, rel)
  console.log(`\n${rel}/${file}`)
  const apkg = readApkg(readFileSync(join(dir, file)))

  const notes = []
  const cards = []
  const media = new Set()
  const skipped = new Map()
  const noteIndex = new Map()

  for (const note of apkg.notes) {
    const notetype = apkg.notetypes.get(note.mid)
    if (!notetype || !isImageOcclusion(notetype)) continue
    const roles = fieldRoles(notetype)
    const field = (role) => (roles[role] !== undefined ? (note.fields[roles[role]] ?? '') : '')
    const image = imageName(field('image'))
    const shapes = parseShapes(field('occlusion'))
    if (!image || !apkg.media.has(image) || !shapes.length) {
      console.warn(
        `  ! note ${note.id}: ${!image ? 'no image' : !apkg.media.has(image) ? `image "${image}" missing from the package` : 'no masks'}, skipped`,
      )
      continue
    }
    const header = withMedia(field('header'), apkg.media, media)
    const backExtra = withMedia(field('backExtra'), apkg.media, media)
    media.add(image)
    noteIndex.set(note.id, notes.length)
    notes.push({
      id: note.id,
      kind: 'image-occlusion',
      image: `media/${encodeURIComponent(image)}`,
      ...(header && { header }),
      ...(backExtra && { backExtra }),
      ...(Object.keys(shapeStyle(notetype.css)).length && { style: shapeStyle(notetype.css) }),
      shapes,
    })
  }

  const decks = []
  const notetypeOf = new Map(apkg.notes.map((n) => [n.id, apkg.notetypes.get(n.mid)]))
  for (const card of apkg.cards) {
    const notetype = notetypeOf.get(card.nid)
    if (!noteIndex.has(card.nid)) {
      if (notetype && !isImageOcclusion(notetype)) skipped.set(notetype.name, (skipped.get(notetype.name) ?? 0) + 1)
      continue
    }
    const note = notes[noteIndex.get(card.nid)]
    // an occlusion card's template ordinal is its cloze number less one
    if (!note.shapes.some((s) => s.cards.includes(card.ord + 1))) continue
    const deck = apkg.decks.get(card.did) ?? []
    decks.push(deck)
    cards.push({ id: card.id, note: noteIndex.get(card.nid), cloze: card.ord + 1, deck })
  }

  // Name the deck after the Anki deck its cards share, and keep only the levels below it.
  const shared = commonPrefix(decks)
  for (const card of cards) card.deck = card.deck.slice(shared.length)
  cards.sort((a, b) => comparePaths(a.deck, b.deck) || compareIds(notes[a.note].id, notes[b.note].id) || a.cloze - b.cloze)
  const title = shared.at(-1) ?? basename(rel)

  rmSync(join(dir, 'media'), { recursive: true, force: true })
  if (media.size) mkdirSync(join(dir, 'media'))
  for (const name of media) {
    if (/[/\\]/.test(name) || name === '.' || name === '..') throw new Error(`refusing media file name "${name}"`)
    writeFileSync(join(dir, 'media', name), apkg.media.get(name)())
  }
  writeJson(join(dir, 'deck.json'), { format: FORMAT, title, notes, cards })

  console.log(
    `  "${title}": ${cards.length} image occlusion card${cards.length === 1 ? '' : 's'} from ${notes.length} note${notes.length === 1 ? '' : 's'}, ${media.size} media file${media.size === 1 ? '' : 's'}`,
  )
  for (const [name, count] of skipped) console.log(`  - skipped ${count} card${count === 1 ? '' : 's'} of "${name}" (not supported yet)`)
  return { title, cards }
}

/** Point a field's `<img src>`s at the deck's media directory, noting which files to copy. */
function withMedia(html, available, used) {
  if (!html.trim()) return ''
  return html.replace(/(<img[^>]*?\ssrc\s*=\s*)(?:"([^"]*)"|'([^']*)')/gi, (whole, start, double, single) => {
    const name = (double ?? single).replace(/&amp;/g, '&')
    if (!available.has(name)) return whole
    used.add(name)
    return `${start}"media/${encodeURIComponent(name)}"`
  })
}

/** A directory that has lost its package keeps nothing we generated for it. */
function removeStale(rel) {
  const dir = join(root, rel)
  for (const name of ['deck.json', 'media']) {
    if (existsSync(join(dir, name))) {
      rmSync(join(dir, name), { recursive: true, force: true })
      console.log(`\n${rel}/: no package any more, removed ${name}`)
    }
  }
  return null
}

function commonPrefix(paths) {
  if (!paths.length) return []
  const prefix = [...paths[0]]
  for (const path of paths) {
    let i = 0
    while (i < prefix.length && prefix[i] === path[i]) i++
    prefix.length = i
  }
  return prefix
}

const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' })
const collate = (a, b) => collator.compare(a, b)

/** Anki's deck order: alphabetical by level, a parent before its children. */
function comparePaths(a, b) {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const c = collate(a[i], b[i])
    if (c) return c
  }
  return a.length - b.length
}

function compareIds(a, b) {
  return a.length - b.length || (a < b ? -1 : a > b ? 1 : 0)
}

function href(rel) {
  return rel.split('/').map(encodeURIComponent).join('/')
}

/** One array item per line: small enough to read, and a re-export diffs by card. */
function writeJson(path, data) {
  const lines = Object.entries(data).map(([key, value]) => {
    const body =
      Array.isArray(value) && value.length ? `[\n${value.map((v) => `    ${JSON.stringify(v)}`).join(',\n')}\n  ]` : JSON.stringify(value)
    return `  ${JSON.stringify(key)}: ${body}`
  })
  writeFileSync(path, `{\n${lines.join(',\n')}\n}\n`)
}

main()
