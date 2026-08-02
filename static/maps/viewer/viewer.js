/**
 * A fast reader for maps exported by tools/map-export.
 *
 * The generator at /maps/interactive/ stays the place to edit a map, but it
 * costs a 20 MB project file and a 46 MB application to open one. This viewer
 * reads the exported form instead: a WebP tile pyramid for the painted terrain,
 * one small SVG for the things worth clicking, and a JSON index of everything
 * the author annotated.
 *
 * Which map to show comes from `?map=<name>`, defaulting to the Argonautica.
 */

const DEFAULT_MAP = 'argonautica'
const MAPS_ROOT = '/maps'

const statusEl = document.getElementById('status')

main().catch((error) => {
  console.error(error)
  showStatus(`Could not load the map: ${error.message}`, true)
})

async function main() {
  const parameters = new URLSearchParams(location.search)
  const name = (parameters.get('map') || DEFAULT_MAP).replace(/[^\w-]/g, '')
  const base = `${MAPS_ROOT}/${name}`

  const [manifest, overlaySource] = await Promise.all([
    fetchJson(`${base}/map.json`),
    fetch(`${base}/overlay.svg`)
      .then(expectOk)
      .then((response) => response.text()),
  ])

  if (manifest.fontsCss) loadStylesheet(`${base}/${manifest.fontsCss}`)
  applyTitles(manifest, name)

  const map = createMap(manifest, base)
  const overlay = addOverlay(map, manifest, overlaySource)

  const index = new FeatureIndex(manifest.features)
  wirePopups(map, overlay, index)
  wireSearch(map, index, manifest)
  wireLayerToggles(overlay)
  buildLegend(manifest.legend)
  addScaleBar(map, manifest)

  restoreView(map, manifest, index, parameters)
  trackViewInHash(map, manifest)

  document.documentElement.classList.remove('loading')
  showStatus(null)
}

/* ------------------------------------------------------------------ setup */

/**
 * FMG map units are the coordinate system throughout: a feature at (x, y) in
 * the project is at `L.latLng(y, x)` here. The transformation below makes
 * Leaflet zoom `nativeZoom` the level at which one map unit is one pixel, which
 * is also how the tile pyramid is numbered.
 */
function createMap(manifest, base) {
  const unit = 2 ** -manifest.nativeZoom
  const crs = L.extend({}, L.CRS.Simple, { transformation: new L.Transformation(unit, 0, unit, 0) })
  const bounds = L.latLngBounds([0, 0], [manifest.height, manifest.width])

  const map = L.map('map', {
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
    zoomControl: false,
    attributionControl: true,
  })

  L.control.zoom({ position: 'bottomleft' }).addTo(map)
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

  map.fitBounds(bounds)
  return map
}

function addOverlay(map, manifest, source) {
  const parsed = new DOMParser().parseFromString(source, 'image/svg+xml')
  const error = parsed.querySelector('parsererror')
  if (error) throw new Error('the map overlay is not valid SVG')

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
    this.searchable = features.filter((feature) => feature.name).map((feature) => ({ feature, haystack: normalise(feature.name) }))
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
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
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

function wirePopups(map, overlay, index) {
  overlay.addEventListener('click', (event) => {
    const id = featureIdFor(event.target, overlay)
    const feature = id && index.get(id)
    if (!feature) return

    event.stopPropagation()
    openFeature(map, feature)
  })
}

function openFeature(map, feature) {
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

function wireSearch(map, index, manifest) {
  const input = document.getElementById('search-input')
  const list = document.getElementById('search-results')
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
    openFeature(map, feature)
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
      button.append(Object.assign(document.createElement('span'), { className: 'kind', textContent: feature.detail || feature.kind }))
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
    if (!event.target.closest('.search')) close()
  })

  // Leaflet binds keyboard shortcuts to the map; typing in the box must not pan it.
  L.DomEvent.disableClickPropagation(input.closest('.search'))
  L.DomEvent.disableScrollPropagation(list)
}

