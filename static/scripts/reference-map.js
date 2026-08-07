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
 * `taxonomies.references` front matter. Every work gets a line regardless of whether it
 * has any — one with an empty `refs` and nothing pointing at it either still renders, as
 * an unconnected dot, which is itself part of the picture: most works in a reading list
 * don't cite or get cited by anything else here.
 *
 * An optional `data-reference-map-focus="some-id"` on the wrapper opens the graph already
 * pinned on that node, for embedding on a work's own page rather than the whole-corpus view.
 *
 * The wrapper decides its own size however its page's CSS sees fit — this script only
 * ever reads the canvas's rendered size back via ResizeObserver and draws to fill exactly
 * that, at any aspect ratio, from a container a few hundred pixels wide to a full-width
 * section. Node positions are computed once, normalized to a unit ellipse independent of
 * pixel size, so a resize is just a redraw with a new scale, never a relayout.
 *
 * Hover previews a work's connections; click pins them (tap, on touch). The active node
 * and every work connected to it — in blue if it cites the active node, orange if the
 * active node cites it — get their own label, not just a color, since a color alone
 * doesn't say which of a dozen dots is which. Labels that would collide are nudged apart;
 * one that still can't find room (a crowded node in a small container) is dropped rather
 * than drawn illegibly on top of another — the dot stays visible either way. Clicking a
 * label goes to that work's page; clicking a dot pins or releases it.
 */

const ACCENT_IN = "#2a78d6"; // blue — an edge pointing INTO the active node (cites it)
const ACCENT_OUT = "#eb6834"; // orange — an edge pointing OUT of the active node (it cites)
const INK = "#111827";
const MUTED_NODE = "#374151";
const MUTED_EDGE = "#d1d5db";
const LABEL_BG = "rgba(255,255,255,0.92)";
const LABEL_BORDER = "rgba(17,24,39,0.15)";
const LEADER_LINE = "rgba(17,24,39,0.25)";

