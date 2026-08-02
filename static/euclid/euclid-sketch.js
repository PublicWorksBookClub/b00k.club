/**
 * Package entry point.
 *
 * Importing this registers <euclid-sketch>. Everything else is exported for
 * anyone who wants the model without the interface — the geometry, the document
 * and the solver have no DOM dependencies and run happily in Node.
 */

import { defineEuclidSketch } from './src/element.js'

export { EuclidSketchElement, defineEuclidSketch } from './src/element.js'
export { createSketch, PRIMITIVES } from './src/app.js'
export { PROPOSITIONS, PROPOSITION_BY_ID, DEFAULT_TOOL_IDS } from './src/propositions.js'
export { extractTool, inlineTool, makeToolStep, collectToolDeps } from './src/macros.js'
export { solve } from './src/solve.js'
export * as doc from './src/doc.js'
export * as geometry from './src/geometry.js'

defineEuclidSketch()
