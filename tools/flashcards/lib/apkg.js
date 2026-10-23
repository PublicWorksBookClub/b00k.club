/**
 * Read an Anki package (.apkg) into plain objects, using nothing but Node.
 *
 * An .apkg is a zip holding a SQLite collection, a map of media file names,
 * and the media themselves under numbered names. Anki has shipped three
 * layouts of that zip; this reads all of them:
 *
 *   collection.anki21b   current exports: the database and every media file
 *                        zstd-compressed, the media map a protobuf
 *   collection.anki21    "Support older Anki versions": plain SQLite, JSON map
 *   collection.anki2     the oldest: same as above, older schema
 *
 * A current export also carries a collection.anki2, but it is a stub telling
 * old clients to update, so the newest collection present always wins.
 *
 * Node 22 has zstd (`zlib.zstdDecompressSync`) and SQLite (`node:sqlite`)
 * built in, which leaves only the zip and a handful of protobuf fields to read
 * by hand.
 */

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { inflateRawSync, zstdDecompressSync } from 'node:zlib'

const ZSTD_MAGIC = Buffer.from([0x28, 0xb5, 0x2f, 0xfd])

/** Anki's `StockNotetype.OriginalStockKind` for image occlusion. */
export const STOCK_KIND_IMAGE_OCCLUSION = 6

/**
 * Anki's tags for the fields of an image occlusion notetype. They survive the
 * fields being renamed or reordered, so they are read in preference to names.
 */
export const IO_FIELD_TAGS = { 0: 'occlusion', 1: 'image', 2: 'header', 3: 'backExtra', 4: 'comments' }

/**
 * @returns {{
 *   notetypes: Map<string, {name, css, stockKind, fields: {name, ord, tag}[], templates: {name, ord, qfmt, afmt}[]}>,
 *   decks: Map<string, string[]>,   deck id → name split into its path
 *   notes: {id, mid, fields: string[], tags: string[]}[],
 *   cards: {id, nid, did, ord}[],
 *   media: Map<string, () => Buffer>,   name → reader for that file's bytes
 * }}
 */
export function readApkg(buffer) {
  const zip = readZip(buffer)
  const name = ['collection.anki21b', 'collection.anki21', 'collection.anki2'].find((n) => zip.has(n))
  if (!name) throw new Error('no collection.anki2* inside; is this an Anki export?')

  const db = openDatabase(maybeZstd(zip.get(name)()))
  try {
    const modern = hasTable(db, 'notetypes')
    return {
      notetypes: modern ? readNotetypes(db) : readLegacyNotetypes(db),
      decks: modern ? readDecks(db) : readLegacyDecks(db),
      notes: db
        .prepare('SELECT id, mid, flds, tags FROM notes ORDER BY id')
        .all()
        .map((n) => ({
          id: String(n.id),
          mid: String(n.mid),
          fields: n.flds.split('\x1f'),
          tags: n.tags.trim().split(/\s+/).filter(Boolean),
        })),
      cards: db
        .prepare('SELECT id, nid, did, ord FROM cards ORDER BY nid, ord')
        .all()
        .map((c) => ({ id: String(c.id), nid: String(c.nid), did: String(c.did), ord: Number(c.ord) })),
      media: readMediaMap(zip),
    }
  } finally {
    db.close()
  }
}

// ── zip ─────────────────────────────────────────────────────────────────────

/** Entry name → function returning that entry's bytes. Enough of the format for what Anki writes. */
function readZip(buf) {
  let eocd = -1
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 0xffff); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i
      break
    }
  }
  if (eocd < 0) throw new Error('not a zip file')
  const count = buf.readUInt16LE(eocd + 10)
  let at = buf.readUInt32LE(eocd + 16)
  if (count === 0xffff || at === 0xffffffff) throw new Error('zip64 packages are not supported')

  const entries = new Map()
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(at) !== 0x02014b50) throw new Error('corrupt zip central directory')
    const method = buf.readUInt16LE(at + 10)
    const size = buf.readUInt32LE(at + 20)
    const nameLength = buf.readUInt16LE(at + 28)
    const extraLength = buf.readUInt16LE(at + 30)
    const commentLength = buf.readUInt16LE(at + 32)
    const local = buf.readUInt32LE(at + 42)
    const name = buf.toString('utf8', at + 46, at + 46 + nameLength)
    entries.set(name, () => {
      const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28)
      const data = buf.subarray(start, start + size)
      if (method === 0) return data
      if (method === 8) return inflateRawSync(data)
      throw new Error(`zip entry ${name} uses unsupported compression method ${method}`)
    })
    at += 46 + nameLength + extraLength + commentLength
  }
  return entries
}

function maybeZstd(buf) {
  return buf.subarray(0, 4).equals(ZSTD_MAGIC) ? zstdDecompressSync(buf) : buf
}

// ── media ───────────────────────────────────────────────────────────────────

