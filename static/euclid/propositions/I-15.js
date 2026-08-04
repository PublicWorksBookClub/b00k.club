/**
 * I.15. The figure I.15 supposes: two straight lines cutting one another.
 *
 * Book I as the sketchpad carries it out. Editing this file changes the app
 * itself: the figure everybody opens, not a sketch kept in one browser. It can
 * be written by hand or saved out of the sketchpad — ⋯ → "Save this
 * proposition" — which is the same thing, since this is all it ever was.
 */

export default {
  id: 'euclid.I.15',
  ref: 'I.15',
  name: 'Two lines cutting one another',
  theorem: true,
  summary: 'The figure I.15 supposes: two straight lines cutting one another.',
  note: 'Two straight lines drawn across each other, and the point they cut in. The vertical angles are there to be '
    + 'read off as soon as the figure exists — this is the shortest supposition in Book I, and the claim is the '
    + 'whole of the work.',
  inputs: [
    { id: 'i0', kind: 'point', label: 'A' },
    { id: 'i1', kind: 'point', label: 'B' },
    { id: 'i2', kind: 'point', label: 'C' },
    { id: 'i3', kind: 'point', label: 'D' },
  ],
  body: [
    { op: 'segment', id: 'l0', a: 'i0', b: 'i1', color: 'black' },
    { op: 'segment', id: 'l1', a: 'i2', b: 'i3', color: 'red' },
    { op: 'inter', id: 'l2', c1: 'l0', c2: 'l1', branch: 0 },
  ],
  outputs: ['l0', 'l1', 'l2'],
  names: {
    l2: 'the point in which {0}{1} and {2}{3} cut one another',
  },
  uses: [],
  demo: {
    points: [
      { x: -170, y: -70 },
      { x: 170, y: 60 },
      { x: -150, y: 90 },
      { x: 160, y: -80 },
    ],
  },
}
