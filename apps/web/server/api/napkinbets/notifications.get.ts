import { eq, desc, inArray } from 'drizzle-orm'
import { requireAuth } from '#layer/server/utils/auth'
import {
  napkinbetsNotifications,
  napkinbetsParticipants,
  napkinbetsWagers,
} from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const db = useAppDatabase(event)

  // Find all wager IDs where the user is the owner or a participant
  const [ownedWagers, participantRows] = await Promise.all([
    db
      .select({
        id: napkinbetsWagers.id,
        title: napkinbetsWagers.title,
        slug: napkinbetsWagers.slug,
      })
      .from(napkinbetsWagers)
      .where(eq(napkinbetsWagers.ownerUserId, user.id)),
    db
      .select({
        wagerId: napkinbetsParticipants.wagerId,
      })
      .from(napkinbetsParticipants)
      .where(eq(napkinbetsParticipants.userId, user.id)),
  ])

  const wagerIds = [
    ...new Set([...ownedWagers.map((w) => w.id), ...participantRows.map((p) => p.wagerId)]),
  ]

  if (wagerIds.length === 0) {
    return { notifications: [], unreadCount: 0 }
  }

  // Fetch all notifications for those wagers
  const notifications = await db
    .select({
      id: napkinbetsNotifications.id,
      wagerId: napkinbetsNotifications.wagerId,
      title: napkinbetsNotifications.title,
      body: napkinbetsNotifications.body,
      kind: napkinbetsNotifications.kind,
      deliveryStatus: napkinbetsNotifications.deliveryStatus,
      createdAt: napkinbetsNotifications.createdAt,
    })
    .from(napkinbetsNotifications)
    .where(inArray(napkinbetsNotifications.wagerId, wagerIds))
    .orderBy(desc(napkinbetsNotifications.createdAt))
    .limit(50)

  // Fetch wager titles for context
  const wagerTitleMap = new Map<string, { title: string; slug: string }>()
  if (notifications.length > 0) {
    const relevantWagerIds = [...new Set(notifications.map((n) => n.wagerId))]
    const wagers = await db
      .select({
        id: napkinbetsWagers.id,
        title: napkinbetsWagers.title,
        slug: napkinbetsWagers.slug,
      })
      .from(napkinbetsWagers)
      .where(inArray(napkinbetsWagers.id, relevantWagerIds))

    for (const w of wagers) {
      wagerTitleMap.set(w.id, { title: w.title, slug: w.slug })
    }
  }

  const unreadCount = notifications.filter((n) => n.deliveryStatus === 'queued').length

  return {
    notifications: notifications.map((n) => ({
      id: n.id,
      wagerId: n.wagerId,
      wagerTitle: wagerTitleMap.get(n.wagerId)?.title ?? '',
      wagerSlug: wagerTitleMap.get(n.wagerId)?.slug ?? '',
      title: n.title,
      body: n.body,
      kind: n.kind,
      deliveryStatus: n.deliveryStatus,
      createdAt: n.createdAt,
    })),
    unreadCount,
  }
})
