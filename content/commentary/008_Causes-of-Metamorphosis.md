+++
slug = "metamorphosis-causes"
title = "Causes of Metamorphosis in Ovid"
description = """
Table grouping by kind the causes that precipitate a change in form.
"""
date = 2026-09-03
# updated =
authors = ["Spencer Scorcelletti"]
template = "commentary/post.html"

[taxonomies]
references = ["ovid-metamorphoses"]

[extra]
commentary_number = 8
+++

{% table(csv="data/tables/Transformations—Causes.csv" id_col=1 id_prefix="cause-" sticky_col=1 scroll_hint=false styles="mt-6 prose-td:first:font-medium") %}
<thead>
  <tr class="prose-th:bg-orange-50">
    <th class="w-28">Cause</th>
    <th class="w-64">Definition</th>
    <th class="w-64">Example</th>
  </tr>
</thead>
{% end %}
