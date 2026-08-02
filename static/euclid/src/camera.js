/** Pan and zoom. World units are CSS pixels at k = 1, with the camera centred. */

export const MIN_ZOOM = 0.05
export const MAX_ZOOM = 40

export function createCamera(init = {}) {
  return { x: 0, y: 0, k: 1, ...init }
}

export function toScreen(cam, p, w, h) {
  return { x: (p.x - cam.x) * cam.k + w / 2, y: (p.y - cam.y) * cam.k + h / 2 }
}

export function toWorld(cam, s, w, h) {
  return { x: (s.x - w / 2) / cam.k + cam.x, y: (s.y - h / 2) / cam.k + cam.y }
}

/** Zoom about a fixed point on screen, so the thing under the cursor stays put. */
export function zoomAt(cam, screenPoint, factor, w, h) {
  const before = toWorld(cam, screenPoint, w, h)
  cam.k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, cam.k * factor))
  const after = toWorld(cam, screenPoint, w, h)
  cam.x += before.x - after.x
  cam.y += before.y - after.y
}

export function panBy(cam, dxScreen, dyScreen) {
  cam.x -= dxScreen / cam.k
  cam.y -= dyScreen / cam.k
}

/** The world rectangle currently on screen, optionally grown by `pad` pixels. */
export function visibleRect(cam, w, h, pad = 0) {
  const a = toWorld(cam, { x: -pad, y: -pad }, w, h)
  const b = toWorld(cam, { x: w + pad, y: h + pad }, w, h)
  return { minX: a.x, minY: a.y, maxX: b.x, maxY: b.y }
}

/**
 * Frame `bounds`.
 *
 * `maxScale` defaults to 1 so fitting never magnifies. World units are CSS
 * pixels, so 1:1 is the scale things were drawn at — and a figure of two points
 * blown up to fill the view would send the first circle drawn on it straight
 * off the edge.
 */
export function fitTo(cam, bounds, w, h, pad = 48, maxScale = 1) {
  if (!bounds || !w || !h) return cam
  const bw = Math.max(bounds.maxX - bounds.minX, 1)
  const bh = Math.max(bounds.maxY - bounds.minY, 1)
  const fitted = Math.min((w - pad * 2) / bw, (h - pad * 2) / bh)
  cam.k = Math.min(MAX_ZOOM, maxScale, Math.max(MIN_ZOOM, fitted))
  cam.x = (bounds.minX + bounds.maxX) / 2
  cam.y = (bounds.minY + bounds.maxY) / 2
  return cam
}
