/**
 * A fast reader for maps exported by tools/map-export.
 *
 * The generator at /maps/interactive/ stays the place to edit a map, but it
 * costs a 20 MB project file and a 46 MB application to open one. This viewer
 * reads the exported form instead: a WebP tile pyramid for the painted terrain,
 * one small SVG for the things worth clicking, and a JSON index of everything
 * the author annotated.
 *
 * `createViewer()` builds one map inside a root element and returns the Leaflet
 * map. Two callers share it:
 *
 *   - the standalone page at /maps/viewer/ (index.html): `root` is the document,
 *     `standalone: true`, and the map name / initial view come from the URL
 *     (`?map=`, `?burg=`, `?scale=`, `#lat,lng,zoom`);
 *   - the inline embed on a work page: `root` is the wrapper element, the map
 *     name and initial view come from its `data-*` attributes, and none of the
 *     page-level side effects below run.
 *
 * Everything is scoped to `root`. The side effects that only make sense for a
 * page that *is* the map — the document title, the `#lat,lng,zoom` hash, the
 * `loading` readiness flag — happen only in standalone mode, so the embed stays
 * a well-behaved guest on someone else's page.
 */

const DEFAULT_MAP = 'argonautica'
const MAPS_ROOT = '/maps'
const LEAFLET_JS = '/maps/viewer/vendor/leaflet/leaflet.js'
const LEAFLET_CSS = '/maps/viewer/vendor/leaflet/leaflet.css'

/** Below this frame width the opening note would smother the map, and the legend
 *  would cover too much of it, so both stay closed until the reader asks. */
const ROOMY_PX = 480

export async function createViewer(options = {}) {
  const { root = document, standalone = false } = options
  if (root.dataset && root.dataset.mapviewReady) return null
  if (root.dataset) root.dataset.mapviewReady = 'true'

  ensureStylesheet(LEAFLET_CSS)
  await ensureScript(LEAFLET_JS)
  const L = window.L

  // Initial view comes from the URL for the standalone page, from data-* for the
  // embed; `param` hides which so the rest reads the same in both.
  const search = standalone ? new URLSearchParams(location.search) : null
  const param = (name) => (search ? search.get(name) : root.dataset ? root.dataset[name] ?? null : null)

  const name = (options.mapName || param('map') || DEFAULT_MAP).replace(/[^\w-]/g, '')
  const base = `${MAPS_ROOT}/${name}`

  try {
    const [manifest, overlaySource] = await Promise.all([
      fetchJson(`${base}/map.json`),
      fetch(`${base}/overlay.svg`)
        .then(expectOk)
        .then((response) => response.text()),
    ])

    if (manifest.fontsCss) ensureStylesheet(`${base}/${manifest.fontsCss}`)
    if (standalone) applyTitles(root, manifest, name)

    const map = createMap(root, L, manifest, base, { scrollWheelZoom: options.scrollWheelZoom ?? true })
    const index = new FeatureIndex(manifest.features)
    const roomy = map.getContainer().clientWidth >= ROOMY_PX
    // The full-window page shows the legend from the start when there's room; an
    // in-article embed keeps it folded so it doesn't crowd the square. Either can
    // override with `legendOpen`.
    const legendOpen = options.legendOpen ?? (standalone && roomy)

    // Set the opening view once, before anything reads the zoom and before the
    // layers are added, so it lands the same in every browser with no first-view
    // zoom to watch.
    restoreView({ root, map, L, index, manifest, param, standalone, roomy })

    const overlay = addOverlay(map, L, manifest, overlaySource)
    wirePopups(map, L, overlay, index)
    wireSearch(root, map, L, index, manifest)
    wireLayerToggles(root, L, overlay)
    buildLegend(root, L, manifest.legend, legendOpen)
    addScaleBar(map, L, manifest)
    const sectionId = (standalone ? search.get('section') : root.dataset?.tourSection) || null
    addNavControl(map, L, await loadTour(base, index, sectionId), manifest, root)
    if (standalone) trackViewInHash(map)

    if (standalone) document.documentElement.classList.remove('loading')
    showStatus(root, null)

    // The frame is laid out by now, but re-measuring next frame is cheap insurance
    // against a first paint that beat the sizing (notably the embed's square).
    requestAnimationFrame(() => map.invalidateSize({ animate: false }))
    return map
  } catch (error) {
    console.error(error)
    showStatus(root, `Could not load the map: ${error.message}`, true)
    return null
  }
}

