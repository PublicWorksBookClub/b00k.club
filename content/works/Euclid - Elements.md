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
already carried out; drag A, B or C and watch AL stay equal to BC.

{{ euclid(proposition="I.2", height=520, caption="Euclid I.2. Step 5 leans on I.1; hover it and press *working* to see what it hides.") }}
