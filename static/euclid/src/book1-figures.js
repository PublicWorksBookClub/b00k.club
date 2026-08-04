/**
 * What Byrne's own drawings say, read out of their MetaPost.
 *
 * Taken from jemmybutton/byrne-euclid, so these are his figures rather than an
 * imitation of them; CC-BY-SA 4.0 like the rest of that edition.
 *
 * Regenerate with tools/extract-byrne.py rather than editing by hand.
 */

/**
 * The small figure Byrne sets in the margin beside a definition, keyed by
 * definition number.
 *
 * Coordinates are in figure units, a hundred to Byrne's u, and y runs UP the
 * page as it does in MetaPost. Angles are in degrees, counter-clockwise from
 * east. Nothing here knows how large it will be drawn.
 *
 *   seg     a line from a to b
 *   circle  centre c, radius r
 *   arc     part of that circle, from one bearing to another
 *   angle   the wedge at v between two bearings; filled unless fill is false
 *   label   a letter naming the point at
 */
export const DEFINITION_FIGURES = {
  9: [
    { k: 'angle', v: [0, 0], from: 45, to: 0, color: 'yellow', fill: true },
    { k: 'seg', a: [0, 0], b: [100, 0], color: 'red' },
    { k: 'seg', a: [0, 0], b: [66.67, 66.67], color: 'blue' },
  ],
  10: [
    { k: 'angle', v: [0, 0], from: 0, to: 90, color: 'black', fill: false },
    { k: 'angle', v: [0, 0], from: 180, to: 90, color: 'black', fill: false },
    { k: 'seg', a: [-100, 0], b: [100, 0], color: 'black' },
    { k: 'seg', a: [0, 0], b: [0, 66.67], color: 'black' },
  ],
  11: [
    { k: 'angle', v: [0, 0], from: 135, to: 0, color: 'red', fill: true },
    { k: 'seg', a: [0, 0], b: [100, 0], color: 'blue' },
    { k: 'seg', a: [0, 0], b: [-66.67, 66.67], color: 'yellow' },
  ],
  12: [
    { k: 'angle', v: [0, 0], from: 45, to: 0, color: 'blue', fill: true },
    { k: 'seg', a: [0, 0], b: [100, 0], color: 'red' },
    { k: 'seg', a: [0, 0], b: [66.67, 66.67], color: 'yellow' },
  ],
  15: [
    { k: 'seg', a: [0, 0], b: [25, 43.3], color: 'black' },
    { k: 'seg', a: [0, 0], b: [-32.14, 38.3], color: 'red' },
    { k: 'seg', a: [0, 0], b: [25, -43.3], color: 'yellow' },
    { k: 'seg', a: [-50, 0], b: [50, 0], color: 'blue' },
    { k: 'circle', c: [0, 0], r: 50, color: 'red' },
  ],
  17: [
    { k: 'seg', a: [50, 0], b: [-50, 0], color: 'yellow' },
    { k: 'circle', c: [0, 0], r: 50, color: 'red' },
  ],
  18: [
    { k: 'seg', a: [50, 0], b: [-50, 0], color: 'blue' },
    { k: 'arc', c: [0, 0], r: 50, from: 0, to: 180, color: 'yellow' },
    { k: 'arc', c: [0, 0], r: 50, from: 180, to: 0, color: 'yellow' },
  ],
  19: [
    { k: 'seg', a: [35.36, 35.36], b: [-35.36, 35.36], color: 'red' },
    { k: 'arc', c: [0, 0], r: 50, from: 45, to: 135, color: 'blue' },
    { k: 'arc', c: [0, 0], r: 50, from: 135, to: 45, color: 'blue' },
  ],
  22: [
    { k: 'seg', a: [-50, -133.33], b: [100, 50], color: 'red' },
    { k: 'seg', a: [0, 0], b: [133.33, -100], color: 'blue' },
    { k: 'seg', a: [100, 50], b: [133.33, -100], color: 'yellow' },
    { k: 'seg', a: [-50, -133.33], b: [133.33, -100], color: 'black' },
    { k: 'seg', a: [0, 0], b: [-50, -133.33], color: 'yellow' },
    { k: 'seg', a: [0, 0], b: [100, 50], color: 'yellow' },
    { k: 'label', at: [0, 0], text: 'A' },
    { k: 'label', at: [100, 50], text: 'B' },
    { k: 'label', at: [133.33, -100], text: 'D' },
    { k: 'label', at: [-50, -133.33], text: 'C' },
  ],
  24: [
    { k: 'seg', a: [43.3, -25], b: [-43.3, -25], color: 'blue' },
    { k: 'seg', a: [-43.3, -25], b: [0, 50], color: 'red' },
    { k: 'seg', a: [0, 50], b: [43.3, -25], color: 'yellow' },
  ],
  25: [
    { k: 'seg', a: [25, -43.3], b: [-25, -43.3], color: 'blue' },
    { k: 'seg', a: [-25, -43.3], b: [0, 50], color: 'red' },
    { k: 'seg', a: [0, 50], b: [25, -43.3], color: 'red' },
  ],
  27: [
    { k: 'seg', a: [0, 0], b: [-100, 0], color: 'red' },
    { k: 'seg', a: [-100, 0], b: [0, 75], color: 'yellow' },
    { k: 'seg', a: [0, 75], b: [0, 0], color: 'blue' },
  ],
  28: [
    { k: 'seg', a: [-25, 0], b: [-100, 0], color: 'red' },
    { k: 'seg', a: [-100, 0], b: [0, 75], color: 'blue' },
    { k: 'seg', a: [0, 75], b: [-25, 0], color: 'yellow' },
  ],
  29: [
    { k: 'seg', a: [0, 0], b: [-100, 0], color: 'blue' },
    { k: 'seg', a: [-100, 0], b: [-25, 75], color: 'yellow' },
    { k: 'seg', a: [-25, 75], b: [0, 0], color: 'red' },
  ],
  30: [
    { k: 'seg', a: [0, 0], b: [100, 0], color: 'red' },
    { k: 'seg', a: [0, 0], b: [0, 100], color: 'blue' },
    { k: 'seg', a: [0, 100], b: [100, 100], color: 'black' },
    { k: 'seg', a: [100, 0], b: [100, 100], color: 'yellow' },
  ],
  31: [
    { k: 'seg', a: [0, 0], b: [100, 0], color: 'red' },
    { k: 'seg', a: [0, 0], b: [17.36, 98.48], color: 'blue' },
    { k: 'seg', a: [17.36, 98.48], b: [117.36, 98.48], color: 'black' },
    { k: 'seg', a: [100, 0], b: [117.36, 98.48], color: 'yellow' },
  ],
  32: [
    { k: 'seg', a: [0, 0], b: [133.33, 0], color: 'blue' },
    { k: 'seg', a: [0, 0], b: [0, 75], color: 'red' },
    { k: 'seg', a: [0, 75], b: [133.33, 75], color: 'blue' },
    { k: 'seg', a: [133.33, 0], b: [133.33, 75], color: 'red' },
  ],
  33: [
    { k: 'seg', a: [0, 0], b: [100, 0], color: 'blue' },
    { k: 'seg', a: [0, 0], b: [25, 75], color: 'red' },
    { k: 'seg', a: [25, 75], b: [125, 75], color: 'blue' },
    { k: 'seg', a: [100, 0], b: [125, 75], color: 'red' },
  ],
  35: [
    { k: 'seg', a: [0, 0], b: [133.33, 0], color: 'red' },
    { k: 'seg', a: [0, 50], b: [133.33, 50], color: 'yellow' },
  ],
}

