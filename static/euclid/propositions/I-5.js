/**
 * I.5. The figure I.5 supposes: an isosceles triangle with the equal sides
 * produced.
 *
 * Book I as the sketchpad carries it out. Editing this file changes the app
 * itself: the figure everybody opens, not a sketch kept in one browser. It can
 * be written by hand or saved out of the sketchpad — ⋯ → "Save this
 * proposition" — which is the same thing, since this is all it ever was.
 */

export default {
  id: 'euclid.I.5',
  ref: 'I.5',
  name: 'Isosceles triangle',
  abbr: '△=',
  theorem: true,
  summary: 'The figure I.5 supposes: an isosceles triangle with the equal sides produced.',
  note: '"Let ABC be isosceles" is not two free points and a promise. C is taken on the circle about A through B, so '
    + 'AC equals AB by Definition 15 and goes on equalling it however hard the figure is shaken. That is what the '
    + 'sketchpad means by a supposition, and what Euclid means too. The enunciation is about the external angles as '
    + 'well, so the equal sides are produced beyond the base and D and E taken on the productions — the theorem '
    + 'holds wherever they fall. The circle and the produced lines are working: Byrne draws neither, and one press '
    + 'shows both.',
  inputs: [
    { id: 'i0', kind: 'point', label: 'A' },
    { id: 'i1', kind: 'point', label: 'B' },
  ],
  body: [
    { op: 'circle', id: 'l0', o: 'i0', r: 'i1', working: true, color: 'yellow' },
    { op: 'onCurve', id: 'l1', curve: 'l0', t: -1.125 },
    { op: 'segment', id: 'l2', a: 'i0', b: 'i1', color: 'red' },
    { op: 'segment', id: 'l3', a: 'i0', b: 'l1', color: 'red' },
    { op: 'segment', id: 'l4', a: 'i1', b: 'l1', color: 'black' },
    { op: 'ray', id: 'l5', a: 'i0', b: 'i1', working: true, remark: '“If the equal sides be produced” — so they are, and the part beyond the base is drawn as its own line in its own colour, as Byrne draws it. The production itself is working: it lies along AB and would only paint over it.' },
    { op: 'onCurve', id: 'l6', curve: 'l5', t: 1.55 },
    { op: 'ray', id: 'l7', a: 'i0', b: 'l1', working: true },
    { op: 'onCurve', id: 'l8', curve: 'l7', t: 1.55 },
    { op: 'segment', id: 'l9', a: 'i1', b: 'l6', color: 'yellow' },
    { op: 'segment', id: 'l10', a: 'l1', b: 'l8', color: 'yellow' },
  ],
  outputs: ['l1', 'l2', 'l3', 'l4', 'l6', 'l8', 'l9', 'l10'],
  names: {
    l1: 'the third corner',
    l5: '{0}{1} produced',
    l6: 'a point on {0}{1} produced',
  },
  uses: [],
  demo: {
    points: [
      { x: 0, y: -130 },
      { x: -120, y: 60 },
    ],
  },
}
