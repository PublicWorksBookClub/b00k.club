# Flashcards

Decks made in [Anki][anki], studied at [/flashcards/](https://b00k.club/flashcards/).

## What's here

- `<deck>/` — one directory per deck; its path is the deck's id in `/flashcards/?deck=<deck>`.
  - `<any name>.apkg` — the deck as exported from Anki. **Edit in Anki, export, and replace this.** One per directory.
  - `deck.json`, `media/` — the cards and their pictures. **Generated; don't hand-edit.**
  - `<subdeck>/` — a subdeck: a directory of its own, laid out the same way, nested as deep as you like.
- `index.json` — the tree of decks the page lists. **Generated.**

## Add or update a deck

1. In Anki, _File → Export…_, choose _Anki Deck Package (.apkg)_ and the deck, with media included. Either setting of _Support older Anki versions_ works.
2. Put the file in `static/flashcards/<deck>/`, replacing the one that was there.
3. `pnpm flashcards`
4. Commit the `.apkg` together with the regenerated `deck.json`, `media/` and `index.json`.

A deck is titled on the site by its name in Anki. Subdecks made inside Anki (`Greek::Verbs`) come through as subdecks
without needing directories of their own, and studying a deck includes all of its subdecks, as in Anki. A directory with
no package of its own but decks inside it is listed under its directory name.

To take a deck down, delete its directory and run `pnpm flashcards` again. Directories named `media`, or starting with `.` or
`_`, are never read as decks.

## What it can show

- **Image occlusion** — rectangles, ellipses, polygons and text labels; _hide all, guess one_ and _hide one, guess one_;
  several masks on one card; mask colours set in the note type's CSS; the Header and Back Extra fields.
- Nothing else yet. Other note types (Basic, Cloze, …) are left out, and `pnpm flashcards` lists how many cards of each it skipped.

## Studying

A session goes through every card of the deck once. After _Show answer_, **Again** brings the card back three cards later
and **Good** puts it away, until none are left. There is no scheduling beyond that, and nothing is recorded about anyone's
study. The session is kept in the browser's `localStorage`, per deck, so a reload carries on where it was; **Reset** starts
over. Keys: <kbd>Space</kbd> shows the answer, then counts as Good; <kbd>1</kbd> is Again; <kbd>M</kbd> toggles the masks on the back.

## Internals

- [`tools/flashcards/export.js`](../../tools/flashcards/export.js) reads packages with nothing but Node: 22.15 or later
  has the zstd and SQLite the current `.apkg` format needs. Re-running it on an unchanged package changes nothing.
- [`static/scripts/flashcards.js`](../scripts/flashcards.js) is the study view, and [`templates/flashcards.html`](../../templates/flashcards.html) the page.
  Cards are drawn by the `kind` the exporter gives each note; a new kind of Anki note is a new reader in the exporter
  plus a new entry in `kinds` in the script.
- The page runs under the site's content security policy as it is. Read the note on `/flashcards/*` in
  [`static/_headers`](../_headers) before adding anything that loads differently, sound in particular.

[anki]: https://apps.ankiweb.net
