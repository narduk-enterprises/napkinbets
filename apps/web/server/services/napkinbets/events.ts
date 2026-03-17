import type { H3Event } from 'h3'
import { and, asc, desc, eq, inArray, lt, or } from 'drizzle-orm'
import {
  napkinbetsEvents,
  napkinbetsEventSnapshots,
  napkinbetsIngestRuns,
} from '#server/database/schema'
import {
  NAPKINBETS_EVENT_LEAGUES,
  getNapkinbetsContextLabel,
  getNapkinbetsLeagues,
  getNapkinbetsSportLabel,
  type NapkinbetsLeagueDefinition,
} from '#server/services/napkinbets/taxonomy'
import { useAppDatabase } from '#server/utils/database'

interface EspnTeamRecord {
  summary?: string
}

interface EspnLeaderEntry {
  displayValue?: string
  athlete?: {
    displayName?: string
  }
}

interface EspnLeader {
  displayName?: string
  leaders?: EspnLeaderEntry[]
}

interface EspnAthlete {
  id?: string
  displayName?: string
  shortName?: string
  headshot?: {
    href?: string
  }
}

interface EspnCompetitorStatus {
  displayValue?: string
  detail?: string
  type?: {
    state?: 'pre' | 'in' | 'post'
    description?: string
    shortDetail?: string
  }
  position?: {
    displayName?: string
    isTie?: boolean
  }
}

interface EspnCompetitorScore {
  value?: number
  displayValue?: string
}

interface EspnCompetitor {
  id?: string
  homeAway?: 'home' | 'away'
  score?: string | EspnCompetitorScore
  winner?: boolean
  team?: {
    id?: string
    displayName?: string
    shortDisplayName?: string
    abbreviation?: string
    logo?: string
  }
  athlete?: EspnAthlete
  sortOrder?: number
  status?: EspnCompetitorStatus
  records?: EspnTeamRecord[]
  leaders?: EspnLeader[]
}

interface EspnBroadcast {
  names?: string[]
  media?: {
    shortName?: string
  }
}

interface EspnVenueAddress {
  city?: string
  state?: string
}

interface EspnCompetition {
  date?: string
  status?: {
    type?: {
      state?: 'pre' | 'in' | 'post'
      description?: string
      shortDetail?: string
    }
  }
  venue?: {
    fullName?: string
    address?: EspnVenueAddress
  }
  broadcasts?: EspnBroadcast[]
  geoBroadcasts?: Array<{ media?: { shortName?: string } }>
  competitors?: EspnCompetitor[]
}

interface EspnEvent {
  id?: string
  date?: string
  name?: string
  shortName?: string
  status?: {
    type?: {
      state?: 'pre' | 'in' | 'post'
      description?: string
      shortDetail?: string
    }
  }
  defendingChampion?: {
    athlete?: EspnAthlete
  }
  courses?: Array<{
    name?: string
    shotsToPar?: number
    address?: EspnVenueAddress & { country?: string }
  }>
  tournament?: {
    displayName?: string
    numberOfRounds?: number
    major?: boolean
  }
  competitions?: EspnCompetition[]
}

interface EspnScoreboardResponse {
  events?: EspnEvent[]
}

interface CachedDiscoverEventIdea {
  title: string
  description: string
  sideOptions: string[]
  format: string
}

interface CachedDiscoverEventLeader {
  label: string
  athlete: string
  value: string
}

interface CachedDiscoverEventTeam {
  id: string
  name: string
  shortName: string
  abbreviation: string
  logo: string
  homeAway: string
  score: string
  record: string
  winner: boolean
}

export interface NapkinbetsCachedEvent {
  id: string
  source: 'espn'
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
  lastSyncedAt: string
}

export interface NapkinbetsDiscoverSection {
  key: 'live-now' | 'starting-soon' | 'today' | 'next-up'
  label: string
  description: string
  events: NapkinbetsCachedEvent[]
}

export interface NapkinbetsDiscoverFilters {
  sports: Array<{ value: string; label: string }>
  contexts: Array<{ value: string; label: string }>
  leagues: Array<{ value: string; label: string }>
  states: Array<{ value: string; label: string }>
}

type DiscoverTier = 'live-window' | 'next-48h' | 'next-7d' | 'manual'

