import type { H3Event } from 'h3'
import { and, asc, desc, eq, inArray, lt, or, sql } from 'drizzle-orm'
import {
  napkinbetsEvents,
  napkinbetsEventOdds,
  napkinbetsEventSnapshots,
  napkinbetsIngestRuns,
  napkinbetsFeaturedBets,
  napkinbetsWagers,
} from '#server/database/schema'
import type { NapkinbetsLeagueDefinition } from '#server/services/napkinbets/taxonomy'
import { loadNapkinbetsLeaguesFromStore } from '#server/services/napkinbets/taxonomy-store'
import {
  enrichNapkinbetsEventsWithPolymarketOdds,
  type NapkinbetsEventOdds,
} from '#server/services/napkinbets/polymarket'
import { linkEventsToCanonicalEntities } from '#server/services/napkinbets/entities'
import { useAppDatabase } from '#server/utils/database'
import {
  buildIngestWindows,
  fetchLeagueEvents,
  isDiscoverCacheStale,
  isLeagueActive,
  type DiscoverTier,
  type IngestWindow,
} from '#server/services/napkinbets/espn'
import { fetchMySportsFeedsLeagueEvents } from '#server/services/napkinbets/mysportsfeeds'
import { fetchBallDontLieLeagueEvents } from '#server/services/napkinbets/balldontlie'
import {
  type NapkinbetsCachedEvent,
  NAPKINBETS_CACHED_EVENT_SELECT,
  toCachedEvent,
  parseJsonValue,
} from '#server/services/napkinbets/event-queries'

// -- Re-export from extracted modules for backward compatibility -------------
export {
  buildIngestWindows,
  buildEspnScoreboardUrl,
  normalizeMatchupEspnEvent,
  normalizeTournamentEspnEvent,
  isLeagueActive,
  isDiscoverCacheStale,
  type DiscoverTier,
  type IngestWindow,
  type CachedDiscoverEventIdea,
  type CachedDiscoverEventLeader,
  type CachedDiscoverEventTeam,
} from '#server/services/napkinbets/espn'

export {
  type NapkinbetsCachedEvent,
  type NapkinbetsCachedEventRow,
  NAPKINBETS_CACHED_EVENT_SELECT,
  toCachedEvent,
  toLiveGame,
  loadCachedEventsByIds,
  loadFeaturedLiveGames,
  parseJsonValue,
} from '#server/services/napkinbets/event-queries'

// -- Types -------------------------------------------------------------------

interface NapkinbetsCreatePrefillQuery {
  source: string
  eventId: string
  eventTitle: string
  eventStartsAt: string
  eventStatus: string
  sport: string
  contextKey: string
  league: string
  venueName: string
  homeTeamName: string
  awayTeamName: string
  format: string
  sideOptions: string[]
}

interface NapkinbetsDiscoverySpotlightAsset {
  kind: 'editorial' | 'mark' | 'logo' | 'headshot'
  src: string
  alt: string
}

interface NapkinbetsDiscoverySpotlight {
  id: string
  label: string
  title: string
  subtitle: string
  summary: string
  windowLabel: string
  venueLabel: string
  accent: 'major' | 'tour' | 'watch'
  assets: NapkinbetsDiscoverySpotlightAsset[]
  prefill: NapkinbetsCreatePrefillQuery
}

export interface NapkinbetsDiscoverSection {
  key: 'live-now' | 'starting-soon' | 'today' | 'next-up'
  label: string
  description: string
  events: NapkinbetsCachedEvent[]
}

export interface NapkinbetsDiscoverFilterOption {
  value: string
  label: string
}

export interface NapkinbetsDiscoverFilters {
  sports: Array<{ value: string; label: string }>
  contexts: Array<{ value: string; label: string }>
  leagues: Array<{ value: string; label: string }>
  leaguesBySport: Record<string, Array<{ value: string; label: string }>>
  states: Array<{ value: string; label: string }>
}

export type NapkinbetsEventIngestTier = DiscoverTier
export type NapkinbetsDiscoverScope = 'live' | 'next-48h' | 'next-7d' | 'next-8w' | 'all'

// -- Constants ---------------------------------------------------------------

const SNAPSHOT_INSERT_BATCH_SIZE = 8
const EVENT_LOOKUP_BATCH_SIZE = 64

