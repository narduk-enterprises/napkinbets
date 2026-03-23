import { z } from 'zod'
import { eq, sql } from 'drizzle-orm'
import { users } from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'
import { defineUserMutation, withValidatedBody } from '#layer/server/utils/mutation'

const MAX_AVATAR_SIZE = 150_000 // ~100KB base64

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z
    .string()
    .max(MAX_AVATAR_SIZE)
    .refine(
      (val) => val === '' || val.startsWith('data:image/'),
      'Avatar must be a data URL or empty',
    )
    .optional(),
})

const RATE_LIMIT = { namespace: 'profile-update', maxRequests: 10, windowMs: 60_000 }

export default defineUserMutation(
  {
    rateLimit: RATE_LIMIT,
    parseBody: withValidatedBody(updateProfileSchema.parse),
  },
  async ({ event, body, user: authUser }) => {
    const db = useAppDatabase(event)

    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    }

    if (body.name !== undefined) {
      updates.name = body.name.trim()
    }

    // avatarUrl is not in the Drizzle schema (layer table), so we handle it separately
    const hasAvatarUpdate = body.avatarUrl !== undefined

    await db.update(users).set(updates).where(eq(users.id, authUser.id))

    if (hasAvatarUpdate) {
      await db.run(
        sql`UPDATE users SET avatar_url = ${body.avatarUrl} WHERE id = ${authUser.id}`,
      )
    }

    // Refresh the session so name changes propagate
    if (body.name !== undefined) {
      await setUserSession(event, {
        user: {
          ...authUser,
          name: body.name.trim(),
        },
      })
    }

    return { ok: true }
  },
)
