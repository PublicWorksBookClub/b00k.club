/**
 * I.16. The figure I.16 and I.32 suppose: a triangle with one of its sides
 * produced.
 *
 * Book I as the sketchpad carries it out. Editing this file changes the app
 * itself: the figure everybody opens, not a sketch kept in one browser. It can
 * be written by hand or saved out of the sketchpad — ⋯ → "Save this
 * proposition" — which is the same thing, since this is all it ever was.
 */

export default {
  id: 'euclid.I.16',
  ref: 'I.16',
  name: 'A triangle with a side produced',
  theorem: true,
  summary: 'The figure I.16 and I.32 suppose: a triangle with one of its sides produced.',
  note: 'A triangle, and Postulate 2 applied to one side. I.16 asks how the external angle at C stands to either of '
    + 'the remote internal ones; I.32 asks what it comes to exactly, and Euclid answers by drawing through C a '
    + 'parallel to AB (I.31), which you have if you have got that far.',
  inputs: [
    { id: 'i0', kind: 'point', label: 'A' },
    { id: 'i1', kind: 'point', label: 'B' },
    { id: 'i2', kind: 'point', label: 'C' },
  ],
  body: [
    { op: 'segment', id: 'l0', a: 'i0', b: 'i1', color: 'black' },
    { op: 'segment', id: 'l1', a: 'i1', b: 'i2', color: 'red' },
    { op: 'segment', id: 'l2', a: 'i2', b: 'i0', color: 'blue' },
    { op: 'ray', id: 'l3', a: 'i0', b: 'i2', working: true, remark: 'Postulate 2 carries AC past C so D can be taken on it. Byrne draws the side and its production as two lines in two colours, not as one line with a ray laid over it, so the ray itself is working.' },
    { op: 'onCurve', id: 'l4', curve: 'l3', t: 1.4 },
    { op: 'segment', id: 'l5', a: 'i2', b: 'l4', color: 'yellow' },
  ],
  outputs: ['l0', 'l1', 'l2', 'l4', 'l5'],
  names: {
    l3: '{0}{2} produced',
    l4: 'a point on {0}{2} produced',
  },
  uses: [],
  demo: {
    points: [
      { x: -150, y: -70 },
      { x: -30, y: 80 },
      { x: 80, y: -30 },
    ],
  },
}