export const NAPKINBETS_PROP_IDEAS = [
  {
    id: 'watch-party-chaos',
    category: 'Watch party',
    title: 'Momentum swings and couch-call props',
    context: 'Friendly social bets around the live room, not the sportsbook menu.',
    summary:
      'Use the shared screen, the group chat, and the room vibe for quick side markets that are easy to verify.',
    examples: [
      'Which team scores the next 10 points?',
      'Will the game stay within one possession in the final two minutes?',
      'Who calls the turning point first in the group chat?',
    ],
    settlementHint: 'Settle from the broadcast and the group thread immediately after the game.',
  },
  {
    id: 'golf-pool-sidepots',
    category: 'Golf drafts',
    title: 'Golf drafts plus side bets',
    context: 'Inspired by the original golf draft workflow.',
    summary:
      'Mix a draft order, low-round bonus, and one weather-sensitive side pot without needing any direct payment processing.',
    examples: [
      'Lowest round on day one',
      'Most birdies by your drafted roster',
      'Closest-to-pin side pot during the watch session',
    ],
    settlementHint:
      'Use the leaderboard plus posted group-bet rules to settle everything manually.',
  },
  {
    id: 'entertainment-and-culture',
    category: 'Entertainment',
    title: 'Non-sports prompts for group nights',
    context: 'The app should feel broader than games only.',
    summary: `Napkinbets can host reality-show outcomes, awards-night calls, and other "who\u2019s right tonight?" bets.`,
    examples: [
      'Which contestant gets called safe first?',
      'Will the acceptance speech run over 45 seconds?',
      'Which trailer drops before the main event starts?',
    ],
    settlementHint:
      'Only use prompts with clear public outcomes that the group can verify together.',
  },
] as const

// -- Shared utilities --------------------------------------------------------

function nowIso() {
  return new Date().toISOString()
}

function addDays(date: Date, days: number) {
  const copy = new Date(date)
  copy.setUTCDate(copy.getUTCDate() + days)
  return copy
}

export function chunkItems<T>(items: T[], size: number) {
  const chunks: T[][] = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}

function isWithinHours(date: Date, hours: number, now: Date) {
  return date.getTime() <= now.getTime() + hours * 60 * 60 * 1000
}

function readScoreFromJson(value: string) {
  const parsed = parseJsonValue<{ score: string }>(value, { score: '0' })
  return parsed.score
}

// -- Ingest pipeline ---------------------------------------------------------

function eventNeedsSnapshot(
  existing: typeof napkinbetsEvents.$inferSelect | undefined,
  nextEvent: NapkinbetsCachedEvent,
  hasSnapshot: boolean,
) {
  if (!hasSnapshot) {
    return true
  }

  if (!existing) {
    return true
  }

  return (
    existing.state !== nextEvent.state ||
    existing.shortStatus !== nextEvent.shortStatus ||
    existing.summary !== nextEvent.summary ||
    readScoreFromJson(existing.homeTeamJson) !== nextEvent.homeTeam.score ||
    readScoreFromJson(existing.awayTeamJson) !== nextEvent.awayTeam.score
  )
}

async function recordIngestRunStart(
  event: H3Event,
  config: NapkinbetsLeagueDefinition,
  tier: DiscoverTier,
  windows: IngestWindow[],
  source: string = 'espn',
) {
  const db = useAppDatabase(event)
  const runId = crypto.randomUUID()
  const firstWindow = windows[0]
  const lastWindow = windows.at(-1) ?? firstWindow

  if (!firstWindow || !lastWindow) {
    throw new Error(`No ingest windows available for ${tier}.`)
  }

  await db
    .insert(napkinbetsIngestRuns)
    .values({
      id: runId,
      source,
      sport: config.sportKey,
      league: config.key,
      tier,
      status: 'running',
      windowStartsAt: firstWindow.start.toISOString(),
      windowEndsAt: lastWindow.end.toISOString(),
      eventCount: 0,
      startedAt: nowIso(),
    })
    .run()

  return runId
}

async function finishIngestRun(
  event: H3Event,
  runId: string,
  status: 'success' | 'failed',
  eventCount: number,
  errorMessage?: string,
) {
  const db = useAppDatabase(event)

  await db
    .update(napkinbetsIngestRuns)
    .set({
      status,
      eventCount,
      errorMessage: errorMessage ?? null,
      completedAt: nowIso(),
    })
    .where(eq(napkinbetsIngestRuns.id, runId))
    .run()
}

