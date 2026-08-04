# Changelog

## Next

- Teach the Euclid sketchpad to prove things, not just construct them
  - **Magnitudes**: a length read from two points, an angle from three, the content of a figure from three or
    four, and a triangle compared by congruence rather than content — Book I turns on that difference, so a
    congruence is written `≡` and content `=`
  - **Claims**: say that two magnitudes are equal, or that one is greater. A claim draws nothing; it is checked
    where it stands, and again by **shaking** the figure — every hand-placed point jogged at random a couple of
    hundred times over, which is what catches a claim true of your figure and of no other
  - Magnitudes of one kind can be taken together, so "the square on the hypotenuse is equal to the squares on
    the sides" can be said at all
  - Each claim carries its reason, chosen from the book in the sidebar, and one can be marked as what was to be
    proved. A theorem that survives shaking is **kept**, with the evidence it survived, and may be cited ever
    after — the **Proved** pane now holds what you can carry out and what you have proved, and both outlive the tab
- Open each proposition with its heading and enunciation, as Byrne's page opens, and close it with **Q. E. D.**
  once what was to be proved is marked, holds, and has been shaken — with the number of configurations it held
  in, since that is the difference between a theorem and a lucky figure
- Add I.23, copying an angle, and with it the figure I.4 supposes: two triangles with two sides and the angle
  between them equal — laid off with a circle and a copied angle, so the hypothesis survives being dragged
- Set out the figures I.13, I.15, I.16, I.20 and I.37 suppose as well, so a theorem opens on something to look
  at rather than a blank sheet. I.37's second apex is taken on a parallel drawn by I.31, so "between the same
  parallels" holds however the figure is pulled about
- Keep the construction lines of a supposition off the page. They are still there — points are taken on them,
  and *working* shows the lot — but I.4 now opens as two triangles and I.5 as Byrne's isosceles with its equal
  sides produced, which its enunciation is half about and the figure did not have
- Mark the proposition on the paper in the book, and turn the book to it
- Cite the way Byrne cites: **const.** and **hyp.** join the definitions, postulates and axioms in the reason
  picker. They are the commonest reasons in the book, and the commonest here, since the figure *is* the
  construction and a theorem's hypothesis was built rather than promised
- Fix the ties left in Byrne's text by the LaTeX reader, which printed as "Triangles BCG, CDG and~ DGE", and
  drop the "symbol" that was a picture and printed as raw MetaPost
- Start the toolbar empty. Everything in Book I but the three postulates has to be got through before it can be
  used; reading a problem through — watching it carried out on your own figure — is what earns it
- Add I.11, I.12, I.31, I.46 and I.47 to the sketchpad, and the figures I.5 and I.47 suppose — the right angle
  constructed rather than assumed, so it stays a right angle however hard the figure is shaken
- Read Byrne's marginal figures out of his own MetaPost and print them beside the definitions, and print each
  proposition's enunciation with its lines in the colours he drew them
- Add multi-select: shift or command to add, and a lasso swept from empty paper
- Add a help sheet and a walk through the first proposition, both from the ⋯ menu
- Name things the way the figure does: a bar over a straight line in the colour it is drawn in, a ring for a
  circle, `△ABD` where a tool has closed a triangle, and "the parallel through C" where no two letters will do

## 1.9.0 (2026-08-02)

- Add a straightedge-and-compass sketchpad for following Euclid's constructions, at [/euclid/](https://b00k.club/euclid/)
  - Only Euclid's first three postulates are given: set down a point, join two points (and produce the line), describe a circle about a centre. Where things cut one another, the points are simply there to be used
  - A construction that has been carried out can be kept as a tool with the **+** button, and used ever after as a single move — tools can be built on tools, and their working stays hidden until asked for
  - Book I propositions 1, 2, 3, 9 and 10 are in the box, and any of them can be set out step by step and walked through with a slider
  - Figures can be dragged to see whether they hold, saved to a file, or shared as a link that carries the whole construction
