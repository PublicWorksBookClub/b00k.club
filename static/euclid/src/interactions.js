/**
 * Pointer and keyboard handling: turning gestures into commands on the sketch.
 *
 * Hit testing happens in world units scaled from a screen tolerance, so the
 * grab radius stays the same size under the finger however far the figure has
 * been zoomed.
 */

import * as G from './geometry.js'
import * as C from './camera.js'

export const HIT_TOLERANCE = 12
const DRAG_THRESHOLD = 4
const DRAW_MODES = new Set(['segment', 'ray', 'line', 'circle'])

export function hitTest(scene, world, cam, tolerance = HIT_TOLERANCE) {
  const reach = tolerance / cam.k
  let point = null
  let best = Infinity
  let curve = null
  let bestCurve = Infinity

  for (const id of scene.order) {
    const o = scene.objects.get(id)
    if (!o || o.hidden || o.ghost) continue
    if (o.type === 'point') {
      // A point that has earned a letter wins ties against a bare intersection
      // sitting almost on top of it.
      const d = G.dist(o.pos, world) - (o.label ? reach * 0.3 : 0)
      if (d <= reach && d < best) {
        best = d
        point = o
      }
    } else {
      const d = G.distanceToCurve(o.geom, world)
      if (d <= reach && d < bestCurve) {
        bestCurve = d
        curve = o
      }
    }
  }
  return point || curve ? { point, curve } : null
}

/** Where a click would land: on a point, along a curve, or loose on the page. */
export function snapAt(scene, world, cam) {
  const hit = hitTest(scene, world, cam)
  if (hit && hit.point) return { kind: 'existing', pos: hit.point.pos, id: hit.point.id }
  if (hit && hit.curve) return { kind: 'onCurve', pos: G.project(hit.curve.geom, world), id: hit.curve.id }
  return { kind: 'free', pos: world }
}

const DOUBLE_CLICK_MS = 400

/**
 * The right button navigates.
 *
 * There is no context menu to lose — the canvas has none — so the right button
 * is free, and giving it navigation keeps the left button purely for geometry.
 * Right-click on its own opens a menu that names the gestures, so they can be
 * found rather than memorised.
 */
export const NAVIGATION = [
  { id: 'pan', label: 'Pan', keys: 'right-drag' },
  { id: 'rotate', label: 'Turn the paper', keys: 'shift + right-drag' },
  { id: 'centre', label: 'Centre, fit and set upright', keys: 'double right-click' },
  { id: 'north', label: 'Centre and fit, keeping this angle as upright', keys: 'shift + double right-click' },
  { id: 'reset', label: 'Turn back to upright', keys: null },
  { id: 'fit', label: 'Fit the figure to the view', keys: null },
]

