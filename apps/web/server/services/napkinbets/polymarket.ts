interface NapkinbetsOddsTeamInput {
  name: string
  shortName: string
  abbreviation: string
}

export interface NapkinbetsOddsEventInput {
  id: string
  league: string
  state: 'pre' | 'in' | 'post'
  startTime: string
  eventTitle: string
  awayTeam: NapkinbetsOddsTeamInput
  homeTeam: NapkinbetsOddsTeamInput
}

export interface NapkinbetsEventOddsSide {
  label: string
  probability: number | null
}

export interface NapkinbetsEventOddsMarket {
  label: string
  detail: string | null
  left: NapkinbetsEventOddsSide
  right: NapkinbetsEventOddsSide
}

export interface NapkinbetsEventOdds {
  source: 'polymarket'
  url: string
  updatedAt: string
  moneyline: NapkinbetsEventOddsMarket | null
  spread: NapkinbetsEventOddsMarket | null
  total: NapkinbetsEventOddsMarket | null
  extraMarkets: NapkinbetsEventOddsMarket[]
  volume: number | null
  priceChange24h: number | null
  commentCount: number | null
}

interface PolymarketMarket {
  slug?: string
  sportsMarketType?: string
  outcomes?: string
  outcomePrices?: string
  updatedAt?: string
  line?: number | string
  gameStartTime?: string
  volume?: string | number
  bestBid?: number
  bestAsk?: number
  lastTradePrice?: number
  spread?: number
  oneDayPriceChange?: number
  groupItemTitle?: string
  description?: string
}

interface PolymarketEvent {
  title?: string
  slug?: string
  active?: boolean
  closed?: boolean
  archived?: boolean
  updatedAt?: string
  markets?: PolymarketMarket[]
  volume?: number
  commentCount?: number
  competitive?: number
}

interface PolymarketSearchResponse {
  events?: PolymarketEvent[]
}

const POLYMARKET_SUPPORTED_LEAGUES = new Set([
  'nba',
  'wnba',
  'ncaamb',
  'ncaaw',
  'ncaaf',
  'mlb',
  'nhl',
  'nfl',
  'epl',
  'mls',
  'nwsl',
  'uefa-champions',
  'lpga',
  'ufc',
])

const POLYMARKET_LEAGUE_SLUG_MAP: Record<string, string> = {
  nba: 'nba',
  wnba: 'wnba',
  ncaamb: 'ncaab',
  ncaaw: 'cwbb',
  ncaaf: 'cfb',
  mlb: 'mlb',
  nhl: 'nhl',
  nfl: 'nfl',
  epl: 'epl',
  mls: 'mls',
  'uefa-champions': 'ucl',
  ufc: 'ufc',
}

const POLYMARKET_EXTRA_MARKET_DEFS: Array<{
  type: string
  label: string
  sports?: string[]
}> = [
  { type: 'both_teams_to_score', label: 'Both Teams to Score', sports: ['soccer'] },
  { type: 'first_half_moneyline', label: '1st Half ML' },
  { type: 'first_half_spreads', label: '1st Half Spread' },
  { type: 'first_half_totals', label: '1st Half Total' },
  { type: 'nrfi', label: 'NRFI', sports: ['baseball'] },
  { type: 'double_chance', label: 'Double Chance', sports: ['soccer'] },
  { type: 'team_totals', label: 'Team Totals' },
  { type: 'team_totals_home', label: 'Home Team Total' },
  { type: 'team_totals_away', label: 'Away Team Total' },
  { type: 'total_goals', label: 'Total Goals', sports: ['soccer'] },
  { type: 'total_corners', label: 'Total Corners', sports: ['soccer'] },
]

const POLYMARKET_LOOKUP_LIMIT = 10
const POLYMARKET_TIMEOUT_MS = 2_500

function normalizeText(value: string | null | undefined) {
  return (value ?? '')
    .toLowerCase()
    .replaceAll('&', ' and ')
    .replaceAll(/[^a-z0-9]+/g, ' ')
    .replaceAll(/\s+/g, ' ')
    .trim()
}

function parseJsonArray(value: string | undefined): string[] {
  if (!value) {
    return []
  }

  try {
    const parsed = JSON.parse(value) as unknown
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : []
  } catch {
    return []
  }
}

