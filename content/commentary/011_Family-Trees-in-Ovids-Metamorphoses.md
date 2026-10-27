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

(This page is still a WIP, as we are currently reading Ovid.)


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
        - Epaphus ~[^jove]
          frenemy of Phaethon
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
* Jove
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
    - Minos [^jove] (as a bull)
      king of Crete (see Minos and Crete below)
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

## Cadmus, Harmonia and the House of Athamas

{% family_tree(caption="Cadmus and Harmonia's daughter Ino, and the house of Aeolus she married into (Books 4, 6–7, 11)") %}
- Mars
  - Harmonia ~[^venus]
    wife of Cadmus and mother of his children; in exile, the two were turned into snakes
    - Ino / Leucothea [^cadmus]
      driven mad by Juno; leapt into the sea and was made a sea goddess
      - Learchus [^athamas]
        dashed against a rock by his maddened father
      - Melicertes / Palaemon [^athamas]
        carried into the sea by his mother and made a sea god
- Aeolus
  a king of Aeolia, not the keeper of the winds
  - Athamas
    driven mad by the Fury Tisiphone at Juno's bidding
    - Phrixus [^nephele]
      fled his stepmother Ino on a golden ram, whose fleece he left at Colchis
    - Helle [^nephele]
      fell from the ram and drowned in the strait named for her
  - Sisyphus
    rolls his stone forever in the underworld; Ajax calls him Ulysses' father
  - Canace
    raped by Neptune as a bull

* Venus
* Cadmus
  son of Agenor and founder of Thebes
* Nephele
{% end %}

## The Children of the Sun

{% family_tree(caption="Hyperion's son the Sun, his children, and Leucothoë (Books 4, 7, 9, 14)") %}
- Hyperion
  - Sun / Titan
    also called Phoebus; father of Phaethon and the Heliades (drawn above under Apollo); loved Clymene, Rhodes and Clytië before Leucothoë
    - Circe
      a sorceress; turned Ulysses' men into swine and Picus into a woodpecker
    - Pasiphaë
      wife of Minos, and mother of the Minotaur by a bull
    - Aeëtes
      king of Colchis, keeper of the Golden Fleece
      - Medea
        see Medea and Jason below
    - NO_CHILDREN ~[^leucothoe]
- Orchamus
  king of Persia, seventh in descent from Belus
  - Leucothoë [^eurynome]
    buried alive by her father after the Sun seduced her; became the frankincense shrub

* Eurynome
{% end %}

## The House of Perseus

{% family_tree(caption="Perseus' ancestors, and Andromeda's family (Books 4–5)") %}
- Lynceus
  - Abas
    king of Argos
    - Acrisius
      denied that Perseus was Jove's son; driven out by Proetus and restored by Perseus
      - Danaë
        locked away by her father
        - Perseus ~[^jove] (as a shower of gold)
          also called an heir of Inachus and of Agenor; killed Medusa and turned his foes to stone with her head
          - NO_CHILDREN [^andromeda]
    - Proetus
      usurped his brother's throne; turned to stone by Perseus
- Cepheus
  king of Aethiopia
  - Andromeda [^cassiope]
    chained to a rock to pay for her mother's words; saved from a sea monster by Perseus
- Phineus
  brother of Cepheus, and Andromeda's uncle and betrothed; turned to stone by Perseus

* Jove
* Cassiope
{% end %}

{% family_tree(caption="Phorcys' daughters Medusa and the Gray Ones (Book 4)") %}
- Phorcys
  - Medusa
    raped by Neptune in Minerva's shrine, for which Minerva turned her hair to snakes; beheaded by Perseus
    - Pegasus
      the winged horse, sprung from her blood
    - Chrysaor
      his brother, sprung from her blood
  - Gray Ones / Graeae
    twin sisters sharing one eye, which Perseus stole
{% end %}

## Other Families of Books 4–6

{% family_tree(caption="Minyas' daughters, and Hermaphroditus (Book 4)") %}
- Minyas
  his three daughters spun and told stories through Bacchus' feast, and were turned into bats
  - Alcithoë
  - Leuconoë
