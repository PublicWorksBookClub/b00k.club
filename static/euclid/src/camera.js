/**
 * Pan, zoom and turn. World units are CSS pixels at k = 1.
 *
 * `r` is how far the paper has been turned under the viewer; `north` is the
 * angle "reset" returns to, so a reader who has settled on an orientation can
 * declare it upright and go on turning from there.
 */

export const MIN_ZOOM = 0.05
export const MAX_ZOOM = 40

export function createCamera(init = {}) {
  return { x: 0, y: 0, k: 1, r: 0, north: 0, ...init }
}

export function toScreen(cam, p, w, h) {
  const dx = p.x - cam.x
  const dy = p.y - cam.y
  const cos = Math.cos(cam.r)
  const sin = Math.sin(cam.r)
  return { x: (dx * cos - dy * sin) * cam.k + w / 2, y: (dx * sin + dy * cos) * cam.k + h / 2 }
}

export function toWorld(cam, s, w, h) {
  const sx = (s.x - w / 2) / cam.k
  const sy = (s.y - h / 2) / cam.k
  const cos = Math.cos(cam.r)
  const sin = Math.sin(cam.r)
  return { x: cam.x + sx * cos + sy * sin, y: cam.y - sx * sin + sy * cos }
}

/** Zoom about a fixed point on screen, so the thing under the cursor stays put. */
export function zoomAt(cam, screenPoint, factor, w, h) {
  const before = toWorld(cam, screenPoint, w, h)
  cam.k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, cam.k * factor))
  const after = toWorld(cam, screenPoint, w, h)
  cam.x += before.x - after.x
  cam.y += before.y - after.y
}

/** Turn about a fixed point on screen, by the same trick. */
export function rotateAt(cam, screenPoint, radians, w, h) {
  const before = toWorld(cam, screenPoint, w, h)
  cam.r += radians
  const after = toWorld(cam, screenPoint, w, h)
  cam.x += before.x - after.x
  cam.y += before.y - after.y
}

export function panBy(cam, dxScreen, dyScreen) {
  const cos = Math.cos(cam.r)
  const sin = Math.sin(cam.r)
  const dx = dxScreen / cam.k
  const dy = dyScreen / cam.k
  cam.x -= dx * cos + dy * sin
  cam.y -= -dx * sin + dy * cos
}

/**
 * The world rectangle covering the screen, optionally grown by `pad` pixels.
 *
 * Once the paper can turn this is the bounding box of a tilted rectangle rather
 * than the rectangle itself — an over-estimate, which is exactly what line
 * clipping wants.
 */
export function visibleRect(cam, w, h, pad = 0) {
  const corners = [
    toWorld(cam, { x: -pad, y: -pad }, w, h),
    toWorld(cam, { x: w + pad, y: -pad }, w, h),
    toWorld(cam, { x: w + pad, y: h + pad }, w, h),
    toWorld(cam, { x: -pad, y: h + pad }, w, h),
  ]
  return {
    minX: Math.min(...corners.map((c) => c.x)),
    minY: Math.min(...corners.map((c) => c.y)),
    maxX: Math.max(...corners.map((c) => c.x)),
    maxY: Math.max(...corners.map((c) => c.y)),
  }
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
  // The figure's box is in world terms; turned, it needs the room its corners
  // sweep out, so fit against the box that contains it either way round.
  const cos = Math.abs(Math.cos(cam.r))
  const sin = Math.abs(Math.sin(cam.r))
  const spanX = bw * cos + bh * sin
  const spanY = bw * sin + bh * cos
  const fitted = Math.min((w - pad * 2) / spanX, (h - pad * 2) / spanY)
  cam.k = Math.min(MAX_ZOOM, maxScale, Math.max(MIN_ZOOM, fitted))
  cam.x = (bounds.minX + bounds.maxX) / 2
  cam.y = (bounds.minY + bounds.maxY) / 2
  return cam
}

/** Turn the paper back to whatever the reader last declared upright. */
export function resetRotation(cam) {
  cam.r = cam.north || 0
}

/** Declare the current turn to be upright. */
export function setNorth(cam) {
  cam.north = cam.r
}
