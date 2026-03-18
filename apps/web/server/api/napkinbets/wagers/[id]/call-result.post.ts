import { createError, getRouterParam, readBody } from 'h3'
import { z } from 'zod'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'
import { callCustomWagerResult } from '#server/services/napkinbets/pools'

const bodySchema = z.object({
  outcomes: z
    .array(
      z.object({
        legId: z.string().min(1),
        outcomeOptionKey: z.string().max(200).optional(),
        outcomeNumericValue: z.number().optional(),
      }),
    )
    .min(1),
  note: z.string().max(500).optional(),
})

export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, 'napkinbets-call-result', 10, 60_000)

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

  return await callCustomWagerResult(event, wagerId, parsed.data)
})
