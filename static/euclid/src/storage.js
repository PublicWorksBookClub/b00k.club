/**
 * Keeping work: the toolbox in local storage, sketches as files or as a link.
 *
 * Nothing leaves the browser. A shared link carries the whole construction in
 * its fragment, so a figure can be handed to someone else without a server.
 */

const TOOLBOX_KEY = 'b00k.euclid.toolbox.v1'

/**
 * What the reader has earned: the constructions they can carry out and the
 * theorems they have proved.
 *
 * The book's whole shape is that this accumulates, so it has to outlive the
 * tab. The first version of this stored a bare array of tools; that is still
 * read, so nobody's toolbox disappears because the format grew a second half.
 */
export function loadProgress(key = TOOLBOX_KEY) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return { tools: parsed, facts: [] }
    if (!parsed || typeof parsed !== 'object') return null
    return { tools: parsed.tools || [], facts: parsed.facts || [] }
  } catch {
    return null
  }
}

export function saveProgress({ tools = [], facts = [] } = {}, key = TOOLBOX_KEY) {
  try {
    localStorage.setItem(key, JSON.stringify({ v: 2, tools, facts }))
    return true
  } catch {
    return false
  }
}

/** Give up everything kept in this browser. */
export function forgetProgress(key = TOOLBOX_KEY) {
  try {
    localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

export function encodeSketch(text) {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeSketch(encoded) {
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4))
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function downloadSketch(text, filename = 'sketch.euclid.json', type = 'application/json') {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function pickSketchFile() {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.addEventListener('change', () => {
      const file = input.files && input.files[0]
      if (!file) return resolve(null)
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => resolve(null)
      reader.readAsText(file)
    })
    input.click()
  })
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