- Atlas
  - Maia [^pleione]
    one of the Pleiades
    - Mercury ~[^jove]
      - Hermaphroditus ~[^venus]
        his name joins his parents'; fused by the gods with the nymph Salmacis into one body of both sexes

* Pleione
* Jove
* Venus
{% end %}

{% family_tree(caption="The families of Pierus, Acheron, Idmon and Tiresias (Books 5–6)") %}
- Pierus
  of Pella
  - DESCENDANTS [^euippe]
    nine daughters, who challenged the Muses to a singing contest and were turned into magpies
- Acheron
  a river of the underworld
  - Ascalaphus ~[^orphne]
    saw Proserpina eat the pomegranate seeds and told; turned into an owl
- Idmon
  a dyer of Colophon
  - Arachne
    challenged Minerva at the loom; turned into a spider
- Tiresias
  the blind Theban prophet
  - Manto
    a prophetess; sent the Theban women to worship Latona

* Euippe
* Orphne
  a nymph of the underworld
{% end %}

## The House of Tantalus

{% family_tree(caption="Tantalus' daughter Niobe and her children (Book 6)") %}
- Jove
  - Tantalus
    dined with the gods and served them his son; starves forever in the underworld
    - Niobe | her mother was a sister of the Pleiades
      boasted of her children before Latona, whose twins killed them all; turned into a weeping stone
      - Ismenus [^amphion]
      - Sipylus [^amphion]
      - Phaedimus [^amphion]
      - Tantalus the younger [^amphion]
      - Alphenor [^amphion]
      - Damasichthon [^amphion]
      - Ilioneus [^amphion]
      - DESCENDANTS [^amphion]
        seven daughters, killed by Diana
  - Amphion | no explicit mother mentioned
    king of Thebes, whose lyre built its walls; killed himself in grief
{% end %}

{% family_tree(caption="Tantalus' son Pelops, and Pelops' grandsons (Books 6, 8, 12–13)") %}
- Tantalus
  - Pelops
    cut up by his father; the gods put him back together with an ivory shoulder
    - Atreus
      - Agamemnon
        led the Greeks at Troy
        - Iphigenia
          offered to Diana at Aulis, who put a deer in her place
      - Menelaus
        - NO_CHILDREN [^helen]
    - Pittheus
      king of Troezen

* Helen
  daughter of Tyndareus; carried off to Troy by Paris
{% end %}

## The House of Pandion

{% family_tree(caption="Pandion's daughters Procne and Philomela, and Erechtheus' daughters Procris and Orithyia (Books 6–7)") %}
- Erichthonius
  son of Vulcan, born of no mother
  - Pandion | not explicitly mentioned by Ovid
    king of Athens; died early of grief
    - Procne
      killed her son and served him to his father; became a bird
      - Itys [^tereus]
    - Philomela
      raped by Tereus, who cut out her tongue; wove her story into cloth, and became a bird
    - Erechtheus
      king of Athens after his father
      - Procris
        killed by mistake with her husband's never-missing spear
        - NO_CHILDREN [^cephalus]
      - Orithyia
        carried off by Boreas to Thrace
        - Calaïs [^boreas]
          winged twin; sailed with the Argonauts
        - Zetes [^boreas]
          winged twin; sailed with the Argonauts
      - DESCENDANTS
        four sons and two more daughters

* Tereus
  king of Thrace, descended from Mars; turned into a crested bird
* Cephalus
  grandson of Aeolus; loved by Dawn
* Boreas
  the north wind
{% end %}

## Medea and Jason

{% family_tree(caption="Medea and her husbands Jason and Aegeus (Book 7)") %}
- Aeëtes
  son of the Sun; king of Colchis
  - Medea
    a sorceress; won Jason the Fleece, made his father young, and tricked Pelias' daughters into killing him
    - DESCENDANTS [^jason]
      their sons, killed by Medea when Jason took a new wife
    - NO_CHILDREN [^aegeus]