function toProbability(value: string | undefined) {
  if (!value) {
    return null
  }

  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    return null
  }

  return Math.round(numeric * 100)
}

function buildTeamTerms(team: NapkinbetsOddsTeamInput) {
  const values = new Set<string>()
  const addValue = (value: string) => {
    const normalized = normalizeText(value)
    if (normalized.length >= 2) {
      values.add(normalized)
    }
  }

  addValue(team.name)
  addValue(team.shortName)
  addValue(team.abbreviation)

  const words = normalizeText(team.name).split(' ').filter(Boolean)
  const shortWords = normalizeText(team.shortName).split(' ').filter(Boolean)
  const tailWord = words.at(-1)
  const shortTailWord = shortWords.at(-1)

  if (tailWord) {
    addValue(tailWord)
  }

  if (shortTailWord) {
    addValue(shortTailWord)
  }

  return [...values]
}

function buildSearchQueries(event: NapkinbetsOddsEventInput) {
  const queries = new Set<string>()
  const awayShort = event.awayTeam.shortName || event.awayTeam.name
  const homeShort = event.homeTeam.shortName || event.homeTeam.name
  const leagueSlug = POLYMARKET_LEAGUE_SLUG_MAP[event.league] ?? ''

  queries.add(`${awayShort} ${homeShort}`)
  queries.add(`${event.awayTeam.name} ${event.homeTeam.name}`)
  queries.add(`${event.awayTeam.abbreviation} ${event.homeTeam.abbreviation}`)

  if (leagueSlug) {
    queries.add(`${awayShort} ${homeShort} ${leagueSlug}`)
  }

  return [...queries].map((query) => normalizeText(query)).filter((query) => query.length >= 4)
}

function isSupportedLeague(event: NapkinbetsOddsEventInput) {
  return POLYMARKET_SUPPORTED_LEAGUES.has(event.league)
}

function isReasonableTimeWindow(targetStartTime: string) {
  const targetMs = new Date(targetStartTime).getTime()
  if (Number.isNaN(targetMs)) {
    return false
  }

  const nowMs = Date.now()
  const deltaMs = targetMs - nowMs

  return deltaMs <= 36 * 60 * 60 * 1000 && deltaMs >= -6 * 60 * 60 * 1000
}

async function fetchPolymarketSearch(query: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), POLYMARKET_TIMEOUT_MS)

  try {
    const url = new URL('https://gamma-api.polymarket.com/public-search')
    url.searchParams.set('q', query)

    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'napkinbets-polymarket-lookup',
      },
      signal: controller.signal,
    })

    if (!response.ok) {
      return []
    }

    const payload = (await response.json()) as PolymarketSearchResponse
    return payload.events ?? []
  } catch {
    return []
  } finally {
    clearTimeout(timeout)
  }
}

function scoreCandidate(candidate: PolymarketEvent, event: NapkinbetsOddsEventInput) {
  if (candidate.closed || candidate.archived) {
    return Number.NEGATIVE_INFINITY
  }

  const awayTerms = buildTeamTerms(event.awayTeam)
  const homeTerms = buildTeamTerms(event.homeTeam)

  const haystack = normalizeText(`${candidate.title ?? ''} ${candidate.slug ?? ''}`)
  const isDirectEventMatch =
    awayTerms.some((term) => haystack.includes(term)) &&
    homeTerms.some((term) => haystack.includes(term))

  let targetMarket: PolymarketMarket | undefined
  if (candidate.markets) {
    targetMarket = candidate.markets.find((m) => {
      const mh = normalizeText(
        `${m.groupItemTitle ?? ''} ${m.description ?? ''} ${m.outcomes ?? ''}`,
      )
      return awayTerms.some((t) => mh.includes(t)) && homeTerms.some((t) => mh.includes(t))
    })
  }

  if (!isDirectEventMatch && !targetMarket) {
    return Number.NEGATIVE_INFINITY
  }

  const candidateStartValue =
    targetMarket?.gameStartTime ??
    candidate.markets?.find((market) => market.gameStartTime)?.gameStartTime ??
    candidate.updatedAt ??
    ''
  const candidateStartMs = new Date(candidateStartValue).getTime()
  const targetStartMs = new Date(event.startTime).getTime()
  const deltaMs =
    Number.isNaN(candidateStartMs) || Number.isNaN(targetStartMs)
      ? Number.MAX_SAFE_INTEGER
      : Math.abs(candidateStartMs - targetStartMs)

  if (deltaMs > 36 * 60 * 60 * 1000) {
    return Number.NEGATIVE_INFINITY
  }

  let score = 0
  if (candidate.active) {
    score += 2
  }

  if (deltaMs <= 2 * 60 * 60 * 1000) {
    score += 5
  } else if (deltaMs <= 12 * 60 * 60 * 1000) {
    score += 3
  } else {
    score += 1
  }

  score += awayTerms.filter((term) => haystack.includes(term)).length
  score += homeTerms.filter((term) => haystack.includes(term)).length

  if (targetMarket) {
    score += 10
  }

  return score
}

