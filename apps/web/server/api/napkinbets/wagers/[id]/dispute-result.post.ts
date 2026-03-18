import { createError, getRouterParam, readBody } from 'h3'
import { z } from 'zod'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'
import { disputeCustomWagerResult } from '#server/services/napkinbets/pools'

const bodySchema = z.object({
  reason: z.string().min(3, 'Provide a reason for the dispute.').max(500),
})

export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, 'napkinbets-dispute-result', 10, 60_000)

  const wagerId = getRouterParam(event, 'id')
  if (!wagerId) {
    throw createError({ statusCode: 400, message: 'Missing wager ID.' })
  }

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues.map((issue) => issue.message).join(', '),
    })
  }

  return await disputeCustomWagerResult(event, wagerId, parsed.data.reason)
})
