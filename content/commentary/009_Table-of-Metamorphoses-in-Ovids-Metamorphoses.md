+++
slug = "metamorphoses-transformations"
title = "Table of Metamorphoses in Ovid's _Metamorphoses_"
description = """
Each metamorphosis in the poem by order of appearance.
"""
date = 2026-09-03
# updated =
authors = ["Spencer Scorcelletti"]
template = "commentary/post.html"

[taxonomies]
references = ["ovid-metamorphoses", "metamorphosis-causes"]

[extra]
commentary_number = 9
+++

- `Subject` is who changed
- `From` is what type they were
- `Into` is what type the became
- `Kind`, is what type of thing they were transferred into
- `Agent` is who brought about this change,
- `Cause` is reason for the change,

See **Commentary #8** _[Causes of Metamorphosis](/commentary/metamorphosis-causes/)_ for more information about causes.

{% table(csv="data/tables/Metamorphoses—Transformations.csv" sortable=true link_col=6 link_prefix="/commentary/metamorphosis-causes/#cause-" styles="mt-8 prose-td:first:text-center prose-td:nth-of-type-2:bg-orange-100 prose-td:nth-of-type-2:z-10") %}
<thead>
  <tr class="prose-th:sticky prose-th:top-0 prose-th:z-20 prose-th:bg-orange-50 prose-th:pt-3">
    <th class="w-16 text-center" data-sort="number" aria-sort="ascending">Order</th>
    <th class="w-36 left-0 z-30! bg-orange-100!" data-sort="text">Subject</th>
    <th class="w-32" data-sort="text">From</th>
    <th class="w-36" data-sort="text">Into</th>
    <th class="w-28" data-sort="text">Kind</th>
    <th class="w-36" data-sort="text">Agent</th>
    <th class="w-28" data-sort="text">Cause</th>
    <th class="w-96">Note</th>
    <th class="w-16" data-sort="number">Book</th>
    <th class="w-28">Loc.</th>
  </tr>
</thead>
{% end %}
