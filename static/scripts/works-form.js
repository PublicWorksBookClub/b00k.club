/**
 * Turns the /works/create/ form into a conspectus file.
 *
 * The form is rendered, prefilled and constrained entirely by Zola — see
 * templates/works/create.html. Every classifying taxonomy is a closed list read
 * out of data/vocab/, so this script never has to worry about whether a term is
 * one the site knows. What's left here is the pair of things a static page can't
 * do on its own:
 *
 *   Download   compose the front matter and hand it over as "Author - Title.md"
 *   Share      put the whole form into the address so it can be sent on, and
 *              read it back out again when someone opens that address
 *
 * Without this script the form still fills in and Share still works — submitting
 * it is a plain GET, which lands you on the same page with every answer in the
 * query string.
 *
 * ── The naming contract ──────────────────────────────────────────────────────
 *
 * Single-valued fields, each written to the front matter key of the same idea:
 *
 *   title, alt-titles (one per line), slug, sort, wikidata, wikipedia,
 *   order, started, abstract, arc, year, contributor
 *
 * Multi-valued taxonomies are checkbox groups; every box in a group shares the
 * group's name and carries the vocabulary term as its value:
 *
 *   authors, forms, genres, periods, languages
 *
 * Each group also opens with a way to name a term the vocabulary hasn't got:
 * `<group>-add` toggles it, `<group>-new` holds it. A coined term leads the list,
 * matching where the box sits on the page — which for authors decides the file
 * name. `subjects` has no group at all: nothing is known about them on the day a
 * work is picked up, so the key is written out empty.
 *
 * A group whose <fieldset> carries `data-required-group="<group>"` must end up
 * with something in it, ticked or coined — HTML has no way to say that, so
 * Download checks it and names the group (from `data-legend`) when it doesn't hold.
 *
 * Flags: read-in-selection, currently-reading.
 *
 * The "look it up" links carry `data-search` (which site) and `data-fallback`
 * (where to go with no script); their href is rewritten as the title is typed.
 *
 * Adding a field to the template means adding it here. Renaming one here without
 * renaming it there silently drops it from the file, so keep the two in step.
 */

const form = document.getElementById("works-form");

/* ─── reading the form ────────────────────────────────────────────────────── */

function value(name) {
  const el = form.elements[name];
  return el && typeof el.value === "string" ? el.value.trim() : "";
}

function checked(name) {
  const el = form.elements[name];
  return Boolean(el && el.checked);
}

/**
 * Everything chosen for a taxonomy: a term coined in the group's "add one" box
 * first, since that box sits at the top of the list, then every ticked term in the
 * order the vocabulary lists them. The coined term only counts while its toggle is
 * ticked, so clearing the toggle drops it rather than leaving it hidden but live.
 */
function group(name) {
  const ticked = [...form.querySelectorAll(`input[name="${name}"]:checked`)].map((el) => el.value);
  const coined = checked(`${name}-add`) ? value(`${name}-new`) : "";
  return coined ? [coined, ...ticked] : ticked;
}

