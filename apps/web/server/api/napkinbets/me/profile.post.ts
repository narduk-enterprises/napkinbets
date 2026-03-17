import { z } from 'zod'
import { eq, sql } from 'drizzle-orm'
import { requireAuth } from '#layer/server/utils/auth'
import { users } from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'

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

export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, 'profile-update', 10, 60_000)
  const authUser = await requireAuth(event)
  const db = useAppDatabase(event)

  const body = await readBody(event)
  const parsed = updateProfileSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues.map((i) => i.message).join(', '),
    })
  }

  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  }

  if (parsed.data.name !== undefined) {
    updates.name = parsed.data.name.trim()
  }

  // avatarUrl is not in the Drizzle schema (layer table), so we handle it separately
  const hasAvatarUpdate = parsed.data.avatarUrl !== undefined

  await db.update(users).set(updates).where(eq(users.id, authUser.id))

  if (hasAvatarUpdate) {
    await db.run(
      sql`UPDATE users SET avatar_url = ${parsed.data.avatarUrl} WHERE id = ${authUser.id}`,
    )
  }

  // Refresh the session so name changes propagate
  if (parsed.data.name !== undefined) {
    await setUserSession(event, {
      user: {
        ...authUser,
        name: parsed.data.name.trim(),
      },
    })
  }

  return { ok: true }
})
