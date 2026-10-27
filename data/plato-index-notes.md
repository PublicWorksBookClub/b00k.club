# Plato index pass, 2026-10-27: working notes

How the Plato `index` terms in this change were made, and what still needs a decision. This is a working
note for the owner; delete it once it has served its purpose.

## Method

- **Source.** The translations and the back-of-book index of Cooper, _Plato: Complete Works_ (Hackett, 1997).
  Each work's text was taken without Cooper's introductions or footnotes.
- **Candidates.** Each work's candidates came from two places:
  - every name heading in Cooper's index that cites the work;
  - every capitalized name in the text of the work itself. This catches what Cooper leaves out, such as oaths
    ("by Zeus", "by Hera") and passing place-names.
- **Literal-mention rule.** A work gets a term only when the name, or a recorded variant of it, appears in
  that work's text. This is the convention of the earlier backfills. As a result:
  - About 170 of Cooper's references are allusions with no name, for example "the son of Thetis" at
    Apology 28c, or "the god" for Apollo. Those are not indexed.
  - Translator glosses don't count: square-bracket insertions ("[Mediterranean] peoples", "[the Isles of
    the Blest]") and Epinomis/Timaeus planet names such as "[Jupiter]" and "(the Morning Star, or Venus)".
  - The bare adjective "Greek" doesn't index Hellas, following Crito 52e ("any other city, Greek or
    foreign"), which was never indexed. "Greece", "Greeks" and "Hellenes" do.
  - Mode names don't index peoples or places. "The Dorian mode" or "Ionian and Lydian modes" are harmonies.
  - Ethnic epithets of people still count, as on the existing pages: "Er … a Pamphylian", "Zalmoxis the
    Thracian".
- **Identity.** Identity was checked against Cooper's own descriptors, for example "Glaucon, father of
  Charmides" versus "Glaucon, son of Ariston". A figure who differs from an existing term of the same name
  got a qualified term, such as `Glaucon (father of Charmides)`. Same figure, different spelling (Cronus,
  Heracles, Clinias) maps to the existing term (`Cronos`, `Herakles`, `Cleinias`). Cooper's spelling is added
  to its synonyms.
- **Links.** Every new Wikipedia/Wikidata link was fetched and its lead read before it was used. A missing
  link means no dedicated article or item was found; nothing was guessed.

## Existing pages: entries replaced because they named a different figure

- Apology: `Lysanias` → `Lysanias of Sphettus`; `Nicostratus` → `Nicostratus (son of Theozotides)`;
  `Theodotus` → `Theodotus (son of Theozotides)`.
- Phaedo: `Ctesippus` (the Odyssey suitor) → `Ctesippus of Paeania`; `Glaucus` (the sea god) →
  `Glaucus (skilled craftsman)`.
- Republic: `Niceratus` → `Niceratus (son of Nicias)`; `Lysanias` → `Lysanias (father of Cephalus)`.
- Seventh Letter: `Dionysius` → `Dionysius I of Syracuse` and `Dionysius II of Syracuse`.
- Theaetetus: `Aristides` → `Aristides (the younger)`. Theaetetus 151a means the Just's grandson.
- Laws: `Magnesia` → `Magnesia (city of the Laws)`.
- Crito and Euthyphro: unchanged. Their indexes were already complete against Cooper's text.

## Existing vocabulary entries whose links look wrong (reported, not changed)

- `Phaedo` links the dialogue; the man is Phaedo of Elis (Q380190).
- `Crito` links the dialogue; the man is Crito of Alopece (Q934471).
- `Euthyphro` links the dialogue; the man is Euthyphro (prophet) (Q5414544).
- `Theages` links the dialogue, not the man.
- `Cephalus` links a page for the mythic Cephaluses. Plato's Cephalus is Q3010242.
- `Cleinias` is the Cretan of the Laws but links Alcibiades' father (Q2979291). That man now has his own term,
  `Cleinias (father of Alcibiades)`.
- `Callias` links Callias II. Plato's Callias son of Hipponicus is Callias III (Q1347613). The term is also
  Aristotle's stock example name.
- `Uranus` links the planet (Q324). The god is Q79999. The synonym "Uranocentric orbit" is also odd.
- `Ammon` links the Ammonite kingdom. The Laws and the Statesman mean the god.
- `Academy` and `Lyceum` link the generic articles. The Athenian ones are Platonic Academy (Q193093) and
  Lyceum (classical) (Q1160664).
- `Marathon` links the footrace.
- `Locri` links the modern comune.
- `Hermus` links a name list; the river is Gediz River (Q1351474).
- `Isthmus` links the generic article.
- `Lysanias` links a 1st-century BC ruler. No Plato page uses it now.
- Other reported mismatches:
  - `Sous` links a Moroccan region.
  - `Leontius` links a Byzantine emperor.
  - `Armenius` links a mythic namesake of Er's father.
  - `Bacchius` links a metrical foot.
  - `Panopeus` links the town, not Epeius' father.
  - `Tisias` (the Seventh Letter's soldier) links Corax.
  - `Myrto` (Theocritus) links Socrates' wife.
- Shared terms that lump different figures across works:
  - `Hippias` is Hippias of Elis, but Thucydides uses it for the tyrant.
  - `Apollodorus` is also used for Diogenes' Epicurean.
  - `Adeimantus` is also used for the Frogs' son of Leucolophus.
  - `Dionysius` is still used by Xenophon and others.
- In the Cratylus, Socrates' made-up example names sit under real people's terms: `Polemarchus`, `Agis`,
  `Theophilus`, `Eupolemus`, `Mnesitheus`, `Eutychides`, `Archepolis` and `Sosias`. Consider dropping them or
  giving them their own terms.

## Judgment calls you may want to revisit

- **Persia.** "The Great King" counts as a mention of Persia.
- **Twins and Pluto.** "The Dioscuri" (Laws 7.796b) indexes both `Kastor` and `Polydeukes`. `Pluto` stays its
  own term rather than becoming Hades.
- **The Stranger.** The Statesman's Stranger is `the Eleatic Stranger`; Rowe and White print "Visitor".
- **Named works.** Protagoras' book is a new term, `Truth (Protagoras)` (Theaetetus, Cratylus).
- **Personifications indexed:** `Gaia` (Earth), `Selene` (Moon), `Penia`, `Poros (son of Metis)`,
  `Chaos (god)`, `Cosmos (god)`, `Beauty (goddess)`, `Pleasure (goddess)`.
- **Atlantis.** The ten Atlantean kings with famous namesakes are qualified "(king of Atlantis)". Eumelus is
  merged into `Gadirus`, since Critias 114b makes them one king.
- **Uncertain identities.** These carry notes and have no links: `Polycrates` (Meno 90a), `Pythodorus (son of
  Isolochus)`, `Leptines (courier to Dionysius II)`, `Glaucon (friend of Apollodorus)`, `Timotheus (brother of
  Cratinus)`.
- **The Letters.** CSV slugs follow `plato-seventh-letter`: `plato-first-letter` … `plato-thirteenth-letter`.
  The Definitions has no names.
