+++
slug = "t4zh1b"
title = "Geometric Ornament for Digital Typesetting"
description = """
Introducing the t4zh1b library for constructing geometric patterns.
"""
date = 2026-09-06
# updated =
authors = ["Spencer Scorcelletti"]
template = "commentary/post.html"

[taxonomies]
references = ["arabian-nights"]

[extra]
commentary_number = 10
+++

{{ fig(img=`![The word t4zh1b, reserved in paper out of a field of twelve-pointed stars on lapis](/demos/t4zh1b/heading.svg)`) }}

The word Tazhib (تذهيب) refers to the [The Classical Islamic](https://en.wikipedia.org/wiki/Ottoman_illumination) style of manuscript illumination. The [t4zh1b library](https://github.com/PublicWorksBookClub/t4zh1b) is an effort to emulate some of these patterns for the purpose of typesetting. Read on to learn more or see the [demo](/demos/t4zh1b/).

## Tilings, Rays, and Patterns

{{ fig(img=`![A tiling of octagons and squares; the same tiling with two short rays leaving the midpoint of every edge; the star pattern those rays make when they meet](/demos/t4zh1b/construction.svg "A tiling. Two rays off every edge, at one angle. Where they meet.")`) }}

The process begins with a tiling, which is just repeating shapes to cover a geometric plane. Rays then are imaginary lines that symmetrically emanate from each edge of the tiling's shapes. When rays intersect with one another they form patterns. The resulting patterns are the ornament.

By starting with different tilings one can produce different patterns. Below are square, hexagonal, octagon–and–square, and dodecagon–and–triangle tilings.

{{ fig(img=`![The same construction on four tilings: square, hexagonal, octagon-and-square, dodecagon-and-triangle](/demos/t4zh1b/tilings.svg "Four different tilings as inputs.")`) }}

The angle of the tips of the patterns is determined by the following formula:

<p class="text-center font-mono!">tip = 180° + 360/<i>n</i> − 2 × contact</p>

{{ fig(img=`![One grid drawn three times at 60, 90 and 120 degree star tips](/demos/t4zh1b/tips.svg "The same tiling but with different angles.")`) }}

## Hatching, Color, and Materials

Before print publishing was wide spread there were pre-established conventions for representing certain colors with hatching. Both are supported here.

{{ fig(img=`![Seven panels of identical strapwork over seven different heraldic hatchings](/demos/t4zh1b/tinctures.svg "argent, or, azure, gules, vert, purpure, sable.")`) }}

{{ fig(img=`![The same seven panels again, this time laid as actual pigment: paper, gold, lapis, red lead, malachite, folium, carbon black](/demos/t4zh1b/tinctures-laid.svg "The same seven as the materials they stand for.")`) }}

Additionally there can be ornate materials used within ornament. The three blue hues below are distinct and reflect different regions and centuries.

{{ fig(img=`![The same bordered panel rendered in four palettes: one ink, Mamluk gold on lapis, Persian, Andalusi](/demos/t4zh1b/palettes.svg "The same pattern set in four different materials.")`) }}

Strapwork refers to a ribbon either drawn or woven over and under, acting as a continuous, unbroken line. Along any strand the crossings must alternate, with each crossing binding the two strands.

{{ fig(img=`![The same band of strapwork drawn as unbroken line, then woven so each strand passes over and under](/demos/t4zh1b/weave.svg "Strands are drawn across or woven.")`) }}

## Depth and Shading

The patterns can be quite overwhelming when rendered in 2d. Therefore, like their architectural counterparts, they can be made concave or convex. With depth shading then becomes possible.

{{ fig(img=`![The same square border drawn flat, then raised into a moulding, then sunk, each shaded against a light from the upper left](/demos/t4zh1b/relief.svg "The light source is the upper left in all three.")`) }}

## Lettering and Furniture

A common need when typesetting is to have some kind of ornamented letters.

{{ fig(img=`![A capital D reserved from ornament four ways: the field running through its bowl, the bowl closed, the bowl given its own finer grid, and all four regions of the panel filled differently](/demos/t4zh1b/regions.svg "The tool can accept a font as input to aid in this.")`) }}

Additionally shamsas, verse markers, and marginal almonds can be formed.

{{ fig(img=`![Two shamsas, two verse markers and a marginal almond](/demos/t4zh1b/devices.svg "Shamsa. Verse marker. Marginal almond.")`) }}

## Everything at once

These elements combined can make interesting and historically accurate ornament. Below is a tall ogee window, with four rings of ornament, standing in relief off a bordered outline: lapis reversed, gold stipple woven, two rings left in diagonal hatching, red lead two-toned, with a shamsa and two verse markers in the opening.

{{ fig(img=`![A very tall ogee window in four rings of ornament, standing in relief off a bordered page: lapis reversed, gold stipple woven, two rings left in diagonal hatching, red lead two-toned, with a shamsa and two verse markers in the opening](/demos/t4zh1b/window.svg "Four rings in relief on a bordered page.")`) }}

---

The generator is [**t4zh1b**](https://github.com/PublicWorksBookClub/t4zh1b), MIT licensed, with no dependencies. Everything above is a scalable vector graphic (SVG). It was built for work towards typesetting this club's own edition of the *[Arabian Nights](/works/arabian-nights/)*.
