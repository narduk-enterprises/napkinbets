/**
 * Nitro plugin that pre-loads Inter font data from Nitro server assets
 * (bundled into the Worker at build time) and injects them into the
 * nuxt-og-image Takumi renderer's font cache.
 *
 * On Cloudflare Workers, the ASSETS.fetch() self-call used by the default
 * font loader silently fails, producing OG images with invisible text.
 * This plugin bypasses ASSETS.fetch() entirely by reading the font data
 * from the inlined server assets.
 */
export default defineNitroPlugin((nitro) => {
  // Pre-populate font cache: intercept the Takumi node creation hook
  // and manually load the renderer with our bundled fonts
  nitro.hooks.hook('nuxt-og-image:takumi:nodes' as never, async (_nodes: unknown, ctx: { _nitro: { _takumiState?: { renderer: { loadFont: (opts: { name: string, data: Uint8Array, weight: number, style: string }) => Promise<void> }, loadedFontKeys: Set<string>, familySubsetNames: Map<string, string[]>, subsetCounter: number } } }) => {
    const state = ctx._nitro._takumiState
    if (!state) return

    // Skip if we already injected our fonts
    const marker = '__og-fonts-injected'
    if (state.loadedFontKeys.has(marker)) return

    const storage = useStorage('assets:fonts')

    const fontConfigs = [
      { key: 'inter-400.ttf', family: 'Inter', weight: 400, style: 'normal' },
      { key: 'inter-700.ttf', family: 'Inter', weight: 700, style: 'normal' },
    ]

    for (const font of fontConfigs) {
      const cacheKey = `${font.family}-${font.weight}-${font.style}-bundled`
      if (state.loadedFontKeys.has(cacheKey)) continue

      try {
        const raw = await storage.getItemRaw(font.key) as ArrayBuffer | null
        if (!raw) continue

        const data = new Uint8Array(raw)
        const subsetName = `${font.family}__bundled_${state.subsetCounter++}`

        await state.renderer.loadFont({
          name: subsetName,
          data,
          weight: font.weight,
          style: font.style,
        })

        // Register in the family→subset mapping so rewriteFontFamilies works
        if (!state.familySubsetNames.has(font.family)) {
          state.familySubsetNames.set(font.family, [])
        }
        state.familySubsetNames.get(font.family)!.push(subsetName)

        // Also register lowercase variant
        const lower = font.family.toLowerCase()
        if (lower !== font.family) {
          if (!state.familySubsetNames.has(lower)) {
            state.familySubsetNames.set(lower, [])
          }
          state.familySubsetNames.get(lower)!.push(subsetName)
        }

        state.loadedFontKeys.add(cacheKey)
      }
      catch (err) {
        // eslint-disable-next-line no-console
        console.warn(`[og-fonts] Failed to load bundled font ${font.family}:${font.weight}:`, err)
      }
    }

    state.loadedFontKeys.add(marker)
  })
})
