import { eq } from 'drizzle-orm'
import { getRouterParam } from 'h3'
import { z } from 'zod'
import { defineAdminMutation, withValidatedBody } from '#layer/server/utils/mutation'
import { napkinbetsWagers } from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'

const bodySchema = z.object({
  status: z.enum(['open', 'locked', 'live', 'settling', 'settled', 'closed', 'archived']),
})

const RATE_LIMIT = { namespace: 'admin-wager-status', maxRequests: 20, windowMs: 60_000 }

export default defineAdminMutation(
  {
    rateLimit: RATE_LIMIT,
    parseBody: withValidatedBody(bodySchema.parse),
  },
  async ({ event, body }) => {
    const wagerId = getRouterParam(event, 'id')
    if (!wagerId) {
      throw createError({ statusCode: 400, message: 'Missing wager ID.' })
    }

    const db = useAppDatabase(event)
    await db
      .update(napkinbetsWagers)
      .set({
        status: body.status,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(napkinbetsWagers.id, wagerId))

    return { ok: true }
  },
)
