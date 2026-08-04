# Straightedge and compass

A sketchpad for following Euclid's constructions. You get his first three postulates and nothing else; when you
prove something you may keep it, and use it ever after as a single move.

Live at [/euclid/](https://b00k.club/euclid/), and embeddable in any page of the site with the `euclid`
shortcode.

## The rules

- **Postulate 1** — a straight line may be drawn from any point to any point.
- **Postulate 2** — a finite straight line may be produced continuously in a straight line.
- **Postulate 3** — a circle may be described with any centre and distance.

The distance in postulate 3 is given by a point the circumference passes through, not by a number: there is no
carrying a length across the page. That is the whole reason [I.2](https://mathcs.clarku.edu/~djoyce/elements/bookI/propI2.html)
exists, and the app makes you feel it.

Where the lines and circles cut one another, the points are simply there. They stay small and anonymous until
some later step uses one, at which point it gets a letter — which is how a figure in the text acquires its
lettering.

## Making a tool

Carry out a construction, press **+**, then

1. click the givens, in the order they should be supplied;
2. click what the construction produces;
3. name it.

It becomes a button in the toolbar. Everything between the givens and the results turns into hidden working,
which the step list will show on request (_working_) or write out as ordinary steps (_unfold_).

Extraction walks back from the results to the givens and keeps what it passes through. Two things it insists on:

- A point placed by hand that is not among the givens is refused, because the tool would otherwise depend on
  where you happened to click. You are told which points to promote.
- Automatic intersections carry no step of their own, so any the construction leans on are written out as
  explicit steps in the tool's body. A tool is therefore closed: replaying it never depends on what else is
  drawn on the page.

Tools may be built on tools. Of the ones that ship, `I.3` calls `I.2`, which calls `I.1`.

## Embedding

It is a custom element in a shadow root, not an iframe — which is what lets it work on a site whose content
policy sets `frame-src 'none'`, and it means the page's styles and the app's cannot reach each other.

```html
<euclid-sketch height="520px" tools="I.1,I.2,I.3"></euclid-sketch>
<script type="module" src="/euclid/euclid-sketch.js"></script>
```

| Attribute     | Meaning                                                        |
| ------------- | -------------------------------------------------------------- |
| `height`      | CSS height of the figure (default `460px`)                     |
| `panel`       | `steps` (default) or `none` to hide the side panel             |
| `tools`       | which propositions start to hand, e.g. `I.1,I.2,I.3`; none by default |
| `proposition` | open with a proposition set out step by step, e.g. `I.2`       |
| `src`         | URL of a saved sketch to open                                  |
| `readonly`    | the figure may be read and dragged, but not drawn on           |
| `empty`       | start with a blank page rather than two points                 |
| `remember`    | keep what the reader has proved in their browser               |
| `use-hash`    | read and write the sketch in the page's URL fragment           |
| `sidebar`     | `open` or `closed`; open by default only on its own page       |
| `through`     | how far the reader has got, e.g. `I.3` — limits what is to hand |
| `app-url`     | where "open in the full sketchpad" points (default `/euclid/`) |

A sketch may also be supplied inline:

```html
<euclid-sketch
  ><script type="application/json">
    { "v": 1, "steps": [ ... ] }
  </script></euclid-sketch
>
```

The element exposes `.sketch` (the controller), `.load(json)`, `.serialize()` and `.fit()`, and fires
`euclid:ready` once it has loaded whatever it was given.

Within this site, prefer the shortcode, which wires up the script tag and respects the build's base URL:

```jinja
{{/* euclid(height=560, tools="I.1,I.2,I.3", caption="…") */}}
```

## How it is put together

The document is an ordered list of **steps** — the things the geometer did — and objects are what steps produce.
Keeping the list rather than a bag of shapes is what makes the rest fall out: the proof reads as a numbered list
and can be scrubbed through, a tool is literally a slice of the list replayed with new inputs, and dragging is
just "edit one step's numbers and run it again".

```
src/
  geometry.js      vectors, curves, intersections, clipping
  doc.js           the step list: ids, references, cascading deletion, serialisation
  solve.js         run a document into a scene; automatic intersections; lettering; prose
  macros.js        extracting a tool from a construction, and unfolding one
  propositions.js  Book I.1–I.3, I.5, I.9–I.12, I.31, I.46, I.47 as tools
  camera.js        pan and zoom
  help.js          what the sketchpad does, as data
  tutorial.js      the walk through the first proposition
  magnitudes.js    lengths, angles, areas and congruences: what a claim is about
  renderer.js      drawing the figure
  figures.js       drawing Byrne's marginal illustrations, which are not constructions
  book1.js         Book I's text, generated from Byrne's LaTeX
  book1-figures.js what his drawings say, generated from their MetaPost
  interactions.js  pointer and keyboard handling, hit testing
  app.js           the controller: all state and every command
  ui.js            toolbar, step list, proved pane, scrubber, the new-tool dialog
  styles.js        the shadow root's stylesheet
  element.js       <euclid-sketch>
  storage.js       local storage, files, shareable links
```

`geometry.js`, `doc.js`, `solve.js`, `macros.js` and `propositions.js` touch no DOM, which is what lets the
constructions be tested in Node.

### The one subtle part

Two circles cut in two places. Something downstream has to name _which_, and it has to go on naming the same one
while the figure is dragged, or everything below a two-circle intersection would flip sides whenever the figure
moved. So intersections are numbered by a rule that varies continuously with the input:

- line × line — one solution, always branch 0;
- line × circle — by parameter along the line. The roots are numbered from the unclipped quadratic and then
  clipped to the line's extent, so clipping a root away never renumbers the survivor;
- circle × circle — branch 0 is to the left of the vector from the first centre to the second. Argument order
  matters, so callers must always pass the pair in its stored order.

An intersection that stops existing does not delete what leant on it. The step stays, is marked as not currently
possible, and comes back when the figure is dragged back.

## Tests

```sh
pnpm test          # or: node --test "static/euclid/test/**/*.test.mjs"
```

They check the geometry, and then check the propositions the way you would want them checked: over a few hundred
random configurations each, that I.2 really does produce a line equal to the given one, that I.3's cut lands on
the line, that I.9's bisector makes equal angles with both arms, that I.10 lands on the midpoint. They also build
I.1 by hand, save it as a tool, apply it somewhere else, and confirm the result is still equilateral.

## If this moves to its own repo

It is written to be lifted out whole. There is no build step, no dependency, and every import is relative, so
the directory works as a package as it stands:

1. move `static/euclid/` to the new repo's root;
2. add a `package.json` with `"type": "module"`, `"main": "euclid-sketch.js"`, `"exports"` for the entry and
   `./src/*`, and `"test": "node --test \"test/**/*.test.mjs\""`;
3. publish, and depend on it here instead — the shortcode only needs its `src` pointed at whatever path the
   package's file ends up served from.

Importing the entry registers `<euclid-sketch>`; `defineEuclidSketch(tag)` is exported for anyone who wants a
different tag name, and the model layer is exported for anyone who wants the geometry without the interface.

## The given figure

Every proposition sets one out. A proposition starts from something — two
points, a line, an angle — and that is not part of what it proves. Steps marked `setup` are set aside in the step list
as "the given figure", the construction proper is numbered from 1, and the
slider cannot rub the givens out. Reading a proposition through marks its givens
automatically; a figure drawn by hand can be declared the givens after the fact
from the ⋯ menu, using the ordinary tools, colours and dashes to lay it out.

A given may carry an id, and then the body works on that very object rather than
drawing a second one over it: "let AB be the given straight line" and "let a
point be taken at random on AB" mean the same AB. A given the caller has not
supplied is drawn by the tool as working — which is what keeps tools composable,
since I.12 calling I.10 has no such line to hand and should not be asked for
one.

A theorem is given the whole of the figure its statement supposes, and
constructs nothing: what is numbered from one is the argument the reader is
about to make.

## Reading the steps

A step's sentence is built as a list of pieces rather than a string, so a name
can be printed as a name: a bar over a straight line in the colour it is drawn
in, an arrow if it runs on, a ring for a circle. Finding the thing on the paper
then takes no translation. `info.text` is the same sentence flattened, for
anything that only wants a string.

A line drawn inside a tool runs between one lettered point and a hidden one, so
it cannot be called AE. Two lettered points that happen to lie on it will do
instead — which is exactly how Euclid names such a line — and failing that, what
the tool calls it: "the parallel through C". A tool says what it hands back in
its `names`, and the tool doing the calling has the last word, since I.31 hands
back a parallel however it happened to draw it.

A tool that hands back a point and the lines reaching it has drawn a triangle,
so the step says `△ABD` rather than reciting the parts. Only segments drawn by
that step or before it count towards closing the figure, so a later step cannot
retrospectively finish one off for an earlier step.

## Selecting

Clicking picks one thing. Holding shift or command adds to the selection, and
clicking something already in it lets that one go. Dragging from empty paper
sweeps a lasso: a point is caught if it is inside, a curve if any of it is, so
a circle can be caught by crossing its rim without enclosing the whole of it.

The lasso rebuilds the selection from the rectangle on every move rather than
adding to it, so pulling the rectangle back off something releases it. A lasso
begun with the adding key held keeps what was already selected as its floor.

## Claims, and what the sketchpad can honestly say about a proof

Book I from I.4 onwards is mostly *theorems*, and a theorem asserts something —
this angle equals that one — which points and lines alone cannot say. So there
are **magnitudes**: a length read from two points, an angle from three, the
content of a figure read from three or four, and a triangle compared by
congruence rather than by content. Book I turns on that last distinction: I.4
says two triangles are equal *in every respect*, while I.37 says triangles on
the same base between the same parallels are equal — in content, and in nothing
else. A congruence is written `≡` and content `=`, so the two never read alike.

Magnitudes of one kind may be taken together. "The square on the hypotenuse is
equal to the squares on the sides" cannot be said otherwise, and neither can
most of I.35 onwards. Euclid never adds an angle to a line, and a congruence is
not a magnitude at all, so neither can be summed. A magnitude is not an object in the figure but
a way of reading it, so it is stored as its kind and the points it is read from
and evaluated afresh whenever anything moves.

A **claim** step says two magnitudes stand in some relation. It draws nothing.
It is checked as the figure stands, and can be checked again by **shaking** —
every hand-placed point is jogged about at random, a couple of hundred times
over, and any claim that fails somewhere is reported. Configurations the
construction itself cannot survive are passed over rather than counted against
the claims.

That is the whole of what the app can honestly do: a claim that survives two
hundred figures is strong evidence, not a proof. Nothing checks that a claim's
reason entails it — that would be a proof checker. But a claim carries its
reason all the same, chosen from the book in the sidebar, because a proof that
does not say why is not a proof, and writing the reason down is what makes the
step list read as an argument rather than a list of measurements.

**The hypothesis is constructed, not asserted.** "Let ABC be isosceles" is not
two free points and a promise; it is A, B, and then C taken on the circle
centred A through B. AC = AB by Def. 15 and stays so however the figure is
dragged. That is why no constraint solver is needed.

Building the supposition correctly is the whole difficulty of getting started,
so a theorem may carry the figure it supposes and nothing else: opening I.5
gives an isosceles triangle that stays isosceles, and opening I.47 gives a
right-angled triangle with a square on each of its sides — the right angle
constructed, not assumed. What it asserts is still the reader's to state, and
to shake until they believe it.

Three points are genuinely ambiguous — a figure with a content, a shape to be
matched in every respect, or the angle at any one of three corners — and the
drawn figure cannot settle it. So every reading is offered by name and the
reader says which. Four points are a quadrilateral; of the three ways they can
be joined up exactly one does not cross itself, so the order round the figure is
found rather than asked for.

## Q. E. D.

The document remembers which of Book I it is working on — `doc.meta.proposition`
— so the step list can open the way Byrne's page opens, with the heading and the
enunciation, and close the way his page closes. Without it the list is a record
of moves with nothing to be a proof *of*.

Byrne ends every proposition with Q. E. D., problems as well as theorems: I.1
builds its triangle and then has to argue that the triangle really is
equilateral. So the foot of the list is the same for both. It appears once a
claim is marked as what was to be proved, holds of the figure, and was not
broken by the last shaking, and it carries how many configurations it held in,
because that is the difference between a theorem and a lucky figure. Until then
the foot says what closing it would take.

It is deliberately not a verdict on the proof. The app cannot read an argument.
It says the thing marked as what was to be shown is shown.

## What you keep

The toolbar starts empty. Everything in Book I but the three postulates has to
be got through before it can be used: a toolbar handed I.1, I.2 and I.3 on
arrival says the opposite of what the book says, which is that each proposition
is earned by the ones before it. Reading a problem through — watching it carried
out, step by step, on your own figure — is what earns it.

The **Proved** pane is the account of what that has come to. It holds two kinds
of thing, because the book gives you two kinds:

- **what you can carry out** — a construction, replayed with new inputs. Read a
  problem through and it goes here, and into the toolbar, and stays.
- **what you have proved** — a theorem, which has nothing to carry out but may
  be cited by a later claim. A theorem's body only builds the figure its
  statement supposes, so there is no tool to hand over; what it yields has to be
  claimed and shaken.

What is *not* in that pane is a catalogue of Book I. The book is in the sidebar,
all forty-eight of it, and that is where a proposition is taken up.

A claim can be marked as *what was to be proved*. Once it is, and once it
survives being shaken, it can be kept as a fact — with the number of
configurations it survived travelling with it, since that is the difference
between a theorem and a lucky figure. Both kinds outlive the paper: clearing
the sheet, turning to the next proposition, and undo all leave them alone.
Only removing one on purpose does.

The reason-picker marks which propositions are actually yours. Nothing stops a
reader leaning on one they have not got — the app is not a proctor — but it
says which is which, because the shape of the book is that each proposition
stands on the ones before it.

## The toolbar

One row, always. It only ever grows — that is the point of the book —
and a bar that wraps shoves the figure down the page every time a proposition is
proved. So the tools give way first, scrolling sideways between the postulates
and the **+**; if even that is not enough the whole bar scrolls, and the height
never changes.

## Between visits

With `remember`, what has been earned outlives the tab — the constructions and
the theorems both. A proposition of Book I is written down as its number and
nothing else: keeping the body would be wasteful, and would hand a returning
reader the copy that was current when they first visited rather than the one in
the app. A tool the reader built themselves has no such home, so it is kept
whole.

Opening somebody else's figure does not empty your own toolbar. A figure
carries the tools it needs to replay itself, and merging them in is right;
throwing yours away to make room is not. Giving up what you have proved is a
separate thing from clearing the paper, it asks first, and it says how much
will go.

## Working the rest of Book I

Eleven propositions are written out — I.1, I.2, I.3, I.9, I.10, I.11, I.12,
I.31 and I.46 as constructions, I.5 and I.47 as the figures their statements
suppose — and the whole of Book I is in the sidebar. Opening one of those sets
it out step by step; opening any of the others gives a clean sheet, the
statement, and whatever you have got through so far — the reader works it
themselves and can save the result as a tool with **+**.

A theorem says so when it opens: the sketchpad checks that a construction
stands up under dragging, and has no way to check that an argument does.

## Finding your way in

The ⋯ menu has two ways in. **How this works** puts the whole vocabulary in the
panel — the rules, drawing, choosing, the gestures, the step list, tools, and
proving — kept in `help.js` as data rather than markup, so adding a gesture
means adding a line rather than hunting for the paragraph that describes it.

**Walk through the first proposition** is the other. It builds I.1 by hand, one
instruction at a time, and by the end the reader has met every idea the app has
except claims. It never draws anything: a stage is a question asked of the
document, not a command issued to it, and it moves on when the reader has done
the thing. Each stage measures against how things stood when it began, so the
walk can be picked up on a figure already under way.

## Byrne's own figures

Beside most of his definitions Byrne prints a small coloured figure, and in the
book those are not decoration: a line's colour is how the proof refers to it, so
"AB equals DE" is read off the page as two reds rather than spelled out.

Those figures are declared in MetaPost in `jemmybutton/byrne-euclid`, in a small
enough dialect that `tools/extract-byrne.py` can read them rather than guess:
named points, coloured lines, a circle, an arc, an angle. It writes them into
`src/book1-figures.js` as a flat list of things to draw — coordinates in figure
units, y running up the page as MetaPost has it — and `figures.js` fits one into
a box. They are illustrations, not constructions, which is why they get their
own format: the construction model has no word for a wedge marking an angle.

The proposition figures are far past that reader — they intersect paths, loop,
and define their own macros — so for now only their **colours** are taken, which
is enough to print each proposition's enunciation with its lines in the colours
Byrne drew them.

To regenerate, clone `jemmybutton/byrne-euclid` into a `byrne/` directory beside
where you run the script; it writes `book1.json` and `book1-figures.js`, and
`book1.js` is assembled from the JSON.

## Moving about the paper

The right button navigates, which leaves the left button entirely to geometry.
Right-clicking opens a menu naming the gestures, so they can be found rather
than memorised: right-drag pans, shift + right-drag turns the paper, double
right-click centres, and shift + double right-click centres and declares the
current turn upright. Two fingers pinch and twist. The camera's `north` is
whatever was last declared upright, and "turn back to upright" returns to it —
nothing in the document moves.

## Things not done yet

- Only the constructions are checked, not the proofs — the app will happily let you build something true for the
  figure in front of you and false in general. Dragging is the defence, and it is a good one, but it is not a
  proof checker.
- No angles, no lengths, no measurement of any kind. Deliberate for Book I, but I.4 onwards will want a way to
  say two things are equal.
- Tools are still matched by position rather than by role, but a tool may now declare what it needs of what
  it is given — written in the same terms as a claim, so it is plain data and travels with a saved tool. I.3
  says the line to be cut off must be the shorter, and is refused with that reason rather than failing
  somewhere in the middle.
- A tool's givens cannot yet be reordered after the fact, and a tool cannot be edited — only removed and rebuilt.
