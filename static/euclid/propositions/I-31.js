/**
 * I.31. Through a given point to draw a straight line parallel to a given
 * straight line.
 *
 * Book I as the sketchpad carries it out. Editing this file changes the app
 * itself: the figure everybody opens, not a sketch kept in one browser. It can
 * be written by hand or saved out of the sketchpad — ⋯ → "Save this
 * proposition" — which is the same thing, since this is all it ever was.
 */

export default {
  id: 'euclid.I.31',
  ref: 'I.31',
  name: 'Parallel through a point',
  abbr: '∥',
  summary: 'Through a given point to draw a straight line parallel to a given straight line.',
  note: 'Given the point A and two points B, C of the line. Euclid copies an angle by I.23; this drops a '
    + 'perpendicular from A to the line by I.12 and then erects a perpendicular to that at A by I.11, which is '
    + 'parallel by I.28 — available by this point in the book, and a great deal shorter.',
  inputs: [
    { id: 'i0', kind: 'point', label: 'A' },
    { id: 'i1', kind: 'point', label: 'B' },
    { id: 'i2', kind: 'point', label: 'C' },
  ],
  body: [
    { op: 'macro', id: 'l0', tool: 'euclid.I.12', args: ['i0', 'i1', 'i2'], out: ['l1', 'l2'] },
    { op: 'macro', id: 'l3', tool: 'euclid.I.11', args: ['i0', 'l1'], out: ['l4'] },
  ],
  outputs: ['l4'],
  names: {
    l4: 'the parallel through {0}',
  },
  given: [
    ['i1', 'i2', { color: 'black' }],
  ],
  uses: ['euclid.I.11', 'euclid.I.12'],
  demo: {
    points: [
      { x: 0, y: 110 },
      { x: -150, y: -60 },
      { x: 150, y: -60 },
    ],
  },
}
