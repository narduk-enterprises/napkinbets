import { eq } from 'drizzle-orm'
import { napkinbetsEvents, napkinbetsEventOdds } from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Missing event ID' })
  }

  const db = useAppDatabase(event)

  const [eventRows, oddsRows] = await Promise.all([
    db.select().from(napkinbetsEvents).where(eq(napkinbetsEvents.id, id)).limit(1),
    db.select().from(napkinbetsEventOdds).where(eq(napkinbetsEventOdds.eventId, id)).limit(1),
  ])

  const row = eventRows[0]
  if (!row) {
    throw createError({ statusCode: 404, message: 'Event not found' })
  }

  const oddsRow = oddsRows[0] ?? null

  function parseJson<T>(value: string, fallback: T): T {
    try {
      return JSON.parse(value) as T
    } catch {
      return fallback
    }
  }

  const odds = oddsRow
    ? {
        source: oddsRow.source as 'polymarket',
        url: oddsRow.polymarketUrl ?? '',
        updatedAt: oddsRow.fetchedAt,
        moneyline: parseJson(oddsRow.moneylineJson ?? '{}', null),
        spread: parseJson(oddsRow.spreadJson ?? '{}', null),
        total: parseJson(oddsRow.totalJson ?? '{}', null),
        extraMarkets: parseJson(oddsRow.extraMarketsJson, []),
        volume: oddsRow.volume,
        priceChange24h: oddsRow.priceChange24h,
        commentCount: oddsRow.commentCount,
      }
    : null

  return {
    event: {
      id: row.id,
      source: row.source,
      sport: row.sport,
      sportLabel: row.sportLabel,
      contextKey: row.contextKey,
      contextLabel: row.contextLabel,
      league: row.league,
      leagueLabel: row.leagueLabel,
      eventTitle: row.eventTitle,
      summary: row.summary,
      status: row.status,
      state: row.state,
      shortStatus: row.shortStatus,
      startTime: row.startTime,
      venueName: row.venueName,
      venueLocation: row.venueLocation,
      broadcast: row.broadcast,
      homeTeam: parseJson(row.homeTeamJson, {}),
      awayTeam: parseJson(row.awayTeamJson, {}),
      leaders: parseJson(row.leadersJson, []),
      ideas: parseJson(row.ideasJson, []),
      lastSyncedAt: row.lastSyncedAt,
      odds,
    },
  }
})
