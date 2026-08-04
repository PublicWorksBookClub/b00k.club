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
| `tools`       | which propositions start in the toolbox, e.g. `I.1,I.2,I.3`    |
| `proposition` | open with a proposition set out step by step, e.g. `I.2`       |
| `src`         | URL of a saved sketch to open                                  |
| `readonly`    | the figure may be read and dragged, but not drawn on           |
| `empty`       | start with a blank page rather than two points                 |
| `remember`    | keep the reader's toolbox in their browser                     |
| `use-hash`    | read and write the sketch in the page's URL fragment           |
| `sidebar`     | `open` or `closed`; open by default only on its own page       |
| `through`     | how far the reader has got, e.g. `I.3` — limits the toolbox    |
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
  propositions.js  Book I.1, I.2, I.3, I.9, I.10 written out as tools
  camera.js        pan and zoom
  renderer.js      drawing the figure
  figures.js       drawing Byrne's marginal illustrations, which are not constructions
  book1.js         Book I's text, generated from Byrne's LaTeX
  book1-figures.js what his drawings say, generated from their MetaPost
  interactions.js  pointer and keyboard handling, hit testing
  app.js           the controller: all state and every command
  ui.js            toolbar, step list, toolbox, scrubber, the new-tool dialog
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

A proposition starts from something — two points, a line, an angle — and that is
not part of what it proves. Steps marked `setup` are set aside in the step list
as "the given figure", the construction proper is numbered from 1, and the
slider cannot rub the givens out. Reading a proposition through marks its givens
automatically; a figure drawn by hand can be declared the givens after the fact
from the ⋯ menu, using the ordinary tools, colours and dashes to lay it out.

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
- Tools are matched by position, not by role: applying I.3 with the lesser line where the greater should go
  fails at solve time rather than being refused up front.
- A tool's givens cannot yet be reordered after the fact, and a tool cannot be edited — only removed and rebuilt.
