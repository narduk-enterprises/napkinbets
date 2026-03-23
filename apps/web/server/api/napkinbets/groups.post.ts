import { z } from 'zod'
import { defineUserMutation, withValidatedBody } from '#layer/server/utils/mutation'
import { createNapkinbetsGroup } from '#server/services/napkinbets/social'

const bodySchema = z.object({
  name: z.string().min(3).max(80),
  description: z.string().max(280).optional(),
  visibility: z.enum(['public', 'private']),
  joinPolicy: z.enum(['open', 'invite-only', 'closed']),
})

const RATE_LIMIT = { namespace: 'napkinbets-groups', maxRequests: 20, windowMs: 60_000 }

export default defineUserMutation(
  {
    rateLimit: RATE_LIMIT,
    parseBody: withValidatedBody(bodySchema.parse),
  },
  async ({ event, body }) => await createNapkinbetsGroup(event, body),
)
