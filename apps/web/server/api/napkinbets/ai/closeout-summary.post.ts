import { z } from 'zod'
import { defineUserMutation, withValidatedBody } from '#layer/server/utils/mutation'
import { buildNapkinbetsCloseoutSummary } from '#server/services/napkinbets/ai'

const bodySchema = z.object({
  title: z.string().min(3).max(120),
  paymentService: z.string().min(2).max(40),
  pendingCount: z.number().min(0),
  submittedCount: z.number().min(0),
  confirmedCount: z.number().min(0),
  rejectedCount: z.number().min(0),
  leaderboard: z.array(
    z.object({
      displayName: z.string().min(1).max(80),
      projectedPayoutCents: z.number().min(0),
      score: z.number().min(0),
    }),
  ),
})

const RATE_LIMIT = { namespace: 'napkinbets-ai-closeout', maxRequests: 8, windowMs: 60_000 }

export default defineUserMutation(
  {
    rateLimit: RATE_LIMIT,
    parseBody: withValidatedBody(bodySchema.parse),
  },
  async ({ event, body }) => buildNapkinbetsCloseoutSummary(event, body),
)
