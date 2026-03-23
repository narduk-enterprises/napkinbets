import { createError, getRouterParam } from 'h3'
import { z } from 'zod'
import { defineUserMutation, withValidatedBody } from '#layer/server/utils/mutation'
import { disputeCustomWagerResult } from '#server/services/napkinbets/pools'

const bodySchema = z.object({
  reason: z.string().min(3, 'Provide a reason for the dispute.').max(500),
})

const RATE_LIMIT = { namespace: 'napkinbets-dispute-result', maxRequests: 10, windowMs: 60_000 }

export default defineUserMutation(
  {
    rateLimit: RATE_LIMIT,
    parseBody: withValidatedBody(bodySchema.parse),
  },
  async ({ event, body }) => {
    const wagerId = getRouterParam(event, 'id')
    if (!wagerId) {
      throw createError({ statusCode: 400, message: 'Missing wager ID.' })
    }

    return await disputeCustomWagerResult(event, wagerId, body.reason)
  },
)
