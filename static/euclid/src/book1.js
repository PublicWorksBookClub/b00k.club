/**
 * Book I of Byrne's Euclid, as text.
 *
 * Generated from jemmybutton/byrne-euclid (byrne-en-latex.tex and
 * byrnebook.cls), which is Oliver Byrne's 1847 edition typeset afresh. That
 * edition's text is CC-BY-SA 4.0, so this file and anything derived from it
 * carry the same terms; Byrne's original is long out of copyright.
 *
 * Regenerate with tools/extract-byrne.py rather than editing by hand.
 *
 * Euclid's own kinds, in his order:
 *   definitions  what a thing is
 *   postulates   what may be granted as done (the moves)
 *   axioms       what holds of magnitudes generally (Byrne's word for the
 *                common notions; they are assumed, not proved)
 */

export const SOURCE = {
  title: 'The First Six Books of the Elements of Euclid',
  editor: 'Oliver Byrne, 1847',
  edition: 'jemmybutton/byrne-euclid',
  license: 'CC-BY-SA 4.0',
  url: 'https://github.com/jemmybutton/byrne-euclid',
}

/** Byrne's own four colours, from byrnebook.cls. The colours are the argument. */
export const BYRNE_COLORS = {
  red: '#D94C1A',
  blue: '#265999',
  yellow: '#F2B21A',
  black: '#000000',
  grey: '#CCCCCC',
}

export const DEFINITIONS = [
  { n: 1, roman: 'I', text: 'A point is that which has no parts.' },
  { n: 2, roman: 'II', text: 'A line is length without breadth.' },
  { n: 3, roman: 'III', text: 'The extremities of a line are points.' },
  { n: 4, roman: 'IV', text: 'The straight or right line is that which lies evenly between its extremities.' },
  { n: 5, roman: 'V', text: 'A surface is that which has length and breadth only.' },
  { n: 6, roman: 'VI', text: 'The extremities of a surface are lines.' },
  { n: 7, roman: 'VII', text: 'A plane surface is that which lies evenly between its extremities.' },
  {
    n: 8,
    roman: 'VIII',
    text: 'A plane angle is the inclination of two lines to one another, in a plane, which meet together, but are not in the same direction.',
  },
  {
    n: 9,
    roman: 'IX',
    text: 'A plane rectilinear angle is the inclination of two straight lines to one another, which meet together, but are not in the same straight line.',
  },
  {
    n: 10,
    roman: 'X',
    text: 'When one straight line standing on another straight line makes the adjacent angles equal, each of these angles is called a right angle, and each of these lines is said to be perpendicular to one another.',
  },
  { n: 11, roman: 'XI', text: 'An obtuse angle is an angle greater than a right angle' },
  { n: 12, roman: 'XII', text: 'An acute angle is an angle less than a right angle.' },
  { n: 13, roman: 'XIII', text: 'A term or boundary is the extremity of any thing.' },
  { n: 14, roman: 'XIV', text: 'A figure is a surface enclosed on all sides by a line or lines.' },
  {
    n: 15,
    roman: 'XV',
    text: 'A circle is a plane figure, bounded by one continued line, called its circumference or periphery; and having a certain point within it, from which all straight lines drawn to its circumference are equal.',
  },
  { n: 16, roman: 'XVI', text: 'This point (from which the equal lines are drawn) is called the centre of the circle.' },
  {
    n: 17,
    roman: 'XVII',
    text: 'A diameter of a circle is a straight line drawn through the centre, terminated both ways in the circumference.',
  },
  {
    n: 18,
    roman: 'XVIII',
    text: 'A semicircle is the figure contained by the diameter, and the part of the circle cut off by the diameter.',
  },
  {
    n: 19,
    roman: 'XIX',
    text: 'A segment of a circle is a figure contained by straight line and the part of the circumference which it cuts off.',
  },
  { n: 20, roman: 'XX', text: 'A figure contained by straight lines only, is called a rectilinear figure.' },
  { n: 21, roman: 'XXI', text: 'A triangle is a rectilinear figure included by three sides.' },
  {
    n: 22,
    roman: 'XXII',
    text: 'A quadrilateral figure is one which is bounded by four sides. The straight lines AD and CB connecting the vertices of the opposite angles of a quadrilateral figure, are called its diagonals.',
  },
  { n: 23, roman: 'XXIII', text: 'A polygon is a rectilinear figure bounded by more than four sides.' },
  { n: 24, roman: 'XXIV', text: 'A triangle whose sides are equal, is said to be equilateral.' },
  { n: 25, roman: 'XXV', text: 'A triangle which has only two sides equal is called an isosceles triangles.' },
  { n: 26, roman: 'XXVI', text: 'A scalene triangle is one which has no two sides equal.' },
  { n: 27, roman: 'XXVII', text: 'A right angled triangle is that which has a right angle.' },
  { n: 28, roman: 'XXVIII', text: 'An obtuse angled triangle is that which has an obtuse angle.' },
  { n: 29, roman: 'XXIX', text: 'An acute angled triangle is that which has three acute angles.' },
  { n: 30, roman: 'XXX', text: 'Of four-sided figures, a square is that which has all its sides equal, and all its angles right angles.' },
  { n: 31, roman: 'XXXI', text: 'A rhombus is that which has all its sides equal, but its angles are not right angles.' },
  { n: 32, roman: 'XXXII', text: 'An oblong is that which has all its angles right angles, but has not all its sides equal.' },
  {
    n: 33,
    roman: 'XXXIII',
    text: 'A rhomboid is that which has its opposite sides equal to one another, but all its sides are not equal nor its angles right angles.',
  },
  { n: 34, roman: 'XXXIV', text: 'All other quadrilateral figures are called trapeziums.' },
  {
    n: 35,
    roman: 'XXXV',
    text: 'Parallel straight lines are such as are in the same plane, and which being produced continually in both directions would never meet.',
  },
]