async function upsertLeagueEvents(event: H3Event, events: NapkinbetsCachedEvent[]) {
  if (events.length === 0) {
    return
  }

  const db = useAppDatabase(event)
  const eventIds = events.map((item) => item.id)
  const existingRows: Array<typeof napkinbetsEvents.$inferSelect> = []
  const snapshotRows: Array<{ eventId: string }> = []

  for (const eventIdChunk of chunkItems(eventIds, EVENT_LOOKUP_BATCH_SIZE)) {
    const [existingChunk, snapshotChunk] = await Promise.all([
      db.select().from(napkinbetsEvents).where(inArray(napkinbetsEvents.id, eventIdChunk)),
      db
        .select({ eventId: napkinbetsEventSnapshots.eventId })
        .from(napkinbetsEventSnapshots)
        .where(inArray(napkinbetsEventSnapshots.eventId, eventIdChunk)),
    ])

    existingRows.push(...existingChunk)
    snapshotRows.push(...snapshotChunk)
  }

  const existingById = new Map(existingRows.map((row) => [row.id, row]))
  const eventIdsWithSnapshots = new Set(snapshotRows.map((row) => row.eventId))
  const snapshotsToInsert: Array<typeof napkinbetsEventSnapshots.$inferInsert> = []

  for (const item of events) {
    const syncedAt = item.lastSyncedAt
    const existing = existingById.get(item.id)
    const rowValues: typeof napkinbetsEvents.$inferInsert = {
      id: item.id,
      source: item.source,
      externalEventId: item.id.split(':').at(-1) ?? item.id,
      sport: item.sport,
      sportLabel: item.sportLabel,
      contextKey: item.contextKey,
      contextLabel: item.contextLabel,
      league: item.league,
      leagueLabel: item.leagueLabel,
      state: item.state,
      status: item.status,
      shortStatus: item.shortStatus,
      startTime: item.startTime,
      eventTitle: item.eventTitle,
      summary: item.summary,
      venueName: item.venueName,
      venueLocation: item.venueLocation,
      venueId: existing?.venueId ?? null,
      broadcast: item.broadcast,
      homeTeamId: existing?.homeTeamId ?? null,
      awayTeamId: existing?.awayTeamId ?? null,
      homeTeamJson: JSON.stringify(item.homeTeam),
      awayTeamJson: JSON.stringify(item.awayTeam),
      leadersJson: JSON.stringify(item.leaders),
      ideasJson: JSON.stringify(item.ideas),
      homeScore: item.homeTeam.score,
      awayScore: item.awayTeam.score,
      rawPayloadJson: JSON.stringify(item.rawPayload ?? null),
      sourceUpdatedAt: item.sourceUpdatedAt,
      lastSyncedAt: syncedAt,
      createdAt: existing?.createdAt ?? syncedAt,
      updatedAt: syncedAt,
    }

    await db
      .insert(napkinbetsEvents)
      .values(rowValues)
      .onConflictDoUpdate({
        target: napkinbetsEvents.id,
        set: {
          source: rowValues.source,
          externalEventId: rowValues.externalEventId,
          sport: rowValues.sport,
          sportLabel: rowValues.sportLabel,
          contextKey: rowValues.contextKey,
          contextLabel: rowValues.contextLabel,
          league: rowValues.league,
          leagueLabel: rowValues.leagueLabel,
          state: rowValues.state,
          status: rowValues.status,
          shortStatus: rowValues.shortStatus,
          startTime: rowValues.startTime,
          eventTitle: rowValues.eventTitle,
          summary: rowValues.summary,
          venueName: rowValues.venueName,
          venueLocation: rowValues.venueLocation,
          venueId: rowValues.venueId,
          broadcast: rowValues.broadcast,
          homeTeamId: rowValues.homeTeamId,
          awayTeamId: rowValues.awayTeamId,
          homeTeamJson: rowValues.homeTeamJson,
          awayTeamJson: rowValues.awayTeamJson,
          leadersJson: rowValues.leadersJson,
          ideasJson: rowValues.ideasJson,
          homeScore: rowValues.homeScore,
          awayScore: rowValues.awayScore,
          rawPayloadJson: rowValues.rawPayloadJson,
          sourceUpdatedAt: rowValues.sourceUpdatedAt,
          lastSyncedAt: rowValues.lastSyncedAt,
          updatedAt: rowValues.updatedAt,
        },
      })
      .run()

    if (eventNeedsSnapshot(existing, item, eventIdsWithSnapshots.has(item.id))) {
      snapshotsToInsert.push({
        id: crypto.randomUUID(),
        eventId: item.id,
        state: item.state,
        status: item.status,
        shortStatus: item.shortStatus,
        summary: item.summary,
        homeScore: item.homeTeam.score,
        awayScore: item.awayTeam.score,
        leadersJson: JSON.stringify(item.leaders),
        capturedAt: syncedAt,
      })
    }
  }

  if (snapshotsToInsert.length > 0) {
    for (const snapshotChunk of chunkItems(snapshotsToInsert, SNAPSHOT_INSERT_BATCH_SIZE)) {
      await db.insert(napkinbetsEventSnapshots).values(snapshotChunk).run()
    }
  }

  const leagues = [...new Set(events.map((item) => item.league))]
  for (const league of leagues) {
    await linkEventsToCanonicalEntities(event, league)
  }
}

