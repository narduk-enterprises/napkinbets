import { createError, getQuery } from 'h3'
import { z } from 'zod'
import {
  refreshDiscoverEventCache,
  type NapkinbetsEventIngestTier,
} from '#server/services/napkinbets/events'
import { requireCronAuth } from '#server/utils/cron'

const querySchema = z.object({
  tier: z.preprocess(
    (value) => (Array.isArray(value) ? value[0] : value),
    z.enum(['manual', 'live-window', 'next-48h', 'next-7d']).default('manual'),
  ),
})

export default defineEventHandler(async (event) => {
  requireCronAuth(event)

  const parsed = querySchema.safeParse(getQuery(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues.map((issue) => issue.message).join(', '),
    })
  }

  return await refreshDiscoverEventCache(event, parsed.data.tier as NapkinbetsEventIngestTier)
})
