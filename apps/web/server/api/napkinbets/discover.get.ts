import { loadCachedDiscoverData } from '#server/services/napkinbets/events'

export default defineEventHandler(async (event) => {
  return await loadCachedDiscoverData(event)
})
