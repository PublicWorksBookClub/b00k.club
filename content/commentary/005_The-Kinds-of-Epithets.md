+++
slug = "epithet-kinds"
title = "Kinds of Epithets"
description = """
Brief description of the different kinds of epithets there are.
"""
date = 2026-08-25
# updated =
authors = ["Spencer Scorcelletti"]
template = "commentary/post.html"

[taxonomies]
references = ["ovid-metamorphoses"]

[extra]
commentary_number = 5
+++

These terms are referenced heavily by other commentary, e.g. _[Commentary #6: Table of Epithets in Ovid's "Metamorphoses"](/todo)_.

{% table(csv="data/tables/Epithets—Kinds.csv" id_col=1 id_prefix="kind-" sticky_col=1 scroll_hint=false styles="mt-6 prose-td:first:font-medium") %}
<thead>
  <tr class="prose-th:bg-orange-50">
    <th class="w-24">Kind</th>
    <th class="w-64">Definition</th>
    <th class="w-64">Example</th>
  </tr>
</thead>
{% end %}