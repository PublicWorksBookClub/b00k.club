+++
draft = false
template = "works/conspectus.html"
slug = "ovid-metamorphoses"
# You can also override `title` and `authors`

[extra]
order = 48
sort = "Metamorphoses"
wikidata = "https://www.wikidata.org/wiki/Q184742"
wikipedia = "https://en.wikipedia.org/wiki/Metamorphoses"
abstract = """
TODO: currently reading
"""
started = 2026-08-17
# stopped =
currently_reading = true

[extra.length]
units = "lines"
parts = [
  { label = "Book I", length = 779 },
  { label = "Book II", length = 875 },
  { label = "Book III", length = 733 },
  { label = "Book IV", length = 798 },
  { label = "Book V", length = 678 },
  { label = "Book VI", length = 721 },
  { label = "Book VII", length = 865 },
  { label = "Book VIII", length = 884 },
  { label = "Book IX", length = 797 },
  { label = "Book X", length = 739 },
  { label = "Book XI", length = 795 },
  { label = "Book XII", length = 628 },
  { label = "Book XIII", length = 968 },
  { label = "Book XIV", length = 851 },
  { label = "Book XV", length = 879 },
]

[taxonomies]
# Textual taxonomies
titles = ["Metamorphoses"]
authors = ["Ovid"]
forms = ["poetry"]
genres = ["narrative poetry", "epic"]
subjects = []
periods = ["Roman imperial period"]
languages = ["Classical Latin"]

# General taxonomies
tags = []
years = ["2026"]
arcs = ["Magna I"]
index = [
  "Jupiter",
  "Juno",
  "Apollo",
  "Diana",
  "Mercury",
  "Cupid",
  "Venus",
  "Neptune",
  "Saturn",
  "Ceres",
  "Sol",
  "Themis",
  "Iris",
  "Triton",
  "Pan",
  "Nereus",
  "Amphitrite",
  "Aeolus",
  "Astraea",
  "Hymen",
  "Earth",
  "Chaos",
  "Prometheus",
  "Epimetheus",
  "Iapetus",
  "Atlas",
  "Eurus",
  "Zephyrus",
  "Boreas",
  "Notus",
  "Lycaon",
  "Deucalion",
  "Pyrrha",
  "Io",
  "Argus",
  "Arestor",
  "Daphne",
  "Syrinx",
  "Epaphus",
  "Phaethon",
  "Clymene",
  "Merops",
  "Augustus",
  "Caesar",
  "Python",
  "Giants",
  "Furies",
  "Cyclopes",
  "Naiads",
  "Nymphs",
  "Satyrs",
  "Fauns",
  "Peneus",
  "Inachus",
  "Cephisus",
  "Spercheus",
  "Apidanus",
  "Amphrysus",
  "Enipeus",
  "Aeas",
  "Ladon",
  "Nile",
  "Styx",
  "Olympus",
  "Parnassus",
  "Corycian Cave",
  "Delos",
  "Ortygia",
  "Delphi",
  "Claros",
  "Patara",
  "Tenedos",
  "Tempe",
  "Pindus",
  "Ossa",
  "Pelion",
  "Oeta",
  "Aonia",
  "Phocis",
  "Thessaly",
  "Arcadia",
  "Maenalus",
  "Cyllene",
  "Lycaeus",
  "Nonacris",
  "Lyrcea",
  "Lerna",
  "Greece",
  "Scythia",
  "Arabia",
  "Persia",
  "Aethiopia",
  "India",
  "Rome",
  "Palatine",
  "Capitol",
  "Milky Way",
]
contributors = ["Spencer Scorcelletti"]
+++

## Table of Epithets

Choice of epithet is based on more than just avoiding repetition, e.g. Jupiter is *Saturn's son* when he decides to destroy mankind, and Juno is *his sister-wife* at the moment he cannot refuse her.

See [below](#kinds-of-epithet) for precise meaning of each kind of epithet.

{% table(csv="data/tables/Metamorphoses—Epithets.csv" sortable=true link_col=4 link_prefix="#kind-" styles="mt-8 prose-td:first:text-center prose-td:nth-of-type-2:bg-orange-100 prose-td:nth-of-type-2:z-10") %}
<thead>
  <tr class="prose-th:sticky prose-th:top-0 prose-th:z-20 prose-th:bg-orange-50 prose-th:pt-3">
    <th class="w-16 text-center" data-sort="number" aria-sort="ascending">Order</th>
    <th class="w-64 left-0 z-30! bg-orange-100!" data-sort="text">Epithet</th>
    <th class="w-36" data-sort="text">Character</th>
    <th class="w-28" data-sort="text">Kind</th>
    <th class="w-80">Gloss</th>
    <th class="w-96">Sense</th>
    <th class="w-16" data-sort="number">Book</th>
    <th class="w-40">Loc.</th>
  </tr>
</thead>
{% end %}

### Kinds of epithet

See [above](#table-of-epithets) for epithets themselves.

{% table(csv="data/tables/Epithets—Kinds.csv" id_col=1 id_prefix="kind-" sticky_col=1 scroll_hint=false styles="mt-6 prose-td:first:font-medium") %}
<thead>
  <tr class="prose-th:bg-orange-50">
    <th class="w-24">Kind</th>
    <th class="w-64">Definition</th>
    <th class="w-64">Example</th>
  </tr>
</thead>
{% end %}