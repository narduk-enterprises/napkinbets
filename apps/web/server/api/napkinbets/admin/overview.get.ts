import { requireAdmin } from '#layer/server/utils/auth'
import { users } from '#server/database/schema'
import { loadEventIngestHealth } from '#server/services/napkinbets/events'
import { loadPoolData } from '#server/services/napkinbets/pools'
import { loadNapkinbetsAiSettings } from '#server/services/napkinbets/settings'
import { useAppDatabase } from '#server/utils/database'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const db = useAppDatabase(event)
  const [dashboard, userRows, ingestHealth, aiSettings] = await Promise.all([
    loadPoolData(event),
    db.select().from(users).orderBy(users.createdAt),
    loadEventIngestHealth(event),
    loadNapkinbetsAiSettings(event),
  ])

  const ownedCountByUser = new Map<string, number>()
  const joinedCountByUser = new Map<string, number>()

  for (const wager of dashboard.wagers) {
    if (wager.ownerUserId) {
      ownedCountByUser.set(wager.ownerUserId, (ownedCountByUser.get(wager.ownerUserId) ?? 0) + 1)
    }

    for (const participant of wager.participants) {
      if (!participant.userId) {
        continue
      }

      joinedCountByUser.set(
        participant.userId,
        (joinedCountByUser.get(participant.userId) ?? 0) + 1,
      )
    }
  }

  const userById = new Map(userRows.map((user) => [user.id, user]))

  return {
    metrics: [
      {
        label: 'Registered users',
        value: String(userRows.length),
        hint: 'accounts with session access',
        icon: 'i-lucide-users',
      },
      {
        label: 'Admins',
        value: String(userRows.filter((user) => Boolean(user.isAdmin)).length),
        hint: 'accounts with board controls',
        icon: 'i-lucide-shield-check',
      },
      {
        label: 'Tracked wagers',
        value: String(dashboard.wagers.length),
        hint: 'all pools across the product',
        icon: 'i-lucide-ticket',
      },
      {
        label: 'Awaiting settlements',
        value: String(
          dashboard.wagers
            .flatMap((wager) => wager.participants)
            .filter((participant) => participant.paymentStatus !== 'confirmed').length,
        ),
        hint: 'participants still missing proof',
        icon: 'i-lucide-wallet',
      },
      {
        label: 'Tracked events',
        value: String(ingestHealth.totalCachedEvents),
        hint: 'event cards ready for Events',
        icon: 'i-lucide-radar',
      },
    ],
    users: userRows.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: Boolean(user.isAdmin),
      createdAt: user.createdAt,
      ownedWagerCount: ownedCountByUser.get(user.id) ?? 0,
      joinedWagerCount: joinedCountByUser.get(user.id) ?? 0,
    })),
    wagers: dashboard.wagers.map((wager) => ({
      id: wager.id,
      slug: wager.slug,
      title: wager.title,
      status: wager.status,
      creatorName: wager.creatorName,
      ownerUserId: wager.ownerUserId,
      ownerEmail: wager.ownerUserId ? (userById.get(wager.ownerUserId)?.email ?? null) : null,
      league: wager.league,
      eventTitle: wager.eventTitle,
      participantCount: wager.participants.length,
      openSettlementCount: wager.participants.filter(
        (participant) => participant.paymentStatus !== 'confirmed',
      ).length,
      createdAt: wager.notifications[0]?.createdAt || wager.eventStartsAt || dashboard.refreshedAt,
    })),
    totalCachedEvents: ingestHealth.totalCachedEvents,
    ingestRuns: ingestHealth.latestRuns,
    aiSettings,
    refreshedAt: dashboard.refreshedAt,
  }
})