/* ------------------------------------------------------------------ setup */

/**
 * FMG map units are the coordinate system throughout: a feature at (x, y) in
 * the project is at `L.latLng(y, x)` here. The transformation below makes
 * Leaflet zoom `nativeZoom` the level at which one map unit is one pixel, which
 * is also how the tile pyramid is numbered.
 */
function createMap(root, L, manifest, base, { scrollWheelZoom }) {
  const unit = 2 ** -manifest.nativeZoom
  const crs = L.extend({}, L.CRS.Simple, { transformation: new L.Transformation(unit, 0, unit, 0) })
  const bounds = L.latLngBounds([0, 0], [manifest.height, manifest.width])

  const map = L.map(root.querySelector('.mapview__map'), {
    crs,
    minZoom: manifest.minZoom,
    // One level past the deepest tiles: Leaflet upscales the raster, while the
    // labels and the voyage stay vector-crisp.
    maxZoom: manifest.maxZoom + 1,
    maxBounds: bounds.pad(0.15),
    maxBoundsViscosity: 0.7,
    zoomSnap: 0.25,
    zoomDelta: 0.5,
    wheelPxPerZoomLevel: 140,
    // Leaflet binds the wheel only over the map container, so the wheel zooms when
    // the pointer is on the map and scrolls the page normally everywhere else.
    scrollWheelZoom,
    zoomControl: false,
    attributionControl: true,
  })

  map.attributionControl.setPrefix('')
  map.attributionControl.addAttribution(
    `Drawn with <a href="https://azgaar.github.io/Fantasy-Map-Generator/">Azgaar's Fantasy Map Generator</a>`,
  )

  L.tileLayer(`${base}/tiles/{z}/{x}_{y}.webp`, {
    tileSize: manifest.tileSize,
    minZoom: manifest.minZoom,
    maxZoom: manifest.maxZoom + 1,
    maxNativeZoom: manifest.maxZoom,
    bounds,
    noWrap: true,
    keepBuffer: 3,
  }).addTo(map)

  // The opening view is set once by restoreView (deep link, or the whole map as a
  // fallback), so createMap deliberately leaves the map without one.
  return map
}

function addOverlay(map, L, manifest, source) {
  const parsed = new DOMParser().parseFromString(source, 'image/svg+xml')
  if (parsed.querySelector('parsererror')) throw new Error('the map overlay is not valid SVG')

  const element = parsed.documentElement
  element.setAttribute('class', 'map-overlay')

  const bounds = L.latLngBounds([0, 0], [manifest.height, manifest.width])
  L.svgOverlay(element, bounds, { interactive: false }).addTo(map)
  return element
}

/* --------------------------------------------------------------- features */

/** Lookup by id, plus a forgiving name search over everything the author named. */
class FeatureIndex {
  constructor(features) {
    this.features = features
    this.byId = new Map(features.map((feature) => [feature.id, feature]))
    this.searchable = features
      .filter((feature) => feature.name)
      .map((feature) => ({ feature, haystack: normalise(feature.name) }))
  }

  get(id) {
    return this.byId.get(id)
  }

  search(query, limit = 40) {
    const needle = normalise(query)
    if (!needle) return []

    const starts = []
    const contains = []
    for (const entry of this.searchable) {
      const at = entry.haystack.indexOf(needle)
      if (at === 0) starts.push(entry.feature)
      else if (at > 0) contains.push(entry.feature)
      if (starts.length >= limit) break
    }
    return [...starts, ...contains].slice(0, limit)
  }
}

/** Fold case and strip accents so "Thrinakia" finds "Thrinákia". */
function normalise(value) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Map a clicked SVG node back to a feature. FMG names its shapes after the
 * thing they depict, so the element ids double as feature ids — except for
 * settlement labels and harbour anchors, which point back at their burg.
 */
function featureIdFor(element, root) {
  for (let node = element; node && node !== root; node = node.parentElement) {
    const id = node.id
    if (!id) continue
    if (/^(burg|marker|label|river)\d+$/.test(id)) return id

    const derived = id.match(/^(?:burgLabel|anchor)(\d+)$/)
    if (derived) return `burg${derived[1]}`
  }
  return null
}

function wirePopups(map, L, overlay, index) {
  overlay.addEventListener('click', (event) => {
    const id = featureIdFor(event.target, overlay)
    const feature = id && index.get(id)
    if (!feature) return

    event.stopPropagation()
    openFeature(map, L, feature)
  })
}

