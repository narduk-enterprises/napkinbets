import { createError, getRouterParam, readBody } from 'h3'
import { z } from 'zod'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'
import { queueReminder } from '#server/services/napkinbets/pools'

const bodySchema = z.object({
  message: z.string().max(240).optional(),
})

export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, 'napkinbets-reminders', 20, 60_000)

  const wagerId = getRouterParam(event, 'id')
  if (!wagerId) {
    throw createError({ statusCode: 400, message: 'Missing wager ID.' })
  }

  const parsed = bodySchema.safeParse((await readBody(event)) || {})
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues.map((issue) => issue.message).join(', '),
    })
  }

  return await queueReminder(event, wagerId, parsed.data)
})
