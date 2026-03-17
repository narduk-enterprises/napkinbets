import { loadDiscoverData } from '#server/services/napkinbets/discover'

export default defineEventHandler(async () => {
  return await loadDiscoverData()
})