async function pruneExpiredEvents(event: H3Event) {
  const db = useAppDatabase(event)
  const cutoff = addDays(new Date(), -3).toISOString()

  // Find event IDs that are referenced by wagers — these must be preserved
  const linkedEventRows = await db
    .select({ eventId: napkinbetsWagers.eventId })
    .from(napkinbetsWagers)
    .where(and(eq(napkinbetsWagers.eventSource, 'espn')))

  const linkedEventIds = new Set(
    linkedEventRows.map((row) => row.eventId).filter((id): id is string => Boolean(id)),
  )

  const baseCondition = or(
    and(eq(napkinbetsEvents.state, 'post'), lt(napkinbetsEvents.startTime, cutoff)),
    lt(napkinbetsEvents.updatedAt, cutoff),
  )

  if (linkedEventIds.size > 0) {
    // Fetch candidates first, then delete in batches to avoid large notInArray
    const candidates = await db
      .select({ id: napkinbetsEvents.id })
      .from(napkinbetsEvents)
      .where(baseCondition)
    const toDelete = candidates.map((row) => row.id).filter((id) => !linkedEventIds.has(id))
    for (const chunk of chunkItems(toDelete, EVENT_LOOKUP_BATCH_SIZE)) {
      await db.delete(napkinbetsEvents).where(inArray(napkinbetsEvents.id, chunk)).run()
    }
  } else {
    await db.delete(napkinbetsEvents).where(baseCondition).run()
  }
}

async function syncWagerScoresFromEvents(event: H3Event, events: NapkinbetsCachedEvent[]) {
  if (events.length === 0) {
    return
  }

  const db = useAppDatabase(event)
  const eventIds = events.map((item) => item.id)

  // Find wagers that reference any of the ingested events (batched to stay within D1 limits)
  const linkedWagers: Array<{ id: string; eventId: string | null }> = []
  for (const chunk of chunkItems(eventIds, EVENT_LOOKUP_BATCH_SIZE)) {
    const rows = await db
      .select({ id: napkinbetsWagers.id, eventId: napkinbetsWagers.eventId })
      .from(napkinbetsWagers)
      .where(inArray(napkinbetsWagers.eventId, chunk))
    linkedWagers.push(...rows)
  }

  if (linkedWagers.length === 0) {
    return
  }

  const eventsById = new Map(events.map((item) => [item.id, item]))

  for (const wager of linkedWagers) {
    const cachedEvent = wager.eventId ? eventsById.get(wager.eventId) : null
    if (!cachedEvent) {
      continue
    }

    await db
      .update(napkinbetsWagers)
      .set({
        eventStatus: cachedEvent.status,
        eventState: cachedEvent.state,
        homeScore: cachedEvent.homeTeam.score,
        awayScore: cachedEvent.awayTeam.score,
        updatedAt: nowIso(),
      })
      .where(eq(napkinbetsWagers.id, wager.id))
      .run()
  }
}

// -- Discover sections & filters ---------------------------------------------

function takeLeagueBalancedEvents(events: NapkinbetsCachedEvent[], limit: number) {
  // Sort by importance first so high-importance events get league-lead priority
  const sorted = [...events].sort((a, b) => (b.importanceScore ?? 0) - (a.importanceScore ?? 0))
  const selected: NapkinbetsCachedEvent[] = []
  const overflow: NapkinbetsCachedEvent[] = []
  const seenLeagues = new Set<string>()

  for (const event of sorted) {
    if (!seenLeagues.has(event.league)) {
      seenLeagues.add(event.league)
      selected.push(event)
      continue
    }

    overflow.push(event)
  }

  return [...selected, ...overflow]
    .slice(0, limit)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
}