function readMediaMap(zip) {
  const media = new Map()
  if (!zip.has('media')) return media
  const raw = maybeZstd(zip.get('media')())
  const read = (entry) => () => maybeZstd(zip.get(entry)())

  if (raw[0] === 0x7b /* { */) {
    for (const [entry, name] of Object.entries(JSON.parse(raw.toString('utf8')))) media.set(name, read(entry))
    return media
  }
  // MediaEntries { repeated MediaEntry entries = 1 }; MediaEntry { string name = 1; ... }.
  // An entry's place in the list is its file name in the zip, unless it carries
  // legacy_zip_filename (field 255).
  let index = 0
  for (const entry of protobuf(raw)) {
    if (entry.field !== 1) continue
    let name = null
    let entryName = String(index)
    for (const f of protobuf(entry.bytes)) {
      if (f.field === 1) name = f.bytes.toString('utf8')
      if (f.field === 255) entryName = String(f.value)
    }
    if (name !== null && zip.has(entryName)) media.set(name, read(entryName))
    index++
  }
  return media
}

// ── collection ──────────────────────────────────────────────────────────────

function openDatabase(bytes) {
  // node:sqlite opens files, not buffers, so the collection takes a short trip through a temp dir
  const dir = mkdtempSync(join(tmpdir(), 'apkg-'))
  const path = join(dir, 'collection.sqlite')
  writeFileSync(path, bytes)
  const db = new DatabaseSync(path, { readOnly: true })
  const close = db.close.bind(db)
  db.close = () => {
    close()
    rmSync(dir, { recursive: true, force: true })
  }
  return db
}

function hasTable(db, name) {
  return !!db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(name)
}

/** Schema 18 (anki21b): one table each for notetypes, fields and templates, settings as protobuf. */
function readNotetypes(db) {
  const notetypes = new Map()
  for (const nt of db.prepare('SELECT id, name, config FROM notetypes').all()) {
    const config = fieldsOf(nt.config)
    notetypes.set(String(nt.id), {
      name: nt.name,
      css: config.get(3)?.bytes.toString('utf8') ?? '',
      stockKind: config.get(9)?.value ?? 0,
      fields: [],
      templates: [],
    })
  }
  for (const f of db.prepare('SELECT ntid, ord, name, config FROM fields ORDER BY ntid, ord').all()) {
    const tag = fieldsOf(f.config).get(10)?.value
    notetypes.get(String(f.ntid))?.fields.push({ name: f.name, ord: Number(f.ord), tag: tag ?? null })
  }
  for (const t of db.prepare('SELECT ntid, ord, name, config FROM templates ORDER BY ntid, ord').all()) {
    const config = fieldsOf(t.config)
    notetypes.get(String(t.ntid))?.templates.push({
      name: t.name,
      ord: Number(t.ord),
      qfmt: config.get(1)?.bytes.toString('utf8') ?? '',
      afmt: config.get(2)?.bytes.toString('utf8') ?? '',
    })
  }
  return notetypes
}

/** Schema 11 (anki2, anki21): everything is JSON in the single row of `col`. */
function readLegacyNotetypes(db) {
  const models = JSON.parse(db.prepare('SELECT models FROM col').get().models)
  const notetypes = new Map()
  for (const [id, m] of Object.entries(models)) {
    notetypes.set(String(id), {
      name: m.name,
      css: m.css ?? '',
      stockKind: m.originalStockKind ?? 0,
      fields: m.flds.map((f) => ({ name: f.name, ord: f.ord, tag: f.tag ?? null })),
      templates: m.tmpls.map((t) => ({ name: t.name, ord: t.ord, qfmt: t.qfmt, afmt: t.afmt })),
    })
  }
  return notetypes
}

/** Schema 18 stores a deck's path with \x1f between levels; schema 11 with "::". */
function readDecks(db) {
  return new Map(
    db
      .prepare('SELECT id, name FROM decks')
      .all()
      .map((d) => [String(d.id), d.name.split('\x1f')]),
  )
}

function readLegacyDecks(db) {
  const decks = JSON.parse(db.prepare('SELECT decks FROM col').get().decks)
  return new Map(Object.entries(decks).map(([id, d]) => [String(id), d.name.split('::')]))
}

// ── protobuf ────────────────────────────────────────────────────────────────

/** The top-level fields of a protobuf message, last occurrence winning, as Anki's single fields expect. */
function fieldsOf(buf) {
  const fields = new Map()
  if (buf) for (const f of protobuf(Buffer.from(buf))) fields.set(f.field, f)
  return fields
}

/** Walk a protobuf message's fields: varints come back as `value`, length-delimited as `bytes`. */
function* protobuf(buf) {
  let at = 0
  const varint = () => {
    let result = 0
    let shift = 0
    for (;;) {
      const byte = buf[at++]
      result += (byte & 0x7f) * 2 ** shift
      if (byte < 0x80) return result
      shift += 7
    }
  }
  while (at < buf.length) {
    const key = varint()
    const field = Math.floor(key / 8)
    switch (key & 7) {
      case 0:
        yield { field, value: varint() }
        break
      case 1:
        at += 8
        break
      case 2: {
        const length = varint()
        yield { field, bytes: buf.subarray(at, at + length) }
        at += length
        break
      }
      case 5:
        at += 4
        break
      default:
        throw new Error(`unsupported protobuf wire type ${key & 7}`)
    }
  }
}
