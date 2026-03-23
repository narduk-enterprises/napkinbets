import { createError, getRouterParam } from 'h3'
import { z } from 'zod'
import { defineUserMutation, withValidatedBody } from '#layer/server/utils/mutation'
import { callCustomWagerResult } from '#server/services/napkinbets/pools'

const bodySchema = z.object({
  outcomes: z
    .array(
      z.object({
        legId: z.string().min(1),
        outcomeOptionKey: z.string().max(200).optional(),
        outcomeNumericValue: z.number().optional(),
      }),
    )
    .min(1),
  note: z.string().max(500).optional(),
})

const RATE_LIMIT = { namespace: 'napkinbets-call-result', maxRequests: 10, windowMs: 60_000 }

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

    return await callCustomWagerResult(event, wagerId, body)
  },
)
