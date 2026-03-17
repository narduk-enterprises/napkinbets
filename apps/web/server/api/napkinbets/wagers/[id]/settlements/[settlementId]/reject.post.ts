import { createError, getRouterParam, readBody } from 'h3'
import { z } from 'zod'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'
import { rejectSettlement } from '#server/services/napkinbets/pools'

const bodySchema = z.object({
  note: z.string().max(240).default(''),
})

export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, 'napkinbets-settlement-reject', 30, 60_000)

  const wagerId = getRouterParam(event, 'id')
  const settlementId = getRouterParam(event, 'settlementId')
  if (!wagerId || !settlementId) {
    throw createError({ statusCode: 400, message: 'Missing wager or settlement ID.' })
  }

  const parsed = bodySchema.safeParse((await readBody(event)) ?? {})
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues.map((issue) => issue.message).join(', '),
    })
  }

  return await rejectSettlement(event, wagerId, settlementId, parsed.data.note)
})
