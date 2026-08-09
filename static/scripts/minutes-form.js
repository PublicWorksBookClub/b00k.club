/**
 * Turns the /minutes/create/ form into a minutes file.
 *
 * The form itself is rendered, prefilled and toggled entirely by Zola and CSS —
 * see templates/minutes/create.html. Two things a static page can't do on its
 * own are left here, and nothing else:
 *
 *   Download   compose the markdown and hand it over as YYYY-MM-DD.md
 *   Share      put the whole form into the address so it can be sent on, and
 *              read it back out again when someone opens that address
 *
 * Without this script the form still fills in, still hides and reveals its
 * optional parts, and Share still works — submitting it is a plain GET, which
 * lands you on the same page with every answer in the query string. All the
 * script adds there is copying the address to the clipboard so nobody has to
 * fish it out of the URL bar on a phone.
 *
 * ── The naming contract ──────────────────────────────────────────────────────
 *
 * Each section of the minutes is a <fieldset data-section> carrying:
 *
 *   data-kind="meeting"      one of the club's regular meetings
 *   data-kind="standalone"   an extra section, e.g. the Nolan pre-meeting
 *   data-prefix="m0"         prefix every field in the section shares
 *   data-heading="…"         meetings only; standalone ones are titled by the scribe
 *
 * Fields are named `<prefix>-<field>`. A meeting has:
 *
 *   held      (checkbox)  unchecked writes "No meeting" and nothing else
 *   absent    reason, kept as an HTML comment beside "No meeting"
 *   verb      Continuing / Starting / …
 *   work      (select)    value is the slug; the <option> carries data-md, the
 *                         markdown link, and data-short, which anchors are built from
 *   from      where we picked up
 *   to        prose of where we got to
 *   locus     the spot itself, kept apart so a reminder can link back to it
 *   next      what we're doing next week
 *   reminder  (checkbox) + reminder-heading + reminder-body
 *   track     (checkbox) + start + end + units, the burndown row
 *
 * A standalone section has `on` (checkbox), `heading`, `body`, and `position`
 * (radio, before/after), which is what orders it against the meetings.
 *
 * Adding a field to the template means adding it here. Renaming one here without
 * renaming it there silently drops it from the file, so keep the two in step.
 */

const form = document.getElementById("minutes-form");

/* ─── reading the form ────────────────────────────────────────────────────── */

/** Trimmed value of a text input, textarea or select. */
function value(name) {
  const el = form.elements[name];
  return el && typeof el.value === "string" ? el.value.trim() : "";
}

/** Raw value, ends trimmed but line breaks kept — for the prose fields. */
function text(name) {
  const el = form.elements[name];
  return el && typeof el.value === "string" ? el.value.replace(/\s+$/, "") : "";
}

function checked(name) {
  const el = form.elements[name];
  return Boolean(el && el.checked);
}

/**
 * Whether a field says anything the scribe didn't get for free. `defaultValue` is
 * the prefill Zola rendered into the value attribute, so this distinguishes "left
 * the suggestion alone" from "wrote something" — which is how a bullet that would
 * otherwise read only "Ending around" gets dropped instead of written out.
 */
function written(name) {
  const el = form.elements[name];
  if (!el || typeof el.value !== "string") return false;
  return el.value.trim() !== "" && el.value.trim() !== (el.defaultValue ?? "").trim();
}

/** The <option> currently chosen in a <select>, for the data-* it carries. */
function chosen(name) {
  const el = form.elements[name];
  return el && el.selectedOptions ? (el.selectedOptions[0] ?? null) : null;
}

/* ─── writing the markdown ────────────────────────────────────────────────── */

/** An id for a heading anchor: "line 1090" → "line-1090", "254b" → "254b". */
function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Markdown blockquote, with blank lines kept as blank quoted lines. */
function quote(body) {
  return body
    .split("\n")
    .map((line) => (line.trim() === "" ? ">" : `> ${line}`))
    .join("\n");
}

