+++
draft = false
template = "works/conspectus.html"
slug = "apollonius-argonautica"
# You can also override `title` and `authors`

[extra]
order = 38
sort = "Argonautica"
wikidata = "https://www.wikidata.org/wiki/Q739529"
wikipedia = "https://en.wikipedia.org/wiki/Argonautica"
abstract = """
Jason, a prince of Thessaly, quests to return the legendary golden fleece from the ends of the earth, alongside a crew of heroes and god descendants in their ship, the Argo.
"""
started = 2026-02-15
stopped = 2026-04-19

[taxonomies]
# Textual taxonomies
titles = ["Argonautica", "Argonautika", "Argonautiche"]
authors = ["Apollonius of Rhodes"]
forms = ["poetry"]
genres = ["epic", "etiology"]
subjects = ["mythology", "fate", "duty", "youth", "honor", "love"]
periods = ["Hellenistic Period", "heroic age"]
languages = ["Ancient Greek", "Attic Greek"]

# General taxonomies
tags = ["when to leave a party", "celestial navigation", "spell casting", "how to yoke and harness bulls", "how to plow a field", "respecting oaths", "geography of the ancient world", "sacred altars and where to find them", "xenia gone wrong", "sea suppliants", "on the importance of being loved by the gods", "99 nymphs", "where is hylas", "killing snakes", "Herakles and his path of destruction", "how to have a bronze age wedding"]
years = ["2026"]
arcs = ["Metamorphoses 2"]
index = [
  "Jason",
  "Medea",
  "Aietes",
  "Hera",
  "Athena",
  "Aphrodite",
  "Eros",
  "Apollo",
  "Zeus",
  "Herakles",
  "Hylas",
  "Orpheus",
  "Tiphys",
  "Argos",
  "Idmon",
  "Mopsos",
  "Idas",
  "Peleus",
  "Telamon",
  "Polydeukes",
  "Kastor",
  "Zetes",
  "Kalais",
  "Euphemos",
  "Ankaios",
  "Meleagros",
  "Akastos",
  "Pelias",
  "Hypsipyle",
  "Kyzikos",
  "Amykos",
  "Phineus",
  "Chalkiope",
  "Apsyrtos",
  "Circe",
  "Alcinous",
  "Arete",
  "Talos",
  "Glaukos",
  "Cheiron",
  "Iolkos",
  "Lemnos",
  "Kolchis",
  "Phasis",
  "Drepane",
  "Libya",
  "Crete",
]
contributors = ["Spencer Scorcelletti"]
+++

## Catalogue of Names

The names of the heroes, in order, along with: their parentage, any other relations they may have, where they're from, ability/class/profession, things they may be known for, as well as additional notes.

{% table(csv="data/tables/Argonautica—Catalogue of Names.csv" styles="mt-8 prose-td:first:text-center prose-td:nth-of-type-2:bg-orange-100 prose-td:nth-of-type-2:z-10") %}
<thead>
  <tr class="prose-th:sticky prose-th:top-0 prose-th:z-20 prose-th:bg-orange-50 prose-th:pt-3">
    <th class="w-18 text-center">Order</th>
    <th class="w-32 left-0 z-30! bg-orange-100!">Name</th>
    <th class="w-48">Son of</th>
    <th class="w-32">Relative to</th>
    <th class="w-72">From</th>
    <th class="w-32">Ability/Title</th>
    <th class="w-72">Known for</th>
    <th class="w-92">Notes</th>
  </tr>
</thead>
{% end %}

<!-- ## Outline -->

<!-- Note: cool images: https://www.davidrumsey.com/luna/servlet/detail/RUMSEY~8~1~275891~90048663# -->

<!-- * [Book I](#book-i)
* [Book II](#book-ii) -->

<!-- ### Book I



### Book II -->

## Map

The first link below opens a fast, explorable version of the Argo's voyage: pan and zoom the Mediterranean, search for a place, and click any settlement, marker or label to read its note.

The second opens the same map in the full generator, where it can be edited. That editor has to load the whole 20 MB project before it will draw anything, so it is slow — use it to make changes, not to read the map. Changes can become permanent by first saving the map file and then either [emailing it](mailto:info@b00k.club) or submitting a [pull-request](https://github.com/PublicWorksBookClub/b00k.club).
<!-- Note: greek tribes divided according to this map https://en.wikipedia.org/wiki/List_of_ancient_Greek_tribes#/media/File:Ἀρχαῖα_Ἑλληνικὰ_φῦλα.png -->

<menu class="flex list-none m-0 p-0 gap-1">
  <li>
    <a class="inline-block border px-2 h-9 m-0 no-underline font-normal" target="_blank"
    href="{{ get_url(path='/maps/viewer/') }}/?map=argonautica&burg=24&scale=3">
      Interactive Map
    </a>
  </li>
  <li>
    <a class="inline-block border px-2 h-9 m-0 no-underline font-normal" target="_blank"
    href="{{ get_url(path='/maps/interactive/') }}/?maplink={{ get_url(path='/maps/argonautica.map') }}&burg=24&scale=3">
      Edit the map
    </a>
  </li>
</menu>