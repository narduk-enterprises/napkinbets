import { createError, getRouterParam } from 'h3'
import { napkinbetsFeaturedBets } from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'
import { eq } from 'drizzle-orm'
import { defineAdminMutation } from '#layer/server/utils/mutation'

const RATE_LIMIT = { namespace: 'admin-featured-bets-delete', maxRequests: 20, windowMs: 60_000 }

export default defineAdminMutation(
  {
    rateLimit: RATE_LIMIT,
  },
  async ({ event }) => {
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({ statusCode: 400, message: 'Missing featured bet ID' })
    }

    const db = useAppDatabase(event)
    await db.delete(napkinbetsFeaturedBets).where(eq(napkinbetsFeaturedBets.id, id))

    return { ok: true }
  },
)
