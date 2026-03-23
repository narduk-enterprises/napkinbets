import { refreshAllActivelyTradedOdds } from '#server/services/napkinbets/odds'
import { defineAdminMutation } from '#layer/server/utils/mutation'
import { useAppDatabase } from '#server/utils/database'

const RATE_LIMIT = { namespace: 'admin-odds', maxRequests: 5, windowMs: 60_000 }

export default defineAdminMutation(
  {
    rateLimit: RATE_LIMIT,
  },
  async ({ event }) => {
    const db = useAppDatabase(event)
    const result = await refreshAllActivelyTradedOdds(db, 30)

    return {
      success: true,
      ...result,
    }
  },
)
