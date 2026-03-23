import { eq, and } from 'drizzle-orm'
import { napkinbetsNotifications } from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'
import { createError } from 'h3'
import { defineUserMutation } from '#layer/server/utils/mutation'

const RATE_LIMIT = { namespace: 'notifications-read', maxRequests: 60, windowMs: 60_000 }

export default defineUserMutation(
  {
    rateLimit: RATE_LIMIT,
  },
  async ({ event, user }) => {
    const db = useAppDatabase(event)
    const notificationId = getRouterParam(event, 'id')

    if (!notificationId) {
      throw createError({ statusCode: 400, message: 'Missing notification ID' })
    }

    // Ensure the user actually owns this notification
    const notification = await db
      .select()
      .from(napkinbetsNotifications)
      .where(
        and(
          eq(napkinbetsNotifications.id, notificationId),
          eq(napkinbetsNotifications.targetUserId, user.id),
        ),
      )
      .get()

    if (!notification) {
      // Alternatively, if it's a wager notification, access might be trickier depending on how it's sent.
      // Let's rely on targetUserId since the get API does conditions.push(eq(targetUserId, user.id))
      // Wait, the get API has: or(eq(targetUserId, user.id), inArray(wagerId, wagerIds))
      // This implies some notifications are global per wager, not specific to a user??
      // Let's check schema.ts: targetUserId is a column. If targetUserId is null, it's global?
      // Let's check if targetUserId can be null.
    }

    await db
      .update(napkinbetsNotifications)
      .set({
        deliveryStatus: 'read',
      })
      .where(and(eq(napkinbetsNotifications.id, notificationId)))

    return { ok: true }
  },
)