- Aeson
  made young again by Medea's magic
  - Jason
    led the Argonauts to Colchis for the Golden Fleece
- Pelias
  Aeson's brother
  - DESCENDANTS
    his daughters, who cut him up believing Medea would make him young

* Aegeus
  king of Athens, and father of Theseus, whom Medea tried to poison
{% end %}

## Aegeus and Theseus

{% family_tree(caption="Aegeus, his son Theseus, and their wives and lovers (Books 7–8, 15)") %}
- Aegeus
  king of Athens; grandson of Cecrops
  - NO_CHILDREN [^medea]
  - Theseus | no explicit mother mentioned
    also called Neptune's hero; killed the Minotaur; his father knew him by his sword just before he drank Medea's poison
    - NO_CHILDREN ~[^ariadne]
    - NO_CHILDREN [^phaedra]
    - Hippolytus ~[^hippolyta]
      cursed by his father and dragged to death by his horses; revived by Aesculapius, and made the god Virbius by Diana

* Medea
  daughter of Aeëtes (see Medea and Jason)
* Ariadne
  daughter of Minos; Theseus left her on Naxos
* Phaedra
  daughter of Minos and Pasiphaë; tried to seduce her stepson Hippolytus, then accused him
* Hippolyta
  queen of the Amazons
{% end %}

## Minos and Crete

{% family_tree(caption="Minos and Pasiphaë, and their children (Books 7–9, 15)") %}
- Europa
  - Minos ~[^jove] (as a bull)
    king of Crete; made war on Megara and Athens to avenge his son
    - Androgeus | no explicit mother mentioned
      his death, blamed on Athens, began Minos' war
    - Ariadne | no explicit mother mentioned
      led Theseus out of the Labyrinth; abandoned on Naxos, where Bacchus set her crown among the stars
      - NO_CHILDREN ~[^bacchus]
    - Phaedra [^pasiphae]
      wife of Theseus (see Aegeus and Theseus)
- Sun
  see the Children of the Sun
  - Pasiphaë
    - Minotaur ~[^bull]
      shut in the Labyrinth Daedalus built; killed by Theseus

* Jove
* Bacchus
* Bull
  the bull Pasiphaë tricked with a wooden cow
{% end %}

{% family_tree(caption="Nisus and Scylla, and Daedalus' son and nephew (Book 8)") %}
- Nisus
  king of Megara, whose scarlet lock kept his throne safe; turned into an osprey
  - Scylla
    cut off her father's lock for love of Minos, who spurned her; turned into a bird, the "shearer"
- Daedalus
  Athenian craftsman; built the Labyrinth, and wings to escape Crete
  - Icarus
    flew too near the sun and fell into the sea
- Perdix
  son of Daedalus' sister; invented the saw; thrown from the Acropolis by his jealous uncle and turned into a partridge
{% end %}

## The House of Oeneus

{% family_tree(caption="Oeneus and Althaea of Calydon, their children, and Althaea's brothers (Books 8–9, 14)") %}
- Portheus
  - Oeneus
    king of Calydon; left Diana out of his harvest offerings, so she sent the boar
    - Meleager [^althaea]
      also called Mars' son; killed the boar and his uncles; died when his mother burned the log his life was bound to
      - NO_CHILDREN ~[^atalanta]
    - Deianira | no explicit mother mentioned
      wooed by Acheloüs, won by Hercules; killed him unknowingly with Nessus' poisoned blood
    - Gorge | no explicit mother mentioned
      spared, with Deianira, when Diana turned their sisters into birds
    - DESCENDANTS
      Meleager's other brothers and sisters; the sisters were turned into birds
    - Tydeus | no explicit mother mentioned
      - Diomedes
        wounded Venus at Troy; his crew were turned into birds
- Thestius
  - Althaea
    burned the log in revenge for her brothers, then killed herself
  - Plexippus
    killed by Meleager
  - Toxeus
    killed by Meleager

* Atalanta
  the Tegean huntress, first to wound the boar
{% end %}

## Hercules

