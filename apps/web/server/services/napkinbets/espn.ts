import type { NapkinbetsLeagueDefinition } from './taxonomy'
import { getNapkinbetsContextLabel, getNapkinbetsSportLabel } from './taxonomy'
import type { NapkinbetsCachedEvent } from './event-queries'

// ---------------------------------------------------------------------------
// ESPN API response types
// ---------------------------------------------------------------------------

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

export interface EspnEvent {
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

export interface EspnScoreboardResponse {
  events?: EspnEvent[]
}

// ---------------------------------------------------------------------------
// Cached discover event sub-types (used by normalization)
// ---------------------------------------------------------------------------

export interface CachedDiscoverEventIdea {
  title: string
  description: string
  sideOptions: string[]
  format: string
}

export interface CachedDiscoverEventLeader {
  label: string
  athlete: string
  value: string
}

export interface CachedDiscoverEventTeam {
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

// ---------------------------------------------------------------------------
// Shared utilities (re-exported from events.ts shared module surface)
// ---------------------------------------------------------------------------

function formatEventTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatEspnDate(date: Date) {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

function addDays(date: Date, days: number) {
  const copy = new Date(date)
  copy.setUTCDate(copy.getUTCDate() + days)
  return copy
}

function buildEventId(source: string, league: string, externalEventId: string) {
  return `${source}:${league}:${externalEventId}`
}

export function isDiscoverCacheStale(freshestSync: string, nowMs = Date.now()) {
  if (!freshestSync) {
    return true
  }
  return nowMs - new Date(freshestSync).getTime() > 30 * 60 * 1000
}

// ---------------------------------------------------------------------------
// Ingest windows
// ---------------------------------------------------------------------------

export interface IngestWindow {
  start: Date
  end: Date
  datesParam: string
}

export type DiscoverTier = 'live-window' | 'next-48h' | 'next-7d' | 'next-8w' | 'manual'

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

export function getMonthsCoveredByWindows(windows: IngestWindow[]) {
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

export function isLeagueActive(config: NapkinbetsLeagueDefinition, windows: IngestWindow[]) {
  const coveredMonths = getMonthsCoveredByWindows(windows)

  return (config.activeMonths as readonly number[]).some((month) => coveredMonths.has(month))
}

// ---------------------------------------------------------------------------
// ESPN helpers — broadcast, location, status, scoring
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Golf-specific helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// League-specific bet ideas
// ---------------------------------------------------------------------------

export function getLeagueIdeas(
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

// ---------------------------------------------------------------------------
// ESPN scoreboard URL builder
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Event normalization (matchup and tournament shapes)
// ---------------------------------------------------------------------------

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
    importanceScore: 0,
    importanceReason: '',
    lastSyncedAt: syncedAt,
    sourceUpdatedAt: '',
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
    importanceScore: 0,
    importanceReason: '',
    lastSyncedAt: syncedAt,
    sourceUpdatedAt: '',
    rawPayload: event,
  }
}

export function normalizeEspnEvent(
  event: EspnEvent,
  config: NapkinbetsLeagueDefinition,
  syncedAt: string,
) {
  if (config.eventShape === 'tournament') {
    return normalizeTournamentEspnEvent(event, config, syncedAt)
  }

  return normalizeMatchupEspnEvent(event, config, syncedAt)
}

// ---------------------------------------------------------------------------
// ESPN API fetchers
// ---------------------------------------------------------------------------

export async function fetchEspnJson<T>(url: string) {
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

export async function fetchLeagueEvents(
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
