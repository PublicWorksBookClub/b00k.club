/**
 * Reader for Azgaar Fantasy Map Generator `.map` project files.
 *
 * A `.map` file is a flat array of fields joined with CRLF. The field order is
 * fixed by the generator and is mirrored in
 * `static/maps/interactive/modules/io/save.js` (`prepareMapData`) and
 * `.../io/load.js` (`parseLoadedData`). Only the fields this exporter needs are
 * named here; the rest stay reachable through `fields`.
 */

import { readFileSync } from 'node:fs'

const FIELD_SEPARATOR = '\r\n'

/** Field indices, matching FMG's own load.js. */
const FIELD = {
  params: 0,
  settings: 1,
  coordinates: 2,
  biomes: 3,
  notes: 4,
  svg: 5,
  cultures: 13,
  states: 14,
  burgs: 15,
  rivers: 32,
  fonts: 34,
  markers: 35,
  routes: 37,
}

/** Settings are a pipe-joined list; these are the offsets we care about. */
const SETTING = {
  distanceUnit: 0,
  distanceScale: 1,
  mapName: 20,
  hideLabels: 21,
  stylePreset: 22,
}

function parseJsonField(fields, index, fallback) {
  const raw = fields[index]
  if (!raw) return fallback
  try {
    return JSON.parse(raw)
  } catch (error) {
    throw new Error(`field ${index} is not valid JSON: ${error.message}`)
  }
}

/**
 * Parse a `.map` file into the pieces the exporter works with.
 *
 * @param {string} path absolute path to the `.map` file
 */
export function readMapFile(path) {
  const fields = readFileSync(path, 'utf8').split(FIELD_SEPARATOR)
  if (fields.length < 40) {
    throw new Error(`${path} has ${fields.length} fields; expected at least 40. Is it an FMG .map file?`)
  }

  const params = fields[FIELD.params].split('|')
  const settings = fields[FIELD.settings].split('|')
  const [version, , savedOn, seed, width, height, mapId] = params

  return {
    fields,
    version,
    savedOn,
    seed,
    mapId,
    width: Number(width),
    height: Number(height),
    mapName: settings[SETTING.mapName] || 'Untitled map',
    stylePreset: settings[SETTING.stylePreset] || 'default',
    hideLabels: settings[SETTING.hideLabels] === '1',
    distanceUnit: settings[SETTING.distanceUnit] || 'km',
    // FMG measures distance as `mapUnits * distanceScale` (see modules/ui/measurers.js).
    distanceScale: Number(settings[SETTING.distanceScale]) || 1,
    svg: fields[FIELD.svg],
    coordinates: parseJsonField(fields, FIELD.coordinates, null),
    notes: parseJsonField(fields, FIELD.notes, []),
    burgs: parseJsonField(fields, FIELD.burgs, []),
    cultures: parseJsonField(fields, FIELD.cultures, []),
    states: parseJsonField(fields, FIELD.states, []),
    rivers: parseJsonField(fields, FIELD.rivers, []),
    markers: parseJsonField(fields, FIELD.markers, []),
    routes: parseJsonField(fields, FIELD.routes, []),
    fonts: parseJsonField(fields, FIELD.fonts, []),
  }
}
