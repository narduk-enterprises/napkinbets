import { requireAdmin } from '#layer/server/utils/auth'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'
import { napkinbetsWagers } from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await enforceRateLimit(event, 'admin-wager-delete', 20, 60_000)

  const db = useAppDatabase(event)
  const wagerId = event.context.params?.id

  if (!wagerId) {
    throw createError({ statusCode: 400, message: 'Missing wager ID' })
  }

  await db.delete(napkinbetsWagers).where(eq(napkinbetsWagers.id, wagerId))

  return { success: true }
})
