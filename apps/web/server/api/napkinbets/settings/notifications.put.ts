import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { napkinbetsUserNotificationSettings } from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'
import { defineUserMutation, withValidatedBody } from '#layer/server/utils/mutation'

const bodySchema = z.object({
  notifyFriendRequests: z.boolean(),
  notifyGroupInvites: z.boolean(),
  notifyWagerUpdates: z.boolean(),
})

const RATE_LIMIT = { namespace: 'notifications', maxRequests: 60, windowMs: 60_000 }

export default defineUserMutation(
  {
    rateLimit: RATE_LIMIT,
    parseBody: withValidatedBody(bodySchema.parse),
  },
  async ({ event, body, user }) => {
    const db = useAppDatabase(event)

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
          notifyFriendRequests: body.notifyFriendRequests,
          notifyGroupInvites: body.notifyGroupInvites,
          notifyWagerUpdates: body.notifyWagerUpdates,
          updatedAt: timestamp,
        })
        .where(eq(napkinbetsUserNotificationSettings.userId, user.id))
    } else {
      await db.insert(napkinbetsUserNotificationSettings).values({
        userId: user.id,
        notifyFriendRequests: body.notifyFriendRequests,
        notifyGroupInvites: body.notifyGroupInvites,
        notifyWagerUpdates: body.notifyWagerUpdates,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
    }

    return { ok: true }
  },
)
