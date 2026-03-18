import type { H3Event } from 'h3'
import { and, asc, desc, eq, inArray, lt, or } from 'drizzle-orm'
import {
  napkinbetsEvents,
  napkinbetsEventOdds,
  napkinbetsEventSnapshots,
  napkinbetsIngestRuns,
  napkinbetsFeaturedBets,
  napkinbetsWagers,
} from '#server/database/schema'
import {
  getNapkinbetsContextLabel,
  getNapkinbetsSportLabel,
  type NapkinbetsLeagueDefinition,
} from '#server/services/napkinbets/taxonomy'
import { loadNapkinbetsLeaguesFromStore } from '#server/services/napkinbets/taxonomy-store'
import {
  enrichNapkinbetsEventsWithPolymarketOdds,
  type NapkinbetsEventOdds,
} from '#server/services/napkinbets/polymarket'
import { linkEventsToCanonicalEntities } from '#server/services/napkinbets/entities'
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
  sourceUpdatedAt: string | null
  rawPayload: unknown
  odds?: NapkinbetsEventOdds | null
}

interface NapkinbetsCachedEventRow {
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
  lastSyncedAt: string
  sourceUpdatedAt: string | null
}

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

export interface NapkinbetsDiscoverFilters {
  sports: Array<{ value: string; label: string }>
  contexts: Array<{ value: string; label: string }>
  leagues: Array<{ value: string; label: string }>
  states: Array<{ value: string; label: string }>
}

type DiscoverTier = 'live-window' | 'next-48h' | 'next-7d' | 'next-8w' | 'manual'

export type NapkinbetsEventIngestTier = DiscoverTier
export type NapkinbetsDiscoverScope = 'live' | 'next-48h' | 'next-7d' | 'next-8w' | 'all'

const SNAPSHOT_INSERT_BATCH_SIZE = 8
const EVENT_LOOKUP_BATCH_SIZE = 64
const NAPKINBETS_CACHED_EVENT_SELECT = {
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
  lastSyncedAt: napkinbetsEvents.lastSyncedAt,
  sourceUpdatedAt: napkinbetsEvents.sourceUpdatedAt,
} as const
const NAPKINBETS_EDITORIAL_IMAGE_PATHS = {
  auth: '/brand/imagery/auth-table-scene.webp',
  discovery: '/brand/imagery/discovery-paper-grid.webp',
  liveRoom: '/brand/imagery/live-room-editorial.webp',
  masters: '/brand/imagery/masters-week-editorial.webp',
} as const

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
    summary:
      'Napkinbets can host reality-show outcomes, awards-night calls, and other “who’s right tonight?” bets.',
    examples: [
      'Which contestant gets called safe first?',
      'Will the acceptance speech run over 45 seconds?',
      'Which trailer drops before the main event starts?',
    ],
    settlementHint:
      'Only use prompts with clear public outcomes that the group can verify together.',
  },
] as const

