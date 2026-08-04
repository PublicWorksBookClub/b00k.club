/**
 * I.9. To bisect a given rectilineal angle.
 *
 * Book I as the sketchpad carries it out. Editing this file changes the app
 * itself: the figure everybody opens, not a sketch kept in one browser. It can
 * be written by hand or saved out of the sketchpad — ⋯ → "Save this
 * proposition" — which is the same thing, since this is all it ever was.
 */

export default {
  id: 'euclid.I.9',
  ref: 'I.9',
  name: 'Bisect an angle',
  abbr: '∠',
  summary: 'To bisect a given rectilineal angle.',
  note: 'Given the vertex A and a point on each arm. Euclid cuts off AE equal to AD by I.3 and joins AF, F being the '
    + 'vertex of an equilateral triangle on DE. Here the circle about A does the cutting off directly (I.3 would '
    + 'need I.2 to copy a length that already starts at A), and the bisector is drawn through both vertices of the '
    + 'triangle on DE rather than through A and one of them. It is the same straight line, and it survives the case '
    + 'where the angle is exactly two thirds of a right angle, in which one of those vertices falls on A.',
  inputs: [
    { id: 'i0', kind: 'point', label: 'A' },
    { id: 'i1', kind: 'point', label: 'B' },
    { id: 'i2', kind: 'point', label: 'C' },
  ],
  body: [
    { op: 'onCurve', id: 'l1', curve: 'g0', t: 0.55 },
    { op: 'ray', id: 'l2', a: 'i0', b: 'i2', remark: 'The cut may fall beyond the arm as it was drawn — Euclid takes D at random on AB and cuts AE equal to it from AC without saying that AC must be long enough. Postulate 2 produces the arm as far as is wanted.' },
    { op: 'circle', id: 'l3', o: 'i0', r: 'l1' },
    { op: 'inter', id: 'l4', c1: 'l2', c2: 'l3', branch: 1 },
    { op: 'circle', id: 'l5', o: 'l1', r: 'l4' },
    { op: 'circle', id: 'l6', o: 'l4', r: 'l1' },
    { op: 'inter', id: 'l7', c1: 'l5', c2: 'l6', branch: 0 },
    { op: 'inter', id: 'l8', c1: 'l5', c2: 'l6', branch: 1 },
    { op: 'line', id: 'l9', a: 'l7', b: 'l8', color: 'blue' },
  ],
  outputs: ['l9'],
  names: {
    l9: 'the bisector of the angle at {0}',
  },
  given: [
    { from: 'i0', to: 'i1', id: 'g0', color: 'black' },
    { from: 'i0', to: 'i2', id: 'g1', color: 'black' },
  ],
  uses: [],
  demo: {
    points: [
      { x: -60, y: 80 },
      { x: 140, y: 40 },
      { x: 20, y: -90 },
    ],
  },
}
