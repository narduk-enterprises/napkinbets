import { eq } from 'drizzle-orm'
import {
  napkinbetsEvents,
  napkinbetsEventOdds,
  napkinbetsTeams,
  napkinbetsVenues,
} from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'

export default defineEventHandler(async (event) => {
  const encodedId = getRouterParam(event, 'id')
  if (!encodedId) {
    throw createError({ statusCode: 400, message: 'Missing event ID' })
  }
  // The ID is base64 encoded by the client to bypass Nitro routing issues with colons
  const id =
    typeof atob !== 'undefined'
      ? atob(encodedId)
      : Buffer.from(encodedId, 'base64').toString('ascii')

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
  const [homeTeamRows, awayTeamRows, venueRows] = await Promise.all([
    row.homeTeamId
      ? db.select().from(napkinbetsTeams).where(eq(napkinbetsTeams.id, row.homeTeamId)).limit(1)
      : Promise.resolve([]),
    row.awayTeamId
      ? db.select().from(napkinbetsTeams).where(eq(napkinbetsTeams.id, row.awayTeamId)).limit(1)
      : Promise.resolve([]),
    row.venueId
      ? db.select().from(napkinbetsVenues).where(eq(napkinbetsVenues.id, row.venueId)).limit(1)
      : Promise.resolve([]),
  ])

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
      sourceUpdatedAt: row.sourceUpdatedAt ?? null,
      homeTeamProfileSlug: homeTeamRows[0]?.slug ?? null,
      awayTeamProfileSlug: awayTeamRows[0]?.slug ?? null,
      venueProfileSlug: venueRows[0]?.slug ?? null,
      leagueProfileKey: row.league,
      odds,
    },
  }
})
