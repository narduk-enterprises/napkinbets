import { createError, readBody } from 'h3'
import { z } from 'zod'
import { requireAuth } from '#layer/server/utils/auth'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'
import { rewriteNapkinbetsTerms } from '#server/services/napkinbets/ai'

const bodySchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(12).max(500),
  format: z.string().min(2).max(40),
  paymentService: z.string().min(2).max(40),
  terms: z.string().min(12).max(600),
})

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  await enforceRateLimit(event, 'napkinbets-ai-terms', 8, 60_000)

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues.map((issue) => issue.message).join(', '),
    })
  }

  return await rewriteNapkinbetsTerms(event, parsed.data)
})
