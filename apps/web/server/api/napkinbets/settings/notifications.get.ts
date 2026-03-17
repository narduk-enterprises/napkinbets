import { eq } from 'drizzle-orm'
import { requireAuth } from '#layer/server/utils/auth'
import { napkinbetsUserNotificationSettings } from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const db = useAppDatabase(event)

  const settings = await db
    .select({
      notifyFriendRequests: napkinbetsUserNotificationSettings.notifyFriendRequests,
      notifyGroupInvites: napkinbetsUserNotificationSettings.notifyGroupInvites,
      notifyWagerUpdates: napkinbetsUserNotificationSettings.notifyWagerUpdates,
    })
    .from(napkinbetsUserNotificationSettings)
    .where(eq(napkinbetsUserNotificationSettings.userId, user.id))
    .get()

  if (settings) {
    return settings
  }

  // Return default settings
  return {
    notifyFriendRequests: true,
    notifyGroupInvites: true,
    notifyWagerUpdates: true,
  }
})
