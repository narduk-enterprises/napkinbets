import { eq } from 'drizzle-orm'
import { createError, getRouterParam } from 'h3'
import { z } from 'zod'
import { defineAdminMutation, withValidatedBody } from '#layer/server/utils/mutation'
import { users } from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'

const bodySchema = z.object({
  isAdmin: z.boolean(),
})

const RATE_LIMIT = { namespace: 'admin-users', maxRequests: 20, windowMs: 60_000 }

export default defineAdminMutation(
  {
    rateLimit: RATE_LIMIT,
    parseBody: withValidatedBody(bodySchema.parse),
  },
  async ({ event, body }) => {
    const userId = getRouterParam(event, 'id')
    if (!userId) {
      throw createError({ statusCode: 400, message: 'Missing user ID.' })
    }

    const db = useAppDatabase(event)
    await db
      .update(users)
      .set({
        isAdmin: body.isAdmin,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, userId))

    return { ok: true }
  },
)