export const POSTULATES = [
  { n: 1, roman: 'I', text: 'Let it be granted that a straight line may be drawn from any one point to any other point.' },
  { n: 2, roman: 'II', text: 'Let it be granted that a finite straight line may be produced to any length in a straight line.' },
  { n: 3, roman: 'III', text: 'Let it be granted that a circle may be described with any centre at any distance from that centre.' },
]

export const AXIOMS = [
  { n: 1, roman: 'I', text: 'Magnitudes which are equal to the same are equal to each other.' },
  { n: 2, roman: 'II', text: 'If equals be added to equals the sums will be equal.' },
  { n: 3, roman: 'III', text: 'If equals be taken away from equals the remainders will be equal.' },
  { n: 4, roman: 'IV', text: 'If equals be added to unequals the sums will be unequal.' },
  { n: 5, roman: 'V', text: 'If equals be taken away from unequals the remainders will be unequal.' },
  { n: 6, roman: 'VI', text: 'The doubles of the same or equal magnitudes are equal.' },
  { n: 7, roman: 'VII', text: 'The halves of the same or equal magnitudes are equal.' },
  { n: 8, roman: 'VIII', text: 'The magnitudes which coincide with one another, or exactly fill the same space, are equal.' },
  { n: 9, roman: 'IX', text: 'The whole is greater than its part.' },
  { n: 10, roman: 'X', text: 'Two straight lines cannot include a space.' },
  { n: 11, roman: 'XI', text: 'All right angles are equal.' },
  {
    n: 12,
    roman: 'XII',
    text: 'If two straight lines (AB CD) meet a third straight line (EF) so as to make the two interior angles (\u2220H and \u2220G) on the same side less than two straight angles, these two straight lines will meet if they be produced on that side on which the angles are less than two right angles. The twelfth axiom may be expressed in any of the following ways: Two diverging straight lines cannot be both parallel to the same straight line. If a straight line intersect one of the two parallel straight lines it must also intersect the other. Only one straight line can be drawn through a given point, parallel to a given straight line.',
  },
]

