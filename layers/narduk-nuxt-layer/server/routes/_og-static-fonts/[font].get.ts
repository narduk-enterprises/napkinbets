/**
 * Catch-all route that serves OG static font files from Nitro server assets.
 *
 * On Cloudflare Workers, the Takumi WASM renderer's ASSETS.fetch() self-call
 * fails silently. The fallback event.$fetch then returns 404 because Nitro's
 * internal router does NOT serve files from the public/ directory. This route
 * intercepts those internal $fetch calls and serves font data from Nitro
 * server assets (inlined into the Worker bundle at build time).
 *
 * IMPORTANT: Fonts must be served in the EXACT format requested (.woff → WOFF
 * bytes, .ttf → TTF bytes). A format mismatch causes Takumi to silently fail
 * to parse the font, resulting in invisible text.
 */
export default defineEventHandler(async (event) => {
  const filename = getRouterParam(event, 'font')
  if (!filename) {
    throw createError({ statusCode: 404, statusMessage: 'Font not found' })
  }

  // Map the static font filenames to our bundled server assets
  // Each file must be served in its correct binary format
  const assetMap: Record<string, { key: string, contentType: string }> = {
    'Inter-400-normal.woff': { key: 'inter-400.woff', contentType: 'font/woff' },
    'Inter-400-normal.ttf': { key: 'inter-400.ttf', contentType: 'font/ttf' },
    'inter-400-latin.ttf': { key: 'inter-400.ttf', contentType: 'font/ttf' },
    'inter-700-latin.ttf': { key: 'inter-700.ttf', contentType: 'font/ttf' },
  }

  const asset = assetMap[filename]
  if (!asset) {
    throw createError({ statusCode: 404, statusMessage: `Font "${filename}" not available` })
  }

  const storage = useStorage('assets:fonts')
  const data = await storage.getItemRaw(asset.key) as ArrayBuffer | null
  if (!data) {
    throw createError({ statusCode: 500, statusMessage: `Font asset "${asset.key}" not found in server storage` })
  }

  setResponseHeaders(event, {
    'Content-Type': asset.contentType,
    'Cache-Control': 'public, max-age=31536000, immutable',
  })

  return Buffer.from(data)
})
