/**
 * Boots any inline map embed on the page. Opt in by putting `data-mapview-embed`
 * (plus `data-map`, and optionally `data-burg`/`data-scale`/`data-tour-section`)
 * on a `.mapview.mapview--embed` wrapper — see content/commentary for an example.
 *
 * This lives in its own file, loaded globally from base.html like the other
 * enhancers, rather than as an inline <script> in the page: the site-wide CSP
 * forbids inline scripts everywhere except /maps/*, so an inline initialiser is
 * silently blocked on a content page. It does nothing, and pulls in nothing, on
 * pages without an embed.
 */
const embeds = document.querySelectorAll('[data-mapview-embed]')
if (embeds.length) {
  const { createViewer } = await import('/maps/viewer/viewer.js')
  for (const root of embeds) createViewer({ root, standalone: false })
}
