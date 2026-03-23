import { defineAdminMutation, withOptionalValidatedBody } from '#layer/server/utils/mutation'
import { z } from 'zod'
import {
  refreshDiscoverEventCache,
  type NapkinbetsEventIngestTier,
} from '#server/services/napkinbets/events'

const bodySchema = z.object({
  tier: z.enum(['manual', 'live-window', 'next-48h', 'next-7d', 'next-8w']).default('manual'),
})

const RATE_LIMIT = { namespace: 'napkinbets-admin-ingest', maxRequests: 10, windowMs: 60_000 }

export default defineAdminMutation(
  {
    rateLimit: RATE_LIMIT,
    parseBody: withOptionalValidatedBody(bodySchema.parse, {}),
  },
  async ({ event, body }) =>
    refreshDiscoverEventCache(event, body.tier as NapkinbetsEventIngestTier),
)
