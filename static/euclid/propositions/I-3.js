/**
 * I.3. Given two unequal straight lines, to cut off from the greater a
 * straight line equal to the less.
 *
 * Book I as the sketchpad carries it out. Editing this file changes the app
 * itself: the figure everybody opens, not a sketch kept in one browser. It can
 * be written by hand or saved out of the sketchpad — ⋯ → "Save this
 * proposition" — which is the same thing, since this is all it ever was.
 */

export default {
  id: 'euclid.I.3',
  ref: 'I.3',
  name: 'Cut off a lesser length',
  abbr: 'I.3',
  summary: 'Given two unequal straight lines, to cut off from the greater a straight line equal to the less.',
  note: 'Given the two ends A, B of the greater line and the two ends C, D of the less. The length is carried to A '
    + 'by I.2 and swept round by a circle, and where the circle cuts the greater line is the cut. Byrne draws the '
    + 'part cut off solid and the remainder dashed, so the figure says which piece the proposition is about; the '
    + 'greater line itself is drawn once underneath, as working. The lesser line must not begin at A — Euclid '
    + 'passes over the same case in silence.',
  inputs: [
    { id: 'i0', kind: 'point', label: 'A' },
    { id: 'i1', kind: 'point', label: 'B' },
    { id: 'i2', kind: 'point', label: 'C' },
    { id: 'i3', kind: 'point', label: 'D' },
  ],
  body: [
    { op: 'macro', id: 'l0', tool: 'euclid.I.2', args: ['i0', 'i2', 'i3'], out: ['l1', 'l2'], working: ['l2'], remark: 'I.2 is what carries a length across the page: the compass will not do it, and this is the proposition that makes up for it.' },
    { op: 'segment', id: 'l3', a: 'i0', b: 'l1', color: 'red' },
    { op: 'circle', id: 'l4', o: 'i0', r: 'l1', color: 'blue' },
    { op: 'segment', id: 'l5', a: 'i0', b: 'i1', working: true, remark: 'The greater line, drawn once so the circle has something to cut. What is shown is the two pieces it falls into.' },
    { op: 'inter', id: 'l6', c1: 'l5', c2: 'l4', branch: 1 },
    { op: 'segment', id: 'l7', a: 'i0', b: 'l6', color: 'black' },
    { op: 'segment', id: 'l8', a: 'l6', b: 'i1', color: 'black', dash: true },
  ],
  outputs: ['l6', 'l7'],
  names: {
    l3: 'the line at {0} equal to {2}{3}',
    l6: 'the cut on {0}{1}',
    l7: 'the part of {0}{1} equal to {2}{3}',
  },
  given: [
    ['i2', 'i3', { color: 'blue' }],
  ],
  requires: [
    { rel: 'lt', of: [{ kind: 'length', pts: ['i2', 'i3'] }, { kind: 'length', pts: ['i0', 'i1'] }], says: 'The line to be cut off must be the shorter of the two — click the greater first.' },
  ],
  uses: ['euclid.I.2'],
  demo: {
    points: [
      { x: -170, y: 20 },
      { x: 180, y: 20 },
      { x: 150, y: 110 },
      { x: 150, y: 190 },
    ],
  },
}
