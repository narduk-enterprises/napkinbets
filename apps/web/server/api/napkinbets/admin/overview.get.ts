import { sql, eq, ne } from 'drizzle-orm'
import { requireAdmin } from '#layer/server/utils/auth'
import {
  users,
  napkinbetsFeaturedBets,
  napkinbetsWagers,
  napkinbetsParticipants,
} from '#server/database/schema'
import { loadEventIngestHealth } from '#server/services/napkinbets/events'
import { loadNapkinbetsAiSettings } from '#server/services/napkinbets/settings'
import { useAppDatabase } from '#server/utils/database'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const db = useAppDatabase(event)

  // Run all lightweight queries in parallel — no more loadPoolData()
  const [
    userCountResult,
    adminCountResult,
    ingestHealth,
    aiSettings,
    featuredBetCountResult,
    wagerCountResult,
    openSettlementCountResult,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(users),
    db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.isAdmin, true)),
    loadEventIngestHealth(event),
    loadNapkinbetsAiSettings(event),
    db.select({ count: sql<number>`count(*)` }).from(napkinbetsFeaturedBets),
    db.select({ count: sql<number>`count(*)` }).from(napkinbetsWagers),
    db
      .select({ count: sql<number>`count(*)` })
      .from(napkinbetsParticipants)
      .where(ne(napkinbetsParticipants.paymentStatus, 'confirmed')),
  ])

  const userCount = userCountResult[0]?.count ?? 0
  const adminCount = adminCountResult[0]?.count ?? 0
  const wagerCount = wagerCountResult[0]?.count ?? 0
  const openSettlementCount = openSettlementCountResult[0]?.count ?? 0
  const featuredBetCount = featuredBetCountResult[0]?.count ?? 0

  return {
    metrics: [
      {
        label: 'Registered users',
        value: String(userCount),
        hint: 'accounts with session access',
        icon: 'i-lucide-users',
      },
      {
        label: 'Admins',
        value: String(adminCount),
        hint: 'accounts with host controls',
        icon: 'i-lucide-shield-check',
      },
      {
        label: 'Tracked wagers',
        value: String(wagerCount),
        hint: 'all bets across the product',
        icon: 'i-lucide-ticket',
      },
      {
        label: 'Awaiting settlements',
        value: String(openSettlementCount),
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
    totalCachedEvents: ingestHealth.totalCachedEvents,
    featuredBetCount: featuredBetCount,
    ingestRuns: ingestHealth.latestRuns,
    tierSummaries: ingestHealth.tierSummaries,
    aiSettings,
    refreshedAt: new Date().toISOString(),
  }
})
