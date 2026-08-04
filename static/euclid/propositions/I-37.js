/**
 * I.37. The figure I.37 supposes: two triangles on the same base, their
 * apexes on one parallel to it.
 *
 * Book I as the sketchpad carries it out. Editing this file changes the app
 * itself: the figure everybody opens, not a sketch kept in one browser. It can
 * be written by hand or saved out of the sketchpad — ⋯ → "Save this
 * proposition" — which is the same thing, since this is all it ever was.
 */

export default {
  id: 'euclid.I.37',
  ref: 'I.37',
  name: 'Two triangles on one base',
  theorem: true,
  summary: 'The figure I.37 supposes: two triangles on the same base, their apexes on one parallel to it.',
  note: 'The base AB, a parallel to it through C by I.31, and a second apex D taken on that parallel. "Between the '
    + 'same parallels" is then true by construction rather than by eye: D slides along the parallel and never '
    + 'leaves it, so the two triangles go on having the same base and the same height however the figure is pulled '
    + 'about. Their contents are what I.37 asks you to compare.',
  inputs: [
    { id: 'i0', kind: 'point', label: 'A' },
    { id: 'i1', kind: 'point', label: 'B' },
    { id: 'i2', kind: 'point', label: 'C' },
  ],
  body: [
    { op: 'segment', id: 'l0', a: 'i0', b: 'i1', color: 'black' },
    { op: 'macro', id: 'l1', tool: 'euclid.I.31', args: ['i2', 'i0', 'i1'], out: ['l2'] },
    { op: 'onCurve', id: 'l3', curve: 'l2', t: -0.54 },
    { op: 'segment', id: 'l4', a: 'i2', b: 'i0', color: 'red' },
    { op: 'segment', id: 'l5', a: 'i2', b: 'i1', color: 'red' },
    { op: 'segment', id: 'l6', a: 'l3', b: 'i0', color: 'blue' },
    { op: 'segment', id: 'l7', a: 'l3', b: 'i1', color: 'blue' },
  ],
  outputs: ['l0', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7'],
  names: {
    l2: 'the parallel to {0}{1} through {2}',
    l3: 'the second apex, on the parallel through {2}',
  },
  uses: ['euclid.I.31'],
  demo: {
    points: [
      { x: -160, y: 80 },
      { x: 120, y: 80 },
      { x: -90, y: -80 },
    ],
  },
}
