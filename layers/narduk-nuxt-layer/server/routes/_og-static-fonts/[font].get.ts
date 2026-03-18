/**
 * Catch-all route that serves OG static font files from Nitro server assets.
 *
 * Root cause: On Cloudflare Workers, the Takumi WASM renderer tries to load
 * fonts from /_og-static-fonts/ via ASSETS.fetch() — which fails silently.
 * The fallback event.$fetch then returns 404 because Nitro's internal router
 * does NOT serve files from the public/ directory. This route intercepts
 * those internal $fetch calls and serves font data from Nitro server assets
 * (inlined into the Worker bundle at build time).
 */
export default defineEventHandler(async (event) => {
  const filename = getRouterParam(event, 'font')
  if (!filename) {
    throw createError({ statusCode: 404, statusMessage: 'Font not found' })
  }

  // Map the static font filenames to our bundled server assets
  const assetMap: Record<string, string> = {
    'Inter-400-normal.woff': 'inter-400.ttf',
    'Inter-400-normal.ttf': 'inter-400.ttf',
    'inter-400-latin.ttf': 'inter-400.ttf',
    'inter-700-latin.ttf': 'inter-700.ttf',
  }

  const assetKey = assetMap[filename]
  if (!assetKey) {
    throw createError({ statusCode: 404, statusMessage: `Font "${filename}" not available` })
  }

  const storage = useStorage('assets:fonts')
  const data = await storage.getItemRaw(assetKey) as ArrayBuffer | null
  if (!data) {
    throw createError({ statusCode: 500, statusMessage: `Font asset "${assetKey}" not found in server storage` })
  }

  setResponseHeaders(event, {
    'Content-Type': filename.endsWith('.woff') ? 'font/woff' : 'font/ttf',
    'Cache-Control': 'public, max-age=31536000, immutable',
  })

  return Buffer.from(data)
})