function openFeature(map, L, feature) {
  L.popup({ maxWidth: 380, autoPanPadding: [30, 60] })
    .setLatLng([feature.y, feature.x])
    .setContent(popupContent(feature))
    .openOn(map)
}

function popupContent(feature) {
  const wrapper = document.createElement('div')

  const name = document.createElement('h2')
  name.className = 'popup__name'
  name.textContent = feature.name || 'Unnamed'
  wrapper.append(name)

  const descriptors = [feature.icon, feature.detail || feature.kind].filter(Boolean)
  if (descriptors.length) {
    const kind = document.createElement('p')
    kind.className = 'popup__kind'
    kind.textContent = descriptors.join(' · ')
    wrapper.append(kind)
  }

  if (feature.note) {
    const body = document.createElement('div')
    body.className = 'popup__body'
    // The note is the author's own HTML, written in the generator's editor and
    // committed to this repository — same trust level as the rest of the site.
    body.innerHTML = feature.note
    for (const link of body.querySelectorAll('a[href]')) {
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
    }
    wrapper.append(body)
  }

  return wrapper
}

/* ----------------------------------------------------------------- search */

function wireSearch(root, map, L, index, manifest) {
  const input = root.querySelector('.mapview__search-input')
  const list = root.querySelector('.mapview__results')
  if (!input || !list) return

  let matches = []
  let active = -1

  const close = () => {
    list.hidden = true
    input.setAttribute('aria-expanded', 'false')
    active = -1
  }

  const choose = (feature) => {
    close()
    input.blur()
    map.flyTo([feature.y, feature.x], Math.max(map.getZoom(), manifest.nativeZoom + 1), { duration: 0.6 })
    openFeature(map, L, feature)
  }

  const render = () => {
    list.textContent = ''
    if (!matches.length) {
      const empty = document.createElement('li')
      empty.className = 'empty'
      empty.textContent = 'Nothing found'
      list.append(empty)
      return
    }

    matches.forEach((feature, position) => {
      const item = document.createElement('li')
      item.setAttribute('role', 'option')
      item.setAttribute('aria-selected', String(position === active))

      const button = document.createElement('button')
      button.type = 'button'
      button.append(Object.assign(document.createElement('span'), { textContent: feature.name }))
      button.append(
        Object.assign(document.createElement('span'), { className: 'kind', textContent: feature.detail || feature.kind }),
      )
      button.addEventListener('click', () => choose(feature))

      item.append(button)
      list.append(item)
    })
  }

  input.addEventListener('input', () => {
    matches = index.search(input.value)
    active = -1
    if (!input.value.trim()) return close()
    list.hidden = false
    input.setAttribute('aria-expanded', 'true')
    render()
  })

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') return close()
    if (!matches.length || list.hidden) return

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      active = (active + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length
      render()
      list.children[active]?.scrollIntoView({ block: 'nearest' })
    } else if (event.key === 'Enter') {
      event.preventDefault()
      choose(matches[Math.max(active, 0)])
    }
  })

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.mapview__search')) close()
  })

  // Leaflet binds keyboard and drag to the map; typing or scrolling the results
  // that sit over it must not pan or zoom it.
  L.DomEvent.disableClickPropagation(input.closest('.mapview__search'))
  L.DomEvent.disableScrollPropagation(list)
}

/* ----------------------------------------------------------- panels & UI */

function wireLayerToggles(root, L, overlay) {
  const panel = root.querySelector('.mapview__layers')
  const toggle = root.querySelector('.mapview__layers-toggle')
  if (!panel || !toggle) return

  toggle.addEventListener('click', () => {
    const open = panel.hidden
    panel.hidden = !open
    toggle.setAttribute('aria-expanded', String(open))
  })

  for (const checkbox of panel.querySelectorAll('input[data-layer]')) {
    const group = overlay.querySelector(`#${checkbox.dataset.layer}`)
    if (!group) {
      checkbox.closest('label').hidden = true
      continue
    }

    // The generator writes `style="display: inline"` onto some layers when it
    // saves, and an inline style outranks any rule this page could add, so the
    // toggle has to work on the element's own style and put back whatever was
    // there before.
    const original = group.style.display
    checkbox.addEventListener('change', () => {
      group.style.display = checkbox.checked ? original : 'none'
    })
  }

  L.DomEvent.disableClickPropagation(panel)
  L.DomEvent.disableClickPropagation(toggle)
}