function buildDiscoverSections(events: NapkinbetsCachedEvent[]): NapkinbetsDiscoverSection[] {
  const now = new Date()

  const liveNow = events
    .filter((event) => event.state === 'in')
    .sort(
      (a, b) =>
        (b.importanceScore ?? 0) - (a.importanceScore ?? 0) ||
        a.startTime.localeCompare(b.startTime),
    )
    .slice(0, 20)

  const upcoming = events
    .filter((event) => event.state === 'pre')
    .sort(
      (a, b) =>
        (b.importanceScore ?? 0) - (a.importanceScore ?? 0) ||
        a.startTime.localeCompare(b.startTime),
    )

  const startingSoon = takeLeagueBalancedEvents(
    upcoming.filter((event) => isWithinHours(new Date(event.startTime), 6, now)),
    20,
  )
  const startingSoonIds = new Set(startingSoon.map((event) => event.id))

  const today = takeLeagueBalancedEvents(
    upcoming.filter(
      (event) =>
        !startingSoonIds.has(event.id) && isWithinHours(new Date(event.startTime), 24, now),
    ),
    20,
  )
  const todayIds = new Set(today.map((event) => event.id))

  const nextUpWindow = upcoming
    .filter((event) => !startingSoonIds.has(event.id) && !todayIds.has(event.id))
    .filter((event) => isWithinHours(new Date(event.startTime), 24 * 7, now))
  const nextUpSource = nextUpWindow.length
    ? nextUpWindow
    : upcoming.filter((event) => !startingSoonIds.has(event.id) && !todayIds.has(event.id))
  const nextUp = takeLeagueBalancedEvents(nextUpSource, 20)

  return [
    {
      key: 'live-now',
      label: 'Live now',
      description: 'Games in progress right now.',
      events: liveNow,
    },
    {
      key: 'starting-soon',
      label: 'Starting soon',
      description: 'Kicking off in the next few hours.',
      events: startingSoon,
    },
    {
      key: 'today',
      label: 'Today',
      description: 'More games on the schedule today.',
      events: today,
    },
    {
      key: 'next-up',
      label: 'Next up',
      description: 'Games on the horizon beyond today.',
      events: nextUp,
    },
  ]
}

function buildDiscoverFilters(events: NapkinbetsCachedEvent[]): NapkinbetsDiscoverFilters {
  const sportMap = new Map<string, string>()
  const contextMap = new Map<string, string>()
  const leagueMap = new Map<string, string>()
  const leaguesBySportMap = new Map<string, Map<string, string>>()
  const stateMap = new Map<string, string>()

  for (const event of events) {
    sportMap.set(event.sport, event.sportLabel)
    contextMap.set(event.contextKey, event.contextLabel)
    leagueMap.set(event.league, event.leagueLabel)
    if (!leaguesBySportMap.has(event.sport)) {
      leaguesBySportMap.set(event.sport, new Map())
    }
    leaguesBySportMap.get(event.sport)!.set(event.league, event.leagueLabel)
    stateMap.set(
      event.state,
      event.state === 'in' ? 'Live' : event.state === 'pre' ? 'Upcoming' : 'Final',
    )
  }

  const leaguesBySport: Record<string, NapkinbetsDiscoverFilterOption[]> = {}
  for (const [sport, leagueToLabel] of leaguesBySportMap) {
    leaguesBySport[sport] = Array.from(leagueToLabel.entries())
      .sort((left, right) => left[1].localeCompare(right[1]))
      .map(([value, label]) => ({ value, label }))
  }

  return {
    sports: Array.from(sportMap.entries())
      .sort((left, right) => left[1].localeCompare(right[1]))
      .map(([value, label]) => ({ value, label })),
    contexts: Array.from(contextMap.entries())
      .sort((left, right) => left[1].localeCompare(right[1]))
      .map(([value, label]) => ({ value, label })),
    leagues: Array.from(leagueMap.entries())
      .sort((left, right) => left[1].localeCompare(right[1]))
      .map(([value, label]) => ({ value, label })),
    leaguesBySport,
    states: Array.from(stateMap.entries())
      .sort((left, right) => left[1].localeCompare(right[1]))
      .map(([value, label]) => ({ value, label })),
  }
}

// -- Ingest orchestration ----------------------------------------------------