function meetingBody(prefix) {
  if (!checked(`${prefix}-held`)) {
    const why = value(`${prefix}-absent`);
    return why ? `No meeting <!-- ${why} -->` : "No meeting";
  }

  const option = chosen(`${prefix}-work`);
  const short = option?.dataset.short ?? "";
  const workMd = option?.dataset.md ?? "";
  const locus = value(`${prefix}-locus`);
  const wantsReminder = checked(`${prefix}-reminder`);
  // The reminder heading and the bullet that points at it have to agree, so both
  // are built from the same two pieces.
  const anchor = short && locus ? `${short}-${slugify(locus)}` : "";

  const bullets = [];
  if (workMd) bullets.push(`- ${value(`${prefix}-verb`)} ${workMd}`);

  const from = value(`${prefix}-from`);
  if (from) bullets.push(`- ${from}`);

  // "Ending around" on its own is the suggestion, not a minute — the bullet is
  // only worth writing once there's a spot to point at, or prose of our own.
  const to = value(`${prefix}-to`);
  if (locus || written(`${prefix}-to`)) {
    let spot = "";
    if (locus) spot = anchor && wantsReminder ? `[**${locus}**](#${anchor})` : `**${locus}**`;
    bullets.push(`- ${[to, spot].filter(Boolean).join(" ")}`);
  }

  const next = value(`${prefix}-next`);
  if (next) bullets.push(`- ${next}`);

  const parts = bullets.length ? [bullets.join("\n")] : [];

  if (wantsReminder) {
    const heading = value(`${prefix}-reminder-heading`);
    const body = text(`${prefix}-reminder-body`);
    if (heading || body) {
      parts.push(`#### ${heading}${anchor ? ` { #${anchor} }` : ""}`);
      if (body) parts.push(quote(body));
    }
  }

  return parts.join("\n\n");
}

/** Sections in the order they belong in the file: before, the meetings, after. */
function sections() {
  return [...form.querySelectorAll("[data-section]")]
    .map((el, index) => {
      const { kind, prefix, heading } = el.dataset;
      const standalone = kind === "standalone";
      const after = form.elements[`${prefix}-position`]?.value === "after";
      return {
        index,
        prefix,
        standalone,
        order: standalone ? (after ? 2 : 0) : 1,
        heading: standalone ? value(`${prefix}-heading`) : heading,
        include: standalone ? checked(`${prefix}-on`) : true,
      };
    })
    .filter((section) => section.include)
    .sort((a, b) => a.order - b.order || a.index - b.index);
}

/** The burndown rows, in meeting order — the order the charts read them back in. */
function burndown() {
  return [...form.querySelectorAll('[data-kind="meeting"]')]
    .map((el) => {
      const { prefix } = el.dataset;
      return {
        slug: value(`${prefix}-work`),
        start: value(`${prefix}-start`),
        end: value(`${prefix}-end`),
        units: value(`${prefix}-units`),
        tracked: checked(`${prefix}-track`),
      };
    })
    .filter((row) => row.tracked && row.slug && row.start !== "" && row.end !== "" && row.units);
}

function markdown() {
  const front = ["+++", `date = ${value("date")}`, "draft = false"];
  for (const row of burndown()) {
    front.push(
      "",
      `[extra.burndown."${row.slug}"]`,
      `starting = ${row.start}`,
      `ending = ${row.end}`,
      `units = "${row.units}"`,
    );
  }
  front.push("+++");

  const body = sections().map((section) => {
    const heading = section.heading ? `### ${section.heading}` : "";
    const content = section.standalone ? text(`${section.prefix}-body`) : meetingBody(section.prefix);
    return [heading, content].filter(Boolean).join("\n\n");
  });

  return `${[front.join("\n"), ...body].join("\n\n")}\n`;
}

/* ─── the two buttons ─────────────────────────────────────────────────────── */

function say(message) {
  const status = form.querySelector("[data-status]");
  if (status) status.textContent = message;
}

/**
 * A meeting that is tracking progress owes the chart all three numbers, so while
 * its box is ticked they're required. Without this a row missing any of them was
 * dropped from the file without a word — and the easiest one to miss is the units,
 * whose placeholder is easily read as a value that's already there.
 */
function syncRequired() {
  for (const section of form.querySelectorAll('[data-kind="meeting"]')) {
    const on = checked(`${section.dataset.prefix}-track`);
    for (const name of ["start", "end", "units"]) {
      const el = form.elements[`${section.dataset.prefix}-${name}`];
      if (el) el.required = on;
    }
  }
}

/** Which meeting is tracking progress without having said what it's reading. */
function trackedWithoutWork() {
  for (const section of form.querySelectorAll('[data-kind="meeting"]')) {
    const { prefix, heading } = section.dataset;
    if (checked(`${prefix}-track`) && !value(`${prefix}-work`)) return heading;
  }
  return null;
}

/** The first thing standing in the way of a complete file, named the way it's labelled. */
function complaint() {
  const bad = form.querySelector("input:invalid, select:invalid, textarea:invalid");
  if (!bad) return "";
  const label = form.querySelector(`label[for="${bad.id}"]`)?.textContent.trim() ?? bad.name;
  const where = bad.closest("[data-section]")?.dataset.heading;
  return where
    ? `“${label}” is empty in the ${where.toLowerCase()} — fill it in, or untick “Track progress on the chart”.`
    : `“${label}” needs filling in.`;
}

function download() {
  const unnamed = trackedWithoutWork();
  if (unnamed) {
    say(`The ${unnamed.toLowerCase()} is tracking progress but has no work chosen — pick one, or untick “Track progress on the chart”.`);
    return;
  }
  if (!form.reportValidity()) {
    say(complaint());
    return;
  }

  const file = new Blob([markdown()], { type: "text/markdown;charset=utf-8" });
  const href = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = href;
  link.download = `${value("date") || "meeting"}.md`;
  link.click();
  URL.revokeObjectURL(href);
  say(`Saved ${link.download} — it goes in content/minutes/.`);
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
 * A checkbox that isn't ticked sends nothing at all, so on a link that carries
 * answers, "absent" has to mean "unticked" rather than "left alone" — otherwise
 * every box the sharer cleared would come back ticked. Hence the guard: only a
 * link that actually carries answers gets to overwrite the defaults.
 */
function restore() {
  const answers = new URLSearchParams(location.search);
  if ([...answers.keys()].length === 0) return;

  for (const el of form.elements) {
    if (!el.name) continue;
    if (el.type === "checkbox") {
      el.checked = answers.has(el.name);
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
  syncRequired();
  form.addEventListener("change", (event) => {
    if (event.target.name?.endsWith("-track")) syncRequired();
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    share();
  });
  form.querySelector("[data-download]")?.addEventListener("click", download);
}
