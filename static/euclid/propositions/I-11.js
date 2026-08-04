/**
 * I.11. From a given point in a given straight line, to draw a straight line
 * at right angles to it.
 *
 * Book I as the sketchpad carries it out. Editing this file changes the app
 * itself: the figure everybody opens, not a sketch kept in one browser. It can
 * be written by hand or saved out of the sketchpad — ⋯ → "Save this
 * proposition" — which is the same thing, since this is all it ever was.
 */

export default {
  id: 'euclid.I.11',
  ref: 'I.11',
  name: 'Perpendicular at a point on a line',
  abbr: '⊥',
  summary: 'From a given point in a given straight line, to draw a straight line at right angles to it.',
  note: 'Given the point A and any other point B of the line. The circle about A through B cuts the line on both '
    + 'sides at equal distances, so A is the midpoint of what it cuts off; the equilateral triangle on that piece '
    + 'has its apex on the perpendicular bisector, which is the line wanted.',
  inputs: [
    { id: 'i0', kind: 'point', label: 'A' },
    { id: 'i1', kind: 'point', label: 'B' },
  ],
  body: [
    { op: 'line', id: 'l0', a: 'i0', b: 'i1', color: 'black' },
    { op: 'circle', id: 'l1', o: 'i0', r: 'i1', color: 'yellow' },
    { op: 'inter', id: 'l2', c1: 'l0', c2: 'l1', branch: 0 },
    { op: 'inter', id: 'l3', c1: 'l0', c2: 'l1', branch: 1 },
    { op: 'circle', id: 'l4', o: 'l2', r: 'l3', color: 'red' },
    { op: 'circle', id: 'l5', o: 'l3', r: 'l2', color: 'blue' },
    { op: 'inter', id: 'l6', c1: 'l4', c2: 'l5', branch: 0 },
    { op: 'line', id: 'l7', a: 'i0', b: 'l6', color: 'blue' },
  ],
  outputs: ['l7'],
  names: {
    l7: 'the perpendicular at {0}',
  },
  given: [
    ['i0', 'i1', { color: 'black' }],
  ],
  uses: [],
  demo: {
    points: [
      { x: 0, y: -40 },
      { x: 150, y: -40 },
    ],
  },
}
