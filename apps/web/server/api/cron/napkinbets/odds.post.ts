import { refreshAllActivelyTradedOdds } from '#server/services/napkinbets/odds'
import { requireCronAuth } from '#server/utils/cron'
import { useAppDatabase } from '#server/utils/database'
import { defineCronMutation } from '#layer/server/utils/mutation'

const RATE_LIMIT = { namespace: 'cron-napkinbets-odds', maxRequests: 60, windowMs: 60_000 }

export default defineCronMutation(
  {
    rateLimit: RATE_LIMIT,
  },
  async ({ event }) => {
  requireCronAuth(event)

  const db = useAppDatabase(event)
  const result = await refreshAllActivelyTradedOdds(db, 15)

  return {
    success: true,
    ...result,
  }
  },
)
