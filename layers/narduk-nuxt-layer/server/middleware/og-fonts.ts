/**
 * Server middleware that serves OG image font files from Nitro server assets.
 *
 * On Cloudflare Workers, the Takumi WASM renderer's ASSETS.fetch() self-call
 * fails silently when trying to load font files from /_og-static-fonts/.
 * The renderer then falls back to event.$fetch, which triggers a normal
 * request through the Nitro handler pipeline. This middleware intercepts
 * those requests and serves the font data directly from server assets
 * (inlined into the Worker bundle at build time).
 */
export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  if (!path.startsWith('/_og-static-fonts/')) return

  // Map the request path to a server asset key
  const filename = path.replace('/_og-static-fonts/', '')

  // We only serve our bundled fonts
  const assetMap: Record<string, string> = {
    'Inter-400-normal.woff': 'inter-400.ttf',
    'Inter-400-normal.ttf': 'inter-400.ttf',
    'inter-400-latin.ttf': 'inter-400.ttf',
    'inter-700-latin.ttf': 'inter-700.ttf',
  }

  const assetKey = assetMap[filename]
  if (!assetKey) return

  try {
    const storage = useStorage('assets:fonts')
    const data = await storage.getItemRaw(assetKey) as ArrayBuffer | null
    if (!data) return

    setResponseHeaders(event, {
      'Content-Type': filename.endsWith('.woff') ? 'font/woff' : 'font/ttf',
      'Cache-Control': 'public, max-age=31536000, immutable',
    })

    return Buffer.from(data)
  }
  catch {
    // Fall through to default asset handling
  }
})
