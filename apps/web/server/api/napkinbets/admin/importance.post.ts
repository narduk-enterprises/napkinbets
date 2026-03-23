import { defineAdminMutation, withOptionalValidatedBody } from '#layer/server/utils/mutation'
import { z } from 'zod'
import { scoreEventsWithAi } from '#server/services/napkinbets/importance'

const bodySchema = z.object({
  forceAll: z.boolean().optional().default(false),
})

const RATE_LIMIT = { namespace: 'admin-importance', maxRequests: 3, windowMs: 60_000 }

export default defineAdminMutation(
  {
    rateLimit: RATE_LIMIT,
    parseBody: withOptionalValidatedBody(bodySchema.parse, {}),
  },
  async ({ event, body }) => scoreEventsWithAi(event, { forceAll: body.forceAll }),
)
