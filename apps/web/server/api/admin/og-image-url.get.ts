import { defineEventHandler, getQuery } from 'h3'

export default defineEventHandler(async (event) => {
  // Enforce admin access if needed, but this is a read-only util
  const query = getQuery(event)
  const path = query.path as string
  
  if (!path) {
    return { url: null }
  }

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
