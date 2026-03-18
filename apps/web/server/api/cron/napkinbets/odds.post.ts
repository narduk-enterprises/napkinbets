import { refreshAllActivelyTradedOdds } from '#server/services/napkinbets/odds'
import { requireCronAuth } from '#server/utils/cron'
import { useAppDatabase } from '#server/utils/database'

export default defineEventHandler(async (event) => {
  requireCronAuth(event)

  const db = useAppDatabase(event)
  const result = await refreshAllActivelyTradedOdds(db, 15)

  return {
    success: true,
    ...result,
  }
})
