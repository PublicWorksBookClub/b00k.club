/**
 * <euclid-sketch> — the whole thing as one custom element.
 *
 * Everything lives in a shadow root, so it can be dropped into a page of prose
 * without the page's styles reaching in or its own reaching out. There is no
 * iframe, which matters: a site with a strict content policy can forbid frames
 * and still embed this.
 *
 *   <euclid-sketch height="480" tools="I.1,I.2" src="/euclid/sketches/I.2.json">
 *   </euclid-sketch>
 *
 * Attributes
 *   height     CSS height of the figure (default 460px)
 *   panel      "steps" (default) or "none" to hide the side panel
 *   tools      which propositions start in the toolbox, e.g. "I.1,I.2,I.3"
 *   src        URL of a saved sketch to open
 *   readonly   no drawing; the figure can still be dragged through and read
 *   remember   keep the toolbox in this browser between visits
 *   use-hash   read and write the sketch in the page's URL fragment
 */

import { createSketch } from './app.js'
import { createUI } from './ui.js'
import { attachInteractions } from './interactions.js'
import { render as paint, resizeCanvas } from './renderer.js'
import { PROPOSITIONS } from './propositions.js'
import * as C from './camera.js'
import * as storage from './storage.js'

const DEFAULT_HEIGHT = '460px'

const ROMAN = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10 }

/** `through="I.3"` (or `through="3"`) — how far into the book the reader has got. */
function throughNumber(value) {
  if (!value) return null
  const tail = String(value).replace(/^I\./i, '').trim()
  if (/^\d+$/.test(tail)) return Number(tail)
  return ROMAN[tail.toUpperCase()] || null
}

function resolveToolIds(attribute) {
  if (!attribute) return null
  const wanted = attribute
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (!wanted.length) return null
  const ids = []
  for (const name of wanted) {
    const found = PROPOSITIONS.find((p) => p.id === name || p.ref === name || p.ref === name.replace(/^I\.?/i, 'I.'))
    if (found) ids.push(found.id)
  }
  return ids
}

export class EuclidSketchElement extends HTMLElement {
  static observedAttributes = ['height', 'readonly']

