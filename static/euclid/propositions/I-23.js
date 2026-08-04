/**
 * I.23. At a given point in a given straight line, to make an angle equal to
 * a given rectilineal angle.
 *
 * Book I as the sketchpad carries it out. Editing this file changes the app
 * itself: the figure everybody opens, not a sketch kept in one browser. It can
 * be written by hand or saved out of the sketchpad — ⋯ → "Save this
 * proposition" — which is the same thing, since this is all it ever was.
 */

export default {
  id: 'euclid.I.23',
  ref: 'I.23',
  name: 'Copy an angle',
  abbr: '∠=',
  summary: 'At a given point in a given straight line, to make an angle equal to a given rectilineal angle.',
  note: 'Given the point A and a point B of the line through it, then a point C on one arm of the angle, its vertex '
    + 'D, and a point E on the other. Euclid cuts DC and DF off equal, joins CF, and builds on AB a triangle with '
    + 'sides equal to those three lines by I.22; the triangles are then equal in every respect by I.8, so the '
    + 'angles at A and D are equal. Here the same triangle is built in place — a circle about A of radius DC, and '
    + 'about the point that cuts off, a circle of radius CF — which saves setting out three separate lines only to '
    + 'copy them back.',
  inputs: [
    { id: 'i0', kind: 'point', label: 'A' },
    { id: 'i1', kind: 'point', label: 'B' },
    { id: 'i2', kind: 'point', label: 'C' },
    { id: 'i3', kind: 'point', label: 'D' },
    { id: 'i4', kind: 'point', label: 'E' },
  ],
  body: [
    { op: 'ray', id: 'l0', a: 'i3', b: 'i4', remark: 'ED and EG cut off equal, and DG joined: the triangle to be copied.' },
    { op: 'circle', id: 'l1', o: 'i3', r: 'i2', color: 'yellow' },
    { op: 'inter', id: 'l2', c1: 'l0', c2: 'l1', branch: 1 },
    { op: 'segment', id: 'l3', a: 'i2', b: 'l2', color: 'red' },
    { op: 'ray', id: 'l4', a: 'i0', b: 'i1', remark: 'The same triangle built on AB. AB is produced as far as is wanted: Euclid\'s line is “unlimited towards” its far end for this very reason.' },
    { op: 'macro', id: 'l5', tool: 'euclid.I.2', args: ['i0', 'i3', 'i2'], out: ['l6', 'l7'], working: ['l6', 'l7'] },
    { op: 'circle', id: 'l8', o: 'i0', r: 'l6', color: 'yellow' },
    { op: 'inter', id: 'l9', c1: 'l4', c2: 'l8', branch: 1 },
    { op: 'macro', id: 'l10', tool: 'euclid.I.2', args: ['l9', 'i2', 'l2'], out: ['l11', 'l12'], working: ['l11', 'l12'] },
    { op: 'circle', id: 'l13', o: 'l9', r: 'l11', color: 'red' },
    { op: 'inter', id: 'l14', c1: 'l8', c2: 'l13', branch: 0, choose: 'side' },
    { op: 'ray', id: 'l15', a: 'i0', b: 'l14', color: 'blue' },
  ],
  outputs: ['l14', 'l15'],
  names: {
    l1: 'the circle about {3} through {2}',
    l8: 'the circle about {0} with radius {3}{2}',
    l13: 'the circle about {l9} with radius {2}{l2}',
    l15: 'the arm of the copied angle at {0}',
    l14: 'a point on the copied arm at {0}',
  },
  given: [
    { from: 'i0', to: 'i1', id: 'g0', color: 'black' },
    { from: 'i3', to: 'i2', id: 'g1', color: 'blue' },
    { from: 'i3', to: 'i4', id: 'g2', color: 'blue' },
  ],
  choices: [
    { key: 'side', prompt: 'Choose which side of the line the angle is to fall.' },
  ],
  uses: ['euclid.I.2'],
  demo: {
    points: [
      { x: -240, y: 60 },
      { x: -160, y: 60 },
      { x: 200, y: 90 },
      { x: 60, y: 120 },
      { x: 120, y: 10 },
    ],
  },
}
