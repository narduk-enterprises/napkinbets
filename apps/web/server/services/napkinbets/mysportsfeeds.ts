import { createError, type H3Event } from 'h3'
import type { NapkinbetsCachedEvent } from './event-queries'
import { getLeagueIdeas, buildIngestWindows, type DiscoverTier } from './espn'
import type { NapkinbetsLeagueDefinition } from './taxonomy'
import { getNapkinbetsSportLabel, getNapkinbetsContextLabel } from './taxonomy'

const MYSPORTSFEEDS_BASE_URL = 'https://api.mysportsfeeds.com/v2.1/pull'

export async function fetchMySportsFeeds<T>(
  event: H3Event,
  league: string,
  endpoint: string,
  query: Record<string, string> = {},
): Promise<T> {
  const config = useRuntimeConfig(event)
  const apiKey = config.mySportsFeedsApiKey
  if (!apiKey) {
    throw createError({ statusCode: 401, message: 'Missing MySportsFeeds API Key' })
  }

  const url = new URL(`${MYSPORTSFEEDS_BASE_URL}/${league}/${endpoint}`)
  for (const [key, value] of Object.entries(query)) {
    if (value) url.searchParams.append(key, value)
  }

  try {
    // MySportsFeeds expects Basic Auth with encoded apikey:MYSPORTSFEEDS
    const authHeader = `Basic ${btoa(`${apiKey}:MYSPORTSFEEDS`)}`

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: authHeader,
      },
    })

    if (response.status === 304) {
      return null as unknown as T
    }

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        message: `MySportsFeeds Error: ${response.statusText}`,
      })
    }
    return (await response.json()) as T
  } catch (err: unknown) {
    if (err instanceof Error && 'statusCode' in err) {
      throw err
    }
    throw createError({ statusCode: 500, message: 'Failed to fetch from MySportsFeeds' })
  }
}

interface MsfTeam {
  id: number
  abbreviation: string
  city?: string
  name?: string
}

interface MsfGame {
  schedule: {
    id: number
    startTime: string
    playedStatus: 'UNPLAYED' | 'LIVE' | 'COMPLETED' | string
    homeTeam: MsfTeam
    awayTeam: MsfTeam
    venue?: { name?: string; city?: string }
  }
  score?: {
    homeScoreTotal?: number | null
    awayScoreTotal?: number | null
  }
}

interface MsfDailyGamesResponse {
  lastUpdatedOn: string
  games: MsfGame[]
}

function formatMsfDate(date: Date) {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

export function normalizeMsfEvent(
  game: MsfGame,
  config: NapkinbetsLeagueDefinition,
  syncedAt: string,
): NapkinbetsCachedEvent {
  const homeName = game.schedule.homeTeam.name
    ? `${game.schedule.homeTeam.city ?? ''} ${game.schedule.homeTeam.name}`.trim()
    : game.schedule.homeTeam.abbreviation
  const awayName = game.schedule.awayTeam.name
    ? `${game.schedule.awayTeam.city ?? ''} ${game.schedule.awayTeam.name}`.trim()
    : game.schedule.awayTeam.abbreviation

  const stateMap: Record<string, 'pre' | 'in' | 'post'> = {
    UNPLAYED: 'pre',
    LIVE: 'in',
    COMPLETED: 'post',
  }
  const state = stateMap[game.schedule.playedStatus] || 'pre'
  const isPost = state === 'post'
  const homeScore = game.score?.homeScoreTotal ?? 0
  const awayScore = game.score?.awayScoreTotal ?? 0

  return {
    id: `mysportsfeeds:${config.key}:${game.schedule.id}`,
    source: 'mysportsfeeds',
    sport: config.sportKey,
    sportLabel: config.sportLabel ?? getNapkinbetsSportLabel(config.sportKey),
    contextKey: config.primaryContextKey,
    contextLabel: config.primaryContextLabel ?? getNapkinbetsContextLabel(config.primaryContextKey),
    league: config.key,
    leagueLabel: config.label,
    eventTitle: `${awayName} at ${homeName}`,
    summary:
      state === 'in'
        ? `${awayName} and ${homeName} are in progress.`
        : state === 'post'
          ? `${awayName} at ${homeName} has finished.`
          : `${awayName} at ${homeName} starts soon.`,
    status: game.schedule.playedStatus,
    state,
    shortStatus: game.schedule.playedStatus,
    startTime: game.schedule.startTime,
    venueName: game.schedule.venue?.name ?? 'Venue TBD',
    venueLocation: game.schedule.venue?.city ?? '',
    broadcast: '',
    homeTeam: {
      id: String(game.schedule.homeTeam.id),
      name: homeName,
      shortName: game.schedule.homeTeam.name ?? homeName,
      abbreviation: game.schedule.homeTeam.abbreviation,
      logo: '',
      homeAway: 'home',
      score:
        game.score?.homeScoreTotal !== undefined && game.score?.homeScoreTotal !== null
          ? String(game.score.homeScoreTotal)
          : '0',
      record: '',
      winner: isPost && homeScore > awayScore,
    },
    awayTeam: {
      id: String(game.schedule.awayTeam.id),
      name: awayName,
      shortName: game.schedule.awayTeam.name ?? awayName,
      abbreviation: game.schedule.awayTeam.abbreviation,
      logo: '',
      homeAway: 'away',
      score:
        game.score?.awayScoreTotal !== undefined && game.score?.awayScoreTotal !== null
          ? String(game.score.awayScoreTotal)
          : '0',
      record: '',
      winner: isPost && awayScore > homeScore,
    },
    leaders: [],
    ideas: getLeagueIdeas(config.sportKey, homeName, awayName),
    importanceScore: 0,
    importanceReason: '',
    lastSyncedAt: syncedAt,
    sourceUpdatedAt: '',
    rawPayload: game,
  }
}

export async function fetchMySportsFeedsLeagueEvents(
  h3Event: H3Event,
  config: NapkinbetsLeagueDefinition,
  tier: DiscoverTier,
  syncedAt: string,
) {
  const windows = buildIngestWindows(tier)
  const normalizedEventsById = new Map<string, NapkinbetsCachedEvent>()

  const msfLeague = config.providerLeagueKey || config.key

  for (const window of windows) {
    const fromStr = formatMsfDate(window.start)
    const toStr = formatMsfDate(window.end)
    const dateParam = `from-${fromStr}-to-${toStr}`

    try {
      const payload = await fetchMySportsFeeds<MsfDailyGamesResponse>(
        h3Event,
        msfLeague,
        'current/games.json',
        { date: dateParam },
      )

      if (payload && payload.games) {
        for (const game of payload.games) {
          const normalized = normalizeMsfEvent(game, config, syncedAt)
          normalizedEventsById.set(normalized.id, normalized)
        }
      }
    } catch (e: unknown) {
      // If fetching one window fails, continue to next
      console.error(
        `[mysportsfeeds] Failed to fetch window ${dateParam} for ${config.key}:`,
        e instanceof Error ? e.message : e,
      )
    }
  }

  return {
    events: Array.from(normalizedEventsById.values()),
  }
}
