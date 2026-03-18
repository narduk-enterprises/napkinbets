import { defineEventHandler, getQuery } from 'h3'
import { z } from 'zod'

const querySchema = z.object({
  path: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  // Enforce admin access if needed, but this is a read-only util
  const result = querySchema.safeParse(getQuery(event))
  
  if (!result.success) {
    return { url: null }
  }

  const path = result.data.path

  try {
    // Fetch the SSR HTML of the requested path internally via Nitro
    const html = await $fetch<string>(path)
    
    // Extract the og:image content URL
    const match = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/)
    
    if (match && match[1]) {
      return { url: match[1] }
    }
    
    return { url: null }
  } catch (error) {
    console.error(`[AdminOgImagesTab] Failed to fetch HTML for ${path}:`, error)
    return { url: null }
  }
})
