import { createError, getRouterParam, readBody } from 'h3'
import { z } from 'zod'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'
import { joinPool } from '#server/services/napkinbets/pools'

const bodySchema = z.object({
  displayName: z.string().min(2).max(80),
  sideLabel: z.string().max(120),
})

export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, 'napkinbets-join', 30, 60_000)

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

  return await joinPool(event, wagerId, parsed.data)
})
