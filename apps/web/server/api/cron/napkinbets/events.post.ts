import { createError, getQuery } from 'h3'
import { z } from 'zod'
import {
  refreshDiscoverEventCache,
  type NapkinbetsEventIngestTier,
} from '#server/services/napkinbets/events'
import { requireCronAuth } from '#server/utils/cron'
import { defineCronMutation } from '#layer/server/utils/mutation'

const RATE_LIMIT = { namespace: 'cron-napkinbets-events', maxRequests: 60, windowMs: 60_000 }

const querySchema = z.object({
  tier: z.preprocess(
    (value) => (Array.isArray(value) ? value[0] : value),
    z.enum(['manual', 'live-window', 'next-48h', 'next-7d', 'next-8w']).default('manual'),
  ),
})

export default defineCronMutation(
  {
    rateLimit: RATE_LIMIT,
  },
  async ({ event }) => {
    requireCronAuth(event)

    const parsed = querySchema.safeParse(getQuery(event))
    if (!parsed.success) {
      throw createError({
        statusCode: 400,
        message: parsed.error.issues.map((issue) => issue.message).join(', '),
      })
    }

    return await refreshDiscoverEventCache(event, parsed.data.tier as NapkinbetsEventIngestTier)
  },
)
