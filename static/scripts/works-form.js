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
 *   authors, forms, genres, subjects, periods, languages
 *
 * A group whose <fieldset> carries `data-required-group` must end up with at
 * least one box ticked — HTML has no way to say that, so Download checks it and
 * names the group (from `data-legend`) when it doesn't hold.
 *
 * Flags: read-in-selection, currently-reading.
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

/** Every ticked box in a checkbox group, in the order the vocabulary lists them. */
function group(name) {
  return [...form.querySelectorAll(`input[name="${name}"]:checked`)].map((el) => el.value);
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
    `sort = "${value("sort")}"`,
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
    const box = fieldset.querySelector("input[type=checkbox]");
    if (box && group(box.name).length === 0) return { fieldset, legend: fieldset.dataset.legend };
  }
  return null;
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
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    share();
  });
  form.querySelector("[data-download]")?.addEventListener("click", download);
}