export const SYMBOLS = [
  { symbol: '∴', text: 'expresses the word therefore.' },
  { symbol: '∵', text: 'expresses the word because.' },
  {
    symbol: '=',
    text: 'expresses the word equal. This sign of equality may be read equal to, or is equal to, or are equal to; but the discrepancy in regard to the introduction of the auxiliary verbs is, are, &c. cannot affect the geometrical rigour.',
  },
  { symbol: '≠', text: 'means the same as if the words ‘not equal’ were written.' },
  { symbol: '>', text: 'signifies greater than.' },
  { symbol: '<', text: 'signifies less than.' },
  { symbol: '≯', text: 'signifies not greater than.' },
  { symbol: '≮', text: 'signifies not less than.' },
  {
    symbol: '+',
    text: 'is read plus (more), the sign of addition; when interposed between two or more magnitudes, signifies their sum.',
  },
  {
    symbol: '-',
    text: 'is read minus (less), signifies subtraction; and when placed between two quantities denotes that the latter is taken from the former.',
  },
  {
    symbol: '×',
    text: 'this sign expresses the product of two or more numbers when placed between them in arithmetic and algebra; but in geometry it is generally used to express a rectangle, when placed between two straight lines which contain one of its right angles. A rectangle may also be represented by placing a point between two of its conterminous sides.',
  },
  {
    symbol: ': :: :',
    text: 'expresses an analogy or proportion; thus if A, B, C and D represent four magnitudes, and A has to B the same ratio that C has to D, the proportion is thus briefly written A: B:: C: D, A: B = C: D, or A B = C D. This equality or sameness of ratio is read, as A is to B, so is C to D; or A is to B, as C is to D.',
  },
  { symbol: '∥', text: 'signifies parallel to.' },
  { symbol: '⊥', text: 'signifies perpendicular to.' },
  { symbol: '∠BAC', text: 'signifies angle.' },
  { symbol: '∠BAD', text: 'signifies right angle.' },
  { symbol: '⌐⌐', text: 'signifies two right angles.' },
  { symbol: 'def.', text: 'signifies definition.' },
  { symbol: 'post.', text: 'signifies postulate.' },
  { symbol: 'ax.', text: 'signifies axiom.' },
  {
    symbol: 'hyp.',
    text: 'signifies hypothesis. It may be necessary here to remark, that hypothesis is the condition assumed or taken for granted. Thus, the hypothesis of the proposition given in the Introduction, is that the triangle is isosceles, or that its legs are equal.',
  },
  {
    symbol: 'const.',
    text: 'signifies construction. The construction is the change made in the original figure, by drawing lines, making angles, describing circles, &c. in order to adapt it to the argument of the demonstration or the solution of the problem. The conditions under which these changes are made, are as indisputable as those contained in the hypothesis. For instance, if we make an angle equal to a given angle, these two angles are equal by construction.',
  },
  { symbol: 'Q.E.D.', text: 'signifies Quod erat demonstrandum. Which was to be demonstrated.' },
]

