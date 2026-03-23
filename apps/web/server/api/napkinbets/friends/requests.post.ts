import { z } from 'zod'
import { defineUserMutation, withValidatedBody } from '#layer/server/utils/mutation'
import { sendNapkinbetsFriendRequest } from '#server/services/napkinbets/social'

const bodySchema = z.object({
  targetUserId: z.string().min(1).max(120),
})

const RATE_LIMIT = { namespace: 'napkinbets-friends', maxRequests: 20, windowMs: 60_000 }

export default defineUserMutation(
  {
    rateLimit: RATE_LIMIT,
    parseBody: withValidatedBody(bodySchema.parse),
  },
  async ({ event, body }) => await sendNapkinbetsFriendRequest(event, body.targetUserId),
)
