import { createError, getRouterParam } from 'h3'
import { defineUserMutation } from '#layer/server/utils/mutation'
import { randomizeDraftOrder } from '#server/services/napkinbets/pools'

const RATE_LIMIT = { namespace: 'napkinbets-draft-order', maxRequests: 20, windowMs: 60_000 }

export default defineUserMutation(
  {
    rateLimit: RATE_LIMIT,
  },
  async ({ event }) => {
    const wagerId = getRouterParam(event, 'id')
    if (!wagerId) {
      throw createError({ statusCode: 400, message: 'Missing wager ID.' })
    }

    return await randomizeDraftOrder(event, wagerId)
  },
)
