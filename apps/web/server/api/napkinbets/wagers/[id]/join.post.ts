import { createError, getRouterParam } from 'h3'
import { z } from 'zod'
import { defineUserMutation, withValidatedBody } from '#layer/server/utils/mutation'
import { joinPool } from '#server/services/napkinbets/pools'

const bodySchema = z.object({
  displayName: z.string().min(2).max(80),
  sideLabel: z.string().max(120),
})

const RATE_LIMIT = { namespace: 'napkinbets-join', maxRequests: 30, windowMs: 60_000 }

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

    return await joinPool(event, wagerId, body)
  },
)
