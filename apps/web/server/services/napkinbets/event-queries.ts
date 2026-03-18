import type { H3Event } from 'h3'
import { asc, eq, inArray, or } from 'drizzle-orm'
import { napkinbetsEvents } from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'
import type {
  CachedDiscoverEventTeam,
  CachedDiscoverEventLeader,
  CachedDiscoverEventIdea,
} from '#server/services/napkinbets/espn'
import type { NapkinbetsEventOdds } from '#server/services/napkinbets/polymarket'

export {
  type CachedDiscoverEventTeam,
  type CachedDiscoverEventLeader,
  type CachedDiscoverEventIdea,
}
export type { NapkinbetsEventOdds }

// ---------------------------------------------------------------------------
// Cached event interfaces
// ---------------------------------------------------------------------------

export interface NapkinbetsCachedEvent {
  id: string
  source: 'espn' | 'mysportsfeeds' | 'balldontlie'
  sport: string
  sportLabel: string
  contextKey: string
  contextLabel: string
  league: string
  leagueLabel: string
  eventTitle: string
  summary: string
  status: string
  state: 'pre' | 'in' | 'post'
  shortStatus: string
  startTime: string
  venueName: string
  venueLocation: string
  broadcast: string
  homeTeam: CachedDiscoverEventTeam
  awayTeam: CachedDiscoverEventTeam
  leaders: CachedDiscoverEventLeader[]
  ideas: CachedDiscoverEventIdea[]
  importanceScore: number
  importanceReason: string
  lastSyncedAt: string
  sourceUpdatedAt: string | null
  rawPayload: unknown
  odds?: NapkinbetsEventOdds | null
}

