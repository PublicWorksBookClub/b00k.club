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
TODO
"""
started = 2026-02-22
currently_reading = true

[taxonomies]
# Textual taxonomies
titles = ["Argonautica", "Argonautika", "Argonautiche"]
authors = ["Apollonius of Rhodes"]
forms = ["poetry"]
genres = ["epic", "etiology"]
subjects = ["todo"]
periods = ["Hellenistic Period", "TODO"]
languages = ["Ancient Greek", "Attic Greek"]

# General taxonomies
years = ["2026"]
arcs = ["Metamorphoses 2"]
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

The link below loads an interactive version of the Argo's voyage. Edits can temporarily be made in the browser. Changes can become permanent by first saving the map file and then either [emailing it](mailto:info@b00k.club) or submitting a [pull-request](https://github.com/PublicWorksBookClub/b00k.club).
<!-- Note: greek tribes divided according to this map https://en.wikipedia.org/wiki/List_of_ancient_Greek_tribes#/media/File:Ἀρχαῖα_Ἑλληνικὰ_φῦλα.png -->

<menu class="flex list-none m-0 p-0 gap-1">
  <li>
    <a class="inline-block border px-2 h-9 m-0 no-underline font-normal" target="_blank"
    href="{{ get_url(path='/maps/interactive/') }}/?maplink={{ get_url(path='/maps/argonautica.map') }}&burg=24&scale=3">
      Interactive Map
    </a>
  </li>
</menu>