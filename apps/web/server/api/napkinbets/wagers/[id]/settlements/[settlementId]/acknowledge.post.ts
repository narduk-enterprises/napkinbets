import { createError, getRouterParam } from 'h3'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'
import { acknowledgeSettlement } from '#server/services/napkinbets/pools'

export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, 'napkinbets-settlement-acknowledge', 30, 60_000)

  const wagerId = getRouterParam(event, 'id')
  const settlementId = getRouterParam(event, 'settlementId')
  if (!wagerId || !settlementId) {
    throw createError({ statusCode: 400, message: 'Missing wager or settlement ID.' })
  }

  return await acknowledgeSettlement(event, wagerId, settlementId)
})
