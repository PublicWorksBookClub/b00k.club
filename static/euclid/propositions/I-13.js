/**
 * I.13. The figure I.13 supposes: a straight line standing upon another.
 *
 * Book I as the sketchpad carries it out. Editing this file changes the app
 * itself: the figure everybody opens, not a sketch kept in one browser. It can
 * be written by hand or saved out of the sketchpad — ⋯ → "Save this
 * proposition" — which is the same thing, since this is all it ever was.
 */

export default {
  id: 'euclid.I.13',
  ref: 'I.13',
  name: 'A line standing on a line',
  theorem: true,
  summary: 'The figure I.13 supposes: a straight line standing upon another.',
  note: 'Nothing here is difficult to build: a straight line AB, a point D taken on it, and a line DC drawn from that '
    + 'point. What the proposition claims is that the two angles at D come to two right angles — which cannot be '
    + 'said until there is a right angle on the page to say it against. Erecting one at D by I.11 is no part of the '
    + 'supposition; it is the proof, and it is yours to make.',
  inputs: [
    { id: 'i0', kind: 'point', label: 'A' },
    { id: 'i1', kind: 'point', label: 'B' },
    { id: 'i2', kind: 'point', label: 'C' },
  ],
  body: [
    { op: 'segment', id: 'l0', a: 'i0', b: 'i1', color: 'black' },
    { op: 'onCurve', id: 'l1', curve: 'l0', t: 0.45 },
    { op: 'segment', id: 'l2', a: 'l1', b: 'i2', color: 'red' },
  ],
  outputs: ['l0', 'l1', 'l2'],
  names: {
    l1: 'the foot of the standing line on {0}{1}',
  },
  uses: [],
  demo: {
    points: [
      { x: -180, y: 40 },
      { x: 180, y: 40 },
      { x: -30, y: -130 },
    ],
  },
}
