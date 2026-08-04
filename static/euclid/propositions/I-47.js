/**
 * I.47. The figure I.47 supposes: a right-angled triangle with a square on
 * each of its sides.
 *
 * Book I as the sketchpad carries it out. Editing this file changes the app
 * itself: the figure everybody opens, not a sketch kept in one browser. It can
 * be written by hand or saved out of the sketchpad — ⋯ → "Save this
 * proposition" — which is the same thing, since this is all it ever was.
 */

export default {
  id: 'euclid.I.47',
  ref: 'I.47',
  name: 'Squares on a right-angled triangle',
  abbr: '△⊥',
  theorem: true,
  summary: 'The figure I.47 supposes: a right-angled triangle with a square on each of its sides.',
  note: 'The right angle is constructed, not assumed — B is taken on the perpendicular raised at A — so it stays a '
    + 'right angle however the figure is shaken. Then a square on each side by I.46. What remains is to say that '
    + 'the square on the hypotenuse is the other two taken together, and to shake the figure until you believe it.',
  inputs: [
    { id: 'i0', kind: 'point', label: 'A' },
    { id: 'i1', kind: 'point', label: 'C' },
  ],
  body: [
    { op: 'macro', id: 'l0', tool: 'euclid.I.11', args: ['i0', 'i1'], out: ['l1'] },
    { op: 'onCurve', id: 'l2', curve: 'l1', t: 1.5708 },
    { op: 'segment', id: 'l3', a: 'i0', b: 'l2', color: 'red' },
    { op: 'segment', id: 'l4', a: 'l2', b: 'i1', color: 'blue' },
    { op: 'macro', id: 'l5', tool: 'euclid.I.46', args: ['i0', 'l2'], out: ['l6', 'l7', 'l8', 'l9', 'l10'], picks: { side: 1 }, remark: 'Round the triangle the same way each time, so one and the same choice puts all three squares outside it, as Euclid draws them.' },
    { op: 'macro', id: 'l11', tool: 'euclid.I.46', args: ['l2', 'i1'], out: ['l12', 'l13', 'l14', 'l15', 'l16'], picks: { side: 1 } },
    { op: 'macro', id: 'l17', tool: 'euclid.I.46', args: ['i1', 'i0'], out: ['l18', 'l19', 'l20', 'l21', 'l22'], picks: { side: 1 } },
  ],
  outputs: ['l2', 'l3', 'l4', 'l6', 'l7', 'l8', 'l9', 'l10', 'l12', 'l13', 'l14', 'l15', 'l16', 'l18', 'l19', 'l20', 'l21', 'l22'],
  given: [
    ['i0', 'i1', { color: 'black' }],
  ],
  uses: ['euclid.I.11', 'euclid.I.46'],
  demo: {
    points: [
      { x: -60, y: -30 },
      { x: 60, y: -30 },
    ],
  },
}