const NAPKINBETS_GOLF_EDITORIAL = [
  {
    id: 'masters-2026',
    label: 'Major watch',
    title: 'Masters week room',
    subtitle: 'Build the Augusta bet before Monday, then let it carry the whole week.',
    summary:
      'Cover the full official Masters week with one room for Green Jacket futures, Thursday pace-setters, and Sunday closeout sweats.',
    windowLabel: 'Apr 6-12, 2026',
    venueLabel: 'Augusta National Golf Club',
    accent: 'major',
    assets: [],
    prefill: {
      source: 'curated',
      eventId: 'masters-2026',
      eventTitle: 'Masters Tournament',
      eventStartsAt: '2026-04-06T12:00:00Z',
      eventStatus: 'Upcoming',
      sport: 'golf',
      contextKey: 'tournament',
      league: 'pga',
      venueName: 'Augusta National Golf Club',
      homeTeamName: 'Masters field',
      awayTeamName: 'Featured golfers',
      format: 'golf-draft',
      sideOptions: ['Green Jacket winner', 'Leader after Thursday', 'Playoff yes/no'],
    },
  },
  {
    id: 'masters-weekend-2026',
    label: 'Sunday sweat',
    title: 'Masters weekend closeout',
    subtitle:
      'Once the cut is set, shrink the bet and turn the leaderboard into one clean finish lane.',
    summary:
      'Use a smaller Augusta bet for best weekend score, final pairing winner, or the biggest Sunday charge once the field is trimmed.',
    windowLabel: 'Apr 11-12, 2026',
    venueLabel: 'Augusta National Golf Club',
    accent: 'watch',
    assets: [],
    prefill: {
      source: 'curated',
      eventId: 'masters-weekend-2026',
      eventTitle: 'Masters Tournament Weekend',
      eventStartsAt: '2026-04-11T14:00:00Z',
      eventStatus: 'Upcoming',
      sport: 'golf',
      contextKey: 'tournament',
      league: 'pga',
      venueName: 'Augusta National Golf Club',
      homeTeamName: 'Masters leaders',
      awayTeamName: 'Weekend chasers',
      format: 'sports-prop',
      sideOptions: ['Leader after Saturday', 'Best Sunday charge', 'Winning score under 280'],
    },
  },
] as const satisfies readonly NapkinbetsDiscoverySpotlight[]

const GOLF_MAJOR_EVENT_PATTERN =
  /masters|u\.s\. open|us open|open championship|the open|pga championship/i

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

interface IngestWindow {
  start: Date
  end: Date
  datesParam: string
}