export interface NapkinbetsCachedEventRow {
  id: string
  source: string
  sport: string
  sportLabel: string
  contextKey: string
  contextLabel: string
  league: string
  leagueLabel: string
  eventTitle: string
  summary: string
  status: string
  state: string
  shortStatus: string
  startTime: string
  venueName: string
  venueLocation: string
  broadcast: string
  homeTeamJson: string
  awayTeamJson: string
  leadersJson: string
  ideasJson: string
  importanceScore: number
  importanceReason: string
  lastSyncedAt: string
  sourceUpdatedAt: string | null
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const NAPKINBETS_CACHED_EVENT_SELECT = {
  id: napkinbetsEvents.id,
  source: napkinbetsEvents.source,
  sport: napkinbetsEvents.sport,
  sportLabel: napkinbetsEvents.sportLabel,
  contextKey: napkinbetsEvents.contextKey,
  contextLabel: napkinbetsEvents.contextLabel,
  league: napkinbetsEvents.league,
  leagueLabel: napkinbetsEvents.leagueLabel,
  eventTitle: napkinbetsEvents.eventTitle,
  summary: napkinbetsEvents.summary,
  status: napkinbetsEvents.status,
  state: napkinbetsEvents.state,
  shortStatus: napkinbetsEvents.shortStatus,
  startTime: napkinbetsEvents.startTime,
  venueName: napkinbetsEvents.venueName,
  venueLocation: napkinbetsEvents.venueLocation,
  broadcast: napkinbetsEvents.broadcast,
  homeTeamJson: napkinbetsEvents.homeTeamJson,
  awayTeamJson: napkinbetsEvents.awayTeamJson,
  leadersJson: napkinbetsEvents.leadersJson,
  ideasJson: napkinbetsEvents.ideasJson,
  importanceScore: napkinbetsEvents.importanceScore,
  importanceReason: napkinbetsEvents.importanceReason,
  lastSyncedAt: napkinbetsEvents.lastSyncedAt,
  sourceUpdatedAt: napkinbetsEvents.sourceUpdatedAt,
} as const

// ---------------------------------------------------------------------------
// Shared utilities
// ---------------------------------------------------------------------------

export function parseJsonValue<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function isWithinHours(date: Date, hours: number, now: Date) {
  return date.getTime() <= now.getTime() + hours * 60 * 60 * 1000
}

// ---------------------------------------------------------------------------
// Row → domain mappers
// ---------------------------------------------------------------------------

export function toCachedEvent(row: NapkinbetsCachedEventRow): NapkinbetsCachedEvent {
  return {
    id: row.id,
    source: row.source as 'espn' | 'mysportsfeeds' | 'balldontlie',
    sport: row.sport,
    sportLabel: row.sportLabel,
    contextKey: row.contextKey,
    contextLabel: row.contextLabel,
    league: row.league,
    leagueLabel: row.leagueLabel,
    eventTitle: row.eventTitle,
    summary: row.summary,
    status: row.status,
    state: row.state as 'pre' | 'in' | 'post',
    shortStatus: row.shortStatus,
    startTime: row.startTime,
    venueName: row.venueName,
    venueLocation: row.venueLocation,
    broadcast: row.broadcast,
    homeTeam: parseJsonValue<CachedDiscoverEventTeam>(row.homeTeamJson, {
      id: '',
      name: '',
      shortName: '',
      abbreviation: '',
      logo: '',
      homeAway: 'home',
      score: '0',
      record: '',
      winner: false,
    }),
    awayTeam: parseJsonValue<CachedDiscoverEventTeam>(row.awayTeamJson, {
      id: '',
      name: '',
      shortName: '',
      abbreviation: '',
      logo: '',
      homeAway: 'away',
      score: '0',
      record: '',
      winner: false,
    }),
    leaders: parseJsonValue<CachedDiscoverEventLeader[]>(row.leadersJson, []),
    ideas: parseJsonValue<CachedDiscoverEventIdea[]>(row.ideasJson, []),
    importanceScore: row.importanceScore ?? 0,
    importanceReason: row.importanceReason ?? '',
    lastSyncedAt: row.lastSyncedAt,
    sourceUpdatedAt: row.sourceUpdatedAt ?? null,
    rawPayload: null,
    odds: null,
  }
}

export function toLiveGame(event: NapkinbetsCachedEvent) {
  const isMatchup = event.awayTeam.homeAway === 'away' && event.homeTeam.homeAway === 'home'

  return {
    id: event.id,
    name: event.eventTitle,
    shortName: isMatchup
      ? `${event.awayTeam.abbreviation || event.awayTeam.shortName} @ ${event.homeTeam.abbreviation || event.homeTeam.shortName}`
      : event.eventTitle,
    status: event.shortStatus,
    sport: event.sport,
    league: event.league,
    competitors: [
      {
        name: event.awayTeam.name,
        abbreviation: event.awayTeam.abbreviation,
        score: event.awayTeam.score,
        homeAway: event.awayTeam.homeAway,
      },
      {
        name: event.homeTeam.name,
        abbreviation: event.homeTeam.abbreviation,
        score: event.homeTeam.score,
        homeAway: event.homeTeam.homeAway,
      },
    ],
  }
}

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

export async function loadCachedEventsByIds(event: H3Event, eventIds: string[]) {
  if (eventIds.length === 0) {
    return new Map<string, NapkinbetsCachedEvent>()
  }

  const db = useAppDatabase(event)
  const rows = await db
    .select(NAPKINBETS_CACHED_EVENT_SELECT)
    .from(napkinbetsEvents)
    .where(inArray(napkinbetsEvents.id, eventIds))

  return new Map(rows.map((row) => [row.id, toCachedEvent(row)]))
}

export async function loadFeaturedLiveGames(event: H3Event, limit = 6) {
  const db = useAppDatabase(event)
  const rows = await db
    .select(NAPKINBETS_CACHED_EVENT_SELECT)
    .from(napkinbetsEvents)
    .where(or(eq(napkinbetsEvents.state, 'in'), eq(napkinbetsEvents.state, 'pre')))
    .orderBy(asc(napkinbetsEvents.state), asc(napkinbetsEvents.startTime))

  return rows
    .map((row) => toCachedEvent(row))
    .filter((item) => item.state === 'in' || isWithinHours(new Date(item.startTime), 6, new Date()))
    .slice(0, limit)
    .map((item) => toLiveGame(item))
}
