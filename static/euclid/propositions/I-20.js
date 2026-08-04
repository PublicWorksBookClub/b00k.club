/**
 * I.20. The figure I.20 supposes: a triangle, and nothing else.
 *
 * Book I as the sketchpad carries it out. Editing this file changes the app
 * itself: the figure everybody opens, not a sketch kept in one browser. It can
 * be written by hand or saved out of the sketchpad — ⋯ → "Save this
 * proposition" — which is the same thing, since this is all it ever was.
 */

export default {
  id: 'euclid.I.20',
  ref: 'I.20',
  name: 'A plain triangle',
  theorem: true,
  summary: 'The figure I.20 supposes: a triangle, and nothing else.',
  note: 'Three points joined. Some of Book I asks nothing more of the figure than that it be a triangle — that any '
    + 'two of its sides are together greater than the third, which the Epicureans said an ass knew, since an ass '
    + 'going for its fodder walks the third side and not the other two.',
  inputs: [
    { id: 'i0', kind: 'point', label: 'A' },
    { id: 'i1', kind: 'point', label: 'B' },
    { id: 'i2', kind: 'point', label: 'C' },
  ],
  body: [
    { op: 'segment', id: 'l0', a: 'i0', b: 'i1', color: 'black' },
    { op: 'segment', id: 'l1', a: 'i1', b: 'i2', color: 'red' },
    { op: 'segment', id: 'l2', a: 'i2', b: 'i0', color: 'blue' },
  ],
  outputs: ['l0', 'l1', 'l2'],
  uses: [],
  demo: {
    points: [
      { x: -160, y: 60 },
      { x: 40, y: 90 },
      { x: -30, y: -100 },
    ],
  },
}
