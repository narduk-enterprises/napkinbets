import { readBody } from 'h3'
import { z } from 'zod'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'
import { saveUserPaymentProfile } from '#server/services/napkinbets/payments'

const bodySchema = z.object({
  provider: z.enum(['Venmo', 'PayPal', 'Cash App', 'Zelle']),
  handle: z.string().min(2).max(120),
  displayLabel: z.string().max(80),
  isDefault: z.boolean(),
  isPublicOnBoards: z.boolean(),
})

export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, 'napkinbets-payment-profiles', 20, 60_000)

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues.map((issue) => issue.message).join(', '),
    })
  }

  return await saveUserPaymentProfile(event, parsed.data)
})
