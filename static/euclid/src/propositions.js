/**
 * Book I, propositions 1, 2, 3, 9 and 10, written out as tools.
 *
 * These ship in the toolbox so there is something to use on day one, and so the
 * shape of a tool definition is visible to anyone who wants to add more. Every
 * one of them could equally well have been built in the app and saved with the
 * + button — that is the point.
 *
 * Local ids: `i0, i1, …` are the givens, `l0, l1, …` are the steps of the
 * construction, and `outputs` names which of those the tool hands back. A body
 * step of the form `{ op: 'macro' }` invokes an earlier proposition, which is
 * why I.3 works: it stands on I.2, which stands on I.1.
 */

export const PROPOSITIONS = [
  {
    id: 'euclid.I.1',
    ref: 'I.1',
    name: 'Equilateral triangle',
    abbr: '△',
    summary: 'On a given finite straight line to construct an equilateral triangle.',
    note: 'Given the two ends of the line. Two circles are described, each with one end as centre and passing through the other; where they cut is the third vertex.',
    inputs: [
      { id: 'i0', kind: 'point', label: 'A' },
      { id: 'i1', kind: 'point', label: 'B' },
    ],
    body: [
      { op: 'circle', id: 'l0', o: 'i0', r: 'i1', color: 'blue' },
      { op: 'circle', id: 'l1', o: 'i1', r: 'i0', color: 'red' },
      // The circles cut in two places and either will do. Which one is the
      // reader's to say, so the step waits until they have said it.
      { op: 'inter', id: 'l2', c1: 'l0', c2: 'l1', branch: 0, choose: 'apex' },
      { op: 'segment', id: 'l3', a: 'i0', b: 'l2', color: 'yellow' },
      { op: 'segment', id: 'l4', a: 'i1', b: 'l2', color: 'red' },
    ],
    outputs: ['l2', 'l3', 'l4'],
    choices: [{ key: 'apex', prompt: 'Choose which way the triangle is to fall.' }],
    uses: [],
    demo: {
      points: [
        { x: -110, y: 60 },
        { x: 60, y: 60 },
      ],
      join: [['i0', 'i1']],
    },
  },

  {
    id: 'euclid.I.2',
    ref: 'I.2',
    name: 'Carry a length to a point',
    abbr: 'I.2',
    summary: 'To place at a given point (as an extremity) a straight line equal to a given straight line.',
    note: 'Given the point A and the two ends B, C of the line to be copied. This is the proposition that makes the compass collapsible: it copies a length without ever carrying one across the page.',
    inputs: [
      { id: 'i0', kind: 'point', label: 'A' },
      { id: 'i1', kind: 'point', label: 'B' },
      { id: 'i2', kind: 'point', label: 'C' },
    ],
    body: [
      { op: 'segment', id: 'l0', a: 'i0', b: 'i1', color: 'black', dash: true },
      { op: 'macro', id: 'l1', tool: 'euclid.I.1', args: ['i0', 'i1'], out: ['l2', 'l3', 'l4'], picks: { apex: 0 } },
      { op: 'ray', id: 'l5', a: 'l2', b: 'i0', color: 'red' },
      { op: 'ray', id: 'l6', a: 'l2', b: 'i1', color: 'red' },
      { op: 'circle', id: 'l7', o: 'i1', r: 'i2', color: 'blue' },
      { op: 'inter', id: 'l8', c1: 'l6', c2: 'l7', branch: 1 },
      { op: 'circle', id: 'l9', o: 'l2', r: 'l8', color: 'red' },
      { op: 'inter', id: 'l10', c1: 'l5', c2: 'l9', branch: 1 },
      { op: 'segment', id: 'l11', a: 'i0', b: 'l10', color: 'blue' },
    ],
    outputs: ['l10', 'l11'],
    uses: ['euclid.I.1'],
    demo: {
      points: [
        { x: 0, y: 0 },
        { x: -60, y: 60 },
        { x: -200, y: 33 },
      ],
      join: [['i1', 'i2']],
    },
  },

  {
    id: 'euclid.I.3',
    ref: 'I.3',
    name: 'Cut off a lesser length',
    abbr: 'I.3',
    summary: 'Given two unequal straight lines, to cut off from the greater a straight line equal to the less.',
    note: 'Given the two ends A, B of the greater line and the two ends P, Q of the less. The lesser line must not begin at A — Euclid passes over the same case in silence.',
    inputs: [
      { id: 'i0', kind: 'point', label: 'A' },
      { id: 'i1', kind: 'point', label: 'B' },
      { id: 'i2', kind: 'point', label: 'P' },
      { id: 'i3', kind: 'point', label: 'Q' },
    ],
    body: [
      { op: 'macro', id: 'l0', tool: 'euclid.I.2', args: ['i0', 'i2', 'i3'], out: ['l1', 'l2'] },
      { op: 'circle', id: 'l3', o: 'i0', r: 'l1', color: 'blue' },
      { op: 'segment', id: 'l4', a: 'i0', b: 'i1', color: 'black' },
      { op: 'inter', id: 'l5', c1: 'l4', c2: 'l3', branch: 1 },
      { op: 'segment', id: 'l6', a: 'i0', b: 'l5', color: 'red' },
    ],
    outputs: ['l5', 'l6'],
    uses: ['euclid.I.2'],
    demo: {
      points: [
        { x: -150, y: 70 },
        { x: 150, y: 70 },
        { x: -80, y: -80 },
        { x: 30, y: -80 },
      ],
      join: [['i2', 'i3']],
    },
  },

  {
    id: 'euclid.I.9',
    ref: 'I.9',
    name: 'Bisect an angle',
    abbr: '∠',
    summary: 'To bisect a given rectilineal angle.',
    note: 'Given the vertex A and a point on each arm. Euclid cuts off AE equal to AD by I.3 and joins AF, F being the vertex of an equilateral triangle on DE. Here the circle about A does the cutting off directly (I.3 would need I.2 to copy a length that already starts at A), and the bisector is drawn through both vertices of the triangle on DE rather than through A and one of them. It is the same straight line, and it survives the case where the angle is exactly two thirds of a right angle, in which one of those vertices falls on A.',
    inputs: [
      { id: 'i0', kind: 'point', label: 'A' },
      { id: 'i1', kind: 'point', label: 'B' },
      { id: 'i2', kind: 'point', label: 'C' },
    ],
    body: [
      { op: 'segment', id: 'l0', a: 'i0', b: 'i1' },
      { op: 'onCurve', id: 'l1', curve: 'l0', t: 0.55 },
      { op: 'ray', id: 'l2', a: 'i0', b: 'i2' },
      { op: 'circle', id: 'l3', o: 'i0', r: 'l1' },
      { op: 'inter', id: 'l4', c1: 'l2', c2: 'l3', branch: 1 },
      { op: 'circle', id: 'l5', o: 'l1', r: 'l4' },
      { op: 'circle', id: 'l6', o: 'l4', r: 'l1' },
      { op: 'inter', id: 'l7', c1: 'l5', c2: 'l6', branch: 0 },
      { op: 'inter', id: 'l8', c1: 'l5', c2: 'l6', branch: 1 },
      { op: 'line', id: 'l9', a: 'l7', b: 'l8', color: 'blue' },
    ],
    outputs: ['l9'],
    uses: [],
    demo: {
      points: [
        { x: -60, y: 80 },
        { x: 140, y: 40 },
        { x: 20, y: -90 },
      ],
    },
  },

  {
    id: 'euclid.I.10',
    ref: 'I.10',
    name: 'Bisect a straight line',
    abbr: '½',
    summary: 'To bisect a given finite straight line.',
    note: 'Given the two ends. Euclid builds the equilateral triangle ABC by I.1 and bisects the angle at C by I.9; that bisector is the straight line through both vertices of the triangle, which is what is drawn here.',
    inputs: [
      { id: 'i0', kind: 'point', label: 'A' },
      { id: 'i1', kind: 'point', label: 'B' },
    ],
    body: [
      { op: 'circle', id: 'l0', o: 'i0', r: 'i1' },
      { op: 'circle', id: 'l1', o: 'i1', r: 'i0' },
      { op: 'inter', id: 'l2', c1: 'l0', c2: 'l1', branch: 0 },
      { op: 'inter', id: 'l3', c1: 'l0', c2: 'l1', branch: 1 },
      { op: 'line', id: 'l4', a: 'l2', b: 'l3', color: 'blue' },
      { op: 'segment', id: 'l5', a: 'i0', b: 'i1' },
      { op: 'inter', id: 'l6', c1: 'l5', c2: 'l4', branch: 0 },
    ],
    outputs: ['l6'],
    uses: [],
    demo: {
      points: [
        { x: -130, y: 40 },
        { x: 130, y: 40 },
      ],
    },
  },
]

export const PROPOSITION_BY_ID = new Map(PROPOSITIONS.map((p) => [p.id, p]))

/** The tools a fresh toolbox starts with. Postulates 1–3 are not tools; they are the pencil. */
export const DEFAULT_TOOL_IDS = ['euclid.I.1', 'euclid.I.2', 'euclid.I.3']
