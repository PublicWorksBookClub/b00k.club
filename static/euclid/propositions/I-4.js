/**
 * I.4. The figure I.4 supposes: two triangles with two sides and the angle
 * between them equal.
 *
 * Book I as the sketchpad carries it out. Editing this file changes the app
 * itself: the figure everybody opens, not a sketch kept in one browser. It can
 * be written by hand or saved out of the sketchpad — ⋯ → "Save this
 * proposition" — which is the same thing, since this is all it ever was.
 */

export default {
  id: 'euclid.I.4',
  ref: 'I.4',
  name: 'Two sides and the angle between',
  theorem: true,
  summary: 'The figure I.4 supposes: two triangles with two sides and the angle between them equal.',
  note: 'Byrne shows two triangles and asks you to see that they must be the same. But a second triangle drawn beside '
    + 'the first is only the same until you drag it. So DE is laid off equal to AB with a circle about D, the angle '
    + 'at D is copied from the angle at A by I.23, and DF is cut off equal to CA the same way. Byrne draws none of '
    + 'that and neither does this, so what you see is his figure; press *working* on the given figure to see the '
    + 'lines it was built with. The hypothesis then holds however hard the figure is shaken, and what remains — '
    + 'that the bases are equal, and the triangles equal in every respect — is the reader\'s to say. E slides round '
    + 'a circle you cannot see: dragging it turns the second triangle without disturbing anything the theorem '
    + 'supposes.',
  inputs: [
    { id: 'i0', kind: 'point', label: 'A' },
    { id: 'i1', kind: 'point', label: 'B' },
    { id: 'i2', kind: 'point', label: 'C' },
    { id: 'i3', kind: 'point', label: 'D' },
  ],
  body: [
    { op: 'segment', id: 'l0', a: 'i0', b: 'i1', color: 'red', thick: true },
    { op: 'segment', id: 'l1', a: 'i1', b: 'i2', color: 'black', thick: true },
    { op: 'segment', id: 'l2', a: 'i2', b: 'i0', color: 'blue', thick: true, remark: 'The first triangle is drawn heavier throughout. Byrne tells corresponding sides apart by weight where the colour is the same, so AB and DE are both red and only one of them is thick.' },
    { op: 'macro', id: 'l3', tool: 'euclid.I.2', args: ['i3', 'i0', 'i1'], out: ['l4', 'l5'], working: ['l4', 'l5'], remark: 'DE equal to AB: the length is carried to D by I.2, and E is taken on the circle it describes, so DE goes on equalling AB however E slides.' },
    { op: 'circle', id: 'l6', o: 'i3', r: 'l4', working: true, color: 'yellow' },
    { op: 'onCurve', id: 'l7', curve: 'l6', t: -2.958 },
    { op: 'macro', id: 'l8', tool: 'euclid.I.23', args: ['i3', 'l7', 'i1', 'i0', 'i2'], out: ['l9', 'l10'], working: ['l9', 'l10'], picks: { side: 0 }, remark: 'The angle at D copied from the angle at A, and DF cut off equal to CA along the arm it makes.' },
    { op: 'macro', id: 'l11', tool: 'euclid.I.2', args: ['i3', 'i2', 'i0'], out: ['l12', 'l13'], working: ['l12', 'l13'] },
    { op: 'circle', id: 'l14', o: 'i3', r: 'l12', working: true, color: 'yellow' },
    { op: 'inter', id: 'l15', c1: 'l10', c2: 'l14', branch: 1 },
    { op: 'segment', id: 'l16', a: 'i3', b: 'l7', color: 'red' },
    { op: 'segment', id: 'l17', a: 'l7', b: 'l15', color: 'black' },
    { op: 'segment', id: 'l18', a: 'l15', b: 'i3', color: 'blue' },
    { op: 'angle', id: 'l19', a: 'i1', v: 'i0', b: 'i2', color: 'yellow', remark: 'The angles the proposition supposes equal, filled in as Byrne fills them: the eye compares two yellow wedges without having to read the letters.' },
    { op: 'angle', id: 'l20', a: 'i0', v: 'i1', b: 'i2', color: 'blue' },
    { op: 'angle', id: 'l21', a: 'i0', v: 'i2', b: 'i1', color: 'red' },
    { op: 'angle', id: 'l22', a: 'l7', v: 'i3', b: 'l15', color: 'yellow' },
    { op: 'angle', id: 'l23', a: 'i3', v: 'l7', b: 'l15', color: 'blue' },
    { op: 'angle', id: 'l24', a: 'i3', v: 'l15', b: 'l7', color: 'red' },
  ],
  outputs: ['l0', 'l1', 'l2', 'l7', 'l15', 'l16', 'l17', 'l18', 'l19', 'l20', 'l21', 'l22', 'l23', 'l24'],
  names: {
    l6: 'the circle about {3} with radius {0}{1}',
    l14: 'the circle about {3} with radius {2}{0}',
    l10: 'the arm at {3} making an angle equal to the angle at {0}',
  },
  uses: ['euclid.I.2', 'euclid.I.23'],
  demo: {
    points: [
      { x: -130, y: 70 },
      { x: -210, y: -50 },
      { x: -60, y: -10 },
      { x: 150, y: 0 },
    ],
  },
}
