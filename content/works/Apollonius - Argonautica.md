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
genres = ["epic"]
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

<iframe class="w-full aspect-square hidden" id="mapFrame"></iframe>

<menu class="flex list-none m-0 p-0 gap-1">
  <li>
    <button class="inline-block cursor-pointer border px-2 h-9 m-0" id="loadMapBtn">Load Map</button>
  </li>
  <li>
    <a class="inline-block border px-2 h-9 m-0 no-underline font-normal" target="_blank"
    href="https://azgaar.github.io/Fantasy-Map-Generator/?maplink={{ get_url(path='/maps/argonautica.map') }}">
      Open Externally
    </a>
  </li>
</menu>

<script>
  const btn = document.getElementById('loadMapBtn');
  const iframe = document.getElementById('mapFrame');

  btn.addEventListener('click', () => {
    // Replace with your hosted map file URL
    const mapURL = encodeURIComponent('{{ get_url(path="/maps/argonautica.map") }}');

    // Azgaar URL with map parameter
    iframe.src = `https://azgaar.github.io/Fantasy-Map-Generator/?maplink=${mapURL}`;

    iframe.style.display = 'block';
    btn.style.display = 'none';
  });
</script>