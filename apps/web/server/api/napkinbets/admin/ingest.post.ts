import { createError, readBody } from 'h3'
import { z } from 'zod'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'
import { requireAdmin } from '#layer/server/utils/auth'
import {
  refreshDiscoverEventCache,
  type NapkinbetsEventIngestTier,
} from '#server/services/napkinbets/events'

const bodySchema = z.object({
  tier: z.enum(['manual', 'live-window', 'next-48h', 'next-7d']).default('manual'),
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await enforceRateLimit(event, 'napkinbets-admin-ingest', 10, 60_000)

  const parsed = bodySchema.safeParse((await readBody(event)) ?? {})
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues.map((issue) => issue.message).join(', '),
    })
  }

  return await refreshDiscoverEventCache(event, parsed.data.tier as NapkinbetsEventIngestTier)
})
