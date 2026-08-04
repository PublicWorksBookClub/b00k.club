/**
 * I.12. To draw a straight line perpendicular to a given straight line from
 * a given point outside it.
 *
 * Book I as the sketchpad carries it out. Editing this file changes the app
 * itself: the figure everybody opens, not a sketch kept in one browser. It can
 * be written by hand or saved out of the sketchpad — ⋯ → "Save this
 * proposition" — which is the same thing, since this is all it ever was.
 */

export default {
  id: 'euclid.I.12',
  ref: 'I.12',
  name: 'Perpendicular from a point off a line',
  abbr: '⊥̸',
  summary: 'To draw a straight line perpendicular to a given straight line from a given point outside it.',
  note: 'Given the point C and two points A, B of the line. The circle about C through A meets the line again at the '
    + 'reflection of A in the foot, so bisecting what it cuts off finds the foot. Euclid takes a point on the far '
    + 'side to be sure the circle reaches across; here the circle is drawn through a point of the line itself, '
    + 'which reaches across for the same reason and needs nothing chosen.',
  inputs: [
    { id: 'i0', kind: 'point', label: 'C' },
    { id: 'i1', kind: 'point', label: 'A' },
    { id: 'i2', kind: 'point', label: 'B' },
  ],
  body: [
    { op: 'line', id: 'l0', a: 'i1', b: 'i2', color: 'black' },
    { op: 'circle', id: 'l1', o: 'i0', r: 'i1', color: 'yellow' },
    { op: 'inter', id: 'l2', c1: 'l0', c2: 'l1', branch: 0 },
    { op: 'inter', id: 'l3', c1: 'l0', c2: 'l1', branch: 1 },
    { op: 'macro', id: 'l4', tool: 'euclid.I.10', args: ['l2', 'l3'], out: ['l5'] },
    { op: 'segment', id: 'l6', a: 'i0', b: 'l5', color: 'blue' },
  ],
  outputs: ['l5', 'l6'],
  names: {
    l5: 'the foot of the perpendicular from {0}',
    l6: 'the perpendicular from {0}',
  },
  given: [
    ['i1', 'i2', { color: 'black' }],
  ],
  uses: ['euclid.I.10'],
  demo: {
    points: [
      { x: 20, y: 110 },
      { x: -140, y: -60 },
      { x: 150, y: -60 },
    ],
  },
}