  connectedCallback() {
    if (this.shadowRoot) return
    const shadow = this.attachShadow({ mode: 'open' })
    this.style.height = this.style.height || this.getAttribute('height') || DEFAULT_HEIGHT
    if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0')

    const through = throughNumber(this.getAttribute('through'))
    const app = createSketch({
      readonly: this.hasAttribute('readonly'),
      // Reading along in the text, you only have what has been proved so far.
      toolIds: through
        ? PROPOSITIONS.filter((p) => ROMAN[p.ref.replace('I.', '')] <= through || Number(p.ref.replace('I.', '')) <= through).map(
            (p) => p.id,
          )
        : resolveToolIds(this.getAttribute('tools')),
    })
    this.sketch = app

    const ui = createUI(shadow, app, {
      onFit: () => this.fit(),
      appUrl: this.getAttribute('app-url') || '/euclid/',
      // The book is open by default where there is room for it, shut where the
      // figure is a figure in someone's article.
      sidebarOpen: this.getAttribute('sidebar') === 'open' || (this.hasAttribute('use-hash') && this.getAttribute('sidebar') !== 'closed'),
      throughN: throughNumber(this.getAttribute('through')),
      // The standalone page owns the fragment; anything else is an embed and
      // gets a way out to the full sketchpad.
      embedded: !this.hasAttribute('use-hash'),
    })
    this._ui = ui
    const interactions = attachInteractions(ui.canvas, app, ui.size, {
      onMenu: (at) => ui.openNavMenu(at),
      onNavigate: (id) => ui.navigate(id),
    })
    this._interactions = interactions
    this.addEventListener('keydown', interactions.onKeyDown)
    this.addEventListener('keyup', interactions.onKeyUp)
    this.addEventListener('blur', interactions.onBlur)

    let frame = null
    const schedule = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = null
        this._paint()
        ui.render()
      })
    }
    this._unsubscribe = app.subscribe(schedule)
    this._schedule = schedule

    // Watch the stage, not just the host: hiding the panel changes the drawing
    // surface without changing the element, and the canvas would stretch.
    this._observer = new ResizeObserver(schedule)
    this._observer.observe(this)
    this._observer.observe(ui.stage)

    this._restore().then(() => {
      ui.render(true)
      this.fit()
      this.dispatchEvent(new CustomEvent('euclid:ready', { detail: { sketch: app }, bubbles: true }))
    })
  }

  disconnectedCallback() {
    this._unsubscribe && this._unsubscribe()
    this._observer && this._observer.disconnect()
    this._interactions && this._interactions.destroy()
    this.removeEventListener('keydown', this._interactions?.onKeyDown)
  }

  attributeChangedCallback(name, _old, value) {
    if (name === 'height' && value) this.style.height = value
    if (name === 'readonly' && this.sketch) this.sketch.state.readonly = this.hasAttribute('readonly')
    this._schedule && this._schedule()
  }

  /** Load whichever source the element was given, in order of specificity. */
  async _restore() {
    const app = this.sketch
    if (this.hasAttribute('remember')) {
      const saved = storage.loadToolbox()
      if (saved) for (const tool of saved) app.addTool(tool)
      // Only when the toolbox itself changes — this fires on every frame of a drag.
      let known = app.tools.map((t) => t.id).join()
      app.subscribe(() => {
        const now = app.tools.map((t) => t.id).join()
        if (now === known) return
        known = now
        storage.saveToolbox(app.tools)
      })
    }
    if (this.hasAttribute('use-hash')) {
      const match = /(?:^|[#&])s=([^&]+)/.exec(location.hash)
      if (match) {
        try {
          app.load(storage.decodeSketch(match[1]))
          return
        } catch {
          /* fall through to the other sources */
        }
      }
    }
    const inline = this.querySelector('script[type="application/json"]')
    if (inline && inline.textContent.trim()) {
      try {
        app.load(inline.textContent)
        return
      } catch (error) {
        app.state.notice = `The figure in this page could not be read: ${error.message}`
      }
    }
    const src = this.getAttribute('src')
    if (src) {
      try {
        const response = await fetch(src)
        if (!response.ok) throw new Error(`${response.status}`)
        app.load(await response.text())
        return
      } catch (error) {
        app.state.notice = `That figure could not be fetched: ${error.message}`
      }
    }
    const walk = this.getAttribute('proposition')
    if (walk) {
      const prop = PROPOSITIONS.find((p) => p.ref === walk || p.id === walk)
      if (prop) {
        app.walkProposition(prop.id)
        return
      }
    }
    // Nothing given: two points, so there is something to draw between.
    if (!app.doc.steps.length && !this.hasAttribute('empty')) {
      app.startingPoints([
        { x: -90, y: 40 },
        { x: 90, y: 40 },
      ])
    }
  }

  _paint() {
    const ui = this._ui
    if (!ui) return
    const { w, h } = ui.size()
    const dpr = Math.min(window.devicePixelRatio || 1, 3)
    resizeCanvas(ui.canvas, w, h, dpr)
    const s = this.sketch.state
    paint(ui.canvas, this.sketch.scene, {
      w,
      h,
      dpr,
      cam: this.sketch.camera,
      hover: s.hover,
      selection: s.selection,
      picked: s.definition ? [...s.definition.inputs, ...s.definition.outputs] : s.picked,
      pending: s.pending,
      cursor: s.cursor,
      snap: s.snap,
      choice: s.choice ? this.sketch.choiceOptions() : null,
    })
  }

  /** Frame the figure. */
  fit() {
    const ui = this._ui
    if (!ui) return
    const { w, h } = ui.size()
    const bounds = this.sketch.scene.bounds()
    if (bounds) C.fitTo(this.sketch.camera, bounds, w, h)
    this.sketch.changed()
  }

  load(source) {
    this.sketch.load(source)
    this.fit()
  }

  serialize() {
    return this.sketch.serialize()
  }
}

export function defineEuclidSketch(tag = 'euclid-sketch') {
  if (typeof customElements === 'undefined') return
  if (!customElements.get(tag)) customElements.define(tag, EuclidSketchElement)
}
