import { createError, getRouterParam } from 'h3'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'
import { clearPoolData } from '#server/services/napkinbets/pools'

export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, 'napkinbets-clear', 10, 60_000)

  const wagerId = getRouterParam(event, 'id')
  if (!wagerId) {
    throw createError({ statusCode: 400, message: 'Missing wager ID.' })
  }

  return await clearPoolData(event, wagerId)
})
