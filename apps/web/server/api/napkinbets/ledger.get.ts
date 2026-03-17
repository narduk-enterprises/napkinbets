import { requireAuth } from '#layer/server/utils/auth'
import { computeLedger } from '#server/services/napkinbets/ledger'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  return await computeLedger(event, user.id)
})
