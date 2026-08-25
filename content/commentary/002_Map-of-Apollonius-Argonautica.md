+++
slug = "argonautica-map"
title = "Map of Apollonius' _Argonautica_"
description = """
An interactive map of the Argo's journey.
"""
date = 2026-03-29
authors = ["Spencer Scorcelletti"]
template = "commentary/post.html"

[taxonomies]
references = ["apollonius-argonautica"]
[extra]
commentary_number = 2
+++

The first link below opens a fast, explorable version of the Argo's voyage.

The second opens the same map in the full generator, where it can be edited, which is much slower. Changes can become permanent by first saving the map file and then either [emailing it](mailto:info@b00k.club) or submitting a [pull-request](https://github.com/PublicWorksBookClub/b00k.club).
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