import { requireAdmin } from '#layer/server/utils/auth'
import { napkinbetsWagers, users } from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'
import { desc, ilike, or, count, eq } from 'drizzle-orm'
import { z } from 'zod'

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const db = useAppDatabase(event)
  const query = await getValidatedQuery(event, querySchema.parse)

  const offset = (query.page - 1) * query.limit

  let whereClause;
  if (query.search) {
    const searchPattern = `%${query.search}%`
    whereClause = or(
      ilike(napkinbetsWagers.title, searchPattern),
      ilike(napkinbetsWagers.slug, searchPattern),
      ilike(napkinbetsWagers.league, searchPattern),
    )
  }

  const [totalCount] = await db
    .select({ value: count() })
    .from(napkinbetsWagers)
    .where(whereClause)

  const wagers = await db.query.napkinbetsWagers.findMany({
    where: whereClause,
    orderBy: [desc(napkinbetsWagers.createdAt)],
    limit: query.limit,
    offset,
    with: {
      participants: true,
    },
  })

  // We need owner emails to display in the admin table.
  const ownerIds = [...new Set(wagers.map((w) => w.ownerUserId).filter(Boolean))] as string[]
  const ownerEmailMap = new Map<string, string>()

  if (ownerIds.length > 0) {
    // using Promise.all or batched queries, but here a simple inArray would be best, wait wait..
    // the prompt says "Array.map(async ...) (N+1 queries) — use Promise.all with batched queries."
    // Actually, getting all users at once by ID mapping might be easiest, or just a few select queries in a Promise.all
    const userQueries = ownerIds.map((id) =>
      db.select({ id: users.id, email: users.email }).from(users).where(eq(users.id, id))
    )
    const userResults = await Promise.all(userQueries)
    for (const res of userResults) {
      if (res.length > 0) {
        ownerEmailMap.set(res[0].id, res[0].email)
      }
    }
  }

  return {
    wagers: wagers.map((wager) => ({
      id: wager.id,
      slug: wager.slug,
      title: wager.title,
      status: wager.status,
      creatorName: wager.creatorName,
      ownerUserId: wager.ownerUserId,
      ownerEmail: wager.ownerUserId ? (ownerEmailMap.get(wager.ownerUserId) ?? null) : null,
      league: wager.league,
      eventTitle: wager.eventTitle,
      participantCount: wager.participants.length,
      openSettlementCount: wager.participants.filter(
        (participant) => participant.paymentStatus !== 'confirmed',
      ).length,
      createdAt: wager.createdAt,
    })),
    total: totalCount?.value ?? 0,
  }
})
