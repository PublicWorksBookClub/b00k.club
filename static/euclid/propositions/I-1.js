/**
 * I.1. On a given finite straight line to construct an equilateral triangle.
 *
 * Book I as the sketchpad carries it out. Editing this file changes the app
 * itself: the figure everybody opens, not a sketch kept in one browser. It can
 * be written by hand or saved out of the sketchpad — ⋯ → "Save this
 * proposition" — which is the same thing, since this is all it ever was.
 */

export default {
  id: 'euclid.I.1',
  ref: 'I.1',
  name: 'Equilateral triangle',
  abbr: '△',
  summary: 'On a given finite straight line to construct an equilateral triangle.',
  note: 'Given the two ends of the line. Two circles are described, each with one end as centre and passing through '
    + 'the other; where they cut is the third vertex.',
  inputs: [
    { id: 'i0', kind: 'point', label: 'A' },
    { id: 'i1', kind: 'point', label: 'B' },
  ],
  body: [
    { op: 'circle', id: 'l0', o: 'i0', r: 'i1', color: 'blue' },
    { op: 'circle', id: 'l1', o: 'i1', r: 'i0', color: 'red' },
    { op: 'inter', id: 'l2', c1: 'l0', c2: 'l1', branch: 1, choose: 'apex', remark: 'The circles cut in two places and either will do. Which one is the reader\'s to say, so the step waits until they have said it.' },
    { op: 'segment', id: 'l3', a: 'i0', b: 'l2', color: 'yellow' },
    { op: 'segment', id: 'l4', a: 'i1', b: 'l2', color: 'red' },
  ],
  outputs: ['l2', 'l3', 'l4'],
  given: [
    ['i0', 'i1', { color: 'black' }],
  ],
  choices: [
    { key: 'apex', prompt: 'Choose which way the triangle is to fall.' },
  ],
  uses: [],
  demo: {
    points: [
      { x: -85, y: 75 },
      { x: 85, y: 75 },
    ],
  },
}
