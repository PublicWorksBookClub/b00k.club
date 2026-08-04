/**
 * I.2. To place at a given point (as an extremity) a straight line equal to
 * a given straight line.
 *
 * Book I as the sketchpad carries it out. Editing this file changes the app
 * itself: the figure everybody opens, not a sketch kept in one browser. It can
 * be written by hand or saved out of the sketchpad — ⋯ → "Save this
 * proposition" — which is the same thing, since this is all it ever was.
 */

export default {
  id: 'euclid.I.2',
  ref: 'I.2',
  name: 'Carry a length to a point',
  abbr: 'I.2',
  summary: 'To place at a given point (as an extremity) a straight line equal to a given straight line.',
  note: 'Given the point A and the two ends B, C of the line to be copied. This is the proposition that makes the '
    + 'compass collapsible: it copies a length without ever carrying one across the page.',
  inputs: [
    { id: 'i0', kind: 'point', label: 'A' },
    { id: 'i1', kind: 'point', label: 'B' },
    { id: 'i2', kind: 'point', label: 'C' },
  ],
  body: [
    { op: 'segment', id: 'l0', a: 'i0', b: 'i1', color: 'black', dash: true },
    { op: 'macro', id: 'l1', tool: 'euclid.I.1', args: ['i0', 'i1'], out: ['l2', 'l3', 'l4'], picks: { apex: 0 } },
    { op: 'ray', id: 'l5', a: 'l2', b: 'i0', color: 'red' },
    { op: 'ray', id: 'l6', a: 'l2', b: 'i1', color: 'red' },
    { op: 'circle', id: 'l7', o: 'i1', r: 'i2', color: 'blue' },
    { op: 'inter', id: 'l8', c1: 'l6', c2: 'l7', branch: 1 },
    { op: 'circle', id: 'l9', o: 'l2', r: 'l8', color: 'red' },
    { op: 'inter', id: 'l10', c1: 'l5', c2: 'l9', branch: 1 },
    { op: 'segment', id: 'l11', a: 'i0', b: 'l10', color: 'blue' },
  ],
  outputs: ['l10', 'l11'],
  given: [
    ['i1', 'i2', { color: 'black' }],
  ],
  uses: ['euclid.I.1'],
  demo: {
    points: [
      { x: 0, y: 0 },
      { x: -60, y: 60 },
      { x: -200, y: 33 },
    ],
  },
}