export async function refreshDiscoverEventCache(event: H3Event, tier: DiscoverTier = 'manual') {
  const syncedAt = nowIso()
  const windows = buildIngestWindows(tier)
  const refreshedEvents = new Map<string, NapkinbetsCachedEvent>()
  const activeLeagues = (await loadNapkinbetsLeaguesFromStore(event, { eventBackedOnly: true }))
    .filter((config) => ['espn', 'mysportsfeeds', 'balldontlie'].includes(config.provider))
    .filter((config) => isLeagueActive(config, windows))
  const summaries: Array<{
    league: string
    sport: string
    tier: DiscoverTier
    status: 'success' | 'failed'
    eventCount: number
    errorMessage: string | null
  }> = []

  for (const config of activeLeagues) {
    const sources = ['espn', 'mysportsfeeds', 'balldontlie']
    let success = false
    let lastMessage: string | null = null

    for (const source of sources) {
      if (source === 'balldontlie' && config.sportKey !== 'basketball') {
        continue
      }
      if (
        source === 'mysportsfeeds' &&
        !['football', 'basketball', 'baseball', 'hockey'].includes(config.sportKey)
      ) {
        continue
      }

      const runId = await recordIngestRunStart(event, config, tier, windows, source)

      try {
        let result
        if (source === 'espn') {
          result = await fetchLeagueEvents(config, tier, syncedAt)
        } else if (source === 'mysportsfeeds') {
          result = await fetchMySportsFeedsLeagueEvents(event, config, tier, syncedAt)
        } else if (source === 'balldontlie') {
          result = await fetchBallDontLieLeagueEvents(event, config, tier, syncedAt)
        }

        if (result) {
          await upsertLeagueEvents(event, result.events)
          try {
            await syncWagerScoresFromEvents(event, result.events)
          } catch (syncError) {
            console.error(
              `[napkinbets-ingest] Wager score sync failed for ${config.key}:`,
              syncError instanceof Error ? syncError.message : syncError,
            )
          }
          for (const currentEvent of result.events) {
            refreshedEvents.set(currentEvent.id, currentEvent)
          }
          await finishIngestRun(event, runId, 'success', result.events.length)

          summaries.push({
            league: config.key,
            sport: config.sportKey,
            tier,
            status: 'success',
            eventCount: result.events.length,
            errorMessage: null,
          })
          success = true
          break
        }
      } catch (error) {
        lastMessage = error instanceof Error ? error.message : 'Unknown ingest failure.'
        await finishIngestRun(event, runId, 'failed', 0, lastMessage)
      }
    }

    if (!success) {
      summaries.push({
        league: config.key,
        sport: config.sportKey,
        tier,
        status: 'failed',
        eventCount: 0,
        errorMessage: lastMessage,
      })
    }
  }

  await pruneExpiredEvents(event)
  await syncCachedOdds(event, [...refreshedEvents.values()])

  return {
    refreshedAt: syncedAt,
    runs: summaries,
  }
}

// -- Odds sync & cache -------------------------------------------------------

type NapkinbetsEventOddsMarketType = NapkinbetsEventOdds extends { moneyline: infer M }
  ? NonNullable<M>
  : never

function deserializeOddsRow(
  row: typeof napkinbetsEventOdds.$inferSelect,
): NapkinbetsEventOdds | null {
  try {
    return {
      source: 'polymarket' as const,
      url: row.polymarketUrl ?? 'https://polymarket.com',
      updatedAt: row.fetchedAt,
      moneyline: row.moneylineJson
        ? (JSON.parse(row.moneylineJson) as NapkinbetsEventOddsMarketType)
        : null,
      spread: row.spreadJson ? (JSON.parse(row.spreadJson) as NapkinbetsEventOddsMarketType) : null,
      total: row.totalJson ? (JSON.parse(row.totalJson) as NapkinbetsEventOddsMarketType) : null,
      extraMarkets: row.extraMarketsJson
        ? (JSON.parse(row.extraMarketsJson) as NapkinbetsEventOddsMarketType[])
        : [],
      volume: row.volume ?? null,
      priceChange24h: row.priceChange24h ?? null,
      commentCount: row.commentCount ?? null,
    }
  } catch {
    return null
  }
}

