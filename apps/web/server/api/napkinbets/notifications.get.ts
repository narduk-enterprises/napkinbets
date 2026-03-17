import { eq, desc, inArray, or } from 'drizzle-orm'
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

  const conditions = [eq(napkinbetsNotifications.targetUserId, user.id)]
  if (wagerIds.length > 0) {
    conditions.push(inArray(napkinbetsNotifications.wagerId, wagerIds))
  }

  // Fetch all notifications for wagers and direct notifications
  const notifications = await db
    .select({
      id: napkinbetsNotifications.id,
      wagerId: napkinbetsNotifications.wagerId,
      targetUserId: napkinbetsNotifications.targetUserId,
      title: napkinbetsNotifications.title,
      body: napkinbetsNotifications.body,
      kind: napkinbetsNotifications.kind,
      deliveryStatus: napkinbetsNotifications.deliveryStatus,
      createdAt: napkinbetsNotifications.createdAt,
    })
    .from(napkinbetsNotifications)
    .where(or(...conditions))
    .orderBy(desc(napkinbetsNotifications.createdAt))
    .limit(50)

  // Fetch wager titles for context
  const wagerTitleMap = new Map<string, { title: string; slug: string }>()
  if (notifications.length > 0) {
    const relevantWagerIds = [
      ...new Set(
        notifications.filter((n) => n.wagerId !== null).map((n) => n.wagerId as string),
      ),
    ]

    if (relevantWagerIds.length > 0) {
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
  }

  const unreadCount = notifications.filter((n) => n.deliveryStatus === 'queued').length

  return {
    notifications: notifications.map((n) => ({
      id: n.id,
      wagerId: n.wagerId,
      wagerTitle: n.wagerId && wagerTitleMap.has(n.wagerId) ? wagerTitleMap.get(n.wagerId)?.title : undefined,
      wagerSlug: n.wagerId && wagerTitleMap.has(n.wagerId) ? wagerTitleMap.get(n.wagerId)?.slug : undefined,
      title: n.title,
      body: n.body,
      kind: n.kind,
      deliveryStatus: n.deliveryStatus,
      createdAt: n.createdAt,
    })),
    unreadCount,
  }
})
