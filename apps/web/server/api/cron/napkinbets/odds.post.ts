import { refreshActivelyTradedOdds } from '#server/services/napkinbets/polymarket'
import { requireCronAuth } from '#server/utils/cron'
import { useAppDatabase } from '#server/utils/database'

export default defineEventHandler(async (event) => {
  requireCronAuth(event)

  const db = useAppDatabase(event)
  const result = await refreshActivelyTradedOdds(db, 15)

  return {
    success: true,
    ...result,
  }
})
