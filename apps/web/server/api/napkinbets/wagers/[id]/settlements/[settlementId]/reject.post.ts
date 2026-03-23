import { createError, getRouterParam } from 'h3'
import { z } from 'zod'
import { defineUserMutation, withValidatedBody } from '#layer/server/utils/mutation'
import { rejectSettlement } from '#server/services/napkinbets/pools'

const bodySchema = z.object({
  note: z.string().max(240).default(''),
})

const RATE_LIMIT = { namespace: 'napkinbets-settlement-reject', maxRequests: 30, windowMs: 60_000 }

export default defineUserMutation(
  {
    rateLimit: RATE_LIMIT,
    parseBody: withValidatedBody(bodySchema.parse),
  },
  async ({ event, body }) => {
    const wagerId = getRouterParam(event, 'id')
    const settlementId = getRouterParam(event, 'settlementId')
    if (!wagerId || !settlementId) {
      throw createError({ statusCode: 400, message: 'Missing wager or settlement ID.' })
    }

    return await rejectSettlement(event, wagerId, settlementId, body.note)
  },
)
