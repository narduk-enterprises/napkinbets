import { defineEventHandler, getQuery } from 'h3'
import { and, asc, eq, gt, or } from 'drizzle-orm'
import { z } from 'zod'
import { useAppDatabase } from '#server/utils/database'
import { napkinbetsEvents } from '#server/database/schema'
import {
  NAPKINBETS_CACHED_EVENT_SELECT,
  toCachedEvent,
} from '#server/services/napkinbets/event-queries'
import type { NapkinbetsCachedEvent } from '#server/services/napkinbets/event-queries'

const querySchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(25),
  after: z.string().trim().optional(),
  sport: z.string().trim().optional(),
  league: z.string().trim().optional(),
  state: z.enum(['pre', 'in']).optional(),
})

function decodeCursor(cursor: string): { startTime: string; id: string } | null {
  try {
    const decoded = JSON.parse(atob(cursor)) as { startTime: string; id: string }
    if (decoded?.startTime && decoded?.id) return decoded
  } catch {
    // ignore
  }
  return null
}

function encodeCursor(startTime: string, id: string): string {
  return btoa(JSON.stringify({ startTime, id }))
}

export default defineEventHandler(async (event) => {
  const rawQuery = getQuery(event)
  const result = querySchema.safeParse(rawQuery)
  if (!result.success) {
    throw createError({ statusCode: 400, message: 'Invalid query parameters' })
  }

  const { limit, after, sport, league, state } = result.data

  const db = useAppDatabase(event)

  const baseConditions = or(eq(napkinbetsEvents.state, 'in'), eq(napkinbetsEvents.state, 'pre'))
  const conditions = [baseConditions]
  if (sport) conditions.push(eq(napkinbetsEvents.sport, sport))
  if (league) conditions.push(eq(napkinbetsEvents.league, league))
  if (state) conditions.push(eq(napkinbetsEvents.state, state))

  let whereClause = conditions.length === 1 ? baseConditions : and(...conditions)

  const cursor = after ? decodeCursor(after) : null
  if (cursor) {
    whereClause = and(
      whereClause,
      or(
        gt(napkinbetsEvents.startTime, cursor.startTime),
        and(eq(napkinbetsEvents.startTime, cursor.startTime), gt(napkinbetsEvents.id, cursor.id)),
      ),
    )
  }

  const rows = await db
    .select(NAPKINBETS_CACHED_EVENT_SELECT)
    .from(napkinbetsEvents)
    .where(whereClause)
    .orderBy(asc(napkinbetsEvents.startTime), asc(napkinbetsEvents.id))
    .limit(limit + 1)

  const events: NapkinbetsCachedEvent[] = rows.slice(0, limit).map((row) => toCachedEvent(row))
  const hasMore = rows.length > limit
  const nextCursor =
    hasMore && rows[limit] ? encodeCursor(rows[limit].startTime, rows[limit].id) : null

  return {
    events,
    nextCursor,
  }
})