/** A textarea taken a line at a time, blanks dropped. */
function lines(name) {
  const el = form.elements[name];
  if (!el) return [];
  return el.value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/* ─── writing the front matter ────────────────────────────────────────────── */

/**
 * A TOML array of strings on one line, the way the rest of content/works/ writes
 * them. Quotes in a term would need escaping, but the vocabulary has none and the
 * only free-text list here is the titles, so a plain join is honest enough.
 */
function toml(list) {
  return `[${list.map((v) => `"${v}"`).join(", ")}]`;
}

/**
 * How long the work is and how it divides, which the burndown chart reads to mark
 * the parts and to say which one a session ended in.
 *
 * Empty for anything not being charted — a work read in selection jumps about and
 * one read in a single sitting draws a line between two points, so neither is
 * measured. A work that divides lists its parts, each naming itself; one that
 * doesn't states a total. `origin` is the coordinate at which nothing has been
 * read yet, which is 0 for lines numbered from 1 and 216 for a dialogue paginated
 * from 216a.
 */
function lengthBlock() {
  if (!checked("charted") || !value("length-units")) return [];

  const out = [
    "",
    "[extra.length]",
    `units = "${value("length-units")}"`,
    `origin = ${value("length-origin") || 0}`,
  ];

  if (!checked("divides")) {
    out.push(`total = ${value("length-total")}`);
    return out;
  }

  // One part per line, named then measured: "Book I, 1362". The number is taken
  // from the last comma so that a name may contain one.
  out.push("parts = [");
  for (const line of lines("length-parts")) {
    const cut = line.lastIndexOf(",");
    if (cut === -1) continue;
    const label = line.slice(0, cut).trim();
    const length = line.slice(cut + 1).trim();
    if (label && length) out.push(`  { label = "${label}", length = ${length} },`);
  }
  out.push("]");
  return out;
}

function frontMatter() {
  const title = value("title");
  const titles = [title, ...lines("alt-titles")];

  const out = [
    "+++",
    "draft = false",
    'template = "works/conspectus.html"',
    `slug = "${value("slug")}"`,
    "# You can also override `title` and `authors`",
    "",
    "[extra]",
    `order = ${value("order")}`,
    // Left empty, a work files under its own title — which is what most of them do.
    // The key is always written out: /minutes/create/ sorts the works on it and a
    // work missing it would take that page down.
    `sort = "${value("sort") || title}"`,
  ];

  // Only the works we read in selection carry the flag; the rest leave it off.
  if (checked("read-in-selection")) out.push("read_in_selection = true");

  if (value("wikidata")) out.push(`wikidata = "${value("wikidata")}"`);
  if (value("wikipedia")) out.push(`wikipedia = "${value("wikipedia")}"`);

  out.push('abstract = """', value("abstract"), '"""');
  out.push(`started = ${value("started")}`);
  // Left as a comment so whoever finishes the work has somewhere to put the date.
  out.push("# stopped =");
  out.push(`currently_reading = ${checked("currently-reading")}`);
  // Last of [extra]: a sub-table swallows every scalar written after it, so
  // anything belonging to [extra] itself has to be down before this opens.
  out.push(...lengthBlock());

  out.push(
    "",
    "[taxonomies]",
    "# Textual taxonomies",
    `titles = ${toml(titles)}`,
    `authors = ${toml(group("authors"))}`,
    `forms = ${toml(group("forms"))}`,
    `genres = ${toml(group("genres"))}`,
    `subjects = ${toml(group("subjects"))}`,
    `periods = ${toml(group("periods"))}`,
    `languages = ${toml(group("languages"))}`,
    "",
    "# General taxonomies",
    // Empty on purpose: all three are backfilled once the work has been read.
    "tags = []",
    `years = ["${value("year")}"]`,
    `arcs = ["${value("arc")}"]`,
    "index = []",
    `contributors = ["${value("contributor")}"]`,
    "+++",
  );

  return `${out.join("\n")}\n`;
}

/** The name the rest of content/works/ uses: "Ovid - Metamorphoses.md". */
function filename() {
  const author = group("authors")[0] || "Unknown";
  // Slashes and colons are the only characters that would break a file name here,
  // and a title carrying one is rare enough to just neutralise.
  const safe = (s) => s.replace(/[/\\:]/g, "-");
  return `${safe(author)} - ${safe(value("title"))}.md`;
}

/* ─── the two buttons ─────────────────────────────────────────────────────── */

function say(message) {
  const status = form.querySelector("[data-status]");
  if (status) status.textContent = message;
}

/**
 * "At least one of these boxes" is the one rule HTML can't state, so it's checked
 * here. Returns the first group left empty, named the way its legend reads.
 */
function emptyRequiredGroup() {
  for (const fieldset of form.querySelectorAll("[data-required-group]")) {
    const name = fieldset.dataset.requiredGroup;
    if (group(name).length === 0) return { fieldset, legend: fieldset.dataset.legend };
  }
  return null;
}

/**
 * The two "look it up" links search for whatever title has been typed. Their href
 * starts out pointing at the plain site, so with no script they still land
 * somewhere useful — just not on a search.
 */
const SEARCHES = {
  wikidata: "https://www.wikidata.org/w/index.php?search=",
  wikipedia: "https://en.wikipedia.org/w/index.php?search=",
};

function syncSearchLinks() {
  const query = value("title");
  for (const link of form.querySelectorAll("[data-search]")) {
    const base = SEARCHES[link.dataset.search];
    link.href = query && base ? base + encodeURIComponent(query) : link.dataset.fallback;
  }
}

/** The first thing standing in the way of a complete file, named as it's labelled. */
function complaint() {
  const bad = form.querySelector("input:invalid, select:invalid, textarea:invalid");
  if (!bad) return "";
  const label = form.querySelector(`label[for="${bad.id}"]`)?.textContent.trim() ?? bad.name;
  return bad.validity.patternMismatch
    ? `“${label}” isn’t in the right shape — lower case words joined by hyphens.`
    : `“${label}” needs filling in.`;
}

function download() {
  if (!form.reportValidity()) {
    say(complaint());
    return;
  }
  const missing = emptyRequiredGroup();
  if (missing) {
    say(`Pick at least one ${missing.legend}.`);
    missing.fieldset.scrollIntoView({ block: "center", behavior: "smooth" });
    missing.fieldset.querySelector("input[type=checkbox]")?.focus();
    return;
  }

  const file = new Blob([frontMatter()], { type: "text/markdown;charset=utf-8" });
  const href = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = href;
  link.download = filename();
  link.click();
  URL.revokeObjectURL(href);
  say(`Saved ${link.download} — it goes in content/works/.`);
}

async function share() {
  // Built from the address we're actually on rather than the form's action, so a
  // link shared off a preview deploy points back at that preview.
  const url = new URL(location.href);
  url.search = new URLSearchParams(new FormData(form)).toString();
  history.replaceState(null, "", url);

  try {
    await navigator.clipboard.writeText(url.toString());
    say("Link copied — send it on and they pick up where you left off.");
  } catch {
    say("Link is in the address bar — copy it from there.");
  }
}

/* ─── coming back to a shared link ────────────────────────────────────────── */

/**
 * A box that isn't ticked sends nothing at all, so on a link that carries answers
 * "absent" has to mean "unticked" rather than "left alone" — otherwise every box
 * the sharer cleared would come back ticked. Hence the guard: only a link that
 * actually carries answers gets to overwrite the defaults.
 */
function restore() {
  const answers = new URLSearchParams(location.search);
  if ([...answers.keys()].length === 0) return;

  for (const el of form.elements) {
    if (!el.name) continue;
    if (el.type === "checkbox") {
      // Groups share a name, so a box is ticked only if its own value was sent.
      el.checked = answers.getAll(el.name).includes(el.value);
    } else if (el.type === "radio") {
      if (answers.has(el.name)) el.checked = answers.get(el.name) === el.value;
    } else if (answers.has(el.name)) {
      el.value = answers.get(el.name);
    }
  }
  say("Picked up from a shared link.");
}

if (form) {
  restore();
  syncSearchLinks();
  form.elements["title"]?.addEventListener("input", syncSearchLinks);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    share();
  });
  form.querySelector("[data-download]")?.addEventListener("click", download);
}