const TAU = Math.PI * 2;
const HIT_RADIUS = 14; // CSS px hit-test radius for a dot, generous relative to its 3-11px draw size
const MIN_RADIUS = 3;
const MAX_RADIUS = 11;
const LABEL_NUDGE_STEP = 5; // CSS px per collision-resolution attempt
const LABEL_NUDGE_TRIES = 40; // ~200px of headroom before a label gives up on finding room

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

  // every work is a node — one with no edges just sits on the rim unconnected, which is
  // itself informative rather than something to hide
  const nodes = [...nodesById.values()].sort((a, b) => a.title.localeCompare(b.title));

  const maxDegree = Math.max(1, ...nodes.map((n) => n.inDegree + n.outDegree));
  nodes.forEach((n, i) => {
    // normalized to a unit ellipse, independent of however big the canvas ends up —
    // resizing only ever rescales these, it never recomputes them
    const angle = (i / nodes.length) * TAU - Math.PI / 2;
    n.nx = Math.cos(angle);
    n.ny = Math.sin(angle);
    n.angle = angle;
    n.degree = n.inDegree + n.outDegree;
    // area-proportional (sqrt), not linear: against one high-degree outlier, a linear
    // scale crushes every degree-1/2 node toward the same floor and they stop reading as
    // different sizes from each other at all
    n.radius = MIN_RADIUS + (MAX_RADIUS - MIN_RADIUS) * Math.sqrt(n.degree / maxDegree);
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

/** The label's ideal box for a node — before collision resolution ever moves it. */
function labelBox(ctx, node, layout, width, height, emphasis) {
  const font = emphasis
    ? "700 13px system-ui, -apple-system, 'Segoe UI', sans-serif"
    : "600 11.5px system-ui, -apple-system, 'Segoe UI', sans-serif";
  ctx.font = font;
  const padX = 6,
    padY = 4,
    lineH = (emphasis ? 13 : 11.5) + 5;
  const boxW = ctx.measureText(node.title).width + padX * 2;
  const boxH = lineH + padY * 2;

  const dot = positionOf(node, layout);
  // starts beside the dot, on whichever side points away from center — clamped into the
  // canvas rather than reasoned about per-quadrant, which stays correct at any aspect
  // ratio or node position, including right at an edge
  const rightSide = node.nx >= 0;
  const idealX = rightSide ? dot.x + node.radius + 6 : dot.x - node.radius - 6 - boxW;
  const idealY = dot.y - boxH / 2;

  return {
    node,
    font,
    padX,
    dot,
    x: Math.min(Math.max(idealX, 4), width - boxW - 4),
    y: Math.min(Math.max(idealY, 4), height - boxH - 4),
    w: boxW,
    h: boxH,
    moved: false,
  };
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/**
 * Places the active node's label plus one for every connected neighbor, resolving
 * collisions by nudging: the active label never moves (placed first, stays the anchor
 * everything else avoids), each neighbor after it is pushed downward — re-clamped into
 * bounds each step — until it clears every label already placed. A neighbor that still
 * can't find room within the try budget is dropped rather than stacked illegibly; its dot
 * stays drawn and colored regardless, only the label is missing. That budget is what makes
 * this the same mechanism at any container size: generous room shows every label, a
 * cramped one thins itself out automatically as the budget is exhausted sooner.
 */
function placeLabels(ctx, activeNode, neighborIds, byId, layout, width, height) {
  const boxes = [labelBox(ctx, activeNode, layout, width, height, true)];

  const neighbors = [...neighborIds]
    .map((id) => byId.get(id))
    .filter(Boolean)
    // fixed, spatially coherent order: labels nudge apart in the same order they sit
    // around the rim, rather than jumping around unpredictably
    .sort((a, b) => a.angle - b.angle);

  for (const n of neighbors) {
    const box = labelBox(ctx, n, layout, width, height, false);
    let tries = 0;
    while (tries < LABEL_NUDGE_TRIES && boxes.some((placed) => rectsOverlap(box, placed))) {
      const nextY = Math.min(box.y + LABEL_NUDGE_STEP, height - box.h - 4);
      if (nextY === box.y) break; // already at the floor; no further nudging is possible
      box.y = nextY;
      tries++;
    }
    if (boxes.some((placed) => rectsOverlap(box, placed))) continue; // no room found — drop it
    box.moved = tries > 0;
    boxes.push(box);
  }
  return boxes;
}

function closestPointOnRect(px, py, rect) {
  return {
    x: Math.min(Math.max(px, rect.x), rect.x + rect.w),
    y: Math.min(Math.max(py, rect.y), rect.y + rect.h),
  };
}

function paintLabel(ctx, box) {
  if (box.moved) {
    // a leader line only when the label actually left its dot's side, so the two stay
    // visibly associated after nudging relocated the box
    const target = closestPointOnRect(box.dot.x, box.dot.y, box);
    ctx.strokeStyle = LEADER_LINE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(box.dot.x, box.dot.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.roundRect(box.x, box.y, box.w, box.h, 5);
  ctx.fillStyle = LABEL_BG;
  ctx.fill();
  ctx.strokeStyle = LABEL_BORDER;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.font = box.font;
  ctx.textBaseline = "middle";
  ctx.fillStyle = INK;
  ctx.fillText(box.node.title, box.x + box.padX, box.y + box.h / 2);
}

function draw(ctx, width, height, graph, activeId) {
  ctx.clearRect(0, 0, width, height);
  const { nodes, edges, byId } = graph;
  const layout = layoutFor(width, height);
  const active = activeId ? byId.get(activeId) : null;

  const outNeighbors = new Set(); // active cites these
  const inNeighbors = new Set(); // these cite active
  if (active) {
    edges.forEach((e) => {
      if (e.source === activeId) outNeighbors.add(e.target);
      if (e.target === activeId) inNeighbors.add(e.source);
    });
  }

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
      if (n.id === activeId) fill = INK;
      else if (outNeighbors.has(n.id)) fill = ACCENT_OUT;
      else if (inNeighbors.has(n.id)) fill = ACCENT_IN;
      else alpha = 0.25;
    }
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, n.radius, 0, TAU);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  let labelRects = [];
  if (active) {
    const neighborIds = new Set([...outNeighbors, ...inNeighbors]);
    const boxes = placeLabels(ctx, active, neighborIds, byId, layout, width, height);
    boxes.forEach((box) => paintLabel(ctx, box));
    labelRects = boxes.map((b) => ({ x: b.x, y: b.y, w: b.w, h: b.h, url: b.node.url }));
  }
  return labelRects;
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
  const focusId = root.dataset.referenceMapFocus;
  let activeId = focusId && graph.byId.has(focusId) ? focusId : null;
  let pinned = activeId !== null;
  let labelRects = [];

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
    labelRects = draw(ctx, w, h, graph, activeId) || [];
  }

  function setActive(id) {
    if (id === activeId) return;
    activeId = id;
    render();
  }

  function labelAt(x, y) {
    return labelRects.find((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
  }

  canvas.addEventListener("pointermove", (ev) => {
    const rect = canvas.getBoundingClientRect();
    const x = ev.clientX - rect.left,
      y = ev.clientY - rect.top;
    // a label draws on top of the graph and wins any hit-test tie — hovering one only
    // offers the click-through cursor, it never reassigns the active node, so drifting
    // across a cluster of neighbor labels doesn't make the highlight flicker
    if (labelAt(x, y)) {
      canvas.style.cursor = "pointer";
      return;
    }
    const hit = hitTest(graph, layoutFor(rect.width, rect.height), x, y);
    canvas.style.cursor = hit ? "pointer" : "default";
    if (pinned) return;
    setActive(hit ? hit.id : null);
  });

  canvas.addEventListener("pointerleave", () => {
    if (!pinned) setActive(null);
  });

  canvas.addEventListener("click", (ev) => {
    const rect = canvas.getBoundingClientRect();
    const x = ev.clientX - rect.left,
      y = ev.clientY - rect.top;
    const label = labelAt(x, y);
    if (label) {
      if (label.url) window.location.href = label.url;
      return;
    }
    const hit = hitTest(graph, layoutFor(rect.width, rect.height), x, y);
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