export type NapkinbetsEventIngestTier = DiscoverTier
export type NapkinbetsDiscoverScope = 'live' | 'next-48h' | 'next-7d' | 'all'

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
    title: 'Draft boards plus side pots',
    context: 'Inspired by the original golf-pool workflow.',
    summary:
      'Mix a draft order, low-round bonus, and one weather-sensitive side pot without needing any direct payment processing.',
    examples: [
      'Lowest round on day one',
      'Most birdies by your drafted roster',
      'Closest-to-pin side pot during the watch session',
    ],
    settlementHint: 'Use the leaderboard plus posted pool rules to close the board manually.',
  },
  {
    id: 'entertainment-and-culture',
    category: 'Entertainment',
    title: 'Non-sports prompts for group nights',
    context: 'The app should feel broader than games only.',
    summary:
      'Napkinbets can host reality-show outcomes, awards-night calls, and other “who’s right tonight?” boards.',
    examples: [
      'Which contestant gets called safe first?',
      'Will the acceptance speech run over 45 seconds?',
      'Which trailer drops before the main event starts?',
    ],
    settlementHint:
      'Only use prompts with clear public outcomes that the group can verify together.',
  },
] as const

function nowIso() {
  return new Date().toISOString()
}

function buildEventId(source: string, league: string, externalEventId: string) {
  return `${source}:${league}:${externalEventId}`
}

function addDays(date: Date, days: number) {
  const copy = new Date(date)
  copy.setUTCDate(copy.getUTCDate() + days)
  return copy
}

function chunkItems<T>(items: T[], size: number) {
  const chunks: T[][] = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}