export function attachInteractions(canvas, app, size, hooks = {}) {
  const pointers = new Map()
  let drag = null
  let pan = null
  let rotate = null
  let pinch = null
  let downAt = null
  let pendingDrag = null
  let drawing = false
  let moved = 0
  let lastRight = 0

  const toWorld = (event) => {
    const rect = canvas.getBoundingClientRect()
    const { w, h } = size()
    return C.toWorld(app.camera, { x: event.clientX - rect.left, y: event.clientY - rect.top }, w, h)
  }
  const localPoint = (event) => {
    const rect = canvas.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  function onPointerDown(event) {
    canvas.setPointerCapture?.(event.pointerId)
    // Touching the figure gives the element the keyboard, so undo and Escape
    // reach it. Without this they would go to whatever the page last focused.
    canvas.getRootNode().host?.focus?.({ preventScroll: true })
    pointers.set(event.pointerId, localPoint(event))
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()]
      pinch = {
        distance: Math.hypot(a.x - b.x, a.y - b.y),
        centre: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        angle: Math.atan2(b.y - a.y, b.x - a.x),
      }
      drag = null
      pan = null
      return
    }
    if (pointers.size > 1) return

    const world = toWorld(event)
    const hit = hitTest(app.scene, world, app.camera)
    const here = localPoint(event)
    downAt = { world, hit, screen: here, button: event.button, shift: event.shiftKey }
    moved = 0

    if (event.button === 2) {
      if (event.shiftKey) rotate = { last: here }
      else pan = { last: here }
      return
    }

    // A press on a point might be a drag or might be a selection; which it is
    // only becomes clear once the pointer moves, so the drag waits until then.
    // Starting it eagerly would swallow the click and bank an undo entry for a
    // drag that never happened.
    if (app.state.mode === 'select' && hit && hit.point) {
      pendingDrag = hit.point.id
      return
    }
    if (app.state.mode === 'select') {
      pan = { last: here }
      return
    }

    // In a drawing mode the first click lands on the press, not the release, so
    // the rubber band follows the pointer whether it is dragged or let go. A
    // press-drag-release then looks exactly like two separate clicks.
    if (DRAW_MODES.has(app.state.mode) && !app.state.activeTool && !app.state.choice) {
      drawing = true
      app.click(world, hit)
    }
  }

  function onPointerMove(event) {
    if (pointers.has(event.pointerId)) pointers.set(event.pointerId, localPoint(event))

    if (pinch && pointers.size === 2) {
      const [a, b] = [...pointers.values()]
      const distance = Math.hypot(a.x - b.x, a.y - b.y)
      const centre = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      const { w, h } = size()
      const angle = Math.atan2(b.y - a.y, b.x - a.x)
      if (pinch.distance > 0) C.zoomAt(app.camera, centre, distance / pinch.distance, w, h)
      // Twisting two fingers turns the paper, as it does everywhere else.
      C.rotateAt(app.camera, centre, angle - pinch.angle, w, h)
      C.panBy(app.camera, centre.x - pinch.centre.x, centre.y - pinch.centre.y)
      pinch = { distance, centre, angle }
      app.changed()
      return
    }

    const world = toWorld(event)
    if (downAt) moved = Math.max(moved, Math.hypot(localPoint(event).x - downAt.screen.x, localPoint(event).y - downAt.screen.y))

    if (!drag && pendingDrag && moved > DRAG_THRESHOLD) {
      drag = app.beginDrag(pendingDrag)
      pendingDrag = null
    }
    if (drag) {
      app.updateDrag(drag, world)
      return
    }
    if (pan) {
      const here = localPoint(event)
      C.panBy(app.camera, here.x - pan.last.x, here.y - pan.last.y)
      pan.last = here
      app.changed()
      return
    }
    if (rotate) {
      const here = localPoint(event)
      const { w, h } = size()
      const pivot = { x: w / 2, y: h / 2 }
      const was = Math.atan2(rotate.last.y - pivot.y, rotate.last.x - pivot.x)
      const now = Math.atan2(here.y - pivot.y, here.x - pivot.x)
      C.rotateAt(app.camera, pivot, now - was, w, h)
      rotate.last = here
      app.changed()
      return
    }

    const hit = hitTest(app.scene, world, app.camera)
    app.setHover(hit ? (hit.point || hit.curve).id : null)
    const willDraw = app.state.mode !== 'select' && app.state.mode !== 'define' && !app.state.activeTool
    app.setCursor(world, willDraw ? snapAt(app.scene, world, app.camera) : null)
  }

  function onPointerUp(event) {
    canvas.releasePointerCapture?.(event.pointerId)
    pointers.delete(event.pointerId)
    if (pointers.size < 2) pinch = null

    const wasDrag = drag
    const wasPan = pan
    const wasRotate = rotate
    drag = null
    pan = null
    rotate = null
    pendingDrag = null
    if (!downAt) {
      drawing = false
      return
    }
    const { world, hit, button, shift } = downAt
    const dragged = moved > DRAG_THRESHOLD
    downAt = null

    if (button === 2) {
      if (dragged) return
      const now = performance.now()
      const doubled = now - lastRight < DOUBLE_CLICK_MS
      lastRight = doubled ? 0 : now
      if (doubled) return hooks.onNavigate && hooks.onNavigate(shift ? 'north' : 'centre')
      return hooks.onMenu && hooks.onMenu(localPoint(event))
    }

    if (drawing) {
      // The press already placed the first point. Letting go somewhere else
      // finishes the line; letting go where you pressed leaves it waiting for a
      // second click, exactly as clicking once does.
      drawing = false
      if (!dragged) return
      const world2 = toWorld(event)
      app.click(world2, hitTest(app.scene, world2, app.camera))
      return
    }
    if (wasDrag || wasRotate || (wasPan && dragged)) return
    app.click(world, hit)
  }

  function onWheel(event) {
    event.preventDefault()
    const { w, h } = size()
    const factor = Math.exp(-event.deltaY * (event.deltaMode === 1 ? 0.05 : 0.0015))
    C.zoomAt(app.camera, localPoint(event), factor, w, h)
    app.changed()
  }

  function onLeave() {
    app.setHover(null)
    app.setCursor(null, null)
  }

  function onContextMenu(event) {
    // The right button belongs to navigation; the browser's menu would swallow it.
    event.preventDefault()
  }

  function onKeyDown(event) {
    const meta = event.metaKey || event.ctrlKey
    if (meta && event.key.toLowerCase() === 'z') {
      event.preventDefault()
      if (event.shiftKey) app.redo()
      else app.undo()
      return
    }
    if (event.key === 'Escape') {
      if (app.state.pending || app.state.picked.length) app.cancelPending()
      app.setMode('select')
      return
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (app.state.selection.size) {
        event.preventDefault()
        app.deleteSelection()
      }
    }
  }

  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('pointercancel', onPointerUp)
  canvas.addEventListener('pointerleave', onLeave)
  canvas.addEventListener('wheel', onWheel, { passive: false })
  canvas.addEventListener('contextmenu', onContextMenu)

  return {
    onKeyDown,
    destroy() {
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
      canvas.removeEventListener('pointerleave', onLeave)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('contextmenu', onContextMenu)
    },
  }
}