{% family_tree(caption="Hercules' parents, wives and sons, and Iole's family (Books 9, 12)") %}
- Alcmene
  - Hercules / Alcides ~[^jove]
    hated by his stepmother Juno; killed by a shirt soaked in Nessus' blood, and made a god
    - Hyllus [^deianira]
      - DESCENDANTS [^iole]
        Iole was carrying his child
    - Tlepolemus | no explicit mother mentioned
      led the Rhodians at Troy
    - NO_CHILDREN [^hebe]
  - NO_CHILDREN [^amphitryon]
- Eurytus
  of Oechalia, which Hercules sacked
  - Iole
    married to Hyllus at Hercules' command
  - Dryope | by a different mother
    raped by Apollo, then married to Andraemon; turned into a tree
    - Amphissos | no explicit father mentioned

* Jove
* Amphitryon
  son of Alcaeus; Hercules' stepfather
* Deianira
  daughter of Oeneus (see the house of Oeneus)
* Hebe
  daughter of Juno; Hercules' wife in heaven
{% end %}

## Byblis, Caunus and Iphis

{% family_tree(caption="Miletus' twins Byblis and Caunus, and Iphis and Ianthe (Book 9)") %}
- Apollo
  - Miletus ~[^deione]
    fled Minos and founded the city named for him
    - Byblis ~[^cyanee]
      fell in love with her twin; wept herself into a spring
    - Caunus ~[^cyanee]
      fled from his sister's love
- Meander
  a river god
  - Cyaneë
- Ligdus
  a poor man of Phaestos, who ordered his child killed if it was a girl
  - Iphis [^telethusa]
    raised as a boy by her mother; turned into a man by Isis before the wedding
    - NO_CHILDREN [^ianthe]
- Telestes
  - Ianthe

* Deione
* Telethusa
{% end %}

## Orpheus, and the Families in His Songs

{% family_tree(caption="Orpheus' parents and wife (Books 10–11)") %}
- Jove
  - Calliope ~[^mnemosyne]
    the Muse of epic poetry
    - Orpheus ~[^apollo]
      went down to the underworld for his wife and lost her by looking back; torn apart by the Ciconian women
      - NO_CHILDREN [^eurydice]
  - Apollo ~[^latona]

* Mnemosyne
* Latona
* Eurydice
  died of a snakebite at her wedding
{% end %}

{% family_tree(caption="Pygmalion's descendants, down to Adonis (Book 10)") %}
- Pygmalion
  a sculptor of Cyprus who fell in love with his ivory statue
  - Paphos [^ivory-maiden]
    namesake of the island
    - Cinyras | no explicit father mentioned
      king of Cyprus
      - Myrrha [^cenchreis]
        fell in love with her father and slept with him in secret; turned into the myrrh tree
        - Adonis | fathered by her own father, Cinyras
          born from the tree; loved by Venus; killed by a boar and turned into the anemone
          - NO_CHILDREN ~[^venus]

* Ivory Maiden
  Pygmalion's statue, brought to life by Venus; unnamed in Ovid
* Cenchreis
  queen of Cyprus
* Venus
{% end %}

{% family_tree(caption="Atalanta and Hippomenes, and Hyacinth (Book 10)") %}
- Schoeneus
  - Atalanta
    raced her suitors and killed those who lost
- Megareus
  of Onchestus, grandson of Neptune
  - Hippomenes
    won Atalanta with Venus' golden apples, but forgot to thank her; the two were turned into lions
    - NO_CHILDREN [^atalanta]
- Amyclas
  king of Sparta
  - Hyacinth
    loved by Apollo, who killed him by accident with a discus; turned into the hyacinth
{% end %}

## Ceyx and Alcyone

{% family_tree(caption="The Morning Star's sons Ceyx and Daedalion, Aeolus' daughter Alcyone, and Erysichthon's daughter Mestra (Books 8, 11)") %}
- Hippotes
  - Aeolus
    keeper of the winds
    - Alcyone
      saw her husband's drowning in a dream; turned into a kingfisher
