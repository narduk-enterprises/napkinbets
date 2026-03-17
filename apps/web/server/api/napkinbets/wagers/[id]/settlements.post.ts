import { createError, getRouterParam, readBody } from 'h3'
import { z } from 'zod'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'
import { recordSettlement } from '#server/services/napkinbets/pools'

const bodySchema = z.object({
  participantId: z.string().max(120).optional(),
  participantName: z.string().min(2).max(80),
  amountDollars: z.coerce.number().min(0).max(10_000),
  method: z.string().min(2).max(40),
  handle: z.string().max(120),
  confirmationCode: z.string().max(120),
  note: z.string().max(240),
})

export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, 'napkinbets-settlements', 30, 60_000)

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

  return await recordSettlement(event, wagerId, parsed.data)
})