function buildLegend(root, L, legend, open) {
  if (!legend?.items?.length) return

  const panel = root.querySelector('.mapview__legend')
  const body = root.querySelector('.mapview__legend-body')
  const toggle = root.querySelector('.mapview__legend-toggle')
  const title = root.querySelector('.mapview__legend-title')
  if (!panel || !body || !toggle) return

  if (title) title.textContent = legend.title || 'Legend'

  for (const item of legend.items) {
    const entry = document.createElement('li')
    const swatch = document.createElement('span')
    swatch.className = 'mapview__swatch'
    swatch.style.background = item.color
    entry.append(swatch, document.createTextNode(item.name))
    body.append(entry)
  }

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open))
    body.hidden = !open
  }

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'))
  setOpen(open)

  panel.hidden = false
  L.DomEvent.disableClickPropagation(panel)
}

/** A scale bar in the map's own units, recomputed as the zoom changes. */
function addScaleBar(map, L, manifest) {
  const control = L.control({ position: 'bottomleft' })

  control.onAdd = () => {
    const element = L.DomUtil.create('div', 'mapview__scale')
    const rule = L.DomUtil.create('div', 'mapview__scale-rule', element)
    const label = L.DomUtil.create('div', '', element)

    const update = () => {
      const pixelsPerUnit = 2 ** (map.getZoom() - manifest.nativeZoom)
      const distanceAt200px = (200 / pixelsPerUnit) * manifest.unitsToDistance
      const rounded = niceNumber(distanceAt200px)
      const width = (rounded / manifest.unitsToDistance) * pixelsPerUnit

      rule.style.width = `${width}px`
      label.textContent = `${rounded.toLocaleString()} ${manifest.distanceUnit}`
    }

    map.on('zoom zoomend', update)
    update()
    return element
  }

  control.addTo(map)
}

/** Round down to 1, 2 or 5 times a power of ten, the usual scale-bar steps. */
function niceNumber(value) {
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const normalised = value / magnitude
  const step = normalised >= 5 ? 5 : normalised >= 2 ? 2 : 1
  return step * magnitude
}

/* ------------------------------------------------------------------- tour */

/**
 * A guided walk, authored in `{base}/tour.json`. Either a flat list of stops or,
 * for a longer journey, chapters:
 *   { name, defaultZoom, flyDuration,
 *     sections: [{ id, title, stops: [{ feature: "<id>", zoom? }, ...] }, ...] }
 * A stop names a feature already on the map, so its position and note come for
 * free; its `label` is the picker's text (the feature's own name if omitted), and
 * any other key (e.g. `$comment`) is an editor annotation and is ignored.
 * `sectionId` scopes the tour to one chapter — an embed's `data-tour-section`, or
 * `?section=` on the standalone page — so a book's page walks just that book.
 * Absent or unresolvable, there is simply no tour.
 */
async function loadTour(base, index, sectionId) {
  const data = await fetch(`${base}/tour.json`)
    .then((response) => (response.ok ? response.json() : null))
    .catch(() => null)
  if (!data) return null

  // One shape downstream: a list of sections. A flat `stops` list is one chapter.
  let sections = Array.isArray(data.sections) ? data.sections : data.stops ? [{ id: 'all', title: data.name, stops: data.stops }] : []
  if (sectionId) sections = sections.filter((section) => section.id === sectionId)

  // Resolve stops to features, drop the unresolvable, and record each chapter's
  // span in the flattened list so the control can label progress and jump to it.
  const stops = []
  const chapters = []
  for (const section of sections) {
    const start = stops.length
    for (const stop of section.stops ?? []) {
      const feature = index.get(stop.feature)
      if (feature) stops.push({ ...stop, feature })
    }
    if (stops.length > start) chapters.push({ id: section.id, title: section.title || 'Tour', start, end: stops.length - 1 })
  }
  return stops.length ? { data, stops, chapters } : null
}

/**
 * Bottom-left navigation: the 2×2 square — zoom out / in on top, previous / next
 * stop below. A tour also gets a compact picker in the top-right chrome (by the
 * Layers button) that jumps to any stop, grouped by chapter. Without a tour, the
 * plain zoom control. Stepping flies the camera to the stop and opens its note.
 */
