/**
 * I.10. To bisect a given finite straight line.
 *
 * Book I as the sketchpad carries it out. Editing this file changes the app
 * itself: the figure everybody opens, not a sketch kept in one browser. It can
 * be written by hand or saved out of the sketchpad — ⋯ → "Save this
 * proposition" — which is the same thing, since this is all it ever was.
 */

export default {
  id: 'euclid.I.10',
  ref: 'I.10',
  name: 'Bisect a straight line',
  abbr: '½',
  summary: 'To bisect a given finite straight line.',
  note: 'Given the two ends. Euclid builds the equilateral triangle ABC by I.1 and bisects the angle at C by I.9; '
    + 'that bisector is the straight line through both vertices of the triangle, which is what is drawn here.',
  inputs: [
    { id: 'i0', kind: 'point', label: 'A' },
    { id: 'i1', kind: 'point', label: 'B' },
  ],
  body: [
    { op: 'circle', id: 'l0', o: 'i0', r: 'i1' },
    { op: 'circle', id: 'l1', o: 'i1', r: 'i0' },
    { op: 'inter', id: 'l2', c1: 'l0', c2: 'l1', branch: 0 },
    { op: 'inter', id: 'l3', c1: 'l0', c2: 'l1', branch: 1 },
    { op: 'line', id: 'l4', a: 'l2', b: 'l3', color: 'blue' },
    { op: 'inter', id: 'l6', c1: 'g0', c2: 'l4', branch: 0 },
  ],
  outputs: ['l6'],
  names: {
    l6: 'the middle of {0}{1}',
  },
  given: [
    { from: 'i0', to: 'i1', id: 'g0', color: 'black' },
  ],
  uses: [],
  demo: {
    points: [
      { x: -130, y: 40 },
      { x: 130, y: 40 },
    ],
  },
}
