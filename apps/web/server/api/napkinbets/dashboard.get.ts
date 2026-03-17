import { loadPoolData } from '#server/services/napkinbets/pools'

export default defineEventHandler(async (event) => {
  return await loadPoolData(event, { includeContext: false })
})
