/**
 * Book I, as the sketchpad carries it out.
 *
 * The propositions themselves live one to a file in `propositions/`, beside
 * this directory rather than inside it, because they are the part a reader may
 * reasonably want to correct: a figure that opens the wrong way up, a colour
 * that does not match the book, a line that should be drawn heavier. Editing
 * one of those files changes what everybody opens. The sketchpad will write
 * one out for you — ⋯ → "Save this proposition" — which is the same thing,
 * since a proposition is only ever this data.
 *
 * A proposition is a tool: `inputs` are what it is applied to, `body` is what
 * it does, `outputs` names which of those it hands back. Local ids are `i0, i1,
 * …` for the givens and `l0, l1, …` for the steps. A body step of the form
 * `{ op: 'macro' }` invokes an earlier proposition, which is why I.3 works: it
 * stands on I.2, which stands on I.1.
 *
 * The order here is the order they were written out in, which is roughly the
 * order a reader meets them; the sidebar shows Book I in its own order.
 */

import PI_1 from '../propositions/I-1.js'
import PI_2 from '../propositions/I-2.js'
import PI_3 from '../propositions/I-3.js'
import PI_9 from '../propositions/I-9.js'
import PI_10 from '../propositions/I-10.js'
import PI_11 from '../propositions/I-11.js'
import PI_12 from '../propositions/I-12.js'
import PI_23 from '../propositions/I-23.js'
import PI_31 from '../propositions/I-31.js'
import PI_46 from '../propositions/I-46.js'
import PI_4 from '../propositions/I-4.js'
import PI_13 from '../propositions/I-13.js'
import PI_15 from '../propositions/I-15.js'
import PI_16 from '../propositions/I-16.js'
import PI_20 from '../propositions/I-20.js'
import PI_37 from '../propositions/I-37.js'
import PI_5 from '../propositions/I-5.js'
import PI_47 from '../propositions/I-47.js'

export const PROPOSITIONS = [
  PI_1,
  PI_2,
  PI_3,
  PI_9,
  PI_10,
  PI_11,
  PI_12,
  PI_23,
  PI_31,
  PI_46,
  PI_4,
  PI_13,
  PI_15,
  PI_16,
  PI_20,
  PI_37,
  PI_5,
  PI_47,
]

export const PROPOSITION_BY_ID = new Map(PROPOSITIONS.map((p) => [p.id, p]))

/**
 * What a fresh toolbox starts with: nothing.
 *
 * Postulates 1–3 are not tools, they are the pencil. Everything else in Book I
 * has to be got through before it can be used — a toolbar handed I.1, I.2 and
 * I.3 on arrival says the opposite of what the book says, which is that each
 * proposition is earned by the ones before it. Reading one through is what
 * earns it.
 */
export const DEFAULT_TOOL_IDS = []
