import { createError, getRouterParam } from 'h3'
import { z } from 'zod'
import { defineUserMutation, withOptionalValidatedBody } from '#layer/server/utils/mutation'
import { queueReminder } from '#server/services/napkinbets/pools'

const bodySchema = z.object({
  message: z.string().max(240).optional(),
})

const RATE_LIMIT = { namespace: 'napkinbets-reminders', maxRequests: 20, windowMs: 60_000 }

export default defineUserMutation(
  {
    rateLimit: RATE_LIMIT,
    parseBody: withOptionalValidatedBody(bodySchema.parse, {}),
  },
  async ({ event, body }) => {
    const wagerId = getRouterParam(event, 'id')
    if (!wagerId) {
      throw createError({ statusCode: 400, message: 'Missing wager ID.' })
    }

    return await queueReminder(event, wagerId, body)
  },
)
