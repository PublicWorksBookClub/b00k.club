# Ovid pass, 2026-10-27: working notes

How the _Metamorphoses_ index, tables and trees in this change were made, and what still needs a decision. This is a
working note for the owner; delete it once it has served its purpose.

## Method

- **Source.** C. Luke Soucy's translation (UC Press, 2023), the club's PDF. Its verse was split into books with
  Soucy's line numbers, which follow the Latin. Between his every-fifth-line markers the numbers are interpolated, so
  a few lines sit one or two off where his English runs long or short. The agents also used his footnotes, his
  commentary, and his Glossary of Names and Places, which lists every figure's patronymics and epithets with
  references.
- **Index rule.** A term goes on the page when Soucy's verse names the figure at least once, in any form: plain,
  possessive, inside a patronymic ("Hippotes' son"), or as a place adjective ("Lydian"). Footnotes and bracketed
  headings don't count. This is the Plato rule, adapted to the page's existing habit of indexing adjectives.
- **Names.** As agreed, Roman gods keep their Latin terms (Jupiter, Minerva, Venus…). Heroes, places and spellings
  that are the same figure as an existing site term join it, with Soucy's form added as a synonym:
  - Hercules → `Herakles`
  - Greece → `Hellas`
  - Calais → `Kalais`
  - Orithyia → `Orithuia`
  - Eridanus → `Eridanos`
  - Phlegethon → `Pyriphlegethon`
  - Ciconians → `Cicones`
  - Seriphos → `Seriphus`
  - Spercheus → `Spercheius`
  - Danube → `Ister`
  - Anapis → `Anapus`
  - Scythia → `Scythians`
  - Tanais → `Don`, which is what Soucy prints
  - Boötes → `Bootes`, re-keyed in ASCII; the URL is unchanged
- **Namesakes.** Soucy's numbered namesakes get separate terms. Where a bare term was used only by Ovid, it keeps the
  Books 1–6 figure the page already meant (`Cygnus`, `Celadon`, `Broteas`, `Eurytus`…), and the later namesakes are
  qualified (`Cygnus (son of Neptune)`, `Celadon (Lapith)`…).
- **Links.** Every new Wikipedia/Wikidata link was fetched and its lead read. Many minor figures (battle casualties,
  centaurs, crewmen) have no article; their entries carry a note instead.

## The page's existing terms

- **Replaced because the shared term meant someone else:**
  - `Abaris` → `Abaris (follower of Phineus)`
  - `Andromeda` → `Andromeda (daughter of Cepheus)`; the site's `Andromeda` is the Frogs' play
  - `Doris` → `Doris (wife of Nereus)`
  - `Draco` → `Draco (constellation)`
  - `Ladon` → `Ladon (river)`
  - `Medon` → `Medon (crewman of Acoetes)`
  - `Melas` → `Melas (Thracian river)`
  - `Metion` → `Metion (father of Phorbas)`
  - `Python` → `Python (serpent)`
  - `Sthenelus` → `Sthenelus (father of Cygnus)`
- **Kept, but never named in Soucy's verse:** only a periphrasis or a footnote identifies them. Drop any you don't
  want:
  - Asclepius ("Coronis' son", "the Epidaurian")
  - Sagittarius ("Thessaly's bowman")
  - Antiope and Theophane ("Nycteus' child", "Bisaltes' child")
  - Iphimedia
  - Graeae ("Phorcys' daughters")
  - Chrysaor ("his swift brother")
  - Pierides (Pierus' daughters, "the Emathians")
  - Hippocrene
  - Harmonia
  - Mygdonia ("Thrace's Til")
  - Syracuse
- **Links fixed** on existing entries. In each case every work using the term means the figure the new link points
  to, and junk synonyms from the old article were dropped:
  - `Venus`, `Mars` and `Neptune` linked the planets.
  - `Paris` linked the city, `Hymen` the anatomy and `Hours` the time unit.
  - `Ammon`, `Amphion`, `Curetes`, `Echion`, `Eurypylus`, `Isthmus`, `Lyceum`, `Marathon`, `Mopsos`, `Panopeus`,
    `Pharos`, `Sarpedon` and `Scylla (daughter of Nisus)` were also corrected.
- `Chaos (god)`, from the Plato pass, duplicated Ovid's `Chaos`. It has been merged, and `plato-index.csv` now uses
  `Chaos`.

## For you to decide

- **Duplicate site terms for one thing.** Each pair could be merged:
  - `Hesperus` / `Hesperos`
  - `Hours` / `Horai`
  - `Cnossus` / `Knossos`
  - `Neoptolemus` / `Pyrrhus`
- **Shared terms that lump two figures:**
  - `Eurydice`: the Antigone means Creon's wife; the links are Orpheus' wife.
  - `Aeolus`: links a set-index page, and the Frogs' use blocks a fix.
  - `Cephalus`: Plato's.
  - `Lycus`: two men.
  - `Ankaios`: two Argonauts.
- **Synonyms that point at another term:** Apollo lists "Sol", Hephaestus "Vulcan", Artemis "Diana", and Corybantes
  "Kouretes".
- **Possible separate terms:**
  - Quirinus, now filed under Romulus.
  - King Alba, now under Alba Longa.
  - "the Bear(s)", six times, next to `Triones`.
- **Bare keys held by a minor figure.** `Nephele`, `Opheltes` and `Orchomenus` (the Arcadian town); the famous
  namesakes are elsewhere or unindexed.

## Commentary tables

- **Coverage.** `Metamorphoses—Epithets.csv` and `Metamorphoses—Transformations.csv` now run through Book 15:
  2,258 new epithet rows and 221 new transformation rows.
- **Show.**
  - `Show` is now true through Book 5, matching the 2026-10-25 minutes (ended near 6.001).
  - Books 6–15 are false.
  - To reveal more, flip `Show` to true on the rows of the books read.
- **Causes legend.** It gains Rescue, Gift and Nature (Pythagoras' examples in Book 15).
- **Kinds.** Transformations use three new values: Insect, Land and Air.
- **Judgment calls in the new rows:**
  - Some unnamed beasts are Characters: the Colchian dragon, the Calydonian boar and the Teumessian fox.
  - Peoples are included: the Greeks and the Trojans.
  - Ethnic epithets of mortals use Cult site, as Books 1–6 do.

## Family trees

- The commentary gains 28 trees in 20 sections for Books 4–15. As agreed, they are ungated.
- One existing tree was corrected: Epaphus is Io's son (1.748), and Europa's son is Minos (8.24).
- Still open: the "Jove and Leto" tree draws Phaethon and the Heliades under Apollo, but Ovid's father is the Sun.
