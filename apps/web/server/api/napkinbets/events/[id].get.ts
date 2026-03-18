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
  // The ID is base64url encoded by the client to bypass Nitro routing issues with colons
  const id = decodeRouteId(encodedId)

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

  // ─── Extract linescores from raw ESPN payload ──────────
  interface RawLinescoreEntry {
    value?: number
  }

  interface RawCompetitor {
    homeAway?: 'home' | 'away'
    linescores?: RawLinescoreEntry[]
  }

  interface RawCompetition {
    competitors?: RawCompetitor[]
  }

  interface RawPayload {
    competitions?: RawCompetition[]
  }

  function extractLinescores(rawJson: string | null, sport: string, state: string) {
    if (state === 'pre' || !rawJson) return null

    try {
      const raw = JSON.parse(rawJson) as RawPayload
      const competitors = raw?.competitions?.[0]?.competitors
      if (!competitors) return null

      const awayComp = competitors.find((c) => c.homeAway === 'away')
      const homeComp = competitors.find((c) => c.homeAway === 'home')

      const awayScores = awayComp?.linescores?.map((ls) => ls.value ?? 0)
      const homeScores = homeComp?.linescores?.map((ls) => ls.value ?? 0)

      if (!awayScores?.length || !homeScores?.length) return null

      const periodCount = Math.max(awayScores.length, homeScores.length)
      let periodLabels: string[]

      if (sport === 'baseball') {
        periodLabels = Array.from({ length: periodCount }, (_, i) => String(i + 1))
      } else if (sport === 'football' || sport === 'basketball') {
        if (periodCount <= 4) {
          periodLabels = Array.from({ length: periodCount }, (_, i) => `Q${i + 1}`)
        } else {
          periodLabels = [
            ...Array.from({ length: 4 }, (_, i) => `Q${i + 1}`),
            ...Array.from({ length: periodCount - 4 }, (_, i) => `OT${i > 0 ? i + 1 : ''}`.trim()),
          ]
        }
      } else if (sport === 'hockey') {
        if (periodCount <= 3) {
          periodLabels = Array.from({ length: periodCount }, (_, i) => `P${i + 1}`)
        } else {
          periodLabels = [
            ...Array.from({ length: 3 }, (_, i) => `P${i + 1}`),
            ...Array.from({ length: periodCount - 3 }, (_, i) => (i === 0 ? 'OT' : `OT${i + 1}`)),
          ]
        }
      } else {
        periodLabels = Array.from({ length: periodCount }, (_, i) => String(i + 1))
      }

      return { periodLabels, away: awayScores, home: homeScores }
    } catch {
      return null
    }
  }

  const linescores = extractLinescores(row.rawPayloadJson ?? null, row.sport, row.state)

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
      linescores,
    },
  }
})
