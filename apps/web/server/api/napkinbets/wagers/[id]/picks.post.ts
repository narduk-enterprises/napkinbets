import { createError, getRouterParam } from 'h3'
import { z } from 'zod'
import { defineUserMutation, withValidatedBody } from '#layer/server/utils/mutation'
import { savePick } from '#server/services/napkinbets/pools'

const bodySchema = z.object({
  participantName: z.string().min(2).max(80),
  pickLabel: z.string().min(2).max(120),
  pickType: z.string().max(40),
  pickValue: z.string().max(120),
  confidence: z.coerce.number().min(1).max(10),
  wagerLegId: z.string().max(100).optional(),
  pickNumericValue: z.coerce.number().int().optional(),
})

const RATE_LIMIT = { namespace: 'napkinbets-picks', maxRequests: 40, windowMs: 60_000 }

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

    return await savePick(event, wagerId, body)
  },
)
