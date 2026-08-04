/**
 * A walk through the first proposition, done by hand.
 *
 * Reading about a straightedge is not the same as holding one, so the shortest
 * way into the sketchpad is to build Euclid's first proposition with it: two
 * points, two circles, two joins, and an equilateral triangle that stays
 * equilateral however hard it is dragged. By the end the reader has met every
 * idea the app has except claims.
 *
 * A stage says what to do and knows when it has been done. Nothing here drives
 * the app — the reader does the whole of it — so a stage is a question asked of
 * the document rather than a command issued to it. Its `done` is given the
 * sketch and a note of how things stood when the stage began, so a stage can
 * ask "two more than before" rather than "two altogether", and the tutorial can
 * be picked up in the middle of a figure.
 */

const count = (app, op) => app.doc.steps.filter((s) => s.op === op).length

/** Where the hand-placed points are, so that dragging one can be noticed. */
const positions = (app) =>
  app.doc.steps.filter((s) => s.op === 'point').map((s) => `${Math.round(s.x)},${Math.round(s.y)}`).join(' ')

export const TUTORIAL = [
  {
    id: 'points',
    say: 'Take the point tool and set down two points, a good way apart. This is the straight line '
      + 'the proposition is given — Euclid would have drawn it, and so will you.',
    watch: (app) => count(app, 'point'),
    done: (app, was) => count(app, 'point') >= was + 2,
  },
  {
    id: 'join',
    say: 'Now the straightedge. Postulate 1: a straight line may be drawn from any point to any '
      + 'point. Click one of your points, then the other.',
    watch: (app) => count(app, 'segment'),
    done: (app, was) => count(app, 'segment') >= was + 1,
  },
  {
    id: 'circle',
    say: 'Take the compass. Postulate 3: a circle may be described with any centre and distance — '
      + 'and the distance has to be a point it passes through, since nothing here can carry a '
      + 'length. Click one end of your line, then the other.',
    watch: (app) => count(app, 'circle'),
    done: (app, was) => count(app, 'circle') >= was + 1,
  },
  {
    id: 'circle2',
    say: 'And the same the other way about: the other end for a centre, the first for the distance. '
      + 'The two circles cut in two places, and those points are simply there — no step needed. They '
      + 'stay small and grey until something uses one.',
    watch: (app) => count(app, 'circle'),
    done: (app, was) => count(app, 'circle') >= was + 1,
  },
  {
    id: 'sides',
    say: 'Join each end of your line to the point where the circles cut, above or below as you like. '
      + 'Watch it earn a letter as you do — an intersection is lettered the moment something refers '
      + 'to it, which is how a figure in a book acquires its lettering.',
    watch: (app) => count(app, 'segment'),
    done: (app, was) => count(app, 'segment') >= was + 2,
  },
  {
    id: 'drag',
    say: 'That is Proposition 1. Now test it: take the pointer and drag one of the two points you '
      + 'placed by hand. Everything built on it follows, and the triangle stays equilateral — which '
      + 'is the difference between a construction and a drawing.',
    watch: positions,
    done: (app, was) => positions(app) !== was,
  },
  {
    id: 'tool',
    say: 'Last, keep it. Press + , click the two points you started from, then the third point and '
      + 'the two sides, then give it a name. It becomes a button in the toolbar and everything in '
      + 'between becomes hidden working — which is what Euclid means by being allowed to use a '
      + 'proposition once it is proved.',
    watch: (app) => app.tools.length,
    done: (app, was) => app.tools.length > was,
  },
]

/** Where the tutorial stands, and how it moves on. */
export function beginTutorial(app, at = 0) {
  const stage = TUTORIAL[at]
  return stage ? { at, was: stage.watch(app) } : null
}

/**
 * Advance if the current stage has been done. Returns the new state, or null
 * once the last stage is finished.
 */
export function advanceTutorial(app, state) {
  if (!state) return null
  const stage = TUTORIAL[state.at]
  if (!stage || !stage.done(app, state.was)) return state
  return beginTutorial(app, state.at + 1)
}