function pickCandidate(
  candidates: PolymarketEvent[],
  event: NapkinbetsOddsEventInput,
): PolymarketEvent | null {
  return (
    [...candidates]
      .map((candidate) => ({
        candidate,
        score: scoreCandidate(candidate, event),
      }))
      .filter((entry) => Number.isFinite(entry.score))
      .sort((left, right) => right.score - left.score)[0]?.candidate ?? null
  )
}

function findOutcomeIndex(outcomes: string[], teamTerms: string[]) {
  return outcomes.findIndex((outcome) => {
    const normalized = normalizeText(outcome)
    return teamTerms.some((term) => normalized.includes(term))
  })
}

function buildMoneylineOdds(
  market: PolymarketMarket | undefined,
  event: NapkinbetsOddsEventInput,
): NapkinbetsEventOddsMarket | null {
  if (!market) {
    return null
  }

  const outcomes = parseJsonArray(market.outcomes)
  const prices = parseJsonArray(market.outcomePrices)
  if (outcomes.length !== prices.length || outcomes.length < 2) {
    return null
  }

  const awayIndex = findOutcomeIndex(outcomes, buildTeamTerms(event.awayTeam))
  const homeIndex = findOutcomeIndex(outcomes, buildTeamTerms(event.homeTeam))

  if (awayIndex < 0 || homeIndex < 0) {
    return null
  }

  return {
    label: 'Moneyline',
    detail: null,
    left: {
      label: event.awayTeam.shortName || outcomes[awayIndex] || event.awayTeam.name,
      probability: toProbability(prices[awayIndex]),
    },
    right: {
      label: event.homeTeam.shortName || outcomes[homeIndex] || event.homeTeam.name,
      probability: toProbability(prices[homeIndex]),
    },
  }
}

function buildGenericMarketOdds(
  market: PolymarketMarket | undefined,
  label: string,
  detail: string | null,
): NapkinbetsEventOddsMarket | null {
  if (!market) {
    return null
  }

  const outcomes = parseJsonArray(market.outcomes)
  const prices = parseJsonArray(market.outcomePrices)
  if (outcomes.length !== prices.length || outcomes.length < 2) {
    return null
  }

  return {
    label,
    detail,
    left: {
      label: outcomes[0] ?? 'Left',
      probability: toProbability(prices[0]),
    },
    right: {
      label: outcomes[1] ?? 'Right',
      probability: toProbability(prices[1]),
    },
  }
}

function buildExtraMarketOdds(
  matchedEvent: PolymarketEvent,
  coreTypes: Set<string>,
): NapkinbetsEventOddsMarket[] {
  if (!matchedEvent.markets) {
    return []
  }

  const extras: NapkinbetsEventOddsMarket[] = []

  for (const def of POLYMARKET_EXTRA_MARKET_DEFS) {
    if (coreTypes.has(def.type)) {
      continue
    }

    const market = matchedEvent.markets.find((m) => m.sportsMarketType === def.type)
    if (!market) {
      continue
    }

    const detail = market.line !== undefined && market.line !== null ? String(market.line) : null

    const parsed = buildGenericMarketOdds(market, def.label, detail)
    if (parsed) {
      extras.push(parsed)
    }
  }

  return extras
}

function computeMoneylinePriceChange(matchedEvent: PolymarketEvent): number | null {
  const moneylineMarket = matchedEvent.markets?.find((m) => m.sportsMarketType === 'moneyline')

  if (!moneylineMarket || moneylineMarket.oneDayPriceChange === undefined) {
    return null
  }

  return Math.round(moneylineMarket.oneDayPriceChange * 100)
}