- Add a `euclid` shortcode so the sketchpad can be embedded in any page (it's a custom element rather than an iframe, so the site's CSP is untouched)
- Embed it in the [Euclid conspectus](https://b00k.club/works/euclid-elements/), with I.2 set out step by step
- Add `pnpm test`, which runs the sketchpad's construction tests under `node --test`

## 1.8.4 (2026-07-28)

- Add Theocritus' Idylls to readings
- Add Metamorphoses 3 arc
- Add [justif](https://github.com/lyallcooper/justif) to display justified text in a way that's closer to actual typesetting
- Scale burndown svg with whichever is bigger of estimated vs actual (but when the book is completed always scale to the completion date)

## 1.8.3 (2026-07-26)

- Update with minutes from today's meeting where we discussed Nolan's *The Odyssey* and finished Lucretius

## 1.8.2 (2026-07-19)

- Update with minutes from today's meeting regarding Plato's Sophist and Lucretius

## 1.8.1 (2026-07-15)

- Make tags in conspectus template look more like hashtags
- Replace fuse search for pagefind

## 1.8.0 (2026-07-14)

- Add a background gradient for iphone top/bottom insets
- Add search
- Remove updates as that's basically what minutes has replaced
- Add more headings to home page, so one doesn't have to scroll to the footer to navigate

## 1.7.2 (2026-07-13)

- Set underline offset for footer links
- Improve headers for burndown charts
- Add Cratylus minutes
- Add Arrian minutes going back to Cratylus

## 1.7.1 (2026-07-12)

- Update minutes with today's meeting

## 1.7.0 (2026-07-12)

- Add "burndown" macro for showing the pace a text was read
- Add minutes section and backfill part of 2026

## 1.6.2 (2026-06-29)

- Migrate comments to a submodule and separate github repo

## 1.6.1 (2026-06-29)

- Update look for r3ply integration
- Add a footer to the base template

## 1.6.0 (2026-06-29)

- Integrate PWBC site with r3ply comments

## 1.5.14 (2026-06-08)

- Add Sophist
- Fix tags taxonomy in conspectus template
- Update word count for Theaetetus
- Add Roman Republic as a period

## 1.5.13 (2026-05-23)

- Add start and end dates for all Major/Minor Works™️ readings
- Add a "reverse" parameter to works listing macro
- Add "Quoted Works" to conspectus (for works that make extensive literal quotation of other works, e.g. Lives and Opinions of Eminent Philosophers)
- Change works macro for listing taxonomy terms to accept a list of terms rather than a page
- Remove letters of Epicurus as independent works and add "Life of Epicurus" by Diogenes Laërtius
- Add Epicurus, Euclid, Apollonius, Diogenes Laërtius to authors file
- Remove underline from "Period" column in works macro

## 1.5.12 (2026-04-22)

- Add Epicurus' Principle Doctrines to readings
- Add Epicurus' Letter to Menoeceus to readings
- Add Euclid's Elements to readings
- Update Argonautica's abstract and conspectus tags
- Sandbox hosted interactive map's more liberal CSP's

## 1.5.11 (2026-04-02)

- Host the azgaar map to avoid iframe and cross origin issues
- Update argonautica map with more birthplaces

## 1.5.10 (2026-04-01)

- Add etiology as a genre
- Add citations to the Argonautica map
- Add a "presentation mode" saved layer to the Argonautica map

## 1.5.9 (2026-03-31)

- Add instructions on how to submit edits to the Argonautica map
- Add Greek cultures to Argonautica map
- Edit Argonautica map to have large labels on two lines and distinguish places and peoples with different fonts and colors
- Finish Book I of Argonautica map

## 1.5.8 (2026-03-30)

- Update Theaetetus notes
- Update argonautica map

## 1.5.7 (2026-03-29)

- Add embedded azgaar map to Argonautica conspectus

## 1.5.6 (2026-03-28)

- Update "Theaetetus" outline
- Edit css to colorize endnote links (pink)
- Add `details` shortcode for displaying details elements and summaries
- Update to tailwind 4.2.x
- Add an Azgaar fantasy map of the Mediterranean basin
- Add PastVu to resources pages
- Add David Rumsey Map Collection to resources page
- Add "Mnamon" to resources page
- Add AWMC, Pleides, and the "myth files" to resources page

## 1.5.5 (2026-03-22)

- Update conspectus info for Cratylus
- Fix typos and tweak templates
- Begin adding Theaetetus info

## 1.5.4 (2026-02-23)

- Catalogue of names for Argonautica
- Shortcode for reading CSV's and producing tables
- Add NewComputerModern10 as a font (for article font, especially when Greek glyphs are needed)
- Fix broken link on conspectus to wikidata/wikipedia pages

## 1.5.3 (2026-02-22)

- Add more revisions to taxonomy

## 1.5.2 (2026-01-10)

- Add _Cratylus_
- Add 'currently reading' field and display it in work listing macro

## 1.5.1 (2026-01-09)

- Corrections to bibliography
- Add junicode and source serif 4 fonts
- Update social preview banner

## 1.5.0 (2026-01-08)

- Add _Anabasis_ (Arrian)
- PWBC bibliography
- Site taxonomy
- Add macros for displaying readings
- Add reference to historical thesaurus of english

## 1.4.4 (2025-12-13)

- Add _Life of Alexander_ and _Phaedo_

## 1.4.3 (2025-09-19)

- Remove .vscode/spellright.dict from source control
- Fix missing alternate title for Demosthenes' *First Philippic*

## 1.4.2 (2025-09-15)

- Add Demosthenes' _On the Crown_ and Plato's _Crito_

## 1.4.1 (2025-08-19)

- Add link to library of esoterica in the Netherlands
- Add Demosthenes' _First Philippic_ and Plato's _Apology_

## 1.4.0 (2025-08-18)

- Upgrade the site to tailwind v4

## 1.3.2 (2025-08-15)

- Make landing header bigger and show site text (but only on devices larger than mobile)
- Add formatter
- Add recent works read by the club, and update Characters to selections
- Update arc names (anabasis 3 -> nostoi 1, and anabasis 4 -> anabasis 3)
- Change page template to create a title link to the present page
- Minor changes to CSS organization
- Add a "scroll ->" hint on the home page
- Add more resources: podcasts (ancient greece declassified, the hellenistic age), a stock footage category (with FedFlix), simple description of what the page is for, and a table of contents with emoji for each item
- Update serve npm script to not give 0.0.0.0 address because it was breaking document fragment links

## 1.3.1 (2025-07-24)

- Add works read since Homer
- Refactor list of works to a table
- Add 'Year' and 'Arc' columns to table (tracking club history)
- Add a notes column and style table
- Add asterisk to indicate works that were read in selection
- Add UPenn online books page to resources
- Update font styling for columns
- Force centering for order column

## 1.2.3 (2025-01-03)

- Update public domain year

## 1.2.2 (2024-12-07)

- Remove remaining reference to old URL
- Add ClassicistORG YouTube channel, for excellent videos and playlists on Classical Architecture
- Update readings with Plato's _Republic_, Euripedes' _Herakles_, and Homer's _Odyssey_

## 1.2.1 (2024-01-31)

- Update site's GitHub
- Remove link to minutes
- Set "foundations of antiquity" in draft mode
- Add "Hellenica" to works read
- Add "Antigone Journal" to /resources

## 1.2.0 (2024-01-30)

- Change site URL to https://b00k.club (from https://r33d.org)

## 1.1.1 (2023-10-26)

- Add "artvee" to resources section under tools heading

## 1.1.0 (2023-10-21)

- Update wording in README around `build-deploy` command to be more clear when it's used
- Add 'Updates' section in README, to specify how updates must be made
- Change 'YouTube Channels' heading under Resources section to 'Video Channels'
- Change 'blog' heading in 'Resources' section to 'Secondary/Editorialized Content'
- Add Loeb Classical Library to 'Reference Material' section
- Add Center for Hellenic Studies to 'Reference Material' and 'Video Channels' sections
- Add Xenophon Group International to 'Secondary/Editorialized Content'

## 1.0.14 (2023-08-13)

- Add "acoup" blog to the resources section

## 1.0.13 (2023-08-10)

- close meetings to public (for now)

## 1.0.12 (2023-08-06)

- cancel upcoming meeting

## 1.0.11 (2023-07-30)

- add Astarte Resources to the references section
- update "next meeting" section with the next meeting details

## 1.0.10 (2023-07-24)

- add Stanford Encyclopedia of Philosophy and "Thersites the Historian" (YT channel) to References section
- update "next meeting" section with the next meeting details

## 1.0.9 (2023-07-09)

- update "next meeting" section with the next meeting details

## 1.0.8 (2023-07-02)

- update "next meeting" section with reading material we'll be covering next week, along with an updated link
- add link to site's GitHub

## 1.0.7 (2023-07-01)

- update landing page with "next meeting" section, including a link to the video call, time, and what information we'll be covering in the meeting

## 1.0.6 (2023-06-19)

- update landing page with contact information to make it more clear how to join the club
- update `build-deploy` run script to not use cf env variable

## 1.0.5 (2023-05-24)

- add 'Foundations of Antiquity' as first 'public sector', along with some preliminary content
- add 'public sectors' section to landing page

## 1.0.4 (2023-05-17)

-add a 'resources' section to landing, along with a separate page

## 1.0.3 (2023-05-17)

- add `build-deploy` run script in package.json
- add 'meeting minutes' section

## 1.0.2 (2023-05-16)

- add _Zhuangzi_ [COMPLETED READING]
- fix typos in headers file

## 1.0.1 (2023-05-09)

- add _federalist papers_ [COMPLETED READING]
- add more context to README

## 1.0.0 (2023-04-03)

- prototype basic look and feel of site
- add prior works read (i.e. _Meditations_, _The Tempest_, _Antigone_, _The Book of the Thousand Nights and a Night_) [COMPLETED READING]
- establish Content Security Policy headers
