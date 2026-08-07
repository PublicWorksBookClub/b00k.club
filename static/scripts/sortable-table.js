/**
 * Client-side column sorting for any table on the site.
 *
 * Opt in from a template by putting `data-sortable` on the <table> and `data-sort` on the
 * <th> of each sortable column:
 *
 *   <table data-sortable>
 *     <thead>
 *       <tr>
 *         <th data-sort="text">Name</th>
 *         <th data-sort="number">Works</th>
 *         <th>Synonyms</th>
 *       </tr>
 *     </thead>
 *     <tbody>…</tbody>
 *   </table>
 *
 * Clicking a header sorts it ascending; clicking the same header again reverses it to
 * descending, and it keeps alternating between the two from there — there's no third
 * "back to unsorted" state to click through.
 * When the visible text is not what you want to sort on — a formatted date, a name with a
 * leading article, a count standing in for a truncated list — put the real key on the cell:
 *
 *   <td data-sort-value="7">a, b, c +4 more</td>
 *
 * If the table's rows already arrive in sorted order — a taxonomy page listed
 * alphabetically, say — say so on that column's header, and the indicator is right from
 * first paint instead of only appearing after a click:
 *
 *   <th data-sort="text" aria-sort="ascending">Name</th>
 *
 * Nothing here is specific to one page: it enhances whatever it finds, and a table without
 * JavaScript stays a perfectly readable table.
 */

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

/** The value a cell sorts on: explicit `data-sort-value` wins over rendered text. */
function cellValue(row, column) {
  const cell = row.children[column];
  if (!cell) return "";
  const override = cell.getAttribute("data-sort-value");
  return (override !== null ? override : cell.textContent).trim();
}

function comparator(column, kind) {
  if (kind === "number") {
    return (a, b) => {
      // rows with no number sort last in both directions rather than clumping at one end
      const x = parseFloat(cellValue(a, column));
      const y = parseFloat(cellValue(b, column));
      const xNaN = Number.isNaN(x);
      const yNaN = Number.isNaN(y);
      if (xNaN && yNaN) return 0;
      if (xNaN) return 1;
      if (yNaN) return -1;
      return x - y;
    };
  }
  return (a, b) => collator.compare(cellValue(a, column), cellValue(b, column));
}

/** Paint aria-sort and the arrow glyph for whichever column is (or isn't) active. */
function updateIndicators(headers, column, direction) {
  headers.forEach((header, i) => {
    if (!header.dataset.sort) return;
    const active = i === column && direction !== "none";
    header.setAttribute("aria-sort", active ? direction : "none");
    const arrow = header.querySelector("[data-sort-arrow]");
    if (arrow) {
      arrow.textContent = active
        ? direction === "ascending"
          ? "▲"
          : "▼"
        : "";
    }
  });
}

function sortTable(table, headers, column, direction) {
  const body = table.tBodies[0];
  if (!body) return;

  const rows = Array.from(body.rows);
  const compare = comparator(column, headers[column].dataset.sort);
  const sign = direction === "descending" ? -1 : 1;
  // stable within equal keys: fall back to the order the server sent
  rows.sort((a, b) => {
    const result = compare(a, b);
    if (result !== 0) return sign * result;
    return Number(a.dataset.sortIndex) - Number(b.dataset.sortIndex);
  });
  rows.forEach((row) => body.appendChild(row));

  updateIndicators(headers, column, direction);
}

function enhance(table) {
  const head = table.tHead;
  const body = table.tBodies[0];
  if (!head || !body || table.dataset.sortableReady) return;
  table.dataset.sortableReady = "true";

  // tie-break equal sort keys by the order the server sent, so ties land predictably
  Array.from(body.rows).forEach((row, i) => {
    row.dataset.sortIndex = String(i);
  });

  const headers = Array.from(head.rows[0]?.cells ?? []);

  // A header may arrive already declaring the table's served sort order — e.g. a taxonomy
  // page whose rows are already alphabetical — so the indicator is right from first paint
  // and the first click reverses it, instead of quietly re-applying the same order. Only
  // the first such header counts; a second declared default is an authoring mistake and
  // would show as two arrows on load, which is obvious enough not to need guarding here.
  let state = { column: -1, direction: "none" };
  headers.forEach((header, column) => {
    if (state.column !== -1 || !header.dataset.sort) return;
    const declared = header.getAttribute("aria-sort");
    if (declared === "ascending" || declared === "descending") {
      state = { column, direction: declared };
    }
  });

  headers.forEach((header, column) => {
    if (!header.dataset.sort) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "cursor-pointer hover:underline";
    while (header.firstChild) button.appendChild(header.firstChild);

    const arrow = document.createElement("span");
    arrow.setAttribute("data-sort-arrow", "");
    arrow.className = "ml-1 text-gray-400";
    button.appendChild(arrow);
    header.appendChild(button);

    button.addEventListener("click", () => {
      // direction is only ever "none" while column is still -1 (untouched), so reaching
      // this column at all means it's already "ascending" or "descending" — a plain
      // toggle, forever, with no third state to click back to.
      const direction =
        state.column === column && state.direction === "ascending"
          ? "descending"
          : "ascending";
      state = { column, direction };
      sortTable(table, headers, column, direction);
    });
  });

  updateIndicators(headers, state.column, state.direction);
}

export function initSortableTables(root = document) {
  root.querySelectorAll("table[data-sortable]").forEach(enhance);
}

initSortableTables();
