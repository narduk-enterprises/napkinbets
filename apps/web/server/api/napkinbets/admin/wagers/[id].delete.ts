import { createError, getRouterParam } from 'h3'
import { defineAdminMutation } from '#layer/server/utils/mutation'
import { napkinbetsWagers } from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'
import { eq } from 'drizzle-orm'

const RATE_LIMIT = { namespace: 'admin-wager-delete', maxRequests: 20, windowMs: 60_000 }

export default defineAdminMutation(
  {
    rateLimit: RATE_LIMIT,
  },
  async ({ event }) => {
    const db = useAppDatabase(event)
    const wagerId = getRouterParam(event, 'id')

    if (!wagerId) {
      throw createError({ statusCode: 400, message: 'Missing wager ID' })
    }

    await db.delete(napkinbetsWagers).where(eq(napkinbetsWagers.id, wagerId))

    return { success: true }
  },
)
