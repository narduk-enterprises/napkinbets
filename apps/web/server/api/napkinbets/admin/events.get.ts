import { defineEventHandler, getQuery } from 'h3'
import { desc, asc, like, or, sql } from 'drizzle-orm'
import { z } from 'zod'
import { requireAdmin } from '#layer/server/utils/auth'
import { useAppDatabase } from '#server/utils/database'
import { napkinbetsEvents } from '#server/database/schema'
import { toCachedEvent } from '#server/services/napkinbets/event-queries'
import type { NapkinbetsCachedEvent } from '#server/services/napkinbets/event-queries'

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().trim().optional().default(''),
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const rawQuery = getQuery(event)
  const result = querySchema.safeParse(rawQuery)
  if (!result.success) {
    throw createError({ statusCode: 400, message: 'Invalid query parameters' })
  }

  const { page, limit, search } = result.data

  const db = useAppDatabase(event)

  // Base where clause
  let conditions
  if (search) {
    conditions = or(
      like(napkinbetsEvents.eventTitle, `%${search}%`),
      like(napkinbetsEvents.sport, `%${search}%`),
      like(napkinbetsEvents.league, `%${search}%`),
    )
  }

  // Count total matching rows
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(napkinbetsEvents)
    .where(conditions)
  const count = countResult[0]?.count ?? 0

  // Fetch paginated data
  const rows = await db
    .select()
    .from(napkinbetsEvents)
    .where(conditions)
    .orderBy(desc(napkinbetsEvents.importanceScore), asc(napkinbetsEvents.startTime))
    .limit(limit)
    .offset((page - 1) * limit)

  // Map to cached event shape, which has everything we need
  const cachedEvents: NapkinbetsCachedEvent[] = rows
    .map((row) =>
      // @ts-expect-error - ignoring select mismatch for admin view as we just need basic mapping
      toCachedEvent(row, { events: [] }),
    )
    .filter(Boolean) as NapkinbetsCachedEvent[]

  return {
    events: cachedEvents,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  }
})
