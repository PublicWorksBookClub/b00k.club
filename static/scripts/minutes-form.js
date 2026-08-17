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
 *   data-kind="standalone"   an extra section, e.g. the amateur idylls
 *   data-prefix="m0"         prefix the section's own fields share
 *   data-heading="…"         meetings only; standalone ones are titled by the scribe
 *
 * A meeting holds one or more works, each a <div data-work data-prefix="m0-w0">.
 * Every work after the first is folded away behind `<work>-on`. Per work:
 *
 *   verb        Continuing / Starting / …
 *   work        (select) value is the slug; the <option> carries data-md, the
 *               markdown link, data-short, which anchors are built from, and
 *               data-remaining / data-units, what last week left of that work
 *   from, from-locus   the wording and the spot we picked up at
 *   to, to-locus       the wording and the spot we got to
 *   reminder    (checkbox) + reminder-heading + reminder-body
 *   track       (checkbox) + units + total, the burndown row
 *
 * The meeting itself owns `held`, `absent` and `next`, the last taking as many
 * lines as it needs — one stands alone, several become a list under "Next week:".
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

/** A textarea taken a line at a time, blanks dropped. */
function lines(name) {
  const el = form.elements[name];
  if (!el) return [];
  return el.value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/** The <option> currently chosen in a <select>, for the data-* it carries. */
function chosen(name) {
  const el = form.elements[name];
  return el && el.selectedOptions ? (el.selectedOptions[0] ?? null) : null;
}

/**
 * The number a spot counts as. The club writes its spots in whatever way the work
 * numbers itself — "249a", "line 1090", "1240" — and the arithmetic only ever
 * wants the figure, so the first run of digits is it.
 */
function locusNumber(spot) {
  const match = spot.match(/\d+/);
  return match ? Number(match[0]) : null;
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

/** Every work a meeting actually covered: the first, plus any that were opened. */
function worksOf(section) {
  return [...section.querySelectorAll("[data-work]")]
    .filter((el, index) => index === 0 || checked(`${el.dataset.prefix}-on`))
    .filter((el) => value(`${el.dataset.prefix}-work`))
    .map((el) => el.dataset.prefix);
}

/** The bullets and any reminder for one work within a meeting. */
function workParts(wp) {
  const option = chosen(`${wp}-work`);
  const short = option?.dataset.short ?? "";
  const workMd = option?.dataset.md ?? "";
  const toSpot = value(`${wp}-to-locus`);
  const wantsReminder = checked(`${wp}-reminder`);
  // The reminder heading and the bullet that points at it have to agree, so both
  // are built from the same two pieces.
  const anchor = short && toSpot ? `${short}-${slugify(toSpot)}` : "";

  const bullets = [`- ${value(`${wp}-verb`)} ${workMd}`];

  const fromSpot = value(`${wp}-from-locus`);
  if (fromSpot) bullets.push(`- ${[value(`${wp}-from`), `**${fromSpot}**`].filter(Boolean).join(" ")}`);

  // "Ending around" on its own is the suggestion, not a minute — the bullet is
  // only worth writing once there's a spot to point at, or prose of our own.
  if (toSpot || written(`${wp}-to`)) {
    const spot = toSpot ? (anchor && wantsReminder ? `[**${toSpot}**](#${anchor})` : `**${toSpot}**`) : "";
    bullets.push(`- ${[value(`${wp}-to`), spot].filter(Boolean).join(" ")}`);
  }

  const parts = { bullets, reminder: "" };
  if (wantsReminder) {
    const heading = value(`${wp}-reminder-heading`);
    const body = text(`${wp}-reminder-body`);
    if (heading || body) {
      const head = `#### ${heading}${anchor ? ` { #${anchor} }` : ""}`;
      parts.reminder = body ? `${head}\n\n${quote(body)}` : head;
    }
  }
  return parts;
}

function meetingBody(section) {
  const prefix = section.dataset.prefix;
  if (!checked(`${prefix}-held`)) {
    const why = value(`${prefix}-absent`);
    return why ? `No meeting <!-- ${why} -->` : "No meeting";
  }

  const bullets = [];
  const reminders = [];
  for (const wp of worksOf(section)) {
    const parts = workParts(wp);
    bullets.push(...parts.bullets);
    if (parts.reminder) reminders.push(parts.reminder);
  }

  // One "next week" for the meeting, however many works it covered — but not
  // necessarily one line. A single one stands as its own bullet; several become a
  // list underneath, which is how 2026-08-02 and 2026-08-09 were written by hand.
  const next = lines(`${prefix}-next`);
  if (next.length === 1) bullets.push(`- ${next[0]}`);
  else if (next.length > 1) bullets.push("- Next week:", ...next.map((line) => `  - ${line}`));

  return [bullets.length ? bullets.join("\n") : "", ...reminders].filter(Boolean).join("\n\n");
}

/** Sections in the order they belong in the file: before, the meetings, after. */
function sections() {
  return [...form.querySelectorAll("[data-section]")]
    .map((el, index) => {
      const { kind, prefix, heading } = el.dataset;
      const standalone = kind === "standalone";
      const after = form.elements[`${prefix}-position`]?.value === "after";
      return {
        el,
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

/**
 * How much ground a work covered this week, and the working to write beside it.
 *
 * Subtracting the two spots only tells the truth while they sit on one continuous
 * scale. Plenty of what the club reads doesn't: the Argonautica numbers its lines
 * from 1 again at every book, so a session running from line 930 of Book II to
 * line 430 of Book III subtracts to -500, and a session that began at a book's
 * opening has no first number at all. Both are the common case for those works,
 * not a corner of them — so when the spots won't subtract the scribe says the
 * figure outright, and saying it always wins.
 *
 * `covered` is null when nothing can be worked out, which is a refusal rather than
 * a zero: recording a flat week the club didn't have would quietly flatten the
 * chart.
 */
/**
 * How much ground a work covered this week: the figure the scribe worked out,
 * which is theirs to work out. The two spots either side of it say where the
 * session began and ended for the minutes to read, but the distance between them
 * only means anything while a work numbers itself straight through, and plenty
 * don't — so it is asked for rather than inferred.
 *
 * Nothing given at all is a flat week, which is what a week we sat out is.
 */
function groundCovered(wp) {
  const stated = value(`${wp}-covered`);
  return stated === "" ? 0 : Number(stated);
}

/**
 * One burndown row per work, worked out rather than typed.
 *
 * `starting` is what the work had left when we sat down, which is simply what it
 * had left when we got up last week. What we got through is the distance between
 * the two spots, so `ending` is one minus the other — and the arithmetic goes
 * into the file as a comment beside it, the way it always has been written by
 * hand: `ending = 13 # 19 - (255 - 249)`.
 *
 * A work with no run behind it has nothing to carry over, so its total stands in
 * as the starting figure. Rows are keyed by work: if the same work turns up in
 * two meetings, the later one wins rather than writing the table out twice.
 */
function burndown() {
  const rows = new Map();
  for (const section of form.querySelectorAll('[data-kind="meeting"]')) {
    for (const wp of worksOf(section)) {
      if (!checked(`${wp}-track`)) continue;
      const option = chosen(`${wp}-work`);
      const slug = value(`${wp}-work`);
      const units = value(`${wp}-units`) || option?.dataset.units || "";

      const carried = option?.dataset.remaining;
      const total = value(`${wp}-total`);
      const starting = carried !== undefined && carried !== "" ? Number(carried) : Number(total);

      if (!slug || !units || !Number.isFinite(starting)) continue;
      const covered = groundCovered(wp);
      const ending = Math.max(0, starting - covered);
      rows.set(slug, {
        slug,
        units,
        starting,
        ending,
        // The working goes in beside it, the way it has always been written by hand.
        working: covered > 0 ? `${starting} - ${covered}` : "",
      });
    }
  }
  return [...rows.values()];
}

function markdown() {
  const front = ["+++", `date = ${value("date")}`, "draft = false"];
  for (const row of burndown()) {
    front.push(
      "",
      `[extra.burndown."${row.slug}"]`,
      `starting = ${row.starting}`,
      `ending = ${row.ending}${row.working ? ` # ${row.working}` : ""}`,
      `units = "${row.units}"`,
    );
  }
  front.push("+++");

  const body = sections().map((section) => {
    const heading = section.heading ? `### ${section.heading}` : "";
    const content = section.standalone ? text(`${section.prefix}-body`) : meetingBody(section.el);
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
 * A work being tracked owes the chart its units, and a work with no run behind it
 * owes its total as well — without them the row would be dropped from the file
 * without a word, and the meeting would look written up while the chart stood
 * still. Returns the first thing missing, said plainly.
 */
function missingForChart() {
  for (const section of form.querySelectorAll('[data-kind="meeting"]')) {
    if (!checked(`${section.dataset.prefix}-held`)) continue;
    for (const wp of worksOf(section)) {
      if (!checked(`${wp}-track`)) continue;
      const option = chosen(`${wp}-work`);
      const name = option?.dataset.title ?? "that work";
      const carried = option?.dataset.remaining;
      if (!(value(`${wp}-units`) || option?.dataset.units)) {
        return `${name} is being tracked but nothing says what it is counted in.`;
      }
      if ((carried === undefined || carried === "") && !value(`${wp}-total`)) {
        return `${name} hasn't been on the chart before, so it needs “how long it is” filling in.`;
      }
    }
  }
  return "";
}

function download() {
  if (!form.reportValidity()) {
    say("Some of the form still needs filling in.");
    return;
  }
  const missing = missingForChart();
  if (missing) {
    say(missing);
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
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    share();
  });
  form.querySelector("[data-download]")?.addEventListener("click", download);
}
