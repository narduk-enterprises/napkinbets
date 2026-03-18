import { refreshAllActivelyTradedOdds } from '#server/services/napkinbets/odds'
import { requireAdmin } from '#layer/server/utils/auth'
import { useAppDatabase } from '#server/utils/database'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await enforceRateLimit(event, 'admin-odds', 5, 60_000)

  const db = useAppDatabase(event)
  const result = await refreshAllActivelyTradedOdds(db, 30)

  return {
    success: true,
    ...result,
  }
})
