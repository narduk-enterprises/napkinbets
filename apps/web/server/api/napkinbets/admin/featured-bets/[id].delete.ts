import { requireAdmin } from '#layer/server/utils/auth'
import { napkinbetsFeaturedBets } from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Missing featured bet ID' })
  }

  const db = useAppDatabase(event)
  await db.delete(napkinbetsFeaturedBets).where(eq(napkinbetsFeaturedBets.id, id))

  return { ok: true }
})
