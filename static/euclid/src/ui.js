/**
 * The chrome: toolbar, step list, toolbox, scrubber, and the dialog for
 * turning a finished construction into a new tool.
 *
 * The canvas is drawn on every change; the surrounding DOM is rebuilt only when
 * something structural moves, so dragging a point does not rebuild the panel
 * sixty times a second.
 */

import { PRIMITIVES } from './app.js'
import { PROPOSITIONS } from './propositions.js'
import { BOOK_I, SOURCE } from './book1.js'
import { DEFINITION_FIGURES, PROPOSITION_LINES } from './book1-figures.js'
import { figureCanvas } from './figures.js'
import { PALETTE } from './renderer.js'
import { STYLES } from './styles.js'
import * as storage from './storage.js'
import * as C from './camera.js'
import { NAVIGATION } from './interactions.js'

const ICONS = {
  arrow: '<path d="M5.6 3.2l12 7.5-5.5 1.2-2.2 5.4z" fill="currentColor" stroke="none"/>',
  point: '<circle cx="12" cy="12" r="3.4" fill="currentColor" stroke="none"/>',
  segment:
    '<path d="M6 17.5L18 6.5"/><circle cx="6" cy="17.5" r="2.1" fill="currentColor" stroke="none"/><circle cx="18" cy="6.5" r="2.1" fill="currentColor" stroke="none"/>',
  ray: '<path d="M6 18L20.5 3.5"/><circle cx="6" cy="18" r="2.1" fill="currentColor" stroke="none"/><circle cx="13" cy="11" r="2.1" fill="currentColor" stroke="none"/>',
  line: '<path d="M3.5 20.5L20.5 3.5"/><circle cx="9" cy="15" r="2.1" fill="currentColor" stroke="none"/><circle cx="15" cy="9" r="2.1" fill="currentColor" stroke="none"/>',
  circle: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none"/>',
  undo: '<path d="M4.5 9.5h9a4.75 4.75 0 010 9.5H8"/><path d="M8.2 5.2L3.9 9.5l4.3 4.3"/>',
  redo: '<path d="M19.5 9.5h-9a4.75 4.75 0 000 9.5H16"/><path d="M15.8 5.2l4.3 4.3-4.3 4.3"/>',
  fit: '<path d="M4 9.5V4h5.5M20 9.5V4h-5.5M4 14.5V20h5.5M20 14.5V20h-5.5"/>',
  book: '<path d="M12 6.2C10.6 5 8.8 4.4 6 4.4v13c2.8 0 4.6.6 6 1.8 1.4-1.2 3.2-1.8 6-1.8v-13c-2.8 0-4.6.6-6 1.8z"/><path d="M12 6.2V19"/>',
  more: '<circle cx="5.5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="18.5" cy="12" r="1.5" fill="currentColor" stroke="none"/>',
  open: '<path d="M14 4h6v6"/><path d="M20 4l-8.5 8.5"/><path d="M18 14v5a1.5 1.5 0 01-1.5 1.5H5A1.5 1.5 0 013.5 19V7.5A1.5 1.5 0 015 6h5"/>',
  sidebar: '<rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><path d="M9.5 4.5v15"/>',
  panel: '<rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><path d="M14.5 4.5v15"/>',
  trash: '<path d="M4.5 6.5h15"/><path d="M9 6.5V4.5h6v2"/><path d="M6.5 6.5l1 13.5h9l1-13.5"/><path d="M10 10v6.5M14 10v6.5"/>',
}

function el(tag, className, props = {}) {
  const node = document.createElement(tag)
  if (className) node.className = className
  Object.assign(node, props)
  return node
}

function icon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', '1.6')
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('stroke-linejoin', 'round')
  svg.setAttribute('aria-hidden', 'true')
  svg.innerHTML = ICONS[name] || ''
  return svg
}

function button(spec) {
  const node = el('button', `btn ${spec.class || ''}`.trim(), { type: 'button' })
  if (spec.title) node.title = spec.title
  if (spec.icon) node.append(icon(spec.icon))
  if (spec.abbr) node.append(el('span', 'abbr', { textContent: spec.abbr }))
  if (spec.ref) node.append(el('span', 'ref', { textContent: spec.ref }))
  if (spec.text) node.append(el('span', 'label', { textContent: spec.text }))
  if (spec.pressed !== undefined) node.setAttribute('aria-pressed', String(!!spec.pressed))
  if (spec.disabled) node.disabled = true
  node.setAttribute('aria-label', spec.title || spec.text || spec.abbr || '')
  if (spec.onClick) node.addEventListener('click', spec.onClick)
  return node
}