function formatEspnDate(date: Date) {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

function formatEventTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function isLeagueActive(config: NapkinbetsLeagueDefinition, now = new Date()) {
  return (config.activeMonths as readonly number[]).includes(now.getMonth() + 1)
}

function getLeagueIdeas(
  sport: string,
  homeTeam: string,
  awayTeam: string,
): CachedDiscoverEventIdea[] {
  switch (sport) {
    case 'basketball':
      return [
        {
          title: 'Race market',
          description: `Turn ${awayTeam} vs ${homeTeam} into a simple run-race board.`,
          sideOptions: [
            'First to 25 points',
            'First to 50 points',
            'Winning margin 1-5 / 6-10 / 11+',
          ],
          format: 'sports-race',
        },
        {
          title: 'Closer call',
          description: 'Give the room one late-game prop that settles cleanly off the broadcast.',
          sideOptions: [
            'Game goes to overtime',
            'Home team covers final spread band',
            'Last made three-pointer team',
          ],
          format: 'sports-prop',
        },
      ]
    case 'football':
      return [
        {
          title: 'Drive finish board',
          description: `Keep ${awayTeam} vs ${homeTeam} focused on clean, free-to-track football swings.`,
          sideOptions: [
            'Next scoring team',
            'First turnover of the half',
            'One-score game in the fourth quarter',
          ],
          format: 'sports-prop',
        },
      ]
    case 'hockey':
      return [
        {
          title: 'First goal board',
          description: `Keep ${awayTeam} vs ${homeTeam} simple and social.`,
          sideOptions: ['Home scores first', 'Away scores first', 'Scoreless first 10 minutes'],
          format: 'sports-prop',
        },
        {
          title: 'Clutch finish',
          description: 'Add one overtime or empty-net style side market.',
          sideOptions: ['Overtime yes/no', 'One-goal game at final horn', 'Empty-netter scored'],
          format: 'sports-prop',
        },
      ]
    case 'baseball':
      return [
        {
          title: 'Early innings board',
          description: 'Lean into clean, free-to-track inning outcomes.',
          sideOptions: [
            'First team to score',
            'Lead after 3 innings',
            'Total runs over 2.5 by the 5th',
          ],
          format: 'sports-prop',
        },
      ]
    case 'golf':
      return [
        {
          title: 'Tournament finish board',
          description: `Turn ${awayTeam} and ${homeTeam} into a clean leaderboard lane.`,
          sideOptions: [
            'Best finish among featured golfers',
            'Leader after round one',
            'Cut made by both featured golfers',
          ],
          format: 'golf-draft',
        },
        {
          title: 'Round-by-round sweat',
          description: 'Keep the board small enough to settle from the leaderboard.',
          sideOptions: ['Lowest Thursday round', 'Best weekend score', 'Playoff yes/no'],
          format: 'sports-prop',
        },
      ]
    default:
      return [
        {
          title: 'Head-to-head board',
          description: 'Keep it simple with winner and one side market.',
          sideOptions: ['Home wins', 'Away wins', 'One featured side prop'],
          format: 'sports-game',
        },
      ]
  }
}

function getEventBroadcast(event: EspnEvent) {
  const competition = event.competitions?.[0]
  const broadcastNames =
    competition?.broadcasts
      ?.flatMap((item) => [item.media?.shortName, ...(item.names ?? [])])
      .filter((value): value is string => Boolean(value)) ?? []

  return (
    competition?.geoBroadcasts?.find((item) => item.media?.shortName)?.media?.shortName ||
    broadcastNames[0] ||
    ''
  )
}

function getAddressParts(address?: EspnVenueAddress) {
  const parts = [address?.city, address?.state].filter(Boolean)
  return parts.join(', ')
}

function getEventLocation(event: EspnEvent) {
  return getAddressParts(event.competitions?.[0]?.venue?.address)
}

function getStatus(event: EspnEvent) {
  return event.competitions?.[0]?.status?.type ?? event.status?.type
}

function getCompetitorScore(score?: string | EspnCompetitorScore, fallback = '0') {
  if (typeof score === 'string') {
    return score
  }

  return score?.displayValue ?? fallback
}

function buildCompetitorLeaders(competitors: EspnCompetitor[]) {
  const leaders: CachedDiscoverEventLeader[] = []

  for (const competitor of competitors) {
    for (const leader of competitor.leaders ?? []) {
      const top = leader.leaders?.[0]
      if (!leader.displayName || !top?.athlete?.displayName || !top.displayValue) {
        continue
      }

      leaders.push({
        label: leader.displayName,
        athlete: top.athlete.displayName,
        value: top.displayValue,
      })
    }
  }

  return leaders.slice(0, 3)
}

function buildGolfLeaderboard(competitors: EspnCompetitor[]) {
  return competitors
    .filter((competitor) => competitor.athlete?.displayName)
    .sort(
      (left, right) =>
        (left.sortOrder ?? Number.MAX_SAFE_INTEGER) - (right.sortOrder ?? Number.MAX_SAFE_INTEGER),
    )
    .slice(0, 3)
    .map((competitor) => ({
      label: competitor.status?.position?.displayName || 'Featured',
      athlete: competitor.athlete?.displayName ?? '',
      value: getCompetitorScore(competitor.score, competitor.status?.displayValue ?? ''),
    }))
    .filter((leader) => leader.athlete && leader.value)
}

function buildGolfFeaturedTeams(
  event: EspnEvent,
  competitors: EspnCompetitor[],
): Pick<NapkinbetsCachedEvent, 'homeTeam' | 'awayTeam'> | null {
  const rankedGolfers = competitors
    .filter((competitor) => competitor.athlete?.displayName)
    .sort(
      (left, right) =>
        (left.sortOrder ?? Number.MAX_SAFE_INTEGER) - (right.sortOrder ?? Number.MAX_SAFE_INTEGER),
    )
  const leader = rankedGolfers[0]
  const chaser = rankedGolfers[1]
  const defendingChampion = event.defendingChampion?.athlete
  const tournament = event.tournament?.displayName || event.shortName || event.name || 'Tournament'
  const roundLabel = event.tournament?.numberOfRounds
    ? `${event.tournament.numberOfRounds}-round event`
    : 'Tournament field'

  return {
    awayTeam: leader?.athlete?.displayName
      ? {
          id: leader.athlete.id ?? '',
          name: leader.athlete.displayName,
          shortName: leader.athlete.shortName ?? leader.athlete.displayName,
          abbreviation: leader.status?.position?.displayName ?? 'LEAD',
          logo: leader.athlete.headshot?.href ?? '',
          homeAway: 'leader',
          score: getCompetitorScore(leader.score, leader.status?.displayValue ?? ''),
          record: leader.status?.detail ?? leader.status?.position?.displayName ?? 'Leader',
          winner: leader.status?.type?.state === 'post',
        }
      : {
          id: defendingChampion?.id ?? '',
          name: defendingChampion?.displayName ?? 'Featured golfer',
          shortName: defendingChampion?.shortName ?? defendingChampion?.displayName ?? 'Featured',
          abbreviation: 'CHAMP',
          logo: defendingChampion?.headshot?.href ?? '',
          homeAway: 'featured',
          score: '',
          record: defendingChampion?.displayName ? 'Defending champion' : 'Featured storyline',
          winner: false,
        },
    homeTeam: chaser?.athlete?.displayName
      ? {
          id: chaser.athlete.id ?? '',
          name: chaser.athlete.displayName,
          shortName: chaser.athlete.shortName ?? chaser.athlete.displayName,
          abbreviation: chaser.status?.position?.displayName ?? 'CHASE',
          logo: chaser.athlete.headshot?.href ?? '',
          homeAway: 'chase',
          score: getCompetitorScore(chaser.score, chaser.status?.displayValue ?? ''),
          record: chaser.status?.detail ?? chaser.status?.position?.displayName ?? 'Chasing',
          winner: false,
        }
      : {
          id: '',
          name: tournament,
          shortName: 'Field',
          abbreviation: 'FIELD',
          logo: '',
          homeAway: 'field',
          score: '',
          record: roundLabel,
          winner: false,
        },
  }
}

function buildGolfSummary(event: EspnEvent, startTime: string, state: 'pre' | 'in' | 'post') {
  const tournament = event.shortName || event.name || 'Tournament'
  const competition = event.competitions?.[0]
  const rankedGolfers = competition?.competitors
    ?.filter((competitor) => competitor.athlete?.displayName)
    .sort(
      (left, right) =>
        (left.sortOrder ?? Number.MAX_SAFE_INTEGER) - (right.sortOrder ?? Number.MAX_SAFE_INTEGER),
    )
  const leader = rankedGolfers?.[0]?.athlete?.displayName
  const chaser = rankedGolfers?.[1]?.athlete?.displayName

  if (state === 'in' && leader) {
    return chaser
      ? `${leader} leads ${tournament}, with ${chaser} in the chase pack.`
      : `${leader} is on top of ${tournament} right now.`
  }

  if (state === 'post' && leader) {
    return `${leader} closed out ${tournament}.`
  }

  return `${tournament} starts ${formatEventTime(startTime)}.`
}

function buildIngestWindow(tier: DiscoverTier, now = new Date()) {
  switch (tier) {
    case 'live-window': {
      const start = addDays(now, -1)
      const end = addDays(now, 1)
      return {
        start,
        end,
        datesParam: `${formatEspnDate(start)}-${formatEspnDate(end)}`,
      }
    }
    case 'next-48h': {
      const start = now
      const end = addDays(now, 2)
      return {
        start,
        end,
        datesParam: `${formatEspnDate(start)}-${formatEspnDate(end)}`,
      }
    }
    case 'next-7d':
    case 'manual': {
      const start = now
      const end = addDays(now, 7)
      return {
        start,
        end,
        datesParam: `${formatEspnDate(start)}-${formatEspnDate(end)}`,
      }
    }
  }
}

function isWithinHours(date: Date, hours: number, now: Date) {
  return date.getTime() <= now.getTime() + hours * 60 * 60 * 1000
}

function parseJsonValue<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function inferEventContextKey(leagueKey: string) {
  return (
    getNapkinbetsLeagues().find((league) => league.key === leagueKey)?.primaryContextKey ??
    'community'
  )
}

function readScoreFromJson(value: string) {
  const parsed = parseJsonValue<CachedDiscoverEventTeam>(value, {
    id: '',
    name: '',
    shortName: '',
    abbreviation: '',
    logo: '',
    homeAway: 'home',
    score: '0',
    record: '',
    winner: false,
  })

  return parsed.score
}

export function buildEspnScoreboardUrl(
  config: NapkinbetsLeagueDefinition,
  tier: DiscoverTier,
  now = new Date(),
) {
  const window = buildIngestWindow(tier, now)
  const url = new URL(
    `https://site.web.api.espn.com/apis/site/v2/sports/${config.sportKey}/${config.providerLeagueKey ?? config.key}/scoreboard`,
  )

  if (config.supportsDateWindow !== false) {
    url.searchParams.set('dates', window.datesParam)
  }

  for (const [key, value] of Object.entries(config.scoreboardQueryParams ?? {})) {
    url.searchParams.set(key, value)
  }

  return {
    window,
    url,
  }
}

export function normalizeMatchupEspnEvent(
  event: EspnEvent,
  config: NapkinbetsLeagueDefinition,
  syncedAt: string,
): NapkinbetsCachedEvent | null {
  const competition = event.competitions?.[0]
  const competitors = competition?.competitors ?? []
  const homeTeam = competitors.find((competitor) => competitor.homeAway === 'home')
  const awayTeam = competitors.find((competitor) => competitor.homeAway === 'away')
  const status = getStatus(event)

  if (!event.id || !homeTeam?.team?.displayName || !awayTeam?.team?.displayName || !status?.state) {
    return null
  }

  const startTime = competition?.date ?? event.date ?? syncedAt
  const venueName = competition?.venue?.fullName ?? 'Venue TBD'
  const homeName = homeTeam.team.displayName
  const awayName = awayTeam.team.displayName

  return {
    id: buildEventId('espn', config.key, event.id),
    source: 'espn',
    sport: config.sportKey,
    sportLabel: getNapkinbetsSportLabel(config.sportKey),
    contextKey: config.primaryContextKey,
    contextLabel: getNapkinbetsContextLabel(config.primaryContextKey),
    league: config.key,
    leagueLabel: config.label,
    eventTitle: event.shortName ?? event.name ?? `${awayName} at ${homeName}`,
    summary:
      status.state === 'in'
        ? `${awayName} and ${homeName} are in progress now.`
        : `${awayName} at ${homeName} starts ${formatEventTime(startTime)}.`,
    status: status.description ?? 'Scheduled',
    state: status.state,
    shortStatus: status.shortDetail ?? status.description ?? 'Scheduled',
    startTime,
    venueName,
    venueLocation: getEventLocation(event),
    broadcast: getEventBroadcast(event),
    homeTeam: {
      id: homeTeam.team.id ?? '',
      name: homeName,
      shortName: homeTeam.team.shortDisplayName ?? homeName,
      abbreviation: homeTeam.team.abbreviation ?? '',
      logo: homeTeam.team.logo ?? '',
      homeAway: 'home',
      score: getCompetitorScore(homeTeam.score),
      record: homeTeam.records?.[0]?.summary ?? '',
      winner: Boolean(homeTeam.winner),
    },
    awayTeam: {
      id: awayTeam.team.id ?? '',
      name: awayName,
      shortName: awayTeam.team.shortDisplayName ?? awayName,
      abbreviation: awayTeam.team.abbreviation ?? '',
      logo: awayTeam.team.logo ?? '',
      homeAway: 'away',
      score: getCompetitorScore(awayTeam.score),
      record: awayTeam.records?.[0]?.summary ?? '',
      winner: Boolean(awayTeam.winner),
    },
    leaders: buildCompetitorLeaders(competitors),
    ideas: getLeagueIdeas(config.sportKey, homeName, awayName),
    lastSyncedAt: syncedAt,
  }
}

export function normalizeTournamentEspnEvent(
  event: EspnEvent,
  config: NapkinbetsLeagueDefinition,
  syncedAt: string,
): NapkinbetsCachedEvent | null {
  const competition = event.competitions?.[0]
  const status = getStatus(event)

  if (!event.id || !status?.state) {
    return null
  }

  const featuredTeams = buildGolfFeaturedTeams(event, competition?.competitors ?? [])
  if (!featuredTeams) {
    return null
  }

  const startTime = competition?.date ?? event.date ?? syncedAt
  const hostCourse = event.courses?.[0]
  const venueName = hostCourse?.name ?? competition?.venue?.fullName ?? 'Course TBD'
  const venueLocation = getAddressParts(hostCourse?.address) || getEventLocation(event)
  const eventTitle = event.shortName ?? event.name ?? event.tournament?.displayName ?? 'Tournament'

  return {
    id: buildEventId('espn', config.key, event.id),
    source: 'espn',
    sport: config.sportKey,
    sportLabel: getNapkinbetsSportLabel(config.sportKey),
    contextKey: config.primaryContextKey,
    contextLabel: getNapkinbetsContextLabel(config.primaryContextKey),
    league: config.key,
    leagueLabel: config.label,
    eventTitle,
    summary: buildGolfSummary(event, startTime, status.state),
    status: status.description ?? 'Scheduled',
    state: status.state,
    shortStatus: status.shortDetail ?? status.description ?? 'Scheduled',
    startTime,
    venueName,
    venueLocation,
    broadcast: getEventBroadcast(event),
    homeTeam: featuredTeams.homeTeam,
    awayTeam: featuredTeams.awayTeam,
    leaders: buildGolfLeaderboard(competition?.competitors ?? []),
    ideas: getLeagueIdeas(
      config.sportKey,
      featuredTeams.homeTeam.name,
      featuredTeams.awayTeam.name,
    ),
    lastSyncedAt: syncedAt,
  }
}

function normalizeEspnEvent(
  event: EspnEvent,
  config: NapkinbetsLeagueDefinition,
  syncedAt: string,
) {
  if (config.eventShape === 'tournament') {
    return normalizeTournamentEspnEvent(event, config, syncedAt)
  }

  return normalizeMatchupEspnEvent(event, config, syncedAt)
}

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

export function isDiscoverCacheStale(freshestSync: string, nowMs = Date.now()) {
  if (!freshestSync) {
    return true
  }

  return nowMs - new Date(freshestSync).getTime() > 30 * 60 * 1000
}

async function fetchEspnJson<T>(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'napkinbets-ingest',
    },
  })

  const payload = (await response.json()) as T

  return {
    response,
    payload,
  }
}

