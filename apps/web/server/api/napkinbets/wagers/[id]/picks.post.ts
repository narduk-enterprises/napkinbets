import { createError, getRouterParam, readBody } from 'h3'
import { z } from 'zod'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'
import { savePick } from '#server/services/napkinbets/pools'

const bodySchema = z.object({
  participantName: z.string().min(2).max(80),
  pickLabel: z.string().min(2).max(120),
  pickType: z.string().max(40),
  pickValue: z.string().max(120),
  confidence: z.coerce.number().min(1).max(10),
  wagerLegId: z.string().max(100).optional(),
  pickNumericValue: z.coerce.number().int().optional(),
})

export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, 'napkinbets-picks', 40, 60_000)

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

  return await savePick(event, wagerId, parsed.data)
})
