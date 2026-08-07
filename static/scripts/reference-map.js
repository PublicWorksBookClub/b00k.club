/**
 * Draws the citation graph produced by macro/canvas.html's reference_map() macro: a
 * directed map of which works refer to which other works, rendered on a <canvas>.
 *
 * Opt in by putting `data-reference-map` on a wrapper element containing an empty
 * <canvas> and a sibling `<script type="application/json" data-reference-map-data>`
 * holding one line of JSON per work:
 *
 *   {"id":"homer-odyssey","title":"Odyssey","url":"/works/homer-odyssey/","refs":[]}
 *
 * `refs` is that work's own outgoing citations, by id — the same shape as a work's
 * `taxonomies.references` front matter. A work cited by others but citing nobody itself
 * still needs its own line (with an empty `refs`), since its id, title and url are needed
 * wherever an edge points at it.
 *
 * The wrapper decides its own size however its page's CSS sees fit — this script only
 * ever reads the canvas's rendered size back via ResizeObserver and draws to fill exactly
 * that, at any aspect ratio, from a container a few hundred pixels wide to a full-width
 * section. Node positions are computed once, normalized to a unit ellipse independent of
 * pixel size, so a resize is just a redraw with a new scale, never a relayout.
 *
 * Hover previews a work's connections; click pins them (tap, on touch) — its own edges in
 * blue (cites it) and orange (it cites), everything else recedes. Nothing here needs its
 * own color per work: with dozens of works a distinct hue each would be unreadable, so the
 * only colors in play are those two accents plus neutral ink, applied to whichever node is
 * active.
 */

const ACCENT_IN = "#2a78d6"; // blue — an edge pointing INTO the active node (cites it)
const ACCENT_OUT = "#eb6834"; // orange — an edge pointing OUT of the active node (it cites)
const INK = "#111827";
const MUTED_NODE = "#374151";
const MUTED_EDGE = "#d1d5db";
const LABEL_BG = "rgba(255,255,255,0.92)";
const LABEL_BORDER = "rgba(17,24,39,0.15)";

const TAU = Math.PI * 2;
const HIT_RADIUS = 14; // CSS px — generous, since dots themselves run 3-9px

function parseGraph(text) {
  const nodesById = new Map();
  const edges = [];

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let record;
    try {
      record = JSON.parse(trimmed);
    } catch {
      continue; // one malformed line shouldn't take down the whole graph
    }
    if (!record.id) continue;
    if (!nodesById.has(record.id)) {
      nodesById.set(record.id, {
        id: record.id,
        title: record.title ?? record.id,
        url: record.url ?? null,
        inDegree: 0,
        outDegree: 0,
      });
    }
    for (const target of record.refs ?? []) {
      edges.push({ source: record.id, target });
    }
  }

  const validEdges = edges.filter((e) => nodesById.has(e.source) && nodesById.has(e.target));
  validEdges.forEach((e) => {
    nodesById.get(e.source).outDegree++;
    nodesById.get(e.target).inDegree++;
  });

  // isolated works — cited by no one, citing no one — add nothing to a *reference* map
  const nodes = [...nodesById.values()]
    .filter((n) => n.inDegree + n.outDegree > 0)
    .sort((a, b) => a.title.localeCompare(b.title));

  const maxDegree = Math.max(1, ...nodes.map((n) => n.inDegree + n.outDegree));
  nodes.forEach((n, i) => {
    // normalized to a unit ellipse, independent of however big the canvas ends up —
    // resizing only ever rescales these, it never recomputes them
    const angle = (i / nodes.length) * TAU - Math.PI / 2;
    n.nx = Math.cos(angle);
    n.ny = Math.sin(angle);
    n.degree = n.inDegree + n.outDegree;
    n.radius = 3 + (n.degree / maxDegree) * 6;
  });

  return { nodes, edges: validEdges, byId: nodesById };
}

/** Where the layout ellipse sits for a given rendered size, in CSS px. */
function layoutFor(width, height) {
  const pad = 28; // room for a dot near the rim plus its label
  return {
    cx: width / 2,
    cy: height / 2,
    rx: Math.max(10, width / 2 - pad),
    ry: Math.max(10, height / 2 - pad),
  };
}

function positionOf(node, layout) {
  return { x: layout.cx + node.nx * layout.rx, y: layout.cy + node.ny * layout.ry };
}

