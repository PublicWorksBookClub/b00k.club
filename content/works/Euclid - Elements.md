+++
draft = false
template = "works/conspectus.html"
slug = "euclid-elements"
# You can also override `title` and `authors`

[extra]
order = 40
sort = "Elements"
read_in_selection = true
wikidata = "https://www.wikidata.org/wiki/Q172891"
wikipedia = "https://en.wikipedia.org/wiki/Euclid%27s_Elements"
abstract = """
TODO
"""
started = 2026-04-26
currently_reading = true

[taxonomies]
# Textual taxonomies
titles = ["Elements", "Euclid's Elements", "Elements by Euclid"]
authors = ["Euclid"]
forms = ["treatise"]
genres = ["Mathematics"]
subjects = ["geometry"]
periods = ["Hellenistic Period"]
languages = ["Ancient Greek"]

# General taxonomies
tags = []
years = ["2026"]
arcs = ["Metamorphoses 2"]
contributors = ["Spencer Scorcelletti"]
+++

## Straightedge and compass

Euclid begins with almost nothing: a point may be set down, a straight line may be drawn from any point to any
point and produced as far as one likes, and a circle may be described about any centre through any point. Every
proposition of Book I is built out of those three postulates and the propositions already proved — and once a
proposition is proved, it may be used ever after as a single move.

The sketchpad below works under exactly those rules. Where the lines and circles you draw cut one another, the
points are there to be used without being asked for. Nothing else is given: a compass that carries a length
across the page is not one of the postulates, which is what [I.2](#i-2) is for.

{{ euclid(height=560, tools="I.1,I.2,I.3", caption="Postulates 1–3, plus whatever you have proved. Open it on its own at [/euclid/](/euclid/).") }}

When you have carried out a construction, press **+** to keep it: choose which parts of the figure are the
givens, choose what the construction produces, and it becomes a button in the toolbar. Everything in between
turns into hidden working, exactly as an appeal to an earlier proposition hides its own construction. Tools may
be built on tools — I.3 as it ships here is built on I.2, which is built on I.1.

The toolbox tab also holds the propositions themselves, and **Read the construction** sets any of them out in a
fresh figure one step at a time, so a proof can be walked forwards and backwards with the slider.

### I.2 { #i-2 }

_To place at a given point (as an extremity) a straight line equal to a given straight line._ The one below is
already carried out; drag A, B or C and watch AF stay equal to BC.

{{ euclid(proposition="I.2", height=520, caption="Euclid I.2. Step 2 leans on I.1; hover it and press *working* to see what it hides.") }}

## Constructing and proving

The first three propositions are problems: they build something, and what they build can be kept. From I.4
onwards Book I is mostly theorems, which build nothing and instead assert — this angle equals that one, these
triangles are equal in every respect, the square on the hypotenuse is the other two taken together. Asserting is
a different act from drawing, so the sketchpad treats it as one.

Select two points for a length, or three for an angle or a figure, hold it, select what it is to be compared
with, and say how the two stand. The claim is checked where it stands, and can be checked again by **shaking**
the figure: every point set down by hand is jogged about at random, a couple of hundred times over, and any
claim that fails somewhere is reported. That is what catches a claim which is true of the figure in front of you
and of no other. Each claim carries its reason, chosen from the book in the sidebar. Nothing checks that the
reason entails the claim — that would be a proof checker, and this is a sketchpad — but a proof that does not
say why is not a proof.

### The supposition is built, not assumed { #supposing }

"Let ABC be an isosceles triangle" is not two free points and a promise. It is A, B, and then C taken _on the
circle about A through B_ — so AC equals AB by [Definition 15](/euclid/), and goes on equalling it however hard
the figure is shaken. There is no constraint solver here and none is wanted: Euclid's suppositions are
constructions, and constructing them is the whole of what it takes.

### I.47 { #i-47 }

_In a right angled triangle the square on the hypotenuse is equal to the sum of the squares of the sides._ The
last proposition of Book I, and the one everything before it is for. The right angle below is constructed rather
than assumed, and each of the three squares is put there by [I.46](/euclid/), which stands on I.31, which stands
on I.12 and I.11, which stand on I.10, which stands on I.1. Drag any of the points and the whole tower follows.

{{ euclid(proposition="I.47", height=620, caption="Euclid I.47. Select the four corners of a square to take its content; hold it, add the second square, and say the third is equal to both.") }}