async function syncCachedOdds(h3Event: H3Event, candidates: NapkinbetsCachedEvent[]) {
  if (candidates.length === 0) {
    return
  }

  const db = useAppDatabase(h3Event)
  const nowMs = Date.now()
  const candidateIds = candidates.map((candidate) => candidate.id)
  const cachedRows =
    candidateIds.length > 0
      ? await db
          .select()
          .from(napkinbetsEventOdds)
          .where(inArray(napkinbetsEventOdds.eventId, candidateIds))
      : []

  const cachedByEventId = new Map(cachedRows.map((row) => [row.eventId, row]))
  const staleEvents: NapkinbetsCachedEvent[] = []

  for (const candidate of candidates) {
    const cached = cachedByEventId.get(candidate.id)
    if (cached) {
      const expiresMs = new Date(cached.expiresAt).getTime()
      if (!Number.isNaN(expiresMs) && expiresMs > nowMs) {
        continue
      }
    }

    staleEvents.push(candidate)
  }

  if (staleEvents.length === 0) {
    return
  }

  try {
    const freshOdds = await enrichNapkinbetsEventsWithPolymarketOdds(staleEvents)

    for (const [eventId, odds] of freshOdds) {
      const candidate = staleEvents.find((entry) => entry.id === eventId)
      const ttl = candidate?.state === 'in' ? 2 * 60 * 1000 : 5 * 60 * 1000
      const expiresAt = new Date(nowMs + ttl).toISOString()
      const fetchedAt = nowIso()
      const rowId = `odds:${eventId}`

      await db
        .insert(napkinbetsEventOdds)
        .values({
          id: rowId,
          eventId,
          source: odds.source,
          polymarketEventSlug: odds.url.replace('https://polymarket.com/event/', '') || null,
          polymarketUrl: odds.url,
          moneylineJson: odds.moneyline ? JSON.stringify(odds.moneyline) : null,
          spreadJson: odds.spread ? JSON.stringify(odds.spread) : null,
          totalJson: odds.total ? JSON.stringify(odds.total) : null,
          extraMarketsJson: JSON.stringify(odds.extraMarkets),
          volume: odds.volume,
          priceChange24h: odds.priceChange24h,
          commentCount: odds.commentCount,
          fetchedAt,
          expiresAt,
        })
        .onConflictDoUpdate({
          target: napkinbetsEventOdds.id,
          set: {
            polymarketEventSlug: odds.url.replace('https://polymarket.com/event/', '') || null,
            polymarketUrl: odds.url,
            moneylineJson: odds.moneyline ? JSON.stringify(odds.moneyline) : null,
            spreadJson: odds.spread ? JSON.stringify(odds.spread) : null,
            totalJson: odds.total ? JSON.stringify(odds.total) : null,
            extraMarketsJson: JSON.stringify(odds.extraMarkets),
            volume: odds.volume,
            priceChange24h: odds.priceChange24h,
            commentCount: odds.commentCount,
            fetchedAt,
            expiresAt,
            updatedAt: fetchedAt,
          },
        })
        .run()
    }
  } catch {
    // Odds enrichment should never block ingest or cached reads.
  }
}

async function loadCachedOdds(
  h3Event: H3Event,
  candidates: NapkinbetsCachedEvent[],
): Promise<Map<string, NapkinbetsEventOdds>> {
  if (candidates.length === 0) {
    return new Map()
  }

  const db = useAppDatabase(h3Event)
  const result = new Map<string, NapkinbetsEventOdds>()

  const candidateIds = candidates.map((c) => c.id)
  const cachedRows =
    candidateIds.length > 0
      ? await db
          .select()
          .from(napkinbetsEventOdds)
          .where(inArray(napkinbetsEventOdds.eventId, candidateIds))
      : []

  const cachedByEventId = new Map(cachedRows.map((row) => [row.eventId, row]))

  for (const candidate of candidates) {
    const cached = cachedByEventId.get(candidate.id)
    if (!cached) {
      continue
    }

    const deserialized = deserializeOddsRow(cached)
    if (deserialized) {
      result.set(candidate.id, deserialized)
    }
  }

  return result
}

// -- Public entry points -----------------------------------------------------

export async function loadCachedDiscoverData(event: H3Event) {
  const db = useAppDatabase(event)
  const readSnapshot = async () => {
    const [eventRows, latestRun] = await Promise.all([
      db
        .select(NAPKINBETS_CACHED_EVENT_SELECT)
        .from(napkinbetsEvents)
        .where(or(eq(napkinbetsEvents.state, 'in'), eq(napkinbetsEvents.state, 'pre')))
        .orderBy(asc(napkinbetsEvents.state), asc(napkinbetsEvents.startTime)),
      db
        .select({ completedAt: napkinbetsIngestRuns.completedAt })
        .from(napkinbetsIngestRuns)
        .orderBy(desc(napkinbetsIngestRuns.startedAt))
        .limit(1),
    ])

    const events = eventRows.map((row) => toCachedEvent(row))
    const latestSync =
      events.length > 0
        ? events.reduce((latest, e) => (e.lastSyncedAt > latest ? e.lastSyncedAt : latest), '')
        : ''

    return {
      events,
      latestRun: latestRun[0] ?? null,
      latestSync,
    }
  }

  const snapshot = await readSnapshot()
  const freshestSync = snapshot.latestSync || snapshot.latestRun?.completedAt || ''

  let sections = buildDiscoverSections(snapshot.events)
  const oddsCandidates = sections
    .flatMap((section) => section.events)
    .filter(
      (cachedEvent, index, allEvents) =>
        allEvents.findIndex((entry) => entry.id === cachedEvent.id) === index,
    )

  const [oddsByEventId, featuredBetRows] = await Promise.all([
    loadCachedOdds(event, oddsCandidates),
    db
      .select()
      .from(napkinbetsFeaturedBets)
      .where(eq(napkinbetsFeaturedBets.isActive, true))
      .orderBy(asc(napkinbetsFeaturedBets.sortOrder)),
  ])

  sections = sections.map((section) => ({
    ...section,
    events: section.events.map((cachedEvent) => ({
      ...cachedEvent,
      odds: oddsByEventId.get(cachedEvent.id) ?? null,
    })),
  }))

  const dbSpotlights: NapkinbetsDiscoverySpotlight[] = featuredBetRows.map((row) => {
    let prefill: NapkinbetsCreatePrefillQuery
    try {
      prefill = JSON.parse(row.prefillJson) as NapkinbetsCreatePrefillQuery
    } catch {
      prefill = {
        source: 'curated',
        eventId: row.id,
        eventTitle: row.title,
        eventStartsAt: '',
        eventStatus: 'Upcoming',
        sport: '',
        contextKey: 'community',
        league: '',
        venueName: row.venueLabel,
        homeTeamName: '',
        awayTeamName: '',
        format: 'sports-prop',
        sideOptions: [],
      }
    }

    return {
      id: `featured:${row.id}`,
      label: row.label,
      title: row.title,
      subtitle: row.subtitle,
      summary: row.summary,
      windowLabel: row.windowLabel,
      venueLabel: row.venueLabel,
      accent: (row.accent as 'major' | 'tour' | 'watch') || 'tour',
      assets: row.imageUrl
        ? [{ kind: 'editorial' as const, src: row.imageUrl, alt: row.title }]
        : [],
      prefill,
    }
  })

  return {
    sections,
    spotlights: dbSpotlights.slice(0, 6),
    filters: buildDiscoverFilters(snapshot.events),
    propIdeas: [...NAPKINBETS_PROP_IDEAS],
    refreshedAt: freshestSync || nowIso(),
    stale: isDiscoverCacheStale(freshestSync),
  }
}

