import { eq } from 'drizzle-orm'
import { readBody } from 'h3'
import { z } from 'zod'
import { requireAuth } from '#layer/server/utils/auth'
import { napkinbetsUserNotificationSettings } from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'

const bodySchema = z.object({
  notifyFriendRequests: z.boolean(),
  notifyGroupInvites: z.boolean(),
  notifyWagerUpdates: z.boolean(),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const db = useAppDatabase(event)

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues.map((issue) => issue.message).join(', '),
    })
  }

  const existing = await db
    .select({ userId: napkinbetsUserNotificationSettings.userId })
    .from(napkinbetsUserNotificationSettings)
    .where(eq(napkinbetsUserNotificationSettings.userId, user.id))
    .get()

  const timestamp = new Date().toISOString()

  if (existing) {
    await db
      .update(napkinbetsUserNotificationSettings)
      .set({
        notifyFriendRequests: parsed.data.notifyFriendRequests,
        notifyGroupInvites: parsed.data.notifyGroupInvites,
        notifyWagerUpdates: parsed.data.notifyWagerUpdates,
        updatedAt: timestamp,
      })
      .where(eq(napkinbetsUserNotificationSettings.userId, user.id))
  } else {
    await db.insert(napkinbetsUserNotificationSettings).values({
      userId: user.id,
      notifyFriendRequests: parsed.data.notifyFriendRequests,
      notifyGroupInvites: parsed.data.notifyGroupInvites,
      notifyWagerUpdates: parsed.data.notifyWagerUpdates,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
  }

  return { ok: true }
})
