import { createError, type H3Event } from 'h3'
import type { NapkinbetsCachedEvent } from './event-queries'
import { getLeagueIdeas, buildIngestWindows, type DiscoverTier } from './espn'
import type { NapkinbetsLeagueDefinition } from './taxonomy'
import { getNapkinbetsSportLabel, getNapkinbetsContextLabel } from './taxonomy'

const BALLDONTLIE_BASE_URL = 'https://api.balldontlie.io'

// Endpoints:
// GET /v1/games (+ dates[], team_ids[], start_date, end_date) -> Events/schedule
// GET /v1/box_scores/live -> Live/in-progress box scores
export async function fetchBallDontLie<T>(
  event: H3Event,
  endpoint: string,
  query: Record<string, string | string[]> = {},
): Promise<T> {
  const config = useRuntimeConfig(event)
  const apiKey = config.ballDontLieApiKey
  if (!apiKey) {
    throw createError({ statusCode: 401, message: 'Missing BALLDONTLIE API Key' })
  }

  const url = new URL(`${BALLDONTLIE_BASE_URL}${endpoint}`)
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      for (const val of value) {
        url.searchParams.append(`${key}[]`, val)
      }
    } else if (value) {
      url.searchParams.append(key, value as string)
    }
  }

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })
    if (response.status === 429) {
      throw createError({ statusCode: 429, message: 'BALLDONTLIE rate limit exceeded (5/min).' })
    }
    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        message: `BALLDONTLIE Error: ${response.statusText}`,
      })
    }
    return (await response.json()) as T
  } catch (err: unknown) {
    if (err instanceof Error && 'statusCode' in err) {
      throw err
    }
    throw createError({ statusCode: 500, message: 'Failed to fetch from BALLDONTLIE' })
  }
}

interface BdlTeam {
  id: number
  abbreviation: string
  city: string
  name: string
  full_name: string
}

interface BdlGame {
  id: number
  date: string
  home_team: BdlTeam
  visitor_team: BdlTeam
  home_team_score: number
  visitor_team_score: number
  status: string
  period: number
  time: string
  postseason: boolean
}

interface BdlGamesResponse {
  data: BdlGame[]
}

export function normalizeBdlEvent(
  game: BdlGame,
  config: NapkinbetsLeagueDefinition,
  syncedAt: string,
): NapkinbetsCachedEvent {
  const homeName = game.home_team.full_name
  const awayName = game.visitor_team.full_name

  const isFinal = game.status.toLowerCase().includes('final')
  const isPostponed =
    game.status.toLowerCase().includes('postponed') ||
    game.status.toLowerCase().includes('canceled')

  // Try to determine state based on period/status
  let state: 'pre' | 'in' | 'post' = 'pre'
  if (isFinal || isPostponed) {
    state = 'post'
  } else if (game.period > 0) {
    state = 'in'
  }

  const homeScore = game.home_team_score ?? 0
  const awayScore = game.visitor_team_score ?? 0

  return {
    id: `balldontlie:${config.key}:${game.id}`,
    source: 'balldontlie',
    sport: config.sportKey,
    sportLabel: config.sportLabel ?? getNapkinbetsSportLabel(config.sportKey),
    contextKey: config.primaryContextKey,
    contextLabel: config.primaryContextLabel ?? getNapkinbetsContextLabel(config.primaryContextKey),
    league: config.key,
    leagueLabel: config.label,
    eventTitle: `${awayName} at ${homeName}`,
    summary:
      state === 'in'
        ? `${awayName} and ${homeName} are playing (Q${game.period} ${game.time}).`
        : state === 'post'
          ? `${awayName} at ${homeName} has finished.`
          : `${awayName} at ${homeName} is scheduled.`,
    status: game.status,
    state,
    shortStatus: game.status,
    startTime: game.date,
    venueName: 'Venue TBD',
    venueLocation: game.home_team.city,
    broadcast: '',
    homeTeam: {
      id: String(game.home_team.id),
      name: homeName,
      shortName: game.home_team.name ?? homeName,
      abbreviation: game.home_team.abbreviation,
      logo: '',
      homeAway: 'home',
      score: String(homeScore),
      record: '',
      winner: state === 'post' && homeScore > awayScore,
    },
    awayTeam: {
      id: String(game.visitor_team.id),
      name: awayName,
      shortName: game.visitor_team.name ?? awayName,
      abbreviation: game.visitor_team.abbreviation,
      logo: '',
      homeAway: 'away',
      score: String(awayScore),
      record: '',
      winner: state === 'post' && awayScore > homeScore,
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

export async function fetchBallDontLieLeagueEvents(
  h3Event: H3Event,
  config: NapkinbetsLeagueDefinition,
  tier: DiscoverTier,
  syncedAt: string,
) {
  const windows = buildIngestWindows(tier)
  const normalizedEventsById = new Map<string, NapkinbetsCachedEvent>()

  for (const window of windows) {
    // BallDontLie expects YYYY-MM-DD
    const startStr = window.start.toISOString().split('T')[0]
    const endStr = window.end.toISOString().split('T')[0]

    try {
      const payload = await fetchBallDontLie<BdlGamesResponse>(h3Event, '/v1/games', {
        start_date: startStr!,
        end_date: endStr!,
        per_page: '100',
      })

      if (payload && payload.data) {
        for (const game of payload.data) {
          const normalized = normalizeBdlEvent(game, config, syncedAt)
          normalizedEventsById.set(normalized.id, normalized)
        }
      }
    } catch (e: unknown) {
      console.error(
        `[balldontlie] Failed to fetch window ${startStr} - ${endStr} for ${config.key}:`,
        e instanceof Error ? e.message : e,
      )
    }
  }

  return {
    events: Array.from(normalizedEventsById.values()),
  }
}
