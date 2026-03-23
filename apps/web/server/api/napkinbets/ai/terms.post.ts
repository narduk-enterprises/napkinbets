import { z } from 'zod'
import { defineUserMutation, withValidatedBody } from '#layer/server/utils/mutation'
import { rewriteNapkinbetsTerms } from '#server/services/napkinbets/ai'

const bodySchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(12).max(500),
  format: z.string().min(2).max(40),
  paymentService: z.string().min(2).max(40),
  terms: z.string().min(12).max(600),
})

const RATE_LIMIT = { namespace: 'napkinbets-ai-terms', maxRequests: 8, windowMs: 60_000 }

export default defineUserMutation(
  {
    rateLimit: RATE_LIMIT,
    parseBody: withValidatedBody(bodySchema.parse),
  },
  async ({ event, body }) => rewriteNapkinbetsTerms(event, body),
)
