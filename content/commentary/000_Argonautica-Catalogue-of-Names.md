+++
slug = "argonautica-catalogue"
title = "Catalogue of Names from Apollonius' _Argonautica_"
description = """
The names of heroes and their origins, parentage, and abilities, along with notes.
"""
date = 2026-02-23
authors = ["Spencer Scorcelletti"]
template = "commentary/post.html"

[taxonomies]
references = ["apollonius-argonautica"]
[extra]
commentary_number = 0
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