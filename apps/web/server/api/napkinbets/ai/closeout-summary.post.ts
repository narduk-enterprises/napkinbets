import { createError, readBody } from 'h3'
import { z } from 'zod'
import { requireAuth } from '#layer/server/utils/auth'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'
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

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  await enforceRateLimit(event, 'napkinbets-ai-closeout', 8, 60_000)

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues.map((issue) => issue.message).join(', '),
    })
  }

  return await buildNapkinbetsCloseoutSummary(event, parsed.data)
})