async function findPolymarketOddsForEvent(event: NapkinbetsOddsEventInput) {
  const candidates = new Map<string, PolymarketEvent>()

  const searchResultsByQuery = await Promise.all(
    buildSearchQueries(event).map((query) => fetchPolymarketSearch(query)),
  )

  for (const searchResults of searchResultsByQuery) {
    for (const candidate of searchResults) {
      if (candidate.slug) {
        candidates.set(candidate.slug, candidate)
      }
    }
  }

  const matchedEvent = pickCandidate([...candidates.values()], event)
  if (!matchedEvent) {
    return null
  }

  const coreTypes = new Set(['moneyline', 'spreads', 'totals'])
  const awayTerms = buildTeamTerms(event.awayTeam)
  const homeTerms = buildTeamTerms(event.homeTeam)

  const eventMarkets = matchedEvent.markets

  function findMarket(type?: string) {
    if (!eventMarkets) return
    return eventMarkets.find((m) => {
      if (type && m.sportsMarketType !== type) return false
      if (eventMarkets.length > 1) {
        const mh = normalizeText(
          `${m.groupItemTitle ?? ''} ${m.description ?? ''} ${m.outcomes ?? ''}`,
        )
        const hasAway = awayTerms.some((t) => mh.includes(t))
        const hasHome = homeTerms.some((t) => mh.includes(t))
        if (!hasAway || !hasHome) return false
      }
      return true
    })
  }

  let moneylineMarket = findMarket('moneyline')
  if (!moneylineMarket && eventMarkets && eventMarkets.length > 1) {
    moneylineMarket = findMarket()
  }

  const spreadMarket = findMarket('spreads')
  const totalMarket = findMarket('totals')

  const moneyline = buildMoneylineOdds(moneylineMarket, event)
  const spread = buildGenericMarketOdds(
    spreadMarket,
    'Spread',
    spreadMarket?.line !== undefined && spreadMarket?.line !== null
      ? `${Number(spreadMarket.line) > 0 ? '+' : ''}${spreadMarket.line}`
      : null,
  )
  const total = buildGenericMarketOdds(
    totalMarket,
    'Total',
    totalMarket?.line !== undefined && totalMarket?.line !== null
      ? `O/U ${totalMarket.line}`
      : null,
  )

  const extraMarkets = buildExtraMarketOdds(matchedEvent, coreTypes)

  if (!moneyline && !spread && !total && extraMarkets.length === 0) {
    return null
  }

  const eventVolume =
    matchedEvent.volume !== undefined && matchedEvent.volume !== null
      ? Math.round(matchedEvent.volume)
      : null

  return {
    source: 'polymarket' as const,
    url: matchedEvent.slug
      ? `https://polymarket.com/event/${matchedEvent.slug}`
      : 'https://polymarket.com',
    updatedAt:
      moneylineMarket?.updatedAt ??
      spreadMarket?.updatedAt ??
      totalMarket?.updatedAt ??
      matchedEvent.updatedAt ??
      '',
    moneyline,
    spread,
    total,
    extraMarkets,
    volume: eventVolume,
    priceChange24h: computeMoneylinePriceChange(matchedEvent),
    commentCount: matchedEvent.commentCount ?? null,
  }
}

export async function enrichNapkinbetsEventsWithPolymarketOdds<T extends NapkinbetsOddsEventInput>(
  events: T[],
) {
  const prioritizedEvents = events
    .filter((event) => isSupportedLeague(event))
    .filter((event) => event.state !== 'post')
    .filter((event) => isReasonableTimeWindow(event.startTime))
    .slice(0, POLYMARKET_LOOKUP_LIMIT)

  const oddsPromises: Array<Promise<readonly [string, NapkinbetsEventOdds | null]>> = []
  for (const event of prioritizedEvents) {
    oddsPromises.push(findPolymarketOddsForEvent(event).then((odds) => [event.id, odds] as const))
  }

  const oddsEntries = await Promise.all(oddsPromises)

  return new Map(
    oddsEntries.filter((entry): entry is readonly [string, NapkinbetsEventOdds] =>
      Boolean(entry[1]),
    ),
  )
}

