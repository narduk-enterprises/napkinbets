import { createError, getRouterParam } from 'h3'
import { z } from 'zod'
import { defineUserMutation, withValidatedBody } from '#layer/server/utils/mutation'
import { recordSettlement } from '#server/services/napkinbets/pools'

const bodySchema = z.object({
  participantId: z.string().max(120).optional(),
  participantName: z.string().min(2).max(80),
  amountDollars: z.coerce.number().min(0).max(10_000),
  method: z.string().min(2).max(40),
  handle: z.string().max(120),
  confirmationCode: z.string().max(120),
  note: z.string().max(240),
})

const RATE_LIMIT = { namespace: 'napkinbets-settlements', maxRequests: 30, windowMs: 60_000 }

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

    return await recordSettlement(event, wagerId, body)
  },
)
