/**
 * What the sketchpad can do, said once, in one place.
 *
 * Kept as data rather than markup so it can be printed anywhere and checked in
 * Node — and so that adding a gesture means adding a line here rather than
 * hunting for the paragraph that describes it.
 *
 * The order is the order a reader meets things: what the rules are, then how to
 * draw, then how to choose, then how to move about, then what to do with a
 * finished construction, and last the business of proving something.
 */

export const HELP = [
  {
    title: 'The rules',
    body: 'Euclid grants three things and nothing else. A straight line may be drawn from any point '
      + 'to any point; a finite straight line may be produced; a circle may be described with any '
      + 'centre and distance. The distance is given by a point the circumference passes through, not '
      + 'by a number — there is no carrying a length across the page, which is exactly why I.2 exists.',
    rows: [
      ['Point', 'Set one down, loose on the page or on a line to keep it there'],
      ['Join', 'Postulate 1 — the straight line between two points'],
      ['Produce', 'Postulate 2 — the line runs on beyond the second point'],
      ['Circle', 'Postulate 3 — click the centre, then a point it passes through'],
    ],
  },
  {
    title: 'Drawing',
    body: 'Two clicks make a line: one for each end. Pressing and dragging does the same thing and '
      + 'looks the same doing it. Where lines and circles cut, the points are simply there — they '
      + 'stay small and anonymous until a later step uses one, at which point it earns a letter, '
      + 'which is how a figure in a book acquires its lettering.',
    rows: [
      ['Escape', 'Abandon a half-drawn line and go back to the pointer'],
      ['⌘Z / Ctrl-Z', 'Undo. One gesture is one undo, however many points it set down'],
      ['⇧⌘Z', 'Redo'],
    ],
  },
  {
    title: 'Choosing',
    body: 'Clicking picks one thing. What can be done to a selection sits beside the pointer that '
      + 'made it: the colours, whether it is dashed, and the rubbish bin.',
    rows: [
      ['Click', 'Select one thing'],
      ['⇧-click, ⌘-click', 'Add to the selection; click again to let one go'],
      ['Drag from empty paper', 'Sweep a lasso. A curve is caught if any of it is inside'],
      ['Hold ⌥', 'Borrow the pointer without putting the drawing tool down'],
      ['Delete', 'Remove what is selected, and whatever stands on it'],
    ],
  },
  {
    title: 'Moving about the paper',
    body: 'The right button navigates, which leaves the left button entirely to geometry. '
      + 'Right-clicking opens a menu naming the gestures, so they can be found rather than '
      + 'memorised. Two fingers pinch and twist.',
    rows: [
      ['Right-drag', 'Pan'],
      ['⇧ right-drag', 'Turn the paper'],
      ['Double right-click', 'Centre, fit, and set upright'],
      ['⇧ double right-click', 'Centre and fit, keeping this angle as upright'],
      ['Scroll', 'Zoom'],
    ],
  },
  {
    title: 'The construction',
    body: 'Every step is written out as prose beside the figure, and the slider walks through it. '
      + 'A step drawn while scrubbed back replaces what came after, rather than being tacked on the '
      + 'end. Names carry the mark of the thing they name — a bar over a straight line, in the '
      + 'colour it is drawn in — so reading a step and finding it on the paper takes no translation.',
    rows: [
      ['Slider', 'Walk through the construction, one step at a time'],
      ['A step', 'Click it to go there'],
      ['×', 'Remove that step and everything that leans on it'],
      ['working', 'Show what a tool did inside'],
      ['unfold', 'Write a tool out as ordinary steps'],
    ],
  },
  {
    title: 'The given figure',
    body: 'A proposition starts from something — two points, a line, an angle — and that is not part '
      + 'of what it proves. Those steps are set aside as "the given figure", the construction proper '
      + 'is numbered from 1, and the slider cannot rub the givens out. Reading a proposition through '
      + 'marks its givens for you; a figure drawn by hand can be declared the givens afterwards from '
      + 'the ⋯ menu.',
    rows: [],
  },
  {
    title: 'Keeping what you build',
    body: 'Carry out a construction, press +, then click the givens in the order they should be '
      + 'supplied, then what the construction produces, then name it. It becomes a button in the '
      + 'toolbar, and everything in between becomes hidden working. Tools may be built on tools.',
    rows: [
      ['+', 'Make a new tool out of what has been constructed'],
      ['Proved', 'The account of what you have got through, and what it entitles you to'],
    ],
  },
  {
    title: 'Proving something',
    body: 'From I.4 onwards Book I is mostly theorems, and a theorem asserts something that points '
      + 'and lines alone cannot say. Select two points for a length or three for an angle or a '
      + 'triangle, hold it, select what it is to be compared with, and say how they stand. The claim '
      + 'is checked where it stands — and shaking the figure checks it again over a couple of hundred '
      + 'random configurations, which is what catches a claim that is true of your figure and of no '
      + 'other. A claim carries its reason, chosen from the book. Nothing here checks that the reason '
      + 'entails the claim; that would be a proof checker, and this is a sketchpad.',
    rows: [
      ['=  >  <', 'How the two magnitudes stand to one another'],
      ['≡', 'Equal in every respect, as I.4 has it, rather than equal in content'],
      ['why?', 'What allows it: a definition, an axiom, a proposition — or the figure itself'],
      ['const.', 'By construction. Make an angle equal to a given angle and the two are equal by construction — and here the figure is always to hand'],
      ['hyp.', 'By the hypothesis, which in this sketchpad was built rather than promised'],
      ['to be proved', 'Mark the claim the proposition set out to show; the page then closes with Q. E. D.'],
      ['Shake', 'Jog every hand-placed point at random, many times over'],
      ['Keep it', 'Hold the theorem, with the evidence it survived, and cite it ever after'],
    ],
  },
  {
    title: 'A theorem supposes something',
    body: '"In any isosceles triangle" is not two free points and a promise. Build the supposition '
      + 'instead of asserting it: place A and B, describe a circle about A through B, and take C on '
      + 'that circle. Now AC equals AB by Definition 15, and goes on equalling it however hard the '
      + 'figure is shaken. That is what the sketchpad means by a hypothesis, and it is what Euclid '
      + 'means too.',
    rows: [],
  },
]