function addNavControl(map, L, tour, manifest, root) {
  if (!tour) {
    L.control.zoom({ position: 'bottomleft' }).addTo(map)
    return
  }

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const defaultZoom = Math.min(tour.data.defaultZoom ?? manifest.nativeZoom + 1, manifest.maxZoom + 1)
  // Seconds for the glide between stops; snappy by default, tunable per tour.
  const flyDuration = tour.data.flyDuration ?? 0.6
  const el = {}
  let current = -1

  const sync = () => {
    if (el.prev) el.prev.disabled = current <= 0
    if (el.next) {
      el.next.disabled = current >= tour.stops.length - 1
      el.next.setAttribute('aria-label', current < 0 ? 'Start the tour' : 'Next stop')
    }
    if (el.select && current >= 0) el.select.value = String(current)
  }

  const go = (i) => {
    current = Math.max(0, Math.min(tour.stops.length - 1, i))
    const stop = tour.stops[current]
    const target = [stop.feature.y, stop.feature.x]
    const zoom = stop.zoom ?? defaultZoom
    map.closePopup()
    let opened = false
    const open = () => {
      if (opened) return
      opened = true
      openFeature(map, L, stop.feature)
    }
    if (reduce) {
      map.setView(target, zoom, { animate: false })
      open()
    } else {
      map.flyTo(target, zoom, { duration: flyDuration })
      map.once('moveend', open)
      // A backgrounded tab suspends the frames flyTo rides on, delaying its
      // moveend, so open the note on a timer too (deduped) as a safety net.
      setTimeout(open, flyDuration * 1000 + 250)
    }
    sync()
  }

  const control = L.control({ position: 'bottomleft' })
  control.onAdd = () => {
    const grid = L.DomUtil.create('div', 'mapview__nav')
    grid.innerHTML =
      `<button class="mapview__nav-btn" data-act="out" type="button" aria-label="Zoom out">−</button>` +
      `<button class="mapview__nav-btn" data-act="in" type="button" aria-label="Zoom in">+</button>` +
      `<button class="mapview__nav-btn mapview__nav-btn--step" data-act="prev" type="button" aria-label="Previous stop">‹</button>` +
      `<button class="mapview__nav-btn mapview__nav-btn--step" data-act="next" type="button" aria-label="Next stop">›</button>`
    el.prev = grid.querySelector('[data-act="prev"]')
    el.next = grid.querySelector('[data-act="next"]')
    grid.addEventListener('click', (event) => {
      const act = event.target.closest('button')?.dataset.act
      if (act === 'in') map.zoomIn()
      else if (act === 'out') map.zoomOut()
      else if (act === 'prev') go(current - 1)
      else if (act === 'next') go(current < 0 ? 0 : current + 1)
    })
    L.DomEvent.disableClickPropagation(grid)
    return grid
  }
  control.addTo(map)

  buildTourPicker(root, L, tour, el, go)
  sync()
}

/**
 * A compact <select> in the top-right chrome, next to Layers: every stop, grouped
 * by chapter (book) when there's more than one, so a reader can jump to a whole
 * book or a single point within it. A stop's `label` (or its feature name) is the
 * option text; stepping keeps the selection in sync.
 */
function buildTourPicker(root, L, tour, el, go) {
  const layers = root.querySelector('.mapview__layers-toggle')
  if (!layers) return

  const select = document.createElement('select')
  select.className = 'mapview__tour-select'
  select.setAttribute('aria-label', 'Jump to a stop on the voyage')

  const placeholder = new Option('Tour…', '')
  placeholder.disabled = true
  placeholder.selected = true
  select.append(placeholder)

  const multi = tour.chapters.length > 1
  for (const chapter of tour.chapters) {
    const group = multi ? document.createElement('optgroup') : select
    if (multi) group.label = chapter.title
    for (let i = chapter.start; i <= chapter.end; i += 1) {
      const stop = tour.stops[i]
      group.append(new Option(stop.label || stop.feature.name, String(i)))
    }
    if (multi) select.append(group)
  }

  select.addEventListener('change', () => {
    if (select.value !== '') go(Number(select.value))
  })
  L.DomEvent.disableClickPropagation(select)

  // Sit it just before Layers. The full-window page groups the top-right controls
  // in a `tools` wrapper; the compact embed has none, so pin it to the right edge.
  if (!root.querySelector('.mapview__tools')) select.style.marginLeft = 'auto'
  layers.parentNode.insertBefore(select, layers)
  el.select = select
}

/* ------------------------------------------------------------ deep links */