- Morning Star / Lucifer
  - Ceyx
    king of Trachis; drowned at sea and turned into a kingfisher
    - DESCENDANTS [^alcyone]
      as kingfishers, they still mate and rear their young
  - Daedalion
    threw himself from Parnassus in grief; Apollo turned him into a hawk
    - Chione
      bore twins to two gods; shot by Diana for boasting herself fairer
      - Autolycus ~[^mercury]
        a thief and trickster like his father
        - NO_CHILDREN [^mestra]
      - Philammon ~[^apollo]
        a singer and lyre-player like his father
- Triops
  - Erysichthon
    cut down Ceres' sacred oak; cursed with a hunger that made him eat himself
    - Mestra
      sold again and again by her father; Neptune let her change shape to escape

* Mercury
* Apollo
{% end %}

## The House of Aeacus

{% family_tree(caption="Aeacus' sons and grandsons, and the descents from Jove that Ajax and Ulysses claim (Books 7, 11–13)") %}
- Jove
  - Aeacus ~[^aegina]
    king of Aegina, whose people Jove remade from ants after a plague; later a judge of the dead
    - Telamon | no explicit mother mentioned
      sacked Troy with Hercules
      - Ajax | no explicit mother mentioned
        lost the contest for Achilles' arms and killed himself; his blood became a flower
      - Teucer [^hesione]
    - Peleus | no explicit mother mentioned
      exiled for killing his half-brother Phocus
      - Achilles [^thetis]
        killed Cygnus and Hector; shot by Paris
        - Neoptolemus / Pyrrhus | no explicit mother mentioned
          sacrificed Polyxena on his father's tomb
    - Phocus ~[^psamathe]
      killed by Peleus
  - Arcesius | no explicit mother mentioned
    - Laertes
      - Ulysses
        his mother's line also went back to Mercury; Ajax calls him a son of Sisyphus
        - NO_CHILDREN [^penelope]

* Aegina
  daughter of the river Asopus; the island is named for her
* Hesione
  daughter of Laomedon of Troy
* Thetis
  a Nereid; Jove married her to Peleus lest her son outdo his father
* Psamathe
  a Nereid, Thetis' sister; sent a wolf against Peleus' herds to avenge her son
* Penelope
{% end %}

## The Royal House of Troy

{% family_tree(caption="Laomedon's children (Books 6, 10–11, 13)") %}
- Ilus
  founder of Troy
  - Laomedon | not explicitly mentioned by Ovid
    king of Troy; cheated Apollo and Neptune of their pay for its walls, and Hercules of his
    - Priam
      king of Troy at its fall (see below)
    - Tithonus
      - Memnon [^dawn]
        killed by Achilles; birds rose from his ashes
    - Hesione
      offered to a sea monster for her father's lies; saved by Hercules and given to Telamon
      - Teucer [^telamon]
    - Antigone
      turned into a stork by Juno
    - Ganymede
      carried off by Jove as an eagle to be his cupbearer

* Dawn
* Telamon
  son of Aeacus
{% end %}

{% family_tree(caption="Priam's children (Books 11–13, 15)") %}
- Priam
  killed at Jove's altar as Troy burned
  - Aesacus ~[^alexirhoe]
    leapt into the sea in grief for Hesperia; turned into a diving bird
  - Hector [^hecuba]
    Troy's greatest warrior; killed by Achilles
    - Astyanax | no explicit mother mentioned
      thrown from Troy's walls by the Greeks
  - Paris [^hecuba]
    carried off Helen; shot Achilles
    - Corythus | no explicit mother mentioned
    - NO_CHILDREN ~[^helen]
  - Cassandra [^hecuba]
    Apollo's priestess; dragged off by the hair as Troy fell
  - Polyxena [^hecuba]
    sacrificed on Achilles' tomb
  - Polydorus [^hecuba]
    the youngest son; murdered for his gold by Polymestor of Thrace
  - Helenus [^hecuba] | Ovid doesn't name his mother
    a prophet; foretold Rome's greatness to Aeneas

* Alexirhoë
  daughter of the river Granicus