/**
 * The colour each line of a proposition's figure is drawn in, keyed by
 * proposition number and then by the line's two letters.
 *
 * The proposition figures themselves are past this reader — they intersect
 * paths, loop, and define macros — but the colours are the argument: when
 * Byrne writes that AB equals DE he prints both in red, and the eye does the
 * work the letters would otherwise have to. Colouring the letters is the least
 * we can do until the figures themselves can be drawn.
 */
export const PROPOSITION_LINES = {
  1: { AB: 'black', BC: 'red', CA: 'yellow' },
  2: { AB: 'black', BC: 'black', BD: 'red', DA: 'red', BE: 'yellow', AF: 'blue' },
  3: { AB: 'black', BC: 'black', AD: 'red' },
  4: { AB: 'red', BC: 'black', CA: 'blue', DE: 'red', EF: 'black', FD: 'blue' },
  5: { BD: 'yellow', CE: 'yellow', BE: 'blue', CD: 'blue', AB: 'red', AC: 'red', BC: 'black' },
  6: { BC: 'yellow', AB: 'red', BD: 'blue', CA: 'black', CD: 'black' },
  7: { BC: 'blue', CA: 'red', BD: 'blue', DA: 'red', BE: 'blue', EA: 'red', BF: 'blue', FA: 'red', EG: 'red', FH: 'red' },
  8: { AB: 'red', BC: 'black', CA: 'blue', DE: 'red', EF: 'black', FD: 'blue' },
  9: { BC: 'yellow', AD: 'black', DB: 'blue', CD: 'blue', AB: 'red', CA: 'red', BE: 'red', CF: 'red' },
  10: { DB: 'black', CD: 'black', AB: 'yellow', CA: 'blue' },
  11: { AB: 'blue', CA: 'blue', DB: 'black', BE: 'black', CD: 'red', FC: 'red' },
  12: { AB: 'blue', CA: 'blue', DB: 'black', BE: 'black', CD: 'yellow', FC: 'yellow' },
  16: { CF: 'black', CG: 'black', BE: 'blue', EC: 'blue', AE: 'red', ED: 'red', AB: 'yellow', AC: 'black', CD: 'yellow' },
  17: { AB: 'red', BC: 'blue', AC: 'black', CD: 'black' },
  18: { DC: 'red', BC: 'blue', BA: 'black', AD: 'red' },
  19: { AB: 'black', BC: 'blue', CA: 'red' },
  20: { BD: 'red', AB: 'black', BC: 'yellow', CD: 'blue', DA: 'blue' },
  21: { BD: 'yellow', AD: 'black', DE: 'black', AB: 'blue', BE: 'red', EC: 'red', CA: 'blue' },
  22: { AD: 'blue', BE: 'red', AB: 'black', BC: 'yellow', CA: 'yellow' },
  23: { BD: 'black', CE: 'blue', AB: 'black', CA: 'blue', GJ: 'black', FG: 'black', GH: 'red', HF: 'yellow' },
  24: { AB: 'blue', BC: 'black', AD: 'red', CD: 'blue', EF: 'blue', FG: 'yellow', GE: 'red' },
  25: { AB: 'blue', BC: 'black', CA: 'red', DE: 'blue', EF: 'yellow', FD: 'red' },
  26: { AB: 'blue', BC: 'black', CA: 'red', DE: 'blue', EF: 'black', FG: 'red', GD: 'red' },
  27: { IA: 'blue', AB: 'blue', IC: 'red', CD: 'red' },
  31: { AE: 'red', EB: 'red', CF: 'blue', FD: 'blue' },
  32: { AD: 'black', AB: 'black', BC: 'red', CA: 'yellow' },
  33: { AB: 'red', CD: 'red', AC: 'blue', BD: 'yellow' },
  34: { AB: 'red', CD: 'red', AC: 'yellow', BD: 'blue' },
  35: { AC: 'blue', BD: 'red', CD: 'black' },
  36: { CE: 'yellow', DF: 'black', CD: 'black', EF: 'red' },
  37: { AC: 'red', FD: 'blue', CD: 'black' },
  38: { AC: 'blue', FH: 'red', AF: 'black' },
  39: { AF: 'red', DF: 'yellow', AB: 'blue', CD: 'black', CG: 'black' },
  40: { AG: 'red', FG: 'yellow', AB: 'blue', CD: 'black', EF: 'black', DE: 'blue' },
  42: { AD: 'red', CE: 'yellow', AC: 'blue', DE: 'black', EG: 'black' },
  44: { AF: 'red', FC: 'black', BG: 'yellow', AH: 'blue', HB: 'black', FE: 'black', EG: 'black', CD: 'yellow' },
  45: { AC: 'blue', AD: 'red' },
  46: { AB: 'red', BD: 'yellow', DC: 'black', CA: 'blue' },
  47: { CF: 'blue', CI: 'red', AB: 'yellow', BC: 'red', CA: 'blue' },
  48: { AC: 'black', AD: 'black', BC: 'red', BD: 'red' },
}
