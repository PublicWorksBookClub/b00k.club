+++
slug = "metamorphoses-epithets"
title = "Table of Epithets in Ovid's _Metamorphoses_"
description = """
Epithets along with gloss and notes for each character by order of appearance.
"""
date = 2026-08-25
# updated =
authors = ["Spencer Scorcelletti"]
template = "commentary/post.html"

[taxonomies]
references = ["ovid-metamorphoses", "epithet-kinds"]

[extra]
commentary_number = 6
+++

Choice of epithet is based on more than just avoiding repetition, e.g. Jupiter is *Saturn's son* when he decides to destroy mankind, and Juno is *his sister-wife* at the moment he cannot refuse her.

See **Commentary #5** _[Kinds of Epithets](/commentary/epithet-kinds/)_ for precise meaning of each kind of epithet.

{% table(csv="data/tables/Metamorphoses—Epithets.csv" sortable=true link_col=4 link_prefix="/commentary/epithet-kinds/#kind-" styles="mt-8 prose-td:first:text-center prose-td:nth-of-type-2:bg-orange-100 prose-td:nth-of-type-2:z-10") %}
<thead>
  <tr class="prose-th:sticky prose-th:top-0 prose-th:z-20 prose-th:bg-orange-50 prose-th:pt-3">
    <th class="w-16 text-center" data-sort="number" aria-sort="ascending">Order</th>
    <th class="w-36 left-0 z-30! bg-orange-100!" data-sort="text">Epithet</th>
    <th class="w-36" data-sort="text">Character</th>
    <th class="w-28" data-sort="text">Kind</th>
    <th class="w-80">Gloss</th>
    <th class="w-96">Sense</th>
    <th class="w-16" data-sort="number">Book</th>
    <th class="w-40">Loc.</th>
  </tr>
</thead>
{% end %}