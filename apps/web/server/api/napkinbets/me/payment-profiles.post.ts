import { z } from 'zod'
import { defineUserMutation, withValidatedBody } from '#layer/server/utils/mutation'
import { saveUserPaymentProfile } from '#server/services/napkinbets/payments'

const bodySchema = z.object({
  provider: z.enum(['Venmo', 'PayPal', 'Cash App', 'Zelle']),
  handle: z.string().min(2).max(120),
  displayLabel: z.string().max(80),
  isDefault: z.boolean(),
  isPublicOnBoards: z.boolean(),
})

const RATE_LIMIT = { namespace: 'napkinbets-payment-profiles', maxRequests: 20, windowMs: 60_000 }

export default defineUserMutation(
  {
    rateLimit: RATE_LIMIT,
    parseBody: withValidatedBody(bodySchema.parse),
  },
  async ({ event, body }) => await saveUserPaymentProfile(event, body),
)