function drawArrowhead(ctx, tip, ux, uy, color) {
  const len = 5,
    width = 3.5;
  const leftX = tip.x - ux * len - uy * width;
  const leftY = tip.y - uy * len + ux * width;
  const rightX = tip.x - ux * len + uy * width;
  const rightY = tip.y - uy * len - ux * width;
  ctx.beginPath();
  ctx.moveTo(tip.x, tip.y);
  ctx.lineTo(leftX, leftY);
  ctx.lineTo(rightX, rightY);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawEdge(ctx, layout, p0, p1, targetRadius, { color, alpha, width, arrow }) {
  // bows each chord in toward the center, like a chord diagram, rather than drawing
  // straight lines that would tangle into a hairball across ~30 points
  const bow = 0.82;
  const mx = (p0.x + p1.x) / 2,
    my = (p0.y + p1.y) / 2;
  const ctrl = { x: layout.cx + (mx - layout.cx) * bow, y: layout.cy + (my - layout.cy) * bow };

  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.quadraticCurveTo(ctrl.x, ctrl.y, p1.x, p1.y);
  ctx.stroke();

  if (arrow) {
    // the curve's tangent at t=1 is 2*(p1 - ctrl); stop short of the target's own dot
    // (whatever its radius happens to be) so the arrowhead doesn't draw under it
    const tx = p1.x - ctrl.x,
      ty = p1.y - ctrl.y;
    const len = Math.hypot(tx, ty) || 1;
    const ux = tx / len,
      uy = ty / len;
    const back = targetRadius + 2;
    drawArrowhead(ctx, { x: p1.x - ux * back, y: p1.y - uy * back }, ux, uy, color);
  }
  ctx.globalAlpha = 1;
}

function drawLabel(ctx, p, title, width, height) {
  ctx.font = "600 12px system-ui, -apple-system, 'Segoe UI', sans-serif";
  ctx.textBaseline = "middle";
  const padX = 7,
    padY = 5,
    lineH = 16;
  const boxW = ctx.measureText(title).width + padX * 2;
  const boxH = lineH + padY * 2;

  // clamp into the canvas rather than deciding a side per-quadrant — simpler, and
  // correct at any aspect ratio or node position, including right at an edge
  const x = Math.min(Math.max(p.x + 10, 4), width - boxW - 4);
  const y = Math.min(Math.max(p.y - boxH / 2, 4), height - boxH - 4);

  ctx.beginPath();
  ctx.roundRect(x, y, boxW, boxH, 5);
  ctx.fillStyle = LABEL_BG;
  ctx.fill();
  ctx.strokeStyle = LABEL_BORDER;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = INK;
  ctx.fillText(title, x + padX, y + boxH / 2);
}

function draw(ctx, width, height, graph, activeId) {
  ctx.clearRect(0, 0, width, height);
  const { nodes, edges, byId } = graph;
  const layout = layoutFor(width, height);
  const active = activeId ? byId.get(activeId) : null;

  edges.forEach((e) => {
    const s = byId.get(e.source),
      t = byId.get(e.target);
    const isOut = active && e.source === activeId;
    const isIn = active && e.target === activeId;
    const highlighted = isOut || isIn;
    drawEdge(ctx, layout, positionOf(s, layout), positionOf(t, layout), t.radius, {
      color: !active ? MUTED_EDGE : highlighted ? (isOut ? ACCENT_OUT : ACCENT_IN) : MUTED_EDGE,
      alpha: !active ? 0.55 : highlighted ? 0.9 : 0.12,
      width: highlighted ? 1.75 : 1,
      arrow: highlighted || !active,
    });
  });

  nodes.forEach((n) => {
    const p = positionOf(n, layout);
    let fill = MUTED_NODE;
    let alpha = 1;
    if (active) {
      if (n.id === activeId) {
        fill = INK;
      } else if (edges.some((e) => e.source === activeId && e.target === n.id)) {
        fill = ACCENT_OUT; // the active node cites this one
      } else if (edges.some((e) => e.target === activeId && e.source === n.id)) {
        fill = ACCENT_IN; // this one cites the active node
      } else {
        alpha = 0.25;
      }
    }
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, n.radius, 0, TAU);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  if (active) drawLabel(ctx, positionOf(active, layout), active.title, width, height);
}

function hitTest(graph, layout, x, y) {
  let best = null,
    bestDist = HIT_RADIUS;
  graph.nodes.forEach((n) => {
    const p = positionOf(n, layout);
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < bestDist) {
      bestDist = d;
      best = n;
    }
  });
  return best;
}

function enhance(root) {
  const canvas = root.querySelector("canvas");
  const dataEl = root.querySelector("[data-reference-map-data]");
  if (!canvas || !dataEl || root.dataset.referenceMapReady) return;
  root.dataset.referenceMapReady = "true";

  const graph = parseGraph(dataEl.textContent);
  if (graph.nodes.length === 0) return; // nothing to draw; leave the canvas empty

  const ctx = canvas.getContext("2d");
  let activeId = null;
  let pinned = false;

  function render() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    const bufferW = Math.round(w * dpr);
    const bufferH = Math.round(h * dpr);
    if (canvas.width !== bufferW || canvas.height !== bufferH) {
      canvas.width = bufferW;
      canvas.height = bufferH;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(ctx, w, h, graph, activeId);
  }

  function setActive(id) {
    if (id === activeId) return;
    activeId = id;
    render();
  }

  canvas.addEventListener("pointermove", (ev) => {
    const rect = canvas.getBoundingClientRect();
    const hit = hitTest(graph, layoutFor(rect.width, rect.height), ev.clientX - rect.left, ev.clientY - rect.top);
    // the cursor tracks the pointer regardless of pinning — clicking still does something
    // anywhere on the canvas — but a pin holds the highlight steady while the pointer wanders
    canvas.style.cursor = hit ? "pointer" : "default";
    if (pinned) return;
    setActive(hit ? hit.id : null);
  });

  canvas.addEventListener("pointerleave", () => {
    if (!pinned) setActive(null);
  });

  canvas.addEventListener("click", (ev) => {
    const rect = canvas.getBoundingClientRect();
    const hit = hitTest(graph, layoutFor(rect.width, rect.height), ev.clientX - rect.left, ev.clientY - rect.top);
    if (hit && pinned && activeId === hit.id) {
      pinned = false;
      setActive(null);
    } else if (hit) {
      pinned = true;
      setActive(hit.id);
    } else {
      pinned = false;
      setActive(null);
    }
  });

  new ResizeObserver(render).observe(canvas);
  render();
}

export function initReferenceMaps(root = document) {
  root.querySelectorAll("[data-reference-map]").forEach(enhance);
}

initReferenceMaps();