/**
 * Accepts the hash this viewer writes (`#y,x,zoom`, standalone only) and the
 * generator's own query/data parameters, so links published against
 * /maps/interactive/?burg=24&scale=3 keep working when pointed here. The opening
 * note only springs open on a roomy frame — on a small embed it would cover the
 * map, so there the view just centres on the place.
 */
function restoreView({ root, map, L, index, manifest, param, standalone, roomy }) {
  const bounds = L.latLngBounds([0, 0], [manifest.height, manifest.width])
  // The opening view snaps into place — there is nothing to animate from, and an
  // animated first setView can be dropped if it lands mid zoom-animation.
  const snap = { animate: false }

  if (standalone) {
    const hash = location.hash.slice(1).split(',').map(Number)
    if (hash.length === 3 && hash.every(Number.isFinite)) {
      map.setView([hash[0], hash[1]], hash[2], snap)
      return
    }
  }

  const scale = Number(param('scale'))
  const zoom = Number.isFinite(scale) && scale > 0 ? manifest.nativeZoom + Math.log2(scale) : manifest.nativeZoom

  for (const kind of ['burg', 'marker', 'label', 'river']) {
    const id = param(kind)
    if (id === null || id === undefined || id === '') continue

    const feature = index.get(`${kind}${id}`)
    if (!feature) continue

    map.setView([feature.y, feature.x], Math.min(zoom, manifest.maxZoom + 1), snap)
    if (roomy) openFeature(map, L, feature)
    return
  }

  const query = param('q')
  if (query) {
    const [first] = index.search(query, 1)
    if (first) {
      map.setView([first.y, first.x], Math.min(zoom, manifest.maxZoom + 1), snap)
      if (roomy) openFeature(map, L, first)
      return
    }
  }

  // Nothing deep-linked: frame the whole map.
  map.fitBounds(bounds, snap)
}

function trackViewInHash(map) {
  let scheduled = 0
  const write = () => {
    const centre = map.getCenter()
    const hash = `#${centre.lat.toFixed(1)},${centre.lng.toFixed(1)},${map.getZoom()}`
    history.replaceState(null, '', hash)
  }

  map.on('moveend zoomend', () => {
    cancelAnimationFrame(scheduled)
    scheduled = requestAnimationFrame(write)
  })
}

/* ---------------------------------------------------------------- helpers */

function applyTitles(root, manifest, name) {
  const title = manifest.title || manifest.mapName || 'Map'
  document.title = `${title} — Public Works Book Club`

  const titleEl = root.querySelector('.mapview__title')
  if (titleEl) titleEl.textContent = title

  const subtitleEl = root.querySelector('.mapview__subtitle')
  if (subtitleEl) {
    subtitleEl.textContent = [manifest.mapName, manifest.savedOn && `updated ${manifest.savedOn}`].filter(Boolean).join(' · ')
  }

  const edit = root.querySelector('.mapview__edit')
  if (edit) {
    edit.href = `${MAPS_ROOT}/interactive/?maplink=${encodeURIComponent(`${location.origin}/${manifest.source.replace(/^static\//, '')}`)}`
    edit.title = `Open ${name}.map in the full editor`
  }
}

async function fetchJson(url) {
  const response = await expectOk(await fetch(url))
  return response.json()
}

function expectOk(response) {
  if (!response.ok) throw new Error(`${response.status} for ${new URL(response.url).pathname}`)
  return response
}

function ensureStylesheet(href) {
  if (document.querySelector(`link[data-mapview-css="${href}"]`)) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  link.setAttribute('data-mapview-css', href)
  document.head.append(link)
}

/** Load Leaflet's UMD build once; it publishes the global `L` the rest expects. */
function ensureScript(src) {
  if (window.L) return Promise.resolve()
  const existing = document.querySelector('script[data-mapview-js]')
  if (existing?._mapviewPromise) return existing._mapviewPromise

  const loader = document.createElement('script')
  loader.src = src
  loader.setAttribute('data-mapview-js', '')
  const promise = new Promise((resolve, reject) => {
    loader.addEventListener('load', () => resolve())
    loader.addEventListener('error', () => reject(new Error(`failed to load ${src}`)))
  })
  loader._mapviewPromise = promise
  document.head.append(loader)
  return promise
}

function showStatus(root, message, isError = false) {
  const statusEl = root.querySelector('.mapview__status')
  if (!statusEl) return
  statusEl.hidden = !message
  statusEl.classList.toggle('mapview__status--error', isError)
  if (message) statusEl.textContent = message
}