async function fetchTournamentEventDetails(
  config: NapkinbetsLeagueDefinition,
  externalEventId: string,
) {
  const url = new URL('https://site.web.api.espn.com/apis/site/v2/sports/golf/leaderboard')
  url.searchParams.set('league', config.providerLeagueKey ?? config.key)
  url.searchParams.set('event', externalEventId)

  const { response, payload } = await fetchEspnJson<EspnScoreboardResponse>(url.toString())

  if (response.status === 400 || response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`ESPN ${config.key} leaderboard returned ${response.status}.`)
  }

  return payload.events?.[0] ?? null
}

async function fetchLeagueEvents(
  config: NapkinbetsLeagueDefinition,
  tier: DiscoverTier,
  syncedAt: string,
) {
  const { window, url } = buildEspnScoreboardUrl(config, tier)
  const { response, payload } = await fetchEspnJson<EspnScoreboardResponse>(url.toString())

  if (response.status === 400 || response.status === 404) {
    return {
      window,
      payload: { events: [] },
      events: [],
    }
  }

  if (!response.ok) {
    throw new Error(`ESPN ${config.key} returned ${response.status}.`)
  }

  const tournamentEventDetails = new Map<string, EspnEvent>()
  if (config.eventShape === 'tournament') {
    for (const event of payload.events ?? []) {
      if (!event.id) {
        continue
      }

      const details = await fetchTournamentEventDetails(config, event.id)
      if (details) {
        tournamentEventDetails.set(event.id, details)
      }
    }
  }

  const normalizedEvents: NapkinbetsCachedEvent[] = []

  for (const event of payload.events ?? []) {
    const normalized = normalizeEspnEvent(
      tournamentEventDetails.get(event.id ?? '') ?? event,
      config,
      syncedAt,
    )
    if (!normalized) {
      continue
    }

    normalizedEvents.push(normalized)
  }

  return {
    window,
    payload,
    events: normalizedEvents,
  }
}