export async function runEventIngest(event: H3Event, scope: NapkinbetsDiscoverScope) {
  if (scope === 'live') {
    return await refreshDiscoverEventCache(event, 'live-window')
  }

  if (scope === 'next-48h') {
    return await refreshDiscoverEventCache(event, 'next-48h')
  }

  if (scope === 'next-7d') {
    return await refreshDiscoverEventCache(event, 'next-7d')
  }

  if (scope === 'next-8w') {
    return await refreshDiscoverEventCache(event, 'next-8w')
  }

  const runs = [
    await refreshDiscoverEventCache(event, 'live-window'),
    await refreshDiscoverEventCache(event, 'next-48h'),
    await refreshDiscoverEventCache(event, 'next-7d'),
    await refreshDiscoverEventCache(event, 'next-8w'),
  ]

  return {
    refreshedAt: runs.at(-1)?.refreshedAt ?? nowIso(),
    runs: runs.flatMap((run) => run.runs),
  }
}

export async function loadEventIngestHealth(event: H3Event) {
  const db = useAppDatabase(event)
  const [latestRuns, totalEventsResult] = await Promise.all([
    db.select().from(napkinbetsIngestRuns).orderBy(desc(napkinbetsIngestRuns.startedAt)).limit(20),
    db.select({ count: sql<number>`count(*)` }).from(napkinbetsEvents),
  ])

  const totalCachedEvents = totalEventsResult[0]?.count ?? 0

  const tiers = ['live-window', 'next-48h', 'next-7d', 'next-8w', 'manual'] as const
  const now = Date.now()
  const oneDayAgo = now - 24 * 60 * 60 * 1000

  const tierSummaries: Record<
    string,
    {
      tier: string
      lastRunAt: string | null
      lastStatus: string | null
      lastEventCount: number
      totalRunsLast24h: number
    }
  > = {}

  for (const tier of tiers) {
    const runsForTier = latestRuns.filter((run) => run.tier === tier)
    const latest = runsForTier[0]
    const runsLast24h = runsForTier.filter(
      (run) => run.startedAt && new Date(run.startedAt).getTime() > oneDayAgo,
    )

    tierSummaries[tier] = {
      tier,
      lastRunAt: latest?.startedAt ?? null,
      lastStatus: latest?.status ?? null,
      lastEventCount: latest?.eventCount ?? 0,
      totalRunsLast24h: runsLast24h.length,
    }
  }

  return {
    totalCachedEvents,
    tierSummaries,
    latestRuns: latestRuns.map((run) => ({
      id: run.id,
      source: run.source,
      sport: run.sport,
      league: run.league,
      tier: run.tier,
      status: run.status,
      eventCount: run.eventCount,
      errorMessage: run.errorMessage ?? null,
      startedAt: run.startedAt,
      completedAt: run.completedAt ?? null,
    })),
  }
}
