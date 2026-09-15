+++
slug = "metamorphoses-geneaology"
title = "Family Trees of Ovid's _Metamorphoses_"
description = """
Various genealogies of gods and heroes as they're portrayed by Ovid.
"""
date = 2026-09-13
# updated =
authors = ["Elisa Barbierato", "Spencer Scorcelletti"]
template = "commentary/post.html"

[taxonomies]
references = ["ovid-metamorphoses"]

[extra]
commentary_number = 11
+++

Dashed lines join partners who were not married. Lighter backgrounds signify an extra-familial parent. Some — especially earlier in the genealogy — are not explicitly mentioned by Ovid and are canon.

## The Titans

{% family_tree(caption="Gaia, Uranos and their descendants") %}
- Gaia
  - Iapetus ~[^uranos]
    - Epimetheus | no explicit mother mentioned
      - Pyrrha [^pandora]
    - Prometheus | no explicit mother mentioned
      - Deucalion
        - DESCENDANTS [^pyrrha] | descendants of the survivors of the flood
          (also siblings to those born from the stones)
    - Atlas | no explicit mother mentioned
  - Tethys ~[^uranos]
    - Peneus [^oceanus]
      - Daphne | no explicit mother mentioned
        turned into a laurel as she was escaping Apollo
    - Inachus [^oceanus]
      - Io | no explicit mother mentioned
        turned into a calf because of her love with Jove
    - Philyra [^oceanus]
      - Chiron [^cronus]
        - Ocyrhoe [^chariclo]
          turned into a horse after saying a prophecy regarding her father
  - Oceanus ~[^uranos]
  - Cronus ~[^uranos]
    - DESCENDANTS [^rhea]
      Olympians
  - Rhea ~[^uranos]

* Uranos
* Pandora
  not explicitly mentioned by Ovid
* Chariclo
{% end %}

## The Olympians

{% family_tree(caption="Descendants of Gaia and Uranos sans extra-familial relationships of Zeus") %}
- Uranos / Caelus
  - Cronus / Saturn ~[^gaia]
    - Hestia / Vesta [^rhea]
    - Poseidon / Neptune [^rhea]
    - Hades / Pluto [^rhea]
      - NO_CHILDREN [^persephone]
    - Demeter / Ceres [^rhea]
      - Persephone / Proserpina ~[^zeus]
    - Zeus / Jove [^rhea]
      - Athena / Minerva | born directly from Jove's head (See Ares/Marte).
    - Hera / Juno [^rhea]
      - Hephaestus / Vulcano [^zeus]
      - Ares / Marte | no father, born as a response to Jove making Minerva without Juno (Hera touches a magical flower to her body, given by Flora)
  - Rhea / Opis ~[^gaia]
  - Aphrodite / Venus | no mother
    - NO_CHILDREN [^hephaestus]
    - Eros / Cupido ~[^ares]

* Gaia / Terra
{% end %}

{% family_tree(caption="Children fathered by Zeus with mothers outside his own family") %}
- Leto
  - Apollo ~[^zeus]
  - Artemis / Diana ~[^zeus]
- Maia
  - Hermes / Mercury ~[^zeus]
- Semele
  - Dionysus / Bacchus ~[^Zeus]

* Zeus / Jove
{% end %}

## Jove and Leto

{% family_tree(caption="The children of Jove and Leto, and of Apollo") %}
- Jove
  - Apollo ~[^leto]
    - Asclepius [^coronis]
    - Phaethusa [^clymene]
      turned into a tree after the death of her brother
    - Lampetia [^clymene]
      turned into a tree after the death of her brother
    - Phaethon [^clymene]
      died trying to drive the Sun's chariot
      - NO_CHILDREN ~[^cygnus]
  - Diana ~[^leto]
- Sthenelus
  - Cygnus
    turned into a swan after the death of his lover

* Leto
* Coronis
  cheated on Apollo and was killed by him, because the raven snitched
* Clymene
{% end %}

## The House of Agenor

{% family_tree(caption="Agenor's children Europa and Cadmus, and Cadmus' grandchildren") %}
- Agenor
  - Europa
    - Epaphus [^jove] (as a bull)
      frenemy of Phaethon
  - Cadmus
    - Semele
      tricked by Juno into asking Jove to show her his true divine form
      - Bacchus [^jove]
    - Ino
    - Autonoe
      - Actaeon
        saw Diana naked, was turned into a deer and killed by his own dogs
    - Agave
      - Pentheus [^echion]
        against Bacchus; killed by his own mother and aunt

* Jove
* Echion
  one of the Spartoi, born of the dragon's teeth
{% end %}

## Other Families

{% family_tree(caption="Lycaön, Cecrops, Epopeus and Arestor, and their children") %}
- Lycaön
  turned into a wolf because of his impiety
  - Callisto
    turned into a bear
    - Arcas [^jove] (as Diana)
      turned into a constellation with his bear mother
- Cecrops
  first king of Athens
  - Herse
    loved by Mercury
  - Aglauros
    disobeyed Athena and saw Erichthonius; for this, Envy made her turn into marble
  - Pandrosos
- Epopeus
  - Nyctimene
    had sex with her father and was turned by Athena into an owl
- Arestor
  - Argus
    with many eyes, a servant of Juno killed by Mercury to save Io; his eyes adorned Juno's bird's feathers (the peacock)

* Jove
{% end %}
