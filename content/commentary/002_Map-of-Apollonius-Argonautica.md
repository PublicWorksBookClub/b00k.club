+++
slug = "argonautica-map"
title = "Map of Apollonius' _Argonautica_"
description = """
An interactive map of the Argo's journey.
"""
date = 2026-03-29
updated = 2026-08-25
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

<link rel="stylesheet" href="/maps/viewer/viewer.css" />

<div class="mapview mapview--embed not-prose" data-mapview-embed data-map="argonautica" data-burg="24" data-scale="3" role="group" aria-label="Interactive map of the Argo's voyage">
  <div class="mapview__frame">
    <div class="mapview__map" role="application" aria-label="Map of the Argo's voyage; drag to pan, scroll or pinch to zoom, click a place to read its note"></div>
    <div class="mapview__chrome">
      <div class="mapview__search" role="search">
        <input class="mapview__search-input" type="search" placeholder="Search places, peoples, markers…" autocomplete="off" spellcheck="false" aria-label="Search the map" aria-expanded="false" />
        <ul class="mapview__results" role="listbox" aria-label="Search results" hidden></ul>
      </div>
      <button class="mapview__button mapview__layers-toggle" type="button" aria-expanded="false">Layers</button>
    </div>
    <div class="mapview__layers" hidden>
      <fieldset>
        <legend>Show on the map</legend>
        <label><input type="checkbox" data-layer="routes" checked /> The voyage</label>
        <label><input type="checkbox" data-layer="markers" checked /> Markers</label>
        <label><input type="checkbox" data-layer="icons" checked /> Settlements</label>
        <label><input type="checkbox" data-layer="labels" checked /> Labels</label>
      </fieldset>
    </div>
    <aside class="mapview__legend" hidden>
      <button class="mapview__legend-toggle" type="button" aria-expanded="false"><span class="mapview__legend-title">Legend</span></button>
      <ul class="mapview__legend-body"></ul>
    </aside>
    <div class="mapview__status" role="status" aria-live="polite">Loading the map…</div>
    <noscript><div class="mapview__fallback">This map needs JavaScript to run inside the page. Use the “Interactive Map” link below to open it on its own.</div></noscript>
  </div>
</div>

<menu class="flex list-none m-0 p-0 gap-1">
  <li>
    <a class="inline-block border px-2 h-9 m-0 no-underline font-normal" target="_blank"
    href="{{ get_url(path='/maps/viewer/') }}/?map=argonautica&burg=24&scale=3">
      Standalone map
    </a>
  </li>
  <li>
    <a class="inline-block border px-2 h-9 m-0 no-underline font-normal" target="_blank"
    href="{{ get_url(path='/maps/interactive/') }}/?maplink={{ get_url(path='/maps/argonautica.map') }}&burg=24&scale=3">
      Edit the map
    </a>
  </li>
</menu>