async function recordIngestRunStart(
  event: H3Event,
  config: NapkinbetsLeagueDefinition,
  tier: DiscoverTier,
  window: ReturnType<typeof buildIngestWindow>,
) {
  const db = useAppDatabase(event)
  const runId = crypto.randomUUID()

  await db
    .insert(napkinbetsIngestRuns)
    .values({
      id: runId,
      source: 'espn',
      sport: config.sportKey,
      league: config.key,
      tier,
      windowStartsAt: window.start.toISOString(),
      windowEndsAt: window.end.toISOString(),
      eventCount: 0,
      status: 'running',
      errorMessage: null,
      startedAt: nowIso(),
      completedAt: null,
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
      broadcast: item.broadcast,
      homeTeamJson: JSON.stringify(item.homeTeam),
      awayTeamJson: JSON.stringify(item.awayTeam),
      leadersJson: JSON.stringify(item.leaders),
      ideasJson: JSON.stringify(item.ideas),
      rawPayloadJson: null,
      sourceUpdatedAt: syncedAt,
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
          broadcast: rowValues.broadcast,
          homeTeamJson: rowValues.homeTeamJson,
          awayTeamJson: rowValues.awayTeamJson,
          leadersJson: rowValues.leadersJson,
          ideasJson: rowValues.ideasJson,
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
}

async function pruneExpiredEvents(event: H3Event) {
  const db = useAppDatabase(event)
  const cutoff = addDays(new Date(), -3).toISOString()

  await db
    .delete(napkinbetsEvents)
    .where(
      or(
        and(eq(napkinbetsEvents.state, 'post'), lt(napkinbetsEvents.startTime, cutoff)),
        lt(napkinbetsEvents.updatedAt, cutoff),
      ),
    )
    .run()
}

function toCachedEvent(row: typeof napkinbetsEvents.$inferSelect): NapkinbetsCachedEvent {
  return {
    id: row.id,
    source: row.source as 'espn',
    sport: row.sport,
    sportLabel: row.sportLabel,
    contextKey: inferEventContextKey(row.league),
    contextLabel: getNapkinbetsContextLabel(inferEventContextKey(row.league)),
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
    lastSyncedAt: row.lastSyncedAt,
  }
}

function toLiveGame(event: NapkinbetsCachedEvent) {
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

function discoverPriority(event: NapkinbetsCachedEvent) {
  if (event.league === 'pga' || event.league === 'lpga') {
    return 0
  }

  if (event.contextKey === 'tournament') {
    return 1
  }

  return 2
}

function buildDiscoverSections(events: NapkinbetsCachedEvent[]): NapkinbetsDiscoverSection[] {
  const now = new Date()

  const liveNow = events
    .filter((event) => event.state === 'in')
    .sort((left, right) => left.startTime.localeCompare(right.startTime))
    .slice(0, 8)

  const upcoming = events
    .filter((event) => event.state === 'pre')
    .sort((left, right) => left.startTime.localeCompare(right.startTime))

  const startingSoon = upcoming
    .filter((event) => isWithinHours(new Date(event.startTime), 4, now))
    .slice(0, 8)
  const startingSoonIds = new Set(startingSoon.map((event) => event.id))

  const today = upcoming
    .filter(
      (event) =>
        !startingSoonIds.has(event.id) && isWithinHours(new Date(event.startTime), 24, now),
    )
    .slice(0, 10)
  const todayIds = new Set(today.map((event) => event.id))

  const nextUp = upcoming
    .filter((event) => !startingSoonIds.has(event.id) && !todayIds.has(event.id))
    .sort((left, right) => {
      const priorityDiff = discoverPriority(left) - discoverPriority(right)
      if (priorityDiff !== 0) {
        return priorityDiff
      }

      return left.startTime.localeCompare(right.startTime)
    })
    .slice(0, 12)

  return [
    {
      key: 'live-now',
      label: 'Live now',
      description: 'Events already in motion and ready for close-to-live side boards.',
      events: liveNow,
    },
    {
      key: 'starting-soon',
      label: 'Starting soon',
      description: 'Boards worth setting before the first whistle or tip.',
      events: startingSoon,
    },
    {
      key: 'today',
      label: 'Today',
      description: 'The rest of the high-signal slate inside the next 24 hours.',
      events: today,
    },
    {
      key: 'next-up',
      label: 'Next up',
      description: 'Upcoming events worth planning around this week.',
      events: nextUp,
    },
  ]
}

function buildDiscoverFilters(events: NapkinbetsCachedEvent[]): NapkinbetsDiscoverFilters {
  const sportMap = new Map<string, string>()
  const contextMap = new Map<string, string>()
  const leagueMap = new Map<string, string>()
  const stateMap = new Map<string, string>()

  for (const event of events) {
    sportMap.set(event.sport, event.sportLabel)
    contextMap.set(event.contextKey, event.contextLabel)
    leagueMap.set(event.league, event.leagueLabel)
    stateMap.set(
      event.state,
      event.state === 'in' ? 'Live' : event.state === 'pre' ? 'Upcoming' : 'Final',
    )
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
    states: Array.from(stateMap.entries())
      .sort((left, right) => left[1].localeCompare(right[1]))
      .map(([value, label]) => ({ value, label })),
  }
}

export async function refreshDiscoverEventCache(event: H3Event, tier: DiscoverTier = 'manual') {
  const syncedAt = nowIso()
  const activeLeagues = NAPKINBETS_EVENT_LEAGUES.filter((config) => isLeagueActive(config))
  const summaries: Array<{
    league: string
    sport: string
    tier: DiscoverTier
    status: 'success' | 'failed'
    eventCount: number
    errorMessage: string | null
  }> = []

  for (const config of activeLeagues) {
    const window = buildIngestWindow(tier)
    const runId = await recordIngestRunStart(event, config, tier, window)

    try {
      const result = await fetchLeagueEvents(config, tier, syncedAt)
      await upsertLeagueEvents(event, result.events)
      await finishIngestRun(event, runId, 'success', result.events.length)

      summaries.push({
        league: config.key,
        sport: config.sportKey,
        tier,
        status: 'success',
        eventCount: result.events.length,
        errorMessage: null,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown ingest failure.'
      await finishIngestRun(event, runId, 'failed', 0, message)

      summaries.push({
        league: config.key,
        sport: config.sportKey,
        tier,
        status: 'failed',
        eventCount: 0,
        errorMessage: message,
      })
    }
  }

  await pruneExpiredEvents(event)

  return {
    refreshedAt: syncedAt,
    runs: summaries,
  }
}

export async function loadCachedDiscoverData(event: H3Event) {
  const db = useAppDatabase(event)
  const [eventRows, latestRun] = await Promise.all([
    db.select().from(napkinbetsEvents).orderBy(asc(napkinbetsEvents.startTime)),
    db.select().from(napkinbetsIngestRuns).orderBy(desc(napkinbetsIngestRuns.startedAt)).limit(1),
  ])

  const events = eventRows.map((row) => toCachedEvent(row))
  const sections = buildDiscoverSections(events)
  const freshestSync =
    eventRows.map((row) => row.lastSyncedAt).sort((left, right) => right.localeCompare(left))[0] ??
    latestRun[0]?.completedAt ??
    ''

  const stale = isDiscoverCacheStale(freshestSync)

  return {
    sections,
    filters: buildDiscoverFilters(events),
    propIdeas: [...NAPKINBETS_PROP_IDEAS],
    refreshedAt: freshestSync || nowIso(),
    stale,
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

  const runs = [
    await refreshDiscoverEventCache(event, 'live-window'),
    await refreshDiscoverEventCache(event, 'next-48h'),
    await refreshDiscoverEventCache(event, 'next-7d'),
  ]

  return {
    refreshedAt: runs.at(-1)?.refreshedAt ?? nowIso(),
    runs: runs.flatMap((run) => run.runs),
  }
}

export async function loadCachedEventsByIds(event: H3Event, eventIds: string[]) {
  if (eventIds.length === 0) {
    return new Map<string, NapkinbetsCachedEvent>()
  }

  const db = useAppDatabase(event)
  const rows = await db
    .select()
    .from(napkinbetsEvents)
    .where(inArray(napkinbetsEvents.id, eventIds))

  return new Map(rows.map((row) => [row.id, toCachedEvent(row)]))
}

export async function loadFeaturedLiveGames(event: H3Event, limit = 6) {
  const db = useAppDatabase(event)
  const rows = await db
    .select()
    .from(napkinbetsEvents)
    .where(or(eq(napkinbetsEvents.state, 'in'), eq(napkinbetsEvents.state, 'pre')))
    .orderBy(asc(napkinbetsEvents.startTime))

  return rows
    .map((row) => toCachedEvent(row))
    .filter((item) => item.state === 'in' || isWithinHours(new Date(item.startTime), 6, new Date()))
    .slice(0, limit)
    .map((item) => toLiveGame(item))
}

export async function loadEventIngestHealth(event: H3Event) {
  const db = useAppDatabase(event)
  const [latestRuns, totalEvents] = await Promise.all([
    db.select().from(napkinbetsIngestRuns).orderBy(desc(napkinbetsIngestRuns.startedAt)).limit(12),
    db.select().from(napkinbetsEvents),
  ])

  return {
    totalCachedEvents: totalEvents.length,
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