export async function refreshPolymarketOddsForEventId(
  db: import('drizzle-orm/d1').DrizzleD1Database<typeof import('#server/database/schema')>,
  eventId: string,
  eventData: NapkinbetsOddsEventInput,
) {
  if (
    !isSupportedLeague(eventData) ||
    eventData.state === 'post' ||
    !isReasonableTimeWindow(eventData.startTime)
  ) {
    return null
  }

  const odds = await findPolymarketOddsForEvent(eventData)

  const nowMs = Date.now()
  const fetchedAt = new Date(nowMs).toISOString()

  // If we found odds, give them a normal TTL based on state.
  // If we didn't find odds, give a shorter negative-cache TTL so we don't spam Polymarket.
  const ttl = odds ? (eventData.state === 'in' ? 2 * 60 * 1000 : 5 * 60 * 1000) : 15 * 60 * 1000

  const expiresAt = new Date(nowMs + ttl).toISOString()
  const rowId = `odds:${eventId}`

  if (odds) {
    const { napkinbetsEventOdds } = await import('#server/database/schema')
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
  } else {
    // Even if we didn't find odds, we should upsert a "not found" record or at least update the expiresAt
    // of an existing record to prevent immediate re-fetching.
    // In the schema, we might need a way to indicate "fetched but not found",
    // but currently `syncCachedOdds` only inserts when odds are found.
    // To avoid spamming, we could insert a dummy record, but schema requires URL.
    // Actually, if we don't insert, `syncCachedOdds` will just try again next time standard ingest runs.
    // For the on-demand button, if it fails, it fails. We can just return null.
  }

  return odds
}

export async function refreshActivelyTradedOdds(
  db: import('drizzle-orm/d1').DrizzleD1Database<typeof import('#server/database/schema')>,
  limit = 15,
) {
  const { napkinbetsEvents, napkinbetsEventOdds } = await import('#server/database/schema')
  const { or, eq, asc } = await import('drizzle-orm')

  const nowIsoStr = new Date().toISOString()

  // Find events that are 'pre' or 'in' and either:
  // 1. Have no odds row
  // 2. Have an odds row that is expired
  // We prioritize 'in' events and those starting soonest.
  // We need to fetch the events and left join with odds to check expiration.

  const eventsToRefresh = await db
    .select({
      id: napkinbetsEvents.id,
      league: napkinbetsEvents.league,
      state: napkinbetsEvents.state,
      startTime: napkinbetsEvents.startTime,
      eventTitle: napkinbetsEvents.eventTitle,
      awayTeamJson: napkinbetsEvents.awayTeamJson,
      homeTeamJson: napkinbetsEvents.homeTeamJson,
      oddsExpiresAt: napkinbetsEventOdds.expiresAt,
    })
    .from(napkinbetsEvents)
    .leftJoin(napkinbetsEventOdds, eq(napkinbetsEvents.id, napkinbetsEventOdds.eventId))
    .where(or(eq(napkinbetsEvents.state, 'in'), eq(napkinbetsEvents.state, 'pre')))
    .orderBy(asc(napkinbetsEvents.state), asc(napkinbetsEvents.startTime))

  // Filter in memory since Drizzle SQLite leftJoin + isNull/lt can be slightly tricky or non-indexed
  const candidates: NapkinbetsOddsEventInput[] = []

  for (const row of eventsToRefresh) {
    if (!row.oddsExpiresAt || row.oddsExpiresAt < nowIsoStr) {
      const homeTeam = parseJsonValue(row.homeTeamJson, {
        name: '',
        shortName: '',
        abbreviation: '',
      })
      const awayTeam = parseJsonValue(row.awayTeamJson, {
        name: '',
        shortName: '',
        abbreviation: '',
      })

      // We only want unsupported events skipped, but we can filter that via the isSupportedLeague func inside
      candidates.push({
        id: row.id,
        league: row.league,
        state: row.state as 'in' | 'pre' | 'post',
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
      })
    }
  }

  const prioritized = candidates
    .filter((event) => isSupportedLeague(event) && isReasonableTimeWindow(event.startTime))
    .slice(0, limit)

  let updatedCount = 0
  for (const candidate of prioritized) {
    const odds = await refreshPolymarketOddsForEventId(db, candidate.id, candidate)
    if (odds) {
      updatedCount++
    }
  }

  return { attempted: prioritized.length, updatedCount }
}

function parseJsonValue<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}
