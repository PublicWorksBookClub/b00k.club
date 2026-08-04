/**
 * What the reader keeps between visits.
 *
 * The book's whole shape is that each proposition stands on the ones before it,
 * so the toolbox has to outlive the tab — and must not be emptied by opening
 * somebody else's figure.
 */

import test from 'node:test'
import assert from 'node:assert/strict'

// storage.js talks to the browser; a plain object is enough to talk back.
const store = new Map()
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
}

const storage = await import('../src/storage.js')
const { createSketch } = await import('../src/app.js')

test('progress goes out and comes back whole', () => {
  store.clear()
  assert.equal(storage.loadProgress(), null, 'nothing kept to begin with')
  storage.saveProgress({
    tools: [{ id: 'mine', ref: 'mine', name: 'Mine' }],
    facts: [{ id: 'euclid.I.5', ref: 'I.5', name: '∠ABC = ∠ACB', rounds: 200 }],
  })
  const back = storage.loadProgress()
  assert.deepEqual(back.tools.map((t) => t.id), ['mine'])
  assert.deepEqual(back.facts.map((f) => f.ref), ['I.5'])
  storage.forgetProgress()
  assert.equal(storage.loadProgress(), null)
})

test('a toolbox kept in the older shape is still read', () => {
  // The first version stored a bare array of tools. Nobody should lose their
  // toolbox because the format grew a second half.
  store.clear()
  store.set('b00k.euclid.toolbox.v1', JSON.stringify([{ id: 'old', ref: 'old' }]))
  const back = storage.loadProgress()
  assert.deepEqual(back.tools.map((t) => t.id), ['old'])
  assert.deepEqual(back.facts, [])
})

test('opening somebody else\'s figure does not empty your own toolbox', () => {
  const mine = createSketch()
  mine.addTool({ ...mine.tools[0], id: 'mine', ref: 'M', name: 'Mine' })
  mine.restoreFacts([{ id: 'euclid.I.5', ref: 'I.5', name: '…', rounds: 200 }])

  const theirs = createSketch({ toolIds: ['euclid.I.1'] })
  mine.load(theirs.serialize(), { keepTools: true })
  assert.ok(mine.tools.some((t) => t.id === 'mine'), 'my tool survived')
  assert.deepEqual(mine.facts.map((f) => f.ref), ['I.5'], 'and so did what I proved')

  // Without keepTools it is a plain open, and the file's toolbox is the one you get.
  mine.load(theirs.serialize())
  assert.equal(mine.tools.some((t) => t.id === 'mine'), false)
})

test('giving up progress goes back to the first three propositions', () => {
  const app = createSketch()
  app.addTool({ ...app.tools[0], id: 'mine', ref: 'M', name: 'Mine' })
  app.restoreFacts([{ id: 'euclid.I.5', ref: 'I.5', name: '…', rounds: 200 }])
  const steps = app.doc.steps.length

  app.forgetProgress()
  assert.deepEqual(app.tools.map((t) => t.ref), ['I.1', 'I.2', 'I.3'])
  assert.deepEqual(app.facts, [])
  assert.equal(app.doc.steps.length, steps, 'the figure on the paper is not touched')
})

test('a proposition is kept by its number, not by its body', () => {
  // Keeping the body would hand a returning reader the copy that was current
  // when they first visited, rather than the one in the app.
  const app = createSketch()
  app.addTool({ ...app.tools[0], id: 'mine', ref: 'M', name: 'Mine', body: [] })
  const kept = app.progress
  assert.deepEqual(
    kept.tools.map((t) => (t.body ? 'whole' : t.id)),
    ['euclid.I.1', 'euclid.I.2', 'euclid.I.3', 'whole'],
  )
  // The reader's own tool has no home to be read back from, so it is kept
  // whole; the eight of Book I that ship with the app cost a few words each.
  const builtIns = JSON.stringify(kept.tools.filter((t) => !t.body))
  assert.ok(builtIns.length < 100, `the built-ins took ${builtIns.length} characters`)

  const returning = createSketch({ toolIds: [] })
  returning.restoreProgress(kept)
  assert.deepEqual(returning.tools.map((t) => t.ref), ['I.1', 'I.2', 'I.3', 'M'])
  // The built-ins came back from the app, not from what was written down.
  assert.ok(returning.tools[0].body.length > 0, 'and the body is the current one')
})
