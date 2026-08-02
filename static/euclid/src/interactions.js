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

export function attachInteractions(canvas, app, size) {
  const pointers = new Map()
  let drag = null
  let pan = null
  let pinch = null
  let downAt = null
  let moved = 0

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
      pinch = { distance: Math.hypot(a.x - b.x, a.y - b.y), centre: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } }
      drag = null
      pan = null
      return
    }
    if (pointers.size > 1) return

    const world = toWorld(event)
    const hit = hitTest(app.scene, world, app.camera)
    downAt = { world, hit, screen: localPoint(event) }
    moved = 0

    if (app.state.mode === 'select' && hit && hit.point) {
      const started = app.beginDrag(hit.point.id)
      if (started) {
        drag = started
        return
      }
    }
    if (!hit || app.state.mode === 'select') pan = { last: localPoint(event) }
  }

  function onPointerMove(event) {
    if (pointers.has(event.pointerId)) pointers.set(event.pointerId, localPoint(event))

    if (pinch && pointers.size === 2) {
      const [a, b] = [...pointers.values()]
      const distance = Math.hypot(a.x - b.x, a.y - b.y)
      const centre = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      const { w, h } = size()
      if (pinch.distance > 0) C.zoomAt(app.camera, centre, distance / pinch.distance, w, h)
      C.panBy(app.camera, centre.x - pinch.centre.x, centre.y - pinch.centre.y)
      pinch = { distance, centre }
      app.changed()
      return
    }

    const world = toWorld(event)
    if (downAt) moved = Math.max(moved, Math.hypot(localPoint(event).x - downAt.screen.x, localPoint(event).y - downAt.screen.y))

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

    const hit = hitTest(app.scene, world, app.camera)
    app.setHover(hit ? (hit.point || hit.curve).id : null)
    const drawing = app.state.mode !== 'select' && app.state.mode !== 'define' && !app.state.activeTool
    app.setCursor(world, drawing ? snapAt(app.scene, world, app.camera) : null)
  }

  function onPointerUp(event) {
    canvas.releasePointerCapture?.(event.pointerId)
    pointers.delete(event.pointerId)
    if (pointers.size < 2) pinch = null

    const wasDrag = drag
    const wasPan = pan
    drag = null
    pan = null
    if (!downAt) return
    const { world, hit } = downAt
    downAt = null
    if (wasDrag || (wasPan && moved > DRAG_THRESHOLD)) return
    if (moved > DRAG_THRESHOLD) return
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
    event.preventDefault()
    if (app.state.pending) {
      app.cancelPending()
      app.changed()
    }
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