* Hecuba
  daughter of Dymas; avenged Polydorus, and was turned into a dog
* Helen
  wife of Menelaus
{% end %}

## Neptune's Sons, and the Lapiths

{% family_tree(caption="Neptune's sons Neleus and Cygnus, Caeneus, and Pirithoüs (Book 12)") %}
- Neptune
  - Neleus
    king of Pylos
    - Nestor
      the aged Pylian, who tells of the battle of the Lapiths and centaurs
    - Periclymenus
      could take any shape; shot down by Hercules as an eagle
    - DESCENDANTS
      ten more sons, all killed by Hercules
  - Cygnus
    no weapon could wound him; strangled by Achilles and turned into a swan
- Elatus
  - Caenis / Caeneus
    raped by Neptune, who made her a man no weapon could wound; buried by the centaurs under trees
- Ixion
  - Pirithoüs
    friend of Theseus; the centaurs ran riot at his wedding
    - NO_CHILDREN [^hippodame]

* Hippodame
{% end %}

## Aeneas and the Kings of Alba

{% family_tree(caption="Aeneas' parents, wives and son, and the family of Anius, who sheltered them on Delos (Books 13–14)") %}
- Venus
  - Aeneas ~[^anchises]
    carried his father and household gods out of burning Troy; made the god Indiges by his mother
    - Ascanius / Iulus | no explicit mother mentioned
      king of Alba
    - NO_CHILDREN ~[^dido]
    - NO_CHILDREN [^lavinia]
- Faunus
  a woodland god; also the father of Acis
  - Latinus
    king of the Latins
    - Lavinia
      promised to Turnus, but given to Aeneas
- Anius
  king of Delos and priest of Apollo
  - Andros
    a prophet; rules the island named for him
  - DESCENDANTS
    four daughters, whose touch turned things to grain, wine and oil; turned into doves

* Anchises
* Dido
  queen of Carthage; killed herself on a pyre when Aeneas left
{% end %}

Ovid gives the kings of Alba as a list of who reigned next. Where he doesn't say a king was his predecessor's son or heir, the line into him is labeled "next king".

{% family_tree(caption="The kings of Alba, from Aeneas' son down to Romulus (Book 14)") %}
- Ascanius / Iulus
  son of Aeneas; first king of Alba
  - Silvius
    - Latinus
      took his forebear's name
      - Alba | his heir
        - Epytus | his heir
          - Capys | next king
            - Capetus | next king
              - Tiberinus | next king
                drowned in the river that now bears his name
                - Remulus
                  mimicked lightning and was killed by it
                - Acrota
                  - Aventinus | next king
                    buried on the hill named for him
                    - Proca | next king
                      - Numitor | not explicitly mentioned by Ovid
                        driven from his throne by Amulius, and restored by his grandson
                        - Ilia
                          - Romulus / Quirinus ~[^mars]
                            founded Rome; taken up to heaven as the god Quirinus
                            - NO_CHILDREN [^hersilie]
                      - Amulius | not explicitly mentioned by Ovid
                        Numitor's brother, who seized his throne

* Mars
* Hersilie
  made the goddess Hora, beside Romulus
{% end %}

## Picus and Canens

{% family_tree(caption="Picus and Canens (Book 14)") %}
- Saturn
  - Picus
    king of Latium; refused Circe's love, so she turned him into a woodpecker
    - NO_CHILDREN [^canens]
- Janus
  - Canens [^venilia]
    a nymph whose singing moved stones and trees; wasted away searching for Picus and vanished into air

* Venilia
{% end %}

## The Julian Line

{% family_tree(caption="Venus' descendants the Caesars (Books 14–15)") %}
- Venus
  - Aeneas ~[^anchises]
    - Ascanius / Iulus | no explicit mother mentioned
      - Julius Caesar | a distant descendant
        murdered in the Senate House; Venus carried his soul to the stars as a comet
        - Augustus | adopted
          emperor in Ovid's day, foretold to become a god
          - Tiberius | adopted
            not named by Ovid: "the son born to his saintly wife"

* Anchises
{% end %}
