/**
 * Book I, propositions 1, 2, 3, 9 and 10, written out as tools.
 *
 * These are written out so a reader can watch a proposition being carried out
 * rather than only read about it, and so the shape of a tool definition is
 * visible to anyone who wants to add more. Every one of them could equally
 * well have been built in the app and saved with the + button — that is the
 * point. None of them is given away: reading one through is what earns it.
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
    // "On a given finite straight line" — so AB is part of what the
    // proposition is handed, and is drawn if it is not already there.
    // Byrne draws the given line solid black; the colour of a given is part of
    // the figure, so it travels with the proposition.
    given: [['i0', 'i1', { color: 'black' }]],
    choices: [{ key: 'apex', prompt: 'Choose which way the triangle is to fall.' }],
    uses: [],
    demo: {
      points: [
        { x: -110, y: 60 },
        { x: 60, y: 60 },
      ],
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
    given: [['i1', 'i2', { color: 'black' }]],
    uses: ['euclid.I.1'],
    demo: {
      points: [
        { x: 0, y: 0 },
        { x: -60, y: 60 },
        { x: -200, y: 33 },
      ],
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
    // The greater line AB is drawn by the construction itself; the lesser is given.
    given: [['i2', 'i3', { color: 'black' }]],
    // Cutting a longer piece off a shorter one cannot be done, and saying so
    // beats letting the construction fail somewhere in the middle.
    requires: [
      {
        rel: 'lt',
        of: [
          { kind: 'length', pts: ['i2', 'i3'] },
          { kind: 'length', pts: ['i0', 'i1'] },
        ],
        says: 'The line to be cut off must be the shorter of the two — click the greater first.',
      },
    ],
    uses: ['euclid.I.2'],
    demo: {
      points: [
        { x: -150, y: 70 },
        { x: 150, y: 70 },
        { x: -80, y: -80 },
        { x: 30, y: -80 },
      ],
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
      { op: 'onCurve', id: 'l1', curve: 'g0', t: 0.55 },
      // The cut may fall beyond the arm as it was drawn — Euclid takes D at
      // random on AB and cuts AE equal to it from AC without saying that AC
      // must be long enough. Postulate 2 produces the arm as far as is wanted.
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
    names: { l9: 'the bisector of the angle at {0}' },
    // The angle is what is given, and an angle is its two arms. The body works
    // on those very lines rather than drawing a second pair over them.
    given: [
      { from: 'i0', to: 'i1', id: 'g0', color: 'black' },
      { from: 'i0', to: 'i2', id: 'g1', color: 'black' },
    ],
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
      { op: 'inter', id: 'l6', c1: 'g0', c2: 'l4', branch: 0 },
    ],
    outputs: ['l6'],
    names: { l6: 'the middle of {0}{1}' },
    given: [{ from: 'i0', to: 'i1', id: 'g0', color: 'black' }],
    uses: [],
    demo: {
      points: [
        { x: -130, y: 40 },
        { x: 130, y: 40 },
      ],
    },
  },
  {
    id: 'euclid.I.11',
    ref: 'I.11',
    name: 'Perpendicular at a point on a line',
    abbr: '⊥',
    summary: 'From a given point in a given straight line, to draw a straight line at right angles to it.',
    note: 'Given the point A and any other point B of the line. The circle about A through B cuts the line on both sides at equal distances, so A is the midpoint of what it cuts off; the equilateral triangle on that piece has its apex on the perpendicular bisector, which is the line wanted.',
    inputs: [
      { id: 'i0', kind: 'point', label: 'A' },
      { id: 'i1', kind: 'point', label: 'B' },
    ],
    body: [
      { op: 'line', id: 'l0', a: 'i0', b: 'i1', color: 'black' },
      { op: 'circle', id: 'l1', o: 'i0', r: 'i1', color: 'yellow' },
      { op: 'inter', id: 'l2', c1: 'l0', c2: 'l1', branch: 0 },
      { op: 'inter', id: 'l3', c1: 'l0', c2: 'l1', branch: 1 },
      { op: 'circle', id: 'l4', o: 'l2', r: 'l3', color: 'red' },
      { op: 'circle', id: 'l5', o: 'l3', r: 'l2', color: 'blue' },
      { op: 'inter', id: 'l6', c1: 'l4', c2: 'l5', branch: 0 },
      { op: 'line', id: 'l7', a: 'i0', b: 'l6', color: 'blue' },
    ],
    outputs: ['l7'],
    names: { l7: 'the perpendicular at {0}' },
    given: [['i0', 'i1', { color: 'black' }]],
    uses: [],
    demo: {
      points: [
        { x: 0, y: -40 },
        { x: 150, y: -40 },
      ],
    },
  },

  {
    id: 'euclid.I.12',
    ref: 'I.12',
    name: 'Perpendicular from a point off a line',
    abbr: '⊥̸',
    summary: 'To draw a straight line perpendicular to a given straight line from a given point outside it.',
    note: 'Given the point C and two points A, B of the line. The circle about C through A meets the line again at the reflection of A in the foot, so bisecting what it cuts off finds the foot. Euclid takes a point on the far side to be sure the circle reaches across; here the circle is drawn through a point of the line itself, which reaches across for the same reason and needs nothing chosen.',
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
    names: { l5: 'the foot of the perpendicular from {0}', l6: 'the perpendicular from {0}' },
    given: [['i1', 'i2', { color: 'black' }]],
    uses: ['euclid.I.10'],
    demo: {
      points: [
        { x: 20, y: 110 },
        { x: -140, y: -60 },
        { x: 150, y: -60 },
      ],
    },
  },

  {
    id: 'euclid.I.23',
    ref: 'I.23',
    name: 'Copy an angle',
    abbr: '∠=',
    summary: 'At a given point in a given straight line, to make an angle equal to a given rectilineal angle.',
    note: 'Given the point A and a point B of the line through it, then a point C on one arm of the angle, its vertex D, and a point E on the other. Euclid cuts DC and DF off equal, joins CF, and builds on AB a triangle with sides equal to those three lines by I.22; the triangles are then equal in every respect by I.8, so the angles at A and D are equal. Here the same triangle is built in place — a circle about A of radius DC, and about the point that cuts off, a circle of radius CF — which saves setting out three separate lines only to copy them back.',
    inputs: [
      { id: 'i0', kind: 'point', label: 'A' },
      { id: 'i1', kind: 'point', label: 'B' },
      { id: 'i2', kind: 'point', label: 'C' },
      { id: 'i3', kind: 'point', label: 'D' },
      { id: 'i4', kind: 'point', label: 'E' },
    ],
    body: [
      // ED and EG cut off equal, and DG joined: the triangle to be copied.
      { op: 'ray', id: 'l0', a: 'i3', b: 'i4' },
      { op: 'circle', id: 'l1', o: 'i3', r: 'i2', color: 'yellow' },
      { op: 'inter', id: 'l2', c1: 'l0', c2: 'l1', branch: 1 },
      { op: 'segment', id: 'l3', a: 'i2', b: 'l2', color: 'red' },
      // The same triangle built on AB. AB is produced as far as is wanted:
      // Euclid's line is "unlimited towards" its far end for this very reason.
      { op: 'ray', id: 'l4', a: 'i0', b: 'i1' },
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
    choices: [{ key: 'side', prompt: 'Choose which side of the line the angle is to fall.' }],
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
  },

  {
    id: 'euclid.I.31',
    ref: 'I.31',
    name: 'Parallel through a point',
    abbr: '∥',
    summary: 'Through a given point to draw a straight line parallel to a given straight line.',
    note: 'Given the point A and two points B, C of the line. Euclid copies an angle by I.23; this drops a perpendicular from A to the line by I.12 and then erects a perpendicular to that at A by I.11, which is parallel by I.28 — available by this point in the book, and a great deal shorter.',
    inputs: [
      { id: 'i0', kind: 'point', label: 'A' },
      { id: 'i1', kind: 'point', label: 'B' },
      { id: 'i2', kind: 'point', label: 'C' },
    ],
    body: [
      { op: 'macro', id: 'l0', tool: 'euclid.I.12', args: ['i0', 'i1', 'i2'], out: ['l1', 'l2'] },
      { op: 'macro', id: 'l3', tool: 'euclid.I.11', args: ['i0', 'l1'], out: ['l4'] },
    ],
    outputs: ['l4'],
    names: { l4: 'the parallel through {0}' },
    given: [['i1', 'i2', { color: 'black' }]],
    uses: ['euclid.I.11', 'euclid.I.12'],
    demo: {
      points: [
        { x: 0, y: 110 },
        { x: -150, y: -60 },
        { x: 150, y: -60 },
      ],
    },
  },
  {
    id: 'euclid.I.46',
    ref: 'I.46',
    name: 'Square on a line',
    abbr: '□',
    summary: 'Upon a given straight line to construct a square.',
    note: 'Given the two ends of the line. A perpendicular at A by I.11, cut to the length of AB by the circle about A, gives the second side; the other two corners are found by drawing parallels through D and through B by I.31, which meet in the fourth vertex. Two parallels meet in one place and one only, so nothing is left to be chosen after the side the square falls on.',
    inputs: [
      { id: 'i0', kind: 'point', label: 'A' },
      { id: 'i1', kind: 'point', label: 'B' },
    ],
    body: [
      { op: 'macro', id: 'l0', tool: 'euclid.I.11', args: ['i0', 'i1'], out: ['l1'] },
      { op: 'circle', id: 'l2', o: 'i0', r: 'i1', color: 'yellow' },
      { op: 'inter', id: 'l3', c1: 'l1', c2: 'l2', branch: 0, choose: 'side' },
      // Through D parallel to AB, and through B parallel to AD. Each parallel is
      // drawn through the far point of its line, since I.31 drops a
      // perpendicular to it and the near one is the foot.
      { op: 'macro', id: 'l4', tool: 'euclid.I.31', args: ['l3', 'i1', 'i0'], out: ['l5'] },
      { op: 'macro', id: 'l6', tool: 'euclid.I.31', args: ['i1', 'l3', 'i0'], out: ['l7'] },
      { op: 'inter', id: 'l8', c1: 'l5', c2: 'l7', branch: 0 },
      { op: 'segment', id: 'l9', a: 'i0', b: 'l3', color: 'red' },
      { op: 'segment', id: 'l10', a: 'l3', b: 'l8', color: 'blue' },
      { op: 'segment', id: 'l11', a: 'l8', b: 'i1', color: 'yellow' },
    ],
    outputs: ['l3', 'l8', 'l9', 'l10', 'l11'],
    given: [['i0', 'i1', { color: 'black' }]],
    choices: [{ key: 'side', prompt: 'Choose which side of the line the square is to stand on.' }],
    uses: ['euclid.I.11', 'euclid.I.31'],
    demo: {
      points: [
        { x: -80, y: -70 },
        { x: 80, y: -70 },
      ],
    },
  },
  /*
   * The theorems below build no more than the figure their statement supposes.
   * A theorem asserts rather than constructs, so there is nothing for it to
   * hand back that Euclid would call a result — but the supposition itself has
   * to be built rather than assumed, and building it correctly is the whole
   * difficulty of getting started. So these set out the figure and leave the
   * asserting to the reader.
   */

  {
    id: 'euclid.I.4',
    ref: 'I.4',
    theorem: true,
    name: 'Two sides and the angle between',
    summary: 'The figure I.4 supposes: two triangles with two sides and the angle between them equal.',
    note: 'Byrne shows two triangles and asks you to see that they must be the same. But a second triangle drawn beside the first is only the same until you drag it. So DE is laid off equal to AB with a circle about D, the angle at D is copied from the angle at A by I.23, and DF is cut off equal to CA the same way. Byrne draws none of that and neither does this, so what you see is his figure; press *working* on the given figure to see the lines it was built with. The hypothesis then holds however hard the figure is shaken, and what remains — that the bases are equal, and the triangles equal in every respect — is the reader\'s to say. E slides round a circle you cannot see: dragging it turns the second triangle without disturbing anything the theorem supposes.',
    inputs: [
      { id: 'i0', kind: 'point', label: 'A' },
      { id: 'i1', kind: 'point', label: 'B' },
      { id: 'i2', kind: 'point', label: 'C' },
      { id: 'i3', kind: 'point', label: 'D' },
    ],
    body: [
      { op: 'segment', id: 'l0', a: 'i0', b: 'i1', color: 'red' },
      { op: 'segment', id: 'l1', a: 'i1', b: 'i2', color: 'black' },
      { op: 'segment', id: 'l2', a: 'i2', b: 'i0', color: 'blue' },
      // DE equal to AB: the length is carried to D by I.2, and E is taken on
      // the circle it describes, so DE goes on equalling AB however E slides.
      { op: 'macro', id: 'l3', tool: 'euclid.I.2', args: ['i3', 'i0', 'i1'], out: ['l4', 'l5'], working: ['l4', 'l5'] },
      { op: 'circle', id: 'l6', o: 'i3', r: 'l4', color: 'yellow', working: true },
      { op: 'onCurve', id: 'l7', curve: 'l6', t: -2.958 },
      // The angle at D copied from the angle at A, and DF cut off equal to CA
      // along the arm it makes.
      { op: 'macro', id: 'l8', tool: 'euclid.I.23', args: ['i3', 'l7', 'i1', 'i0', 'i2'], out: ['l9', 'l10'], working: ['l9', 'l10'], picks: { side: 0 } },
      { op: 'macro', id: 'l11', tool: 'euclid.I.2', args: ['i3', 'i2', 'i0'], out: ['l12', 'l13'], working: ['l12', 'l13'] },
      { op: 'circle', id: 'l14', o: 'i3', r: 'l12', color: 'yellow', working: true },
      { op: 'inter', id: 'l15', c1: 'l10', c2: 'l14', branch: 1 },
      { op: 'segment', id: 'l16', a: 'i3', b: 'l7', color: 'red' },
      { op: 'segment', id: 'l17', a: 'l7', b: 'l15', color: 'black' },
      { op: 'segment', id: 'l18', a: 'l15', b: 'i3', color: 'blue' },
    ],
    outputs: ['l0', 'l1', 'l2', 'l7', 'l15', 'l16', 'l17', 'l18'],
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
  },

  {
    id: 'euclid.I.13',
    ref: 'I.13',
    theorem: true,
    name: 'A line standing on a line',
    summary: 'The figure I.13 supposes: a straight line standing upon another.',
    note: 'Nothing here is difficult to build: a straight line AB, a point D taken on it, and a line DC drawn from that point. What the proposition claims is that the two angles at D come to two right angles — which cannot be said until there is a right angle on the page to say it against. Erecting one at D by I.11 is no part of the supposition; it is the proof, and it is yours to make.',
    inputs: [
      { id: 'i0', kind: 'point', label: 'A' },
      { id: 'i1', kind: 'point', label: 'B' },
      { id: 'i2', kind: 'point', label: 'C' },
    ],
    body: [
      { op: 'segment', id: 'l0', a: 'i0', b: 'i1', color: 'black' },
      { op: 'onCurve', id: 'l1', curve: 'l0', t: 0.45 },
      { op: 'segment', id: 'l2', a: 'l1', b: 'i2', color: 'red' },
    ],
    outputs: ['l0', 'l1', 'l2'],
    names: { l1: 'the foot of the standing line on {0}{1}' },
    uses: [],
    demo: {
      points: [
        { x: -180, y: 40 },
        { x: 180, y: 40 },
        { x: -30, y: -130 },
      ],
    },
  },

  {
    id: 'euclid.I.15',
    ref: 'I.15',
    theorem: true,
    name: 'Two lines cutting one another',
    summary: 'The figure I.15 supposes: two straight lines cutting one another.',
    note: 'Two straight lines drawn across each other, and the point they cut in. The vertical angles are there to be read off as soon as the figure exists — this is the shortest supposition in Book I, and the claim is the whole of the work.',
    inputs: [
      { id: 'i0', kind: 'point', label: 'A' },
      { id: 'i1', kind: 'point', label: 'B' },
      { id: 'i2', kind: 'point', label: 'C' },
      { id: 'i3', kind: 'point', label: 'D' },
    ],
    body: [
      { op: 'segment', id: 'l0', a: 'i0', b: 'i1', color: 'black' },
      { op: 'segment', id: 'l1', a: 'i2', b: 'i3', color: 'red' },
      { op: 'inter', id: 'l2', c1: 'l0', c2: 'l1', branch: 0 },
    ],
    outputs: ['l0', 'l1', 'l2'],
    names: { l2: 'the point in which {0}{1} and {2}{3} cut one another' },
    uses: [],
    demo: {
      points: [
        { x: -170, y: -70 },
        { x: 170, y: 60 },
        { x: -150, y: 90 },
        { x: 160, y: -80 },
      ],
    },
  },

  {
    id: 'euclid.I.16',
    ref: 'I.16',
    theorem: true,
    name: 'A triangle with a side produced',
    summary: 'The figure I.16 and I.32 suppose: a triangle with one of its sides produced.',
    note: 'A triangle, and Postulate 2 applied to one side. I.16 asks how the external angle at C stands to either of the remote internal ones; I.32 asks what it comes to exactly, and Euclid answers by drawing through C a parallel to AB (I.31), which you have if you have got that far.',
    inputs: [
      { id: 'i0', kind: 'point', label: 'A' },
      { id: 'i1', kind: 'point', label: 'B' },
      { id: 'i2', kind: 'point', label: 'C' },
    ],
    body: [
      { op: 'segment', id: 'l0', a: 'i0', b: 'i1', color: 'black' },
      { op: 'segment', id: 'l1', a: 'i1', b: 'i2', color: 'red' },
      { op: 'segment', id: 'l2', a: 'i2', b: 'i0', color: 'blue' },
      // Postulate 2 carries AC past C so D can be taken on it. Byrne draws the
      // side and its production as two lines in two colours, not as one line
      // with a ray laid over it, so the ray itself is working.
      { op: 'ray', id: 'l3', a: 'i0', b: 'i2', working: true },
      { op: 'onCurve', id: 'l4', curve: 'l3', t: 1.4 },
      { op: 'segment', id: 'l5', a: 'i2', b: 'l4', color: 'yellow' },
    ],
    outputs: ['l0', 'l1', 'l2', 'l4', 'l5'],
    names: { l3: '{0}{2} produced', l4: 'a point on {0}{2} produced' },
    uses: [],
    demo: {
      points: [
        { x: -150, y: -70 },
        { x: -30, y: 80 },
        { x: 80, y: -30 },
      ],
    },
  },

  {
    id: 'euclid.I.20',
    ref: 'I.20',
    theorem: true,
    name: 'A plain triangle',
    summary: 'The figure I.20 supposes: a triangle, and nothing else.',
    note: 'Three points joined. Some of Book I asks nothing more of the figure than that it be a triangle — that any two of its sides are together greater than the third, which the Epicureans said an ass knew, since an ass going for its fodder walks the third side and not the other two.',
    inputs: [
      { id: 'i0', kind: 'point', label: 'A' },
      { id: 'i1', kind: 'point', label: 'B' },
      { id: 'i2', kind: 'point', label: 'C' },
    ],
    body: [
      { op: 'segment', id: 'l0', a: 'i0', b: 'i1', color: 'black' },
      { op: 'segment', id: 'l1', a: 'i1', b: 'i2', color: 'red' },
      { op: 'segment', id: 'l2', a: 'i2', b: 'i0', color: 'blue' },
    ],
    outputs: ['l0', 'l1', 'l2'],
    uses: [],
    demo: {
      points: [
        { x: -160, y: 60 },
        { x: 40, y: 90 },
        { x: -30, y: -100 },
      ],
    },
  },

  {
    id: 'euclid.I.37',
    ref: 'I.37',
    theorem: true,
    name: 'Two triangles on one base',
    summary: 'The figure I.37 supposes: two triangles on the same base, their apexes on one parallel to it.',
    note: 'The base AB, a parallel to it through C by I.31, and a second apex D taken on that parallel. "Between the same parallels" is then true by construction rather than by eye: D slides along the parallel and never leaves it, so the two triangles go on having the same base and the same height however the figure is pulled about. Their contents are what I.37 asks you to compare.',
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
    names: { l2: 'the parallel to {0}{1} through {2}', l3: 'the second apex, on the parallel through {2}' },
    uses: ['euclid.I.31'],
    demo: {
      points: [
        { x: -160, y: 80 },
        { x: 120, y: 80 },
        { x: -90, y: -80 },
      ],
    },
  },

  {
    id: 'euclid.I.5',
    ref: 'I.5',
    name: 'Isosceles triangle',
    abbr: '△=',
    theorem: true,
    summary: 'The figure I.5 supposes: an isosceles triangle with the equal sides produced.',
    note: '"Let ABC be isosceles" is not two free points and a promise. C is taken on the circle about A through B, so AC equals AB by Definition 15 and goes on equalling it however hard the figure is shaken. That is what the sketchpad means by a supposition, and what Euclid means too. The enunciation is about the external angles as well, so the equal sides are produced beyond the base and D and E taken on the productions — the theorem holds wherever they fall. The circle and the produced lines are working: Byrne draws neither, and one press shows both.',
    inputs: [
      { id: 'i0', kind: 'point', label: 'A' },
      { id: 'i1', kind: 'point', label: 'B' },
    ],
    body: [
      { op: 'circle', id: 'l0', o: 'i0', r: 'i1', color: 'yellow', working: true },
      { op: 'onCurve', id: 'l1', curve: 'l0', t: -1.125 },
      { op: 'segment', id: 'l2', a: 'i0', b: 'i1', color: 'red' },
      { op: 'segment', id: 'l3', a: 'i0', b: 'l1', color: 'red' },
      { op: 'segment', id: 'l4', a: 'i1', b: 'l1', color: 'black' },
      // "If the equal sides be produced" — so they are, and the part beyond the
      // base is drawn as its own line in its own colour, as Byrne draws it. The
      // production itself is working: it lies along AB and would only paint
      // over it.
      { op: 'ray', id: 'l5', a: 'i0', b: 'i1', working: true },
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
  },

  {
    id: 'euclid.I.47',
    ref: 'I.47',
    name: 'Squares on a right-angled triangle',
    abbr: '△⊥',
    theorem: true,
    summary: 'The figure I.47 supposes: a right-angled triangle with a square on each of its sides.',
    note: 'The right angle is constructed, not assumed — B is taken on the perpendicular raised at A — so it stays a right angle however the figure is shaken. Then a square on each side by I.46. What remains is to say that the square on the hypotenuse is the other two taken together, and to shake the figure until you believe it.',
    inputs: [
      { id: 'i0', kind: 'point', label: 'A' },
      { id: 'i1', kind: 'point', label: 'C' },
    ],
    body: [
      { op: 'macro', id: 'l0', tool: 'euclid.I.11', args: ['i0', 'i1'], out: ['l1'] },
      { op: 'onCurve', id: 'l2', curve: 'l1', t: 1.5708 },
      { op: 'segment', id: 'l3', a: 'i0', b: 'l2', color: 'red' },
      { op: 'segment', id: 'l4', a: 'l2', b: 'i1', color: 'blue' },
      // Round the triangle the same way each time, so one and the same choice
      // puts all three squares outside it, as Euclid draws them.
      { op: 'macro', id: 'l5', tool: 'euclid.I.46', args: ['i0', 'l2'], out: ['l6', 'l7', 'l8', 'l9', 'l10'], picks: { side: 1 } },
      { op: 'macro', id: 'l11', tool: 'euclid.I.46', args: ['l2', 'i1'], out: ['l12', 'l13', 'l14', 'l15', 'l16'], picks: { side: 1 } },
      { op: 'macro', id: 'l17', tool: 'euclid.I.46', args: ['i1', 'i0'], out: ['l18', 'l19', 'l20', 'l21', 'l22'], picks: { side: 1 } },
    ],
    outputs: [
      'l2', 'l3', 'l4',
      'l6', 'l7', 'l8', 'l9', 'l10',
      'l12', 'l13', 'l14', 'l15', 'l16',
      'l18', 'l19', 'l20', 'l21', 'l22',
    ],
    given: [['i0', 'i1', { color: 'black' }]],
    uses: ['euclid.I.11', 'euclid.I.46'],
    demo: {
      points: [
        { x: -60, y: -30 },
        { x: 60, y: -30 },
      ],
    },
  },
]

export const PROPOSITION_BY_ID = new Map(PROPOSITIONS.map((p) => [p.id, p]))

/**
 * What a fresh toolbox starts with: nothing.
 *
 * Postulates 1–3 are not tools, they are the pencil. Everything else in Book I
 * has to be got through before it can be used — a toolbar handed I.1, I.2 and
 * I.3 on arrival says the opposite of what the book says, which is that each
 * proposition is earned by the ones before it. Reading one through is what
 * earns it.
 */
export const DEFAULT_TOOL_IDS = []
