import { eq } from 'drizzle-orm'
import { napkinbetsEvents } from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'
import { refreshPolymarketOddsForEventId } from '#server/services/napkinbets/polymarket'

export default defineEventHandler(async (event) => {
  const encodedId = getRouterParam(event, 'id')
  if (!encodedId) {
    throw createError({ statusCode: 400, message: 'Missing event ID' })
  }
  // The ID is base64url encoded by the client to bypass Nitro routing issues with colons
  const id = decodeRouteId(encodedId)

  const db = useAppDatabase(event)

  const [eventRows] = await Promise.all([
    db.select().from(napkinbetsEvents).where(eq(napkinbetsEvents.id, id)).limit(1),
  ])

  const row = eventRows[0]
  if (!row) {
    throw createError({ statusCode: 404, message: 'Event not found' })
  }

  function parseJson<T>(value: string, fallback: T): T {
    try {
      return JSON.parse(value) as T
    } catch {
      return fallback
    }
  }

  const homeTeam = parseJson(row.homeTeamJson, { name: '', shortName: '', abbreviation: '' })
  const awayTeam = parseJson(row.awayTeamJson, { name: '', shortName: '', abbreviation: '' })

  const eventData = {
    id: row.id,
    league: row.league,
    state: row.state as 'pre' | 'in' | 'post',
    startTime: row.startTime,
    eventTitle: row.eventTitle,
    awayTeam: {
      name: awayTeam.name,
      shortName: awayTeam.shortName || awayTeam.name,
      abbreviation: awayTeam.abbreviation || awayTeam.name.substring(0, 3).toUpperCase(),
    },
    homeTeam: {
      name: homeTeam.name,
      shortName: homeTeam.shortName || homeTeam.name,
      abbreviation: homeTeam.abbreviation || homeTeam.name.substring(0, 3).toUpperCase(),
    },
  }

  const refreshedOdds = await refreshPolymarketOddsForEventId(db, row.id, eventData)

  return {
    success: true,
    odds: refreshedOdds,
  }
})