/* ----------------------------------------------------------- panels & UI */

function wireLayerToggles(overlay) {
  const panel = document.getElementById('layers-panel')
  const toggle = document.getElementById('layers-toggle')

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

function buildLegend(legend) {
  if (!legend?.items?.length) return

  const panel = document.getElementById('legend')
  const body = document.getElementById('legend-body')
  const toggle = document.getElementById('legend-toggle')

  document.getElementById('legend-title').textContent = legend.title

  for (const item of legend.items) {
    const entry = document.createElement('li')
    const swatch = document.createElement('span')
    swatch.className = 'swatch'
    swatch.style.background = item.color
    entry.append(swatch, document.createTextNode(item.name))
    body.append(entry)
  }

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open))
    body.hidden = !open
  }

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'))

  // On a phone a twelve-culture key would cover a third of the map, so it
  // starts as a heading the reader can open.
  setOpen(!window.matchMedia('(max-width: 40rem)').matches)

  panel.hidden = false
  L.DomEvent.disableClickPropagation(panel)
}

/** A scale bar in the map's own units, recomputed as the zoom changes. */
function addScaleBar(map, manifest) {
  const control = L.control({ position: 'bottomleft' })

  control.onAdd = () => {
    const element = L.DomUtil.create('div', 'scale-bar')
    const rule = L.DomUtil.create('div', 'scale-bar__rule', element)
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

/* ------------------------------------------------------------ deep links */

/**
 * Accepts both the hash this viewer writes (`#y,x,zoom`) and the query
 * parameters the generator uses, so links already published against
 * /maps/interactive/?burg=24&scale=3 keep working when pointed here.
 */
function restoreView(map, manifest, index, parameters) {
  const hash = location.hash.slice(1).split(',').map(Number)
  if (hash.length === 3 && hash.every(Number.isFinite)) {
    map.setView([hash[0], hash[1]], hash[2])
    return
  }

  const scale = Number(parameters.get('scale'))
  const zoom = Number.isFinite(scale) && scale > 0 ? manifest.nativeZoom + Math.log2(scale) : manifest.nativeZoom

  for (const kind of ['burg', 'marker', 'label', 'river']) {
    const id = parameters.get(kind)
    if (id === null) continue

    const feature = index.get(`${kind}${id}`)
    if (!feature) continue

    map.setView([feature.y, feature.x], Math.min(zoom, manifest.maxZoom + 1))
    openFeature(map, feature)
    return
  }

  const query = parameters.get('q')
  if (query) {
    const [first] = index.search(query, 1)
    if (first) {
      map.setView([first.y, first.x], Math.min(zoom, manifest.maxZoom + 1))
      openFeature(map, first)
    }
  }
}

function trackViewInHash(map, manifest) {
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

function applyTitles(manifest, name) {
  const title = manifest.title || manifest.mapName || 'Map'
  document.title = `${title} — Public Works Book Club`
  document.getElementById('map-title').textContent = title

  const subtitle = [manifest.mapName, manifest.savedOn && `updated ${manifest.savedOn}`].filter(Boolean).join(' · ')
  document.getElementById('map-subtitle').textContent = subtitle

  const edit = document.getElementById('edit-link')
  edit.href = `${MAPS_ROOT}/interactive/?maplink=${encodeURIComponent(`${location.origin}/${manifest.source.replace(/^static\//, '')}`)}`
  edit.title = `Open ${name}.map in the full editor`
}

async function fetchJson(url) {
  const response = await expectOk(await fetch(url))
  return response.json()
}

function expectOk(response) {
  if (!response.ok) throw new Error(`${response.status} for ${new URL(response.url).pathname}`)
  return response
}

function loadStylesheet(href) {
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  document.head.append(link)
}

function showStatus(message, isError = false) {
  statusEl.hidden = !message
  statusEl.classList.toggle('status--error', isError)
  if (message) statusEl.textContent = message
}