export const PROPOSITIONS_TEXT = [
  {
    n: 1,
    roman: 'I',
    kind: 'problem',
    heading: 'Prop. I. Prob.',
    text: 'On a given finite straight line (AB) to describe an equilateral triangle.',
  },
  {
    n: 2,
    roman: 'II',
    kind: 'problem',
    heading: 'Prop. II. Prob.',
    text: 'From a given point (A), to draw a straight line equal to a given straight line (BC).',
  },
  {
    n: 3,
    roman: 'III',
    kind: 'problem',
    heading: 'Prop. III. Prob.',
    text: 'From the greater (AC) of two given straight lines, to cut off a part equal to the less (EF).',
  },
  {
    n: 4,
    roman: 'IV',
    kind: 'theorem',
    heading: 'Prop. IV. Theor.',
    text: 'If two triangles have two sides of the one respectively equal to two sides of the other, (AB to DE and CA to FD) and the angles (\u2220A and \u2220D) contained by those equal sides also equal; then their bases or their sides (BC and EF) are also equal: and the remaining angles opposite to equal sides are respectively equal (\u2220B = \u2220E and \u2220C = \u2220F): and the triangles are equal in every respect.',
  },
  {
    n: 5,
    roman: 'V',
    kind: 'theorem',
    heading: 'Prop. V. Theor.',
    text: 'In any isosceles triangle BC, AC, AB if the equal sides be produced, the external angles at the base are equal, and the internal angles at the base are also equal.',
  },
  {
    n: 6,
    roman: 'VI',
    kind: 'theorem',
    heading: 'Prop VI. Theor.',
    text: 'In any triangle (\u25b3ABD) if two angles (\u2220A and \u2220B) are equal, the sides (AD and BD) opposite to them are also equal.',
  },
  {
    n: 7,
    roman: 'VII',
    kind: 'theorem',
    heading: 'Prop VII. Theor.',
    text: 'On the same base (AB), and on the same side of it there cannot be two triangles having their conterminous sides (CA and DA, BC and BD) at both extremities of the base, equal to each other.',
  },
  {
    n: 8,
    roman: 'VIII',
    kind: 'theorem',
    heading: 'Prop VIII. Theor.',
    text: 'If two triangles have two sides of the one respectively equal to two sides of the other (CA = FD and AB = DE) and also their bases (BC = EF), equal; then the angles (and) contained by their equal sides are also equal.',
  },
  { n: 9, roman: 'IX', kind: 'problem', heading: 'Prop IX. Prob.', text: 'To bisect a given rectilinear angle (\u2220BAC).' },
  { n: 10, roman: 'X', kind: 'problem', heading: 'Prop X. Prob.', text: 'To bisect a given finite straight line (BC).' },
  {
    n: 11,
    roman: 'XI',
    kind: 'problem',
    heading: 'Prop XI. Prob.',
    text: 'From a given point (D), in a given straight line (BD, DC), to draw a perpendicular.',
  },
  {
    n: 12,
    roman: 'XII',
    kind: 'problem',
    heading: 'Prop XII. Prob.',
    text: 'To draw a straight line perpendicular to a given indefinite straight line (DB, CD) from a given point (A) without.',
  },
  {
    n: 13,
    roman: 'XIII',
    kind: 'theorem',
    heading: 'Prop XIII. Theor.',
    text: 'When a straight line (ED) standing upon another straight line (BC) makes angles with it; they are either two right angles or together equal to two right angles.',
  },
  {
    n: 14,
    roman: 'XIV',
    kind: 'theorem',
    heading: 'Prop XIV. Theor.',
    text: 'If two straight lines (BD and DC), meeting a third straight line (AD), at the same point, and at opposite sides of it, make with it adjacent angles (15pt \u2220BDA and \u2220CDA) equal to two right angles; these straight lines lie in one continuous straight line.',
  },
  {
    n: 15,
    roman: 'XV',
    kind: 'theorem',
    heading: 'Prop XV. Theor.',
    text: 'If two right lines (AB and CD) intersect one another, the vertical angles \u2220BEC and \u2220AED, \u2220CEA and \u2220DEB are equal.',
  },
  {
    n: 16,
    roman: 'XVI',
    kind: 'theorem',
    heading: 'Prop XVI. Theor.',
    text: 'If a side of a triangle (BE, EC, AC, AB) is produced, the external angle is greater than either of the internal remote angles (\u2220B or \u2220A).',
  },
  {
    n: 17,
    roman: 'XVII',
    kind: 'theorem',
    heading: 'Prop XVII. Theor.',
    text: 'Any two angles of a triangle AB, BC, AC are together less than two right angles.',
  },
  {
    n: 18,
    roman: 'XVIII',
    kind: 'theorem',
    heading: 'Prop XVIII. Theor.',
    text: 'In any triangle DC, BC, BA, AD if one side AC be greater than another BC, the angle opposite to the greater side is greater than the angle opposite to the less. I.\\ e.\\ \u2220CBA > \u2220A.',
  },
  {
    n: 19,
    roman: 'XIX',
    kind: 'theorem',
    heading: 'Prop XIX. Theor.',
    text: 'If in any triangle CA, BC, AB one angle \u2220A be greater than another \u2220B the side BC which is opposite to the greater angle, is greater than the side CA opposite the less.',
  },
  {
    n: 20,
    roman: 'XX',
    kind: 'theorem',
    heading: 'Prop XX. Theor.',
    text: 'Any two sides DA and BD of a triangle DA, BD, AB taken together are greater than the third side (AB).',
  },
  {
    n: 21,
    roman: 'XXI',
    kind: 'theorem',
    heading: 'Prop XXI. Theor.',
    text: 'If from any point (D) within a triangle CA, EC, BE, AB straight lines be drawn to the extremities of one side (AB), these lines must be together less than the other two sides, but must contain a greater angle.',
  },
  {
    n: 22,
    roman: 'XXII',
    kind: 'problem',
    heading: 'Prop XXII. Prob.',
    text: "Given three right lines \\ L' L'' L'''. the sum of any two greater than the third, to construct a triangle whose sides shall be respectively equal to the given lines.",
  },
  {
    n: 23,
    roman: 'XXIII',
    kind: 'problem',
    heading: 'Prop XXIII. Prob.',
    text: 'At a given point (F) in a given straight line (FJ), to make an angle equal to a given rectilinear angle (\u2220A).',
  },
  {
    n: 24,
    roman: 'XXIV',
    kind: 'theorem',
    heading: 'Prop XXIV. Theor.',
    text: 'If two triangles have two sides of the one respectively equal to two sides of the other (AB to EF and AD to GE), and if one of the angles contained by the equal sides be greater than the other, the side (DB) which is opposite to the greater angle is greater than the side (FG) which is opposite to the less angle.',
  },
  {
    n: 25,
    roman: 'XXV',
    kind: 'theorem',
    heading: 'Prop XXV. Theor.',
    text: 'If two triangles have two sides (AB and CA) of the one respectively equal to two sides (DE and FD) of the other, but their bases unequal, the angle subtended by the greater base (BC) of the one, must be greater than the angle subtended by the less base (EF) of the other.',
  },
  {
    n: 26,
    roman: 'XXVI',
    kind: 'theorem',
    heading: 'Prop XXVI. Theor.',
    text: 'If two triangles have two angles of the one respectively equal to two angles of the other (\u2220A = \u2220D and \u2220B = \u2220FED), and a side of the one equal to a side of the other similarly placed with respect to the equal angles, the remaining sides and angles are respectively equal to one another.',
  },
  {
    n: 27,
    roman: 'XXVII',
    kind: 'theorem',
    heading: 'Prop XXVII. Theor.',
    text: 'If a straight line (GH) meeting two other straight lines (CD and AB) makes with them the alternate angles (\u2220CFG and \u2220HEB; \u2220GFD and \u2220AEH) equal, these two straight lines are parallel.',
  },
  {
    n: 28,
    roman: 'XXVIII',
    kind: 'theorem',
    heading: 'Prop XXVIII. Theor.',
    text: 'If a straight line (GH), cutting two other straight lines (AB and CD), makes the external equal to the internal and opposite angle, at the same side of the cutting line (namely \u2220GEA = \u2220CFG or \u2220BEG = \u2220GFD), or if it makes the two internal angles at the same side (\u2220GFD and \u2220HEB, or \u2220CFG and \u2220AEH) together equal to two right angles, those two straight lines are parallel.',
  },
  {
    n: 29,
    roman: 'XXIX',
    kind: 'theorem',
    heading: 'Prop XXIX. Theor.',
    text: 'A straight line (GH) falling on two parallel straight lines (AB and CD), makes the alternate angles equal to one another; and also the external equal to the internal and opposite angle on the same side; and the two internal angles on the same side together equal to two right angles.',
  },
  {
    n: 30,
    roman: 'XXX',
    kind: 'theorem',
    heading: 'Prop XXX. Theor.',
    text: 'Straight lines (AB and EF) which are parallel to the same straight line (CD), are parallel to one another.',
  },
  {
    n: 31,
    roman: 'XXXI',
    kind: 'problem',
    heading: 'Prop XXXI. Prob.',
    text: 'From a given point E to draw a straight line parallel to a given straight line (CD).',
  },
  {
    n: 32,
    roman: 'XXXII',
    kind: 'theorem',
    heading: 'Prop XXXII. Theor.',
    text: 'If any side (AB) of a triangle be produced, the external angle (\u2220CAD) is equal to the sum of the two internal and opposite angles (\u2220B and \u2220C), and the three internal angles of any triangle taken together are equal to two right angles.',
  },
  {
    n: 33,
    roman: 'XXXIII',
    kind: 'theorem',
    heading: 'Prop XXXIII. Theor.',
    text: 'Straight lines (AC and BD) which join the adjacent extremities of two equal and parallel straight lines (AB and CD), are themselves equal and parallel.',
  },
  {
    n: 34,
    roman: 'XXXIV',
    kind: 'theorem',
    heading: 'Prop XXXIV. Theor.',
    text: 'The opposite sides and angles of any parallelogram are equal, and the diagonal (AD) divides it into two equal parts.',
  },
  {
    n: 35,
    roman: 'XXXV',
    kind: 'theorem',
    heading: 'Prop XXXV. Theor.',
    text: 'Parallelograms on the same base, and between the same parallels, are (in area) equal.',
  },
  {
    n: 36,
    roman: 'XXXVI',
    kind: 'theorem',
    heading: 'Prop XXXVI. Theor.',
    text: 'Parallelograms (ABIC, CDI and EFJ, JFHG) on equal bases, and between the same parallels, are equal.',
  },
  {
    n: 37,
    roman: 'XXXVII',
    kind: 'theorem',
    heading: 'Prop XXXVII. Theor.',
    text: 'Triangles BCG, CDG and DGE, CDG on the same base (CD) and between the same parallels are equal.',
  },
  {
    n: 38,
    roman: 'XXXVIII',
    kind: 'theorem',
    heading: 'Prop XXXVIII. Theor.',
    text: 'Triangles (BCD and EGH) on equal bases and between the same parallels are equal.',
  },
  {
    n: 39,
    roman: 'XXXIX',
    kind: 'theorem',
    heading: 'Prop XXXIX. Theor.',
    text: 'Equal triangles AEC, ECD and BED, ECD on the same base (CD) and on the same side of it, are between the same parallels.',
  },
  {
    n: 40,
    roman: 'XL',
    kind: 'theorem',
    heading: 'Prop XL. Theor.',
    text: 'Equal triangles (and) on equal bases, and on the same side, are between the same parallels.',
  },
  {
    n: 41,
    roman: 'XLI',
    kind: 'theorem',
    heading: 'Prop XLI. Theor.',
    text: 'If a parallelogram ABFG, GFE, AGD, DEG and a triangle GFE, DEG, CFE are upon the same base DE and between the same parallels AC and DE, the parallelogram is double the triangle.',
  },
  {
    n: 42,
    roman: 'XLII',
    kind: 'problem',
    heading: 'Prop XLII. Prob.',
    text: 'To construct a parallelogram equal to a given triangle DEF, CFE, ECG and having an angle equal to a given rectilinear angle \u2220I.',
  },
  {
    n: 43,
    roman: 'XLIII',
    kind: 'theorem',
    heading: 'Prop XLIII. Theor.',
    text: 'The complements HBGE and FCIE of the parallelograms which are about the diagonal of a parallelogram are equal.',
  },
  {
    n: 44,
    roman: 'XLIV',
    kind: 'problem',
    heading: 'Prop XLIV. Prob.',
    text: 'To a given straight line (EG) to apply a parallelogram equal to a given triangle (JKL), and having an angle equal to a given rectilinear angle (\u2220N).',
  },
  {
    n: 45,
    roman: 'XLV',
    kind: 'problem',
    heading: 'Prop XLV. Prob.',
    text: 'To construct a parallelogram equal to a given rectilinear figure (ABC, ACD, ADE) and having an angle equal to a given rectilinear angle (\u2220O).',
  },
  { n: 46, roman: 'XLVI', kind: 'problem', heading: 'Prop XLVI. Prob.', text: 'Upon a given straight line (DC) to construct a square.' },
  {
    n: 47,
    roman: 'XLVII',
    kind: 'theorem',
    heading: 'Prop XLVII. Theor.',
    text: 'In a right angled triangle \u25b3ABC the square on the hypotenuse BC is equal to the sum of the squares of the sides (CA and AB).',
  },
  {
    n: 48,
    roman: 'XLVIII',
    kind: 'theorem',
    heading: 'Prop XLVIII. Theor.',
    text: 'If the square of one side (BC) of a triangle is equal to the squares of the other two sides (AB and AC), the angle (\u2220BAC) subtended by that side is a right angle.',
  },
]

export const BOOK_I = {
  definitions: DEFINITIONS,
  postulates: POSTULATES,
  axioms: AXIOMS,
  symbols: SYMBOLS,
  propositions: PROPOSITIONS_TEXT,
}
