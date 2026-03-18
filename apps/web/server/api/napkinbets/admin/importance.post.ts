import { defineEventHandler, readBody } from 'h3'
import { z } from 'zod'
import { requireAdmin } from '#layer/server/utils/auth'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'
import { scoreEventsWithAi } from '#server/services/napkinbets/importance'

const bodySchema = z.object({
  forceAll: z.boolean().optional().default(false),
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await enforceRateLimit(event, 'admin-importance', 3, 60_000)

  // Read body safely, it might be empty
  const body = await readBody(event).catch(() => ({}))
  const result = bodySchema.safeParse(body || {})
  const forceAll = result.success ? result.data.forceAll : false

  const scoreResult = await scoreEventsWithAi(event, { forceAll })
  return scoreResult
})
