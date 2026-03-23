import { createError, getRouterParam } from 'h3'
import { defineUserMutation } from '#layer/server/utils/mutation'
import { confirmSettlement } from '#server/services/napkinbets/pools'

const RATE_LIMIT = { namespace: 'napkinbets-settlement-confirm', maxRequests: 30, windowMs: 60_000 }

export default defineUserMutation(
  {
    rateLimit: RATE_LIMIT,
  },
  async ({ event }) => {
    const wagerId = getRouterParam(event, 'id')
    const settlementId = getRouterParam(event, 'settlementId')
    if (!wagerId || !settlementId) {
      throw createError({ statusCode: 400, message: 'Missing wager or settlement ID.' })
    }

    return await confirmSettlement(event, wagerId, settlementId)
  },
)
