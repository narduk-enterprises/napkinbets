import { createError, getRouterParam } from 'h3'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'
import { declineWager } from '#server/services/napkinbets/pools'

export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, 'napkinbets-decline', 20, 60_000)

  const wagerId = getRouterParam(event, 'id')
  if (!wagerId) {
    throw createError({ statusCode: 400, message: 'Missing wager ID.' })
  }

  return await declineWager(event, wagerId)
})