function getMonthsCoveredByWindows(windows: IngestWindow[]) {
  const months = new Set<number>()

  for (const window of windows) {
    const cursor = new Date(window.start)
    while (cursor <= window.end) {
      months.add(cursor.getUTCMonth() + 1)
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
  }

  return months
}

function isLeagueActive(config: NapkinbetsLeagueDefinition, windows: IngestWindow[]) {
  const coveredMonths = getMonthsCoveredByWindows(windows)

  return (config.activeMonths as readonly number[]).some((month) => coveredMonths.has(month))
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
          description: `Turn ${awayTeam} vs ${homeTeam} into a simple run-race bet.`,
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
          title: 'Drive finish bet',
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
          title: 'First goal bet',
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
          title: 'Early innings bet',
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
          title: 'Featured golfer lane',
          description: `Keep ${awayTeam} and ${homeTeam} at the center of a bet that still settles cleanly from the leaderboard.`,
          sideOptions: [
            'Best finish among featured golfers',
            'Both golfers make the cut',
            'Top-10 finisher count',
          ],
          format: 'golf-draft',
        },
        {
          title: 'Round and cut sweat',
          description:
            'Use one quick tournament pulse instead of asking the room to track the full field.',
          sideOptions: [
            'Leader after round one',
            'Cut made by both featured golfers',
            'Best weekend score',
            'Playoff yes/no',
          ],
          format: 'sports-prop',
        },
      ]
    default:
      return [
        {
          title: 'Head-to-head bet',
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

export function buildIngestWindows(tier: DiscoverTier, now = new Date()) {
  switch (tier) {
    case 'live-window': {
      const start = addDays(now, -1)
      const end = addDays(now, 1)
      return [
        {
          start,
          end,
          datesParam: `${formatEspnDate(start)}-${formatEspnDate(end)}`,
        },
      ] satisfies IngestWindow[]
    }
    case 'next-48h': {
      const start = now
      const end = addDays(now, 2)
      return [
        {
          start,
          end,
          datesParam: `${formatEspnDate(start)}-${formatEspnDate(end)}`,
        },
      ] satisfies IngestWindow[]
    }
    case 'next-7d':
    case 'manual': {
      const start = now
      const end = addDays(now, 7)
      return [
        {
          start,
          end,
          datesParam: `${formatEspnDate(start)}-${formatEspnDate(end)}`,
        },
      ] satisfies IngestWindow[]
    }
    case 'next-8w': {
      const windows: IngestWindow[] = []
      let cursor = new Date(now)

      for (let index = 0; index < 8; index += 1) {
        const start = new Date(cursor)
        const end = addDays(start, 7)
        windows.push({
          start,
          end,
          datesParam: `${formatEspnDate(start)}-${formatEspnDate(end)}`,
        })
        cursor = end
      }

      return windows
    }
  }
}

function isWithinHours(date: Date, hours: number, now: Date) {
  return date.getTime() <= now.getTime() + hours * 60 * 60 * 1000
}

function isWithinDays(date: Date, days: number, now: Date) {
  return date.getTime() <= now.getTime() + days * 24 * 60 * 60 * 1000
}

function parseJsonValue<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
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
  const [window] = buildIngestWindows(tier, now)
  if (!window) {
    throw new Error(`No ingest window available for ${tier}.`)
  }

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
    sportLabel: config.sportLabel ?? getNapkinbetsSportLabel(config.sportKey),
    contextKey: config.primaryContextKey,
    contextLabel: config.primaryContextLabel ?? getNapkinbetsContextLabel(config.primaryContextKey),
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
    sourceUpdatedAt: null,
    rawPayload: event,
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
    sportLabel: config.sportLabel ?? getNapkinbetsSportLabel(config.sportKey),
    contextKey: config.primaryContextKey,
    contextLabel: config.primaryContextLabel ?? getNapkinbetsContextLabel(config.primaryContextKey),
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
    sourceUpdatedAt: null,
    rawPayload: event,
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
  const windows = buildIngestWindows(tier)
  const normalizedEventsById = new Map<string, NapkinbetsCachedEvent>()
  const payloads: EspnScoreboardResponse[] = []

  for (const window of windows) {
    const url = new URL(
      `https://site.web.api.espn.com/apis/site/v2/sports/${config.sportKey}/${config.providerLeagueKey ?? config.key}/scoreboard`,
    )

    if (config.supportsDateWindow !== false) {
      url.searchParams.set('dates', window.datesParam)
    }

    for (const [key, value] of Object.entries(config.scoreboardQueryParams ?? {})) {
      url.searchParams.set(key, value)
    }

    const { response, payload } = await fetchEspnJson<EspnScoreboardResponse>(url.toString())

    if (response.status === 400 || response.status === 404) {
      payloads.push({ events: [] })
      continue
    }

    if (!response.ok) {
      throw new Error(`ESPN ${config.key} returned ${response.status}.`)
    }

    payloads.push(payload)

    const tournamentEventDetails = new Map<string, EspnEvent>()
    if (config.eventShape === 'tournament') {
      for (const currentEvent of payload.events ?? []) {
        if (!currentEvent.id) {
          continue
        }

        const details = await fetchTournamentEventDetails(config, currentEvent.id)
        if (details) {
          tournamentEventDetails.set(currentEvent.id, details)
        }
      }
    }

    for (const currentEvent of payload.events ?? []) {
      const normalized = normalizeEspnEvent(
        tournamentEventDetails.get(currentEvent.id ?? '') ?? currentEvent,
        config,
        syncedAt,
      )
      if (!normalized) {
        continue
      }

      normalizedEventsById.set(normalized.id, normalized)
    }
  }

  return {
    windows,
    payload: payloads.at(-1) ?? { events: [] },
    events: [...normalizedEventsById.values()],
  }
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
      windowStartsAt: firstWindow.start.toISOString(),
      windowEndsAt: lastWindow.end.toISOString(),
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

function toCachedEvent(row: NapkinbetsCachedEventRow): NapkinbetsCachedEvent {
  return {
    id: row.id,
    source: row.source as 'espn',
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
    lastSyncedAt: row.lastSyncedAt,
    sourceUpdatedAt: row.sourceUpdatedAt ?? null,
    rawPayload: null,
    odds: null,
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

function takeLeagueBalancedEvents(events: NapkinbetsCachedEvent[], limit: number) {
  const selected: NapkinbetsCachedEvent[] = []
  const overflow: NapkinbetsCachedEvent[] = []
  const seenLeagues = new Set<string>()

  for (const event of events) {
    if (!seenLeagues.has(event.league)) {
      seenLeagues.add(event.league)
      selected.push(event)
      continue
    }

    overflow.push(event)
  }

  return [...selected, ...overflow].slice(0, limit)
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

  const startingSoon = takeLeagueBalancedEvents(
    upcoming.filter((event) => isWithinHours(new Date(event.startTime), 4, now)),
    8,
  )
  const startingSoonIds = new Set(startingSoon.map((event) => event.id))

  const today = takeLeagueBalancedEvents(
    upcoming.filter(
      (event) =>
        !startingSoonIds.has(event.id) && isWithinHours(new Date(event.startTime), 24, now),
    ),
    10,
  )
  const todayIds = new Set(today.map((event) => event.id))

  const nextUpWindow = upcoming
    .filter((event) => !startingSoonIds.has(event.id) && !todayIds.has(event.id))
    .filter((event) => isWithinHours(new Date(event.startTime), 24 * 7, now))
  const nextUpSource = nextUpWindow.length
    ? nextUpWindow
    : upcoming.filter((event) => !startingSoonIds.has(event.id) && !todayIds.has(event.id))
  const nextUp = takeLeagueBalancedEvents(nextUpSource, 12)

  return [
    {
      key: 'live-now',
      label: 'Live now',
      description: 'Events already in motion and ready for close-to-live bets.',
      events: liveNow,
    },
    {
      key: 'starting-soon',
      label: 'Starting soon',
      description: 'Good bets to set before the first whistle or tip.',
      events: startingSoon,
    },
    {
      key: 'today',
      label: 'Today',
      description: 'The rest of the strongest events inside the next 24 hours.',
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

function buildCreatePrefillFromEvent(
  event: NapkinbetsCachedEvent,
  idea?: CachedDiscoverEventIdea,
): NapkinbetsCreatePrefillQuery {
  return {
    source: event.source,
    eventId: event.id,
    eventTitle: event.eventTitle,
    eventStartsAt: event.startTime,
    eventStatus: event.status,
    sport: event.sport,
    contextKey: event.contextKey,
    league: event.league,
    venueName: event.venueName,
    homeTeamName: event.homeTeam.homeAway === 'home' ? event.homeTeam.name : '',
    awayTeamName: event.awayTeam.homeAway === 'away' ? event.awayTeam.name : '',
    format: idea?.format || (event.sport === 'golf' ? 'golf-draft' : 'sports-game'),
    sideOptions: idea?.sideOptions ?? [],
  }
}

function isGolfMajorEvent(event: Pick<NapkinbetsCachedEvent, 'sport' | 'eventTitle'>) {
  return event.sport === 'golf' && GOLF_MAJOR_EVENT_PATTERN.test(event.eventTitle)
}

function dedupeSpotlightAssets(assets: NapkinbetsDiscoverySpotlightAsset[]) {
  const unique = new Map<string, NapkinbetsDiscoverySpotlightAsset>()

  for (const asset of assets) {
    if (!asset.src) {
      continue
    }

    const key = `${asset.kind}:${asset.src}`
    if (!unique.has(key)) {
      unique.set(key, asset)
    }
  }

  return [...unique.values()]
}

function buildEditorialSpotlightAsset(src: string, alt: string): NapkinbetsDiscoverySpotlightAsset {
  return {
    kind: 'editorial',
    src,
    alt,
  }
}

function buildSpotlightAssetsFromEvent(
  event: NapkinbetsCachedEvent,
  options?: { includeMark?: boolean },
): NapkinbetsDiscoverySpotlightAsset[] {
  const editorialAsset =
    event.sport === 'golf'
      ? [
          buildEditorialSpotlightAsset(
            isGolfMajorEvent(event)
              ? NAPKINBETS_EDITORIAL_IMAGE_PATHS.masters
              : NAPKINBETS_EDITORIAL_IMAGE_PATHS.liveRoom,
            `${event.eventTitle} editorial`,
          ),
        ]
      : []

  const markAsset = options?.includeMark
    ? [
        {
          kind: 'mark',
          src: '/brand/napkinbets-mark.svg',
          alt: 'Napkinbets spotlight',
        } satisfies NapkinbetsDiscoverySpotlightAsset,
      ]
    : []

  const teamAssets = [event.awayTeam, event.homeTeam]
    .filter((team) => team.logo)
    .slice(0, 2)
    .map(
      (team) =>
        ({
          kind: event.sport === 'golf' ? 'headshot' : 'logo',
          src: team.logo,
          alt: team.name,
        }) satisfies NapkinbetsDiscoverySpotlightAsset,
    )

  const assets = dedupeSpotlightAssets([...editorialAsset, ...markAsset, ...teamAssets]).slice(0, 3)

  if (assets.length > 0) {
    return assets
  }

  return [
    buildEditorialSpotlightAsset(
      NAPKINBETS_EDITORIAL_IMAGE_PATHS.discovery,
      `${event.leagueLabel} spotlight`,
    ),
  ]
}

function buildEditorialSpotlightAssets(
  events: NapkinbetsCachedEvent[],
): NapkinbetsDiscoverySpotlightAsset[] {
  const assets = events.flatMap((event) =>
    buildSpotlightAssetsFromEvent(event).filter((asset) => asset.kind !== 'editorial'),
  )

  return dedupeSpotlightAssets([
    buildEditorialSpotlightAsset(
      NAPKINBETS_EDITORIAL_IMAGE_PATHS.masters,
      'Napkinbets golf spotlight',
    ),
    ...assets,
  ]).slice(0, 3)
}

function buildTourSpotlightFromEvent(
  event: NapkinbetsCachedEvent,
  label: string,
): NapkinbetsDiscoverySpotlight {
  const isMajor = isGolfMajorEvent(event)
  const leaderNames = [event.awayTeam.name, event.homeTeam.name].filter(Boolean).join(' and ')

  return {
    id: `spotlight:${event.id}`,
    label: isMajor ? 'Major watch' : label,
    title: event.eventTitle,
    subtitle:
      event.sport === 'golf'
        ? event.state === 'in'
          ? `${leaderNames || 'The field'} gives you a live leaderboard lane without needing a sportsbook feed.`
          : `${leaderNames || 'Featured golfers'} give this tournament a clean featured lane before the round starts.`
        : event.summary,
    summary:
      event.sport === 'golf'
        ? `${event.summary} Keep the side market tight enough to settle from the official leaderboard.`
        : event.ideas[0]?.description ||
          'Use the live event context first, then keep the side market small enough to settle fast.',
    windowLabel: event.shortStatus,
    venueLabel: event.venueName,
    accent: isMajor ? 'major' : event.sport === 'golf' ? 'tour' : 'tour',
    assets: buildSpotlightAssetsFromEvent(event, { includeMark: event.state === 'in' }),
    prefill: buildCreatePrefillFromEvent(event, event.ideas[0]),
  }
}

export function buildDiscoverSpotlights(events: NapkinbetsCachedEvent[], now = new Date()) {
  const spotlights: NapkinbetsDiscoverySpotlight[] = []
  const golfEvents = events.filter((event) => event.sport === 'golf')
  const pgaEvent = golfEvents.find((event) => event.league === 'pga')
  const lpgaEvent = golfEvents.find((event) => event.league === 'lpga')
  const editorialAssets = buildEditorialSpotlightAssets(
    [pgaEvent, lpgaEvent].filter((event): event is NapkinbetsCachedEvent => Boolean(event)),
  )

  for (const spotlight of NAPKINBETS_GOLF_EDITORIAL) {
    const start = new Date(spotlight.prefill.eventStartsAt)
    if (start >= now && isWithinDays(start, 45, now)) {
      spotlights.push({
        ...spotlight,
        assets: editorialAssets,
      })
    }
  }

  if (pgaEvent) {
    spotlights.push(
      buildTourSpotlightFromEvent(pgaEvent, pgaEvent.state === 'in' ? 'Live on tour' : 'PGA tour'),
    )
  }

  if (lpgaEvent) {
    spotlights.push(
      buildTourSpotlightFromEvent(
        lpgaEvent,
        lpgaEvent.state === 'in' ? 'Live on tour' : 'LPGA tour',
      ),
    )
  }

  return spotlights.slice(0, 4)
}

export async function refreshDiscoverEventCache(event: H3Event, tier: DiscoverTier = 'manual') {
  const syncedAt = nowIso()
  const windows = buildIngestWindows(tier)
  const refreshedEvents = new Map<string, NapkinbetsCachedEvent>()
  const activeLeagues = (await loadNapkinbetsLeaguesFromStore(event, { eventBackedOnly: true }))
    .filter((config) => config.provider === 'espn')
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
          throw new Error('MySportsFeeds API mapping not yet implemented for events.')
        } else if (source === 'balldontlie') {
          throw new Error('BALLDONTLIE API mapping not yet implemented for events.')
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

function deserializeOddsRow(
  row: typeof napkinbetsEventOdds.$inferSelect,
): NapkinbetsEventOdds | null {
  try {
    return {
      source: 'polymarket' as const,
      url: row.polymarketUrl ?? 'https://polymarket.com',
      updatedAt: row.fetchedAt,
      moneyline: row.moneylineJson
        ? (JSON.parse(row.moneylineJson) as NapkinbetsEventOddsMarket)
        : null,
      spread: row.spreadJson ? (JSON.parse(row.spreadJson) as NapkinbetsEventOddsMarket) : null,
      total: row.totalJson ? (JSON.parse(row.totalJson) as NapkinbetsEventOddsMarket) : null,
      extraMarkets: row.extraMarketsJson
        ? (JSON.parse(row.extraMarketsJson) as NapkinbetsEventOddsMarket[])
        : [],
      volume: row.volume ?? null,
      priceChange24h: row.priceChange24h ?? null,
      commentCount: row.commentCount ?? null,
    }
  } catch {
    return null
  }
}

type NapkinbetsEventOddsMarket = NapkinbetsEventOdds extends { moneyline: infer M }
  ? NonNullable<M>
  : never

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

export async function loadCachedDiscoverData(event: H3Event) {
  const db = useAppDatabase(event)
  const readSnapshot = async () => {
    const [eventRows, latestRun, latestEventSync] = await Promise.all([
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
      db
        .select({ lastSyncedAt: napkinbetsEvents.lastSyncedAt })
        .from(napkinbetsEvents)
        .orderBy(desc(napkinbetsEvents.lastSyncedAt))
        .limit(1),
    ])

    return {
      events: eventRows.map((row) => toCachedEvent(row)),
      latestRun: latestRun[0] ?? null,
      latestSync: latestEventSync[0]?.lastSyncedAt ?? '',
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

  const spotlights = buildDiscoverSpotlights(snapshot.events)

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

  const existingIds = new Set(dbSpotlights.map((s) => s.id))
  const mergedSpotlights = [
    ...dbSpotlights,
    ...spotlights.filter((s) => !existingIds.has(s.id)),
  ].slice(0, 6)

  return {
    sections,
    spotlights: mergedSpotlights,
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

export async function loadEventIngestHealth(event: H3Event) {
  const db = useAppDatabase(event)
  const [latestRuns, totalEvents] = await Promise.all([
    db.select().from(napkinbetsIngestRuns).orderBy(desc(napkinbetsIngestRuns.startedAt)).limit(20),
    db.select().from(napkinbetsEvents),
  ])

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
    totalCachedEvents: totalEvents.length,
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
