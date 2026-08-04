/**
 * I.46. Upon a given straight line to construct a square.
 *
 * Book I as the sketchpad carries it out. Editing this file changes the app
 * itself: the figure everybody opens, not a sketch kept in one browser. It can
 * be written by hand or saved out of the sketchpad — ⋯ → "Save this
 * proposition" — which is the same thing, since this is all it ever was.
 */

export default {
  id: 'euclid.I.46',
  ref: 'I.46',
  name: 'Square on a line',
  abbr: '□',
  summary: 'Upon a given straight line to construct a square.',
  note: 'Given the two ends of the line. A perpendicular at A by I.11, cut to the length of AB by the circle about A, '
    + 'gives the second side; the other two corners are found by drawing parallels through D and through B by I.31, '
    + 'which meet in the fourth vertex. Two parallels meet in one place and one only, so nothing is left to be '
    + 'chosen after the side the square falls on.',
  inputs: [
    { id: 'i0', kind: 'point', label: 'A' },
    { id: 'i1', kind: 'point', label: 'B' },
  ],
  body: [
    { op: 'macro', id: 'l0', tool: 'euclid.I.11', args: ['i0', 'i1'], out: ['l1'] },
    { op: 'circle', id: 'l2', o: 'i0', r: 'i1', color: 'yellow' },
    { op: 'inter', id: 'l3', c1: 'l1', c2: 'l2', branch: 0, choose: 'side' },
    { op: 'macro', id: 'l4', tool: 'euclid.I.31', args: ['l3', 'i1', 'i0'], out: ['l5'], remark: 'Through D parallel to AB, and through B parallel to AD. Each parallel is drawn through the far point of its line, since I.31 drops a perpendicular to it and the near one is the foot.' },
    { op: 'macro', id: 'l6', tool: 'euclid.I.31', args: ['i1', 'l3', 'i0'], out: ['l7'] },
    { op: 'inter', id: 'l8', c1: 'l5', c2: 'l7', branch: 0 },
    { op: 'segment', id: 'l9', a: 'i0', b: 'l3', color: 'red' },
    { op: 'segment', id: 'l10', a: 'l3', b: 'l8', color: 'blue' },
    { op: 'segment', id: 'l11', a: 'l8', b: 'i1', color: 'yellow' },
  ],
  outputs: ['l3', 'l8', 'l9', 'l10', 'l11'],
  given: [
    ['i0', 'i1', { color: 'black' }],
  ],
  choices: [
    { key: 'side', prompt: 'Choose which side of the line the square is to stand on.' },
  ],
  uses: ['euclid.I.11', 'euclid.I.31'],
  demo: {
    points: [
      { x: -80, y: -70 },
      { x: 80, y: -70 },
    ],
  },
}