export function createUI(root, app, options = {}) {
  const ui = {
    tab: 'steps',
    menu: false,
    sidebar: !!options.sidebarOpen,
    nav: null,
    panel: true,
    open: { propositions: true, definitions: false, postulates: false, axioms: false, symbols: false },
    draft: { name: '', ref: '', abbr: '', summary: '' },
  }
  let chromeSignature = null
  let sidebarSignature = null

  root.replaceChildren(el('style', null, { textContent: STYLES }))

  const frame = el('div', 'frame')
  const bar = el('div', 'bar')
  const body = el('div', 'body')
  const sidebar = el('nav', 'sidebar')
  const stage = el('div', 'stage')
  const canvas = el('canvas', 'sheet')
  const hint = el('div', 'hint')
  const panel = el('aside', 'panel')
  const foot = el('div', 'foot')
  const floating = el('div', 'floating')

  stage.append(canvas, hint)
  body.append(sidebar, stage, panel)
  frame.append(bar, body, foot, floating)
  root.append(frame)

  const size = () => ({ w: canvas.clientWidth || 1, h: canvas.clientHeight || 1 })

  /**
   * A link always points at the sketchpad's own page, never at the page the
   * figure happens to be embedded in — an article does not read the fragment,
   * so a link to it would drop the construction on the floor.
   */
  const shareUrl = () => {
    const base = new URL(options.appUrl || '/euclid/', location.href)
    base.hash = `s=${storage.encodeSketch(app.serialize())}`
    return base.href
  }

  /* ---------------------------------------------------------------- */

  /**
   * What the sidebar depends on. It is deliberately blind to the figure: the
   * book does not change as a construction is scrubbed through, and rebuilding
   * it would throw away wherever the reader had scrolled to.
   */
  function sidebarState() {
    return JSON.stringify([ui.sidebar, ui.open, app.tools.map((t) => t.id), options.throughN || null])
  }

  function chromeState() {
    const s = app.state
    const def = s.definition
    return JSON.stringify([
      app.doc.steps.length,
      app.tools.map((t) => t.id),
      s.mode,
      s.holdSelect,
      s.activeTool,
      s.picked,
      [...s.selection],
      s.upTo === Infinity ? -1 : s.upTo,
      def ? [def.stage, def.inputs, def.outputs, def.error, def.missing] : null,
      s.notice,
      app.canUndo,
      app.canRedo,
      ui.tab,
      ui.menu,
      ui.nav ? [ui.nav.x, ui.nav.y] : null,
      ui.sidebar,
      ui.panel,
      // How the selection is drawn, so the palette shows the colour it now has.
      [...s.selection].map((id) => {
        const o = app.scene.get(id)
        return o ? `${o.color || ''}${o.dash ? '-' : ''}` : ''
      }),
      app.doc.steps.map((step) => (step.op === 'macro' ? !!step.expanded : 0)),
    ])
  }

  function render(force = false) {
    const chrome = chromeState()
    if (force || chrome !== chromeSignature) {
      chromeSignature = chrome
      renderBar()
      renderPanel()
      renderFoot()
      renderFloating()
    }
    const book = sidebarState()
    if (book !== sidebarSignature) {
      sidebarSignature = book
      renderSidebar()
    }
    renderHint()
    // The cursor follows the mode the pointer is actually in, so holding
    // option shows the arrow.
    stage.dataset.mode = app.workingMode
  }

  function renderHint() {
    const text = app.hint()
    hint.textContent = text || ''
    const isTrouble = (!!app.state.notice && app.state.noticeKind !== 'info') || !!(app.state.definition && app.state.definition.error)
    hint.classList.toggle('trouble', isTrouble)
  }

  /* ---------------------------------------------------------------- bar */

  function renderBar() {
    const s = app.state
    const children = []

    children.push(
      button({
        icon: 'sidebar',
        title: 'Show the book: definitions, postulates, axioms and propositions',
        pressed: ui.sidebar,
        onClick: () => {
          ui.sidebar = !ui.sidebar
          render(true)
        },
      }),
    )
    children.push(el('span', 'rule'))

    for (const primitive of PRIMITIVES) {
      children.push(
        button({
          icon: primitive.glyph,
          title: `${primitive.label} — ${primitive.hint}`,
          pressed: s.mode === primitive.id && !s.activeTool,
          onClick: () => app.setMode(primitive.id),
        }),
      )
    }
    children.push(el('span', 'rule'))

    for (const tool of app.tools) {
      children.push(
        button({
          class: 'wide',
          abbr: tool.abbr || '?',
          ref: tool.ref && tool.ref !== tool.abbr ? tool.ref : '',
          title: `${tool.name}${tool.summary ? ' — ' + tool.summary : ''}`,
          pressed: s.activeTool === tool.id,
          onClick: () => app.setMode('tool', tool.id),
        }),
      )
    }
    children.push(
      button({
        class: 'add',
        text: '+',
        title: 'Make a new tool out of what has been constructed',
        pressed: s.mode === 'define',
        onClick: () => (s.mode === 'define' ? app.setMode('select') : app.startDefinition()),
      }),
    )

    const coloured = [...s.selection].map((id) => app.scene.get(id)).filter((o) => o && o.type === 'curve')
    if (coloured.length) {
      children.push(el('span', 'rule'))
      const swatches = el('div', 'swatches')
      for (const name of Object.keys(PALETTE)) {
        const swatch = el('button', 'swatch', { type: 'button', title: `Colour it ${name}` })
        swatch.style.background = PALETTE[name]
        if (coloured.every((o) => o.color === name)) swatch.setAttribute('aria-pressed', 'true')
        swatch.addEventListener('click', () => {
          for (const o of coloured) app.setColor(o.id, name)
        })
        swatches.append(swatch)
      }
      const dashed = coloured.every((o) => o.dash)
      const dash = el('button', 'swatch dash', { type: 'button', title: dashed ? 'Draw it solid' : 'Draw it dashed' })
      dash.setAttribute('aria-pressed', String(dashed))
      dash.addEventListener('click', () => {
        for (const o of coloured) app.setDash(o.id, !dashed)
      })
      swatches.append(dash)
      children.push(swatches)
    }
    if (s.selection.size) {
      children.push(
        button({
          icon: 'trash',
          title: 'Remove what is selected, and whatever stands on it (Delete)',
          onClick: () => app.deleteSelection(),
        }),
      )
    }

    children.push(el('span', 'spacer'))
    children.push(button({ icon: 'undo', title: 'Undo', disabled: !app.canUndo, onClick: () => app.undo() }))
    children.push(button({ icon: 'redo', title: 'Redo', disabled: !app.canRedo, onClick: () => app.redo() }))
    children.push(button({ icon: 'fit', title: 'Fit the figure to the view', onClick: () => options.onFit && options.onFit() }))
    children.push(
      button({
        icon: 'book',
        title: 'The toolbox and the propositions of Book I',
        pressed: ui.tab === 'tools',
        onClick: () => {
          ui.tab = ui.tab === 'tools' ? 'steps' : 'tools'
          render(true)
        },
      }),
    )
    children.push(
      button({
        icon: 'panel',
        title: ui.panel ? 'Hide the construction' : 'Show the construction',
        pressed: ui.panel,
        onClick: () => {
          ui.panel = !ui.panel
          render(true)
        },
      }),
    )
    if (options.embedded) {
      children.push(
        button({
          icon: 'open',
          title: 'Open this figure in the full sketchpad',
          onClick: () => window.open(shareUrl(), '_blank', 'noopener'),
        }),
      )
    }
    children.push(
      button({
        icon: 'more',
        title: 'Save, open, share',
        pressed: ui.menu,
        onClick: () => {
          ui.menu = !ui.menu
          render(true)
        },
      }),
    )
    bar.replaceChildren(...children)
  }

  /* ---------------------------------------------------------------- sidebar */

  // Euclid's kinds of first principle, glossed in a line each. Definitions say
  // what a thing is, postulates grant what may be done, axioms are the truths
  // about magnitudes that everything else leans on.
  // The book's own order: the shorthand, then what things are, then what may
  // be done, then what is granted, then what is proved.
  const SECTIONS = [
    { id: 'symbols', label: 'Symbols & abbreviations', gloss: 'The shorthand Byrne writes his proofs in.' },
    { id: 'definitions', label: 'Definitions', gloss: 'What each thing is. They assert nothing; they only fix the words.' },
    { id: 'postulates', label: 'Postulates', gloss: 'What may be granted as done. These three are the only moves the pencil has.' },
    {
      id: 'axioms',
      label: 'Axioms',
      gloss: 'Truths about magnitudes, taken as granted and nowhere proved. Byrne’s word for the common notions.',
    },
    {
      id: 'propositions',
      label: 'Propositions',
      gloss: 'Problems construct something, theorems assert something. Each may be used once it is proved.',
    },
  ]

  const constructible = new Map(PROPOSITIONS.map((p) => [p.ref, p]))
  const KIND_PREFIX = { definitions: 'Def.', postulates: 'Post.', axioms: 'Ax.', symbols: '' }

  /**
   * The book, as one scrolling list of collapsible sections.
   *
   * A row of tabs across 290px could not hold five names without shouting, and
   * a reader wants the propositions open and the rest within reach, not four
   * lists competing for the same space.
   */
  function renderSidebar() {
    if (!ui.sidebar) {
      sidebar.replaceChildren()
      sidebar.hidden = true
      return
    }
    sidebar.hidden = false

    const head = el('div', 'side-head')
    const collapse = el('button', 'side-collapse', { type: 'button', title: 'Hide the book' })
    collapse.append(icon('sidebar'))
    collapse.addEventListener('click', () => {
      ui.sidebar = false
      render(true)
    })
    const books = el('select', 'books')
    books.append(el('option', null, { textContent: 'Book I', value: 'I' }))
    for (const n of ['II', 'III', 'IV', 'V', 'VI']) {
      books.append(el('option', null, { textContent: `Book ${n} — not yet`, value: n, disabled: true }))
    }
    books.setAttribute('aria-label', 'Which book')
    head.append(books, collapse)

    const list = el('div', 'side-list')
    for (const section of SECTIONS) {
      const rows = BOOK_I[section.id]
      const box = el('details', 'side-section')
      box.open = ui.open[section.id] !== false
      box.addEventListener('toggle', () => {
        ui.open[section.id] = box.open
      })
      const summary = el('summary')
      summary.append(el('span', 'name', { textContent: section.label }))
      summary.append(el('span', 'count', { textContent: String(rows.length) }))
      summary.title = section.gloss
      box.append(summary)
      box.append(el('p', 'gloss', { textContent: section.gloss }))
      for (const entry of rows) box.append(entryRow(section.id, entry))
      list.append(box)
    }

    const foot = el('p', 'side-foot')
    foot.append(document.createTextNode(`${SOURCE.title}, ${SOURCE.editor}. Text from `))
    foot.append(el('a', null, { href: SOURCE.url, textContent: SOURCE.edition, target: '_blank', rel: 'noopener' }))
    foot.append(document.createTextNode(`, ${SOURCE.license}.`))

    // Rebuilding drops the scroll position, so put it back.
    const was = sidebar.querySelector('.side-list')
    const scrolled = was ? was.scrollTop : 0
    sidebar.replaceChildren(head, list, foot)
    if (scrolled) list.scrollTop = scrolled
  }

  /**
   * A figure never changes, so it is drawn once and thereafter moved about.
   * The sidebar is rebuilt whenever the book's shape changes, and redrawing a
   * score of canvases each time would be work for nothing.
   */
  const drawnFigures = new Map()
  function marginFigure(n, items) {
    if (!drawnFigures.has(n)) drawnFigures.set(n, figureCanvas(document, items, 74))
    return drawnFigures.get(n)
  }

  /**
   * An enunciation, with the lines named in the colours Byrne drew them.
   *
   * In the book a line is not called AB, it is printed as a short red stroke,
   * and "AB equals DE" is read off the page as two reds rather than spelled
   * out. Until the proposition figures can be drawn, colouring the letters
   * carries as much of that as letters can carry.
   */
  function enunciation(text, lines) {
    const said = document.createDocumentFragment()
    if (!lines) {
      said.append(document.createTextNode(text))
      return said
    }
    let at = 0
    for (const m of text.matchAll(/[A-Z]+/g)) {
      const colour = m[0].length === 2 && (lines[m[0]] || lines[m[0][1] + m[0][0]])
      if (!colour) continue
      said.append(document.createTextNode(text.slice(at, m.index)))
      const name = el('b', 'named', { textContent: m[0] })
      name.style.color = PALETTE[colour]
      said.append(name)
      at = m.index + m[0].length
    }
    said.append(document.createTextNode(text.slice(at)))
    return said
  }

  function entryRow(sectionId, entry) {
    if (sectionId === 'symbols') {
      const row = el('div', 'entry plain')
      row.append(el('span', 'num glyph', { textContent: entry.symbol }))
      row.append(el('span', 'said', { textContent: entry.text }))
      return row
    }
    if (sectionId !== 'propositions') {
      // Cited the way they would be written down: I.Def.2, I.Post.2, I.Ax.2.
      // The propositions keep the bare I.3, since that is how everyone cites
      // them and they have the better claim to the unqualified form.
      const row = el('div', 'entry plain')
      row.append(el('span', 'num', { textContent: `I.${KIND_PREFIX[sectionId]}${entry.n}` }))
      const said = el('span', 'said')
      // Byrne prints a small figure in the margin beside a definition that has
      // one, and the text runs around it. Float it into the same corner.
      const figure = sectionId === 'definitions' && DEFINITION_FIGURES[entry.n]
      if (figure) {
        const cut = el('span', 'cut')
        cut.append(marginFigure(entry.n, figure))
        said.append(cut)
      }
      said.append(document.createTextNode(entry.text))
      row.append(said)
      return row
    }
    const tool = constructible.get(`I.${entry.n}`)
    const available = !!tool && (!options.throughN || entry.n <= options.throughN)
    const row = el('button', `entry${available ? '' : ' unavailable'}`, { type: 'button' })
    row.title = available ? 'Set this out step by step' : 'This one is not in the sketchpad yet'
    const num = el('span', 'num')
    num.append(document.createTextNode(`I.${entry.n}`))
    num.append(el('em', null, { textContent: entry.kind === 'problem' ? 'Prob.' : 'Theor.' }))
    row.append(num)
    const said = el('span', 'said')
    said.append(enunciation(entry.text, PROPOSITION_LINES[entry.n]))
    row.append(said)
    if (available) {
      row.addEventListener('click', () => {
        app.walkProposition(tool.id)
        ui.tab = 'steps'
        options.onFit && options.onFit()
        render(true)
      })
    } else {
      row.disabled = true
    }
    return row
  }

  /* ---------------------------------------------------------------- panel */

  function renderPanel() {
    panel.hidden = !ui.panel
    if (!ui.panel) {
      panel.replaceChildren()
      return
    }
    if (app.state.definition) {
      panel.replaceChildren(renderDefinition())
      return
    }
    const tabs = el('div', 'tabs')
    for (const [id, label] of [
      ['steps', 'Construction'],
      ['tools', 'Toolbox'],
    ]) {
      const tab = el('button', null, { type: 'button', textContent: label })
      tab.setAttribute('role', 'tab')
      tab.setAttribute('aria-selected', String(ui.tab === id))
      tab.addEventListener('click', () => {
        ui.tab = id
        render(true)
      })
      tabs.append(tab)
    }
    const pane = el('div', 'tabpanel')
    pane.append(ui.tab === 'steps' ? renderSteps() : renderToolbox())
    panel.replaceChildren(tabs, pane)
  }

  function renderSteps() {
    const steps = app.scene.steps
    if (!steps.length) {
      return el('p', 'empty', {
        textContent: 'Nothing has been constructed yet. Set down a point, or join two of them.',
      })
    }
    const wrap = el('div')
    const givens = steps.filter((s) => s.setup)
    if (givens.length) {
      // The given figure is what the proposition starts from, so it is set
      // aside rather than numbered among the moves that follow.
      const box = el('details', 'given-figure')
      box.open = ui.open.given === true
      box.addEventListener('toggle', () => {
        ui.open.given = box.open
      })
      const summary = el('summary')
      summary.append(el('span', 'name', { textContent: 'The given figure' }))
      summary.append(el('span', 'count', { textContent: String(givens.length) }))
      box.append(summary)
      box.append(stepList(givens))
      wrap.append(box)
    }
    wrap.append(stepList(steps.filter((s) => !s.setup)))
    return wrap
  }

  function stepList(steps) {
    const list = el('ol', 'steps')
    steps.forEach((info) => {
      const item = el('li')
      item.classList.toggle('beyond', info.beyond)
      item.classList.toggle('trouble', !info.ok)
      const isCurrent = app.state.upTo !== Infinity && info.index === app.state.upTo - 1
      if (isCurrent) item.setAttribute('aria-current', 'true')
      item.append(el('span', 'n', { textContent: info.setup ? '·' : String(info.number) }))
      const what = el('span', 'what')
      what.append(document.createTextNode(info.text))
      if (!info.ok && info.error) {
        what.append(el('br'))
        what.append(el('small', null, { textContent: info.error }))
      }
      item.append(what)

      const acts = el('span', 'acts')
      if (info.step.op === 'macro') {
        acts.append(
          el('button', null, {
            type: 'button',
            textContent: info.step.expanded ? 'hide' : 'working',
            title: 'Show the construction this tool carries out',
            onclick: (event) => {
              event.stopPropagation()
              app.toggleStepWorking(info.step.id)
            },
          }),
        )
        acts.append(
          el('button', null, {
            type: 'button',
            textContent: 'unfold',
            title: 'Write this out as ordinary steps',
            onclick: (event) => {
              event.stopPropagation()
              app.unfoldStep(info.step.id)
            },
          }),
        )
      }
      if (!app.state.readonly) {
        acts.append(
          el('button', null, {
            type: 'button',
            textContent: '×',
            title: 'Remove this step and everything that leans on it',
            onclick: (event) => {
              event.stopPropagation()
              app.deleteStep(info.step.id)
            },
          }),
        )
      }
      item.append(acts)

      item.addEventListener('click', () => app.setUpTo(info.index + 1))
      item.addEventListener('mouseenter', () => app.setHover(info.produced[0] || null))
      item.addEventListener('mouseleave', () => app.setHover(null))
      list.append(item)
    })
    return list
  }

  function renderToolbox() {
    const wrap = el('div')
    const have = new Set(app.tools.map((t) => t.id))
    for (const tool of app.tools) {
      const card = el('div', 'tool-card')
      const title = el('h4')
      title.append(document.createTextNode(tool.name))
      if (tool.ref) title.append(el('span', 'ref', { textContent: tool.ref }))
      card.append(title)
      if (tool.summary) card.append(el('p', null, { textContent: tool.summary }))
      if (tool.note) card.append(el('p', null, { textContent: tool.note }))
      const acts = el('div', 'acts')
      acts.append(el('button', null, { type: 'button', textContent: 'Use', onclick: () => app.setMode('tool', tool.id) }))
      if (PROPOSITIONS.some((p) => p.id === tool.id)) {
        acts.append(
          el('button', null, {
            type: 'button',
            textContent: 'Read the construction',
            title: 'Set it out step by step in a fresh figure',
            onclick: () => {
              app.walkProposition(tool.id)
              ui.tab = 'steps'
              options.onFit && options.onFit()
              render(true)
            },
          }),
        )
      }
      acts.append(el('button', null, { type: 'button', textContent: 'Remove', onclick: () => app.removeTool(tool.id) }))
      card.append(acts)
      wrap.append(card)
    }

    const rest = PROPOSITIONS.filter((p) => !have.has(p.id))
    if (rest.length) {
      wrap.append(el('p', 'empty', { textContent: 'Others from Book I:' }))
      for (const prop of rest) {
        const card = el('div', 'tool-card')
        const title = el('h4')
        title.append(document.createTextNode(prop.name))
        title.append(el('span', 'ref', { textContent: prop.ref }))
        card.append(title)
        card.append(el('p', null, { textContent: prop.summary }))
        const acts = el('div', 'acts')
        acts.append(el('button', null, { type: 'button', textContent: 'Add to toolbox', onclick: () => app.addTool(prop) }))
        acts.append(
          el('button', null, {
            type: 'button',
            textContent: 'Read the construction',
            onclick: () => {
              app.walkProposition(prop.id)
              ui.tab = 'steps'
              options.onFit && options.onFit()
              render(true)
            },
          }),
        )
        card.append(acts)
        wrap.append(card)
      }
    }
    return wrap
  }

  /* ---------------------------------------------------------------- new tool */

  function renderDefinition() {
    const def = app.state.definition
    const card = el('div', 'tool-card')
    card.append(el('h4', null, { textContent: 'A new tool' }))

    const chips = (ids, none) => {
      const box = el('div', 'chips')
      if (!ids.length) box.append(el('span', 'none', { textContent: none }))
      for (const id of ids) box.append(el('span', 'chip', { textContent: app.scene.name(id) }))
      return box
    }

    if (def.stage === 'inputs') {
      card.append(el('p', null, { textContent: 'Click the givens in the figure, in the order they should be supplied.' }))
      card.append(chips(def.inputs, 'nothing chosen yet'))
    } else if (def.stage === 'outputs') {
      card.append(el('p', null, { textContent: 'Now click what the tool should hand back. Everything else becomes hidden working.' }))
      card.append(chips(def.inputs, '—'))
      card.append(el('p', null, { textContent: 'Results:' }))
      card.append(chips(def.outputs, 'nothing chosen yet'))
    } else {
      card.append(chips(def.inputs, '—'))
      card.append(chips(def.outputs, '—'))
      for (const [key, label, placeholder] of [
        ['name', 'Name', 'Carry a length to a point'],
        ['ref', 'Proposition', 'I.2'],
        ['abbr', 'Button', 'I.2'],
      ]) {
        card.append(el('label', null, { textContent: label }))
        const input = el('input', null, { type: 'text', value: ui.draft[key], placeholder })
        input.addEventListener('input', () => (ui.draft[key] = input.value))
        card.append(input)
      }
    }

    if (def.error) {
      const problem = el('div', 'problem')
      problem.append(document.createTextNode(def.error))
      if (def.missing && def.missing.length) {
        problem.append(
          el('button', null, {
            type: 'button',
            textContent: 'Add them to the givens',
            onclick: () => app.definitionAcceptMissing(),
          }),
        )
      }
      card.append(problem)
    }

    const acts = el('div', 'acts')
    acts.append(el('button', null, { type: 'button', textContent: 'Cancel', onclick: () => app.setMode('select') }))
    if (def.stage !== 'inputs') {
      acts.append(
        el('button', null, {
          type: 'button',
          textContent: 'Back',
          onclick: () => app.definitionStage(def.stage === 'outputs' ? 'inputs' : 'outputs'),
        }),
      )
    }
    if (def.stage === 'details') {
      acts.append(
        el('button', 'primary', {
          type: 'button',
          textContent: 'Add to toolbox',
          onclick: () => {
            const made = app.createTool(ui.draft)
            if (made) ui.draft = { name: '', ref: '', abbr: '', summary: '' }
          },
        }),
      )
    } else {
      acts.append(
        el('button', 'primary', {
          type: 'button',
          textContent: 'Next',
          onclick: () => app.definitionStage(def.stage === 'inputs' ? 'outputs' : 'details'),
        }),
      )
    }
    card.append(acts)
    return card
  }

  /* ---------------------------------------------------------------- foot */

  /**
   * The scrubber is built once and thereafter only updated.
   *
   * Rebuilding it would replace the slider under the reader's finger on the
   * first `input` event, which ends the drag — so it could only ever be moved
   * one step at a time.
   */
  let scrubber = null

  function buildScrubber() {
    const range = el('input', null, { type: 'range', min: '0', step: '1' })
    range.setAttribute('aria-label', 'Step through the construction')
    range.addEventListener('input', () => app.setUpTo(Number(range.value)))
    const back = el('button', 'btn', { type: 'button', textContent: '‹', title: 'One step back' })
    const forward = el('button', 'btn', { type: 'button', textContent: '›', title: 'One step on' })
    back.addEventListener('click', () => app.setUpTo(Number(range.value) - 1))
    forward.addEventListener('click', () => app.setUpTo(Number(range.value) + 1))
    const count = el('span', 'count')
    const row = el('div', 'scrub')
    row.append(back, range, forward, count)
    return { row, range, back, forward, count }
  }

  function renderFoot() {
    const total = app.doc.steps.length
    if (!total) {
      foot.replaceChildren()
      scrubber = null
      return
    }
    if (!scrubber) {
      scrubber = buildScrubber()
      foot.replaceChildren(scrubber.row)
    }
    // The givens are always drawn; the slider steps through the construction.
    const floor = app.scene.setupCount
    const at = app.state.upTo === Infinity ? total : app.state.upTo
    scrubber.range.min = String(floor)
    scrubber.range.max = String(total)
    if (scrubber.range.value !== String(at)) scrubber.range.value = String(at)
    scrubber.count.textContent = `${at - floor} / ${total - floor}`
    scrubber.back.disabled = at <= floor
    scrubber.forward.disabled = at >= total
  }

  /* ---------------------------------------------------------------- menu */

  /** Carry out one of the navigation moves the right-button menu lists. */
  function runNavigation(id) {
    const cam = app.camera
    if (id === 'north') {
      // Keep the angle, but call it upright from now on.
      C.setNorth(cam)
      options.onFit && options.onFit()
    } else if (id === 'centre') {
      // Put everything back: upright, centred, and framed.
      C.resetRotation(cam)
      options.onFit && options.onFit()
    } else if (id === 'reset') {
      C.resetRotation(cam)
      app.changed()
    } else if (id === 'fit') {
      options.onFit && options.onFit()
    } else {
      app.changed()
    }
  }

  function renderNavMenu() {
    const at = ui.nav
    const menu = el('div', 'menu nav-menu')
    menu.style.left = `${Math.round(at.x)}px`
    menu.style.top = `${Math.round(at.y)}px`
    menu.append(el('p', 'menu-head', { textContent: 'Moving about the paper' }))
    for (const move of NAVIGATION) {
      const row = el('button', 'nav-row', {
        type: 'button',
        onclick: () => {
          ui.nav = null
          runNavigation(move.id)
          render(true)
        },
      })
      row.append(el('span', 'what', { textContent: move.label }))
      if (move.keys) row.append(el('kbd', null, { textContent: move.keys }))
      menu.append(row)
    }
    return menu
  }

  function renderFloating() {
    if (ui.nav) {
      floating.replaceChildren(renderNavMenu())
      return
    }
    if (!ui.menu) {
      floating.replaceChildren()
      return
    }
    const menu = el('div', 'menu')
    const item = (label, onClick) =>
      el('button', null, {
        type: 'button',
        textContent: label,
        onclick: () => {
          ui.menu = false
          onClick()
          render(true)
        },
      })
    menu.append(
      item('Save to a file…', () => storage.downloadSketch(app.serialize(), 'construction.euclid.json')),
      item('Open a file…', async () => {
        const text = await storage.pickSketchFile()
        if (!text) return
        try {
          app.load(text)
          options.onFit && options.onFit()
        } catch (error) {
          app.state.notice = `That file could not be read: ${error.message}`
          app.changed()
        }
      }),
      item('Copy a link to this figure', async () => {
        const done = await storage.copyText(shareUrl())
        app.state.notice = done ? 'A link to this figure is on the clipboard.' : 'The clipboard could not be reached.'
        app.state.noticeKind = done ? 'info' : 'problem'
        app.changed()
      }),
      item('Open in the full sketchpad ↗', () => window.open(shareUrl(), '_blank', 'noopener')),
      app.scene.setupCount
        ? item('Let the whole figure be construction', () => app.clearSetup())
        : item('Treat what is drawn as the given figure', () => app.markSetup()),
      item('Start a fresh figure', () => app.clear()),
    )
    floating.replaceChildren(menu)
  }

  const dismiss = (event) => {
    if (!ui.menu && !ui.nav) return
    if (event.composedPath().includes(floating)) return
    ui.menu = false
    ui.nav = null
    render(true)
  }
  root.addEventListener('pointerdown', dismiss, true)

  return {
    canvas,
    stage,
    size,
    render,
    setTab(tab) {
      ui.tab = tab
      render(true)
    },
    /** Right-clicking the paper opens the navigation menu where the cursor is. */
    openNavMenu(at) {
      const box = stage.getBoundingClientRect()
      const frameBox = frame.getBoundingClientRect()
      ui.nav = { x: at.x + (box.left - frameBox.left), y: at.y + (box.top - frameBox.top) }
      ui.menu = false
      render(true)
    },
    navigate(id) {
      ui.nav = null
      runNavigation(id)
      render(true)
    },
    destroy() {
      root.removeEventListener('pointerdown', dismiss, true)
      root.replaceChildren()
    },
  }
}
