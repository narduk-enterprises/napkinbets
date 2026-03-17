export const NAPKINBETS_BOARD_TYPES = [
  'event-backed',
  'manual-curated',
  'community-created',
] as const

export type NapkinbetsBoardType = (typeof NAPKINBETS_BOARD_TYPES)[number]

export const NAPKINBETS_SPORT_KEYS = [
  'basketball',
  'football',
  'baseball',
  'hockey',
  'golf',
  'soccer',
  'motorsports',
  'combat',
  'tennis',
  'track-field',
  'entertainment',
  'other',
] as const

export type NapkinbetsSportKey = (typeof NAPKINBETS_SPORT_KEYS)[number]

export const NAPKINBETS_CONTEXT_KEYS = [
  'pro',
  'college',
  'high-school',
  'tournament',
  'international',
  'community',
  'entertainment',
] as const

export type NapkinbetsContextKey = (typeof NAPKINBETS_CONTEXT_KEYS)[number]

export interface NapkinbetsSportDefinition {
  key: NapkinbetsSportKey
  label: string
  icon: string
  supportsEventDiscovery: boolean
}

export interface NapkinbetsContextDefinition {
  key: NapkinbetsContextKey
  label: string
  description: string
}

export interface NapkinbetsLeagueDefinition {
  key: string
  label: string
  sportKey: NapkinbetsSportKey
  sportLabel?: string
  primaryContextKey: NapkinbetsContextKey
  primaryContextLabel?: string
  contextKeys: NapkinbetsContextKey[]
  provider: 'espn' | 'manual'
  providerLeagueKey?: string
  scoreboardQueryParams?: Readonly<Record<string, string>>
  eventShape?: 'head-to-head' | 'tournament'
  activeMonths: number[]
  supportsDateWindow?: boolean
  supportsEventDiscovery: boolean
}

interface CreateWagerTaxonomyInput {
  boardType: string
  sport: string
  league?: string
  contextKey: string
  eventSource?: string
  eventId?: string
  customContextName?: string
}

export const NAPKINBETS_DEFAULT_SPORTS: ReadonlyArray<NapkinbetsSportDefinition> = [
  {
    key: 'basketball',
    label: 'Basketball',
    icon: 'i-lucide-badge-info',
    supportsEventDiscovery: true,
  },
  {
    key: 'football',
    label: 'Football',
    icon: 'i-lucide-badge-info',
    supportsEventDiscovery: true,
  },
  {
    key: 'baseball',
    label: 'Baseball',
    icon: 'i-lucide-badge-info',
    supportsEventDiscovery: true,
  },
  {
    key: 'hockey',
    label: 'Hockey',
    icon: 'i-lucide-badge-info',
    supportsEventDiscovery: true,
  },
  {
    key: 'golf',
    label: 'Golf',
    icon: 'i-lucide-badge-info',
    supportsEventDiscovery: true,
  },
  {
    key: 'soccer',
    label: 'Soccer',
    icon: 'i-lucide-badge-info',
    supportsEventDiscovery: false,
  },
  {
    key: 'motorsports',
    label: 'Motorsports',
    icon: 'i-lucide-badge-info',
    supportsEventDiscovery: false,
  },
  {
    key: 'combat',
    label: 'Combat',
    icon: 'i-lucide-badge-info',
    supportsEventDiscovery: false,
  },
  {
    key: 'tennis',
    label: 'Tennis',
    icon: 'i-lucide-badge-info',
    supportsEventDiscovery: false,
  },
  {
    key: 'track-field',
    label: 'Track & field',
    icon: 'i-lucide-badge-info',
    supportsEventDiscovery: false,
  },
  {
    key: 'entertainment',
    label: 'Entertainment',
    icon: 'i-lucide-badge-info',
    supportsEventDiscovery: false,
  },
  {
    key: 'other',
    label: 'Other',
    icon: 'i-lucide-badge-info',
    supportsEventDiscovery: false,
  },
] satisfies ReadonlyArray<NapkinbetsSportDefinition>

export const NAPKINBETS_DEFAULT_CONTEXTS: ReadonlyArray<NapkinbetsContextDefinition> = [
  {
    key: 'pro',
    label: 'Professional',
    description: 'Top-flight leagues and tours with regular public schedule data.',
  },
  {
    key: 'college',
    label: 'College',
    description: 'NCAA and campus-level boards tied to college events.',
  },
  {
    key: 'high-school',
    label: 'High school',
    description: 'School meets, district tournaments, and other prep events.',
  },
  {
    key: 'tournament',
    label: 'Tournament',
    description: 'Majors, invitationals, and bracket-style event runs.',
  },
  {
    key: 'international',
    label: 'International',
    description: 'National-team competitions and international event windows.',
  },
  {
    key: 'community',
    label: 'Community',
    description: 'Neighborhood runs, club matches, or friend-group events.',
  },
  {
    key: 'entertainment',
    label: 'Entertainment',
    description: 'Shows, culture moments, and non-sports social bets.',
  },
] satisfies ReadonlyArray<NapkinbetsContextDefinition>

export const NAPKINBETS_LEAGUES: ReadonlyArray<NapkinbetsLeagueDefinition> = [
  {
    key: 'nba',
    label: 'NBA',
    sportKey: 'basketball',
    primaryContextKey: 'pro',
    contextKeys: ['pro'],
    provider: 'espn',
    activeMonths: [1, 2, 3, 4, 5, 6, 10, 11, 12],
    supportsEventDiscovery: true,
  },
  {
    key: 'wnba',
    label: 'WNBA',
    sportKey: 'basketball',
    primaryContextKey: 'pro',
    contextKeys: ['pro'],
    provider: 'espn',
    activeMonths: [5, 6, 7, 8, 9, 10],
    supportsEventDiscovery: true,
  },
  {
    key: 'ncaamb',
    label: "Men's College Basketball",
    sportKey: 'basketball',
    primaryContextKey: 'college',
    contextKeys: ['college', 'tournament'],
    provider: 'espn',
    providerLeagueKey: 'mens-college-basketball',
    scoreboardQueryParams: {
      groups: '50',
    },
    activeMonths: [1, 2, 3, 4, 11, 12],
    supportsEventDiscovery: true,
  },
  {
    key: 'ncaaw',
    label: "Women's College Basketball",
    sportKey: 'basketball',
    primaryContextKey: 'college',
    contextKeys: ['college', 'tournament'],
    provider: 'espn',
    providerLeagueKey: 'womens-college-basketball',
    scoreboardQueryParams: {
      groups: '50',
    },
    activeMonths: [1, 2, 3, 4, 11, 12],
    supportsEventDiscovery: true,
  },
  {
    key: 'nfl',
    label: 'NFL',
    sportKey: 'football',
    primaryContextKey: 'pro',
    contextKeys: ['pro'],
    provider: 'espn',
    activeMonths: [1, 8, 9, 10, 11, 12],
    supportsEventDiscovery: true,
  },
  {
    key: 'ncaaf',
    label: 'College Football',
    sportKey: 'football',
    primaryContextKey: 'college',
    contextKeys: ['college', 'tournament'],
    provider: 'espn',
    providerLeagueKey: 'college-football',
    activeMonths: [1, 8, 9, 10, 11, 12],
    supportsEventDiscovery: true,
  },
  {
    key: 'mlb',
    label: 'MLB',
    sportKey: 'baseball',
    primaryContextKey: 'pro',
    contextKeys: ['pro', 'international'],
    provider: 'espn',
    activeMonths: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    supportsEventDiscovery: true,
  },
  {
    key: 'nhl',
    label: 'NHL',
    sportKey: 'hockey',
    primaryContextKey: 'pro',
    contextKeys: ['pro', 'international'],
    provider: 'espn',
    activeMonths: [1, 2, 3, 4, 5, 6, 9, 10, 11, 12],
    supportsEventDiscovery: true,
  },
  {
    key: 'pga',
    label: 'PGA Tour',
    sportKey: 'golf',
    primaryContextKey: 'tournament',
    contextKeys: ['pro', 'tournament'],
    provider: 'espn',
    eventShape: 'tournament',
    activeMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    supportsEventDiscovery: true,
  },
  {
    key: 'lpga',
    label: 'LPGA Tour',
    sportKey: 'golf',
    primaryContextKey: 'tournament',
    contextKeys: ['pro', 'tournament'],
    provider: 'espn',
    eventShape: 'tournament',
    activeMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    supportsEventDiscovery: true,
  },
  {
    key: 'mls',
    label: 'MLS',
    sportKey: 'soccer',
    primaryContextKey: 'pro',
    contextKeys: ['pro', 'international'],
    provider: 'espn',
    providerLeagueKey: 'usa.1',
    activeMonths: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    supportsEventDiscovery: true,
  },
  {
    key: 'nwsl',
    label: 'NWSL',
    sportKey: 'soccer',
    primaryContextKey: 'pro',
    contextKeys: ['pro', 'international'],
    provider: 'espn',
    providerLeagueKey: 'usa.nwsl',
    activeMonths: [3, 4, 5, 6, 7, 8, 9, 10, 11],
    supportsEventDiscovery: true,
  },
  {
    key: 'college-baseball',
    label: 'College Baseball',
    sportKey: 'baseball',
    primaryContextKey: 'college',
    contextKeys: ['college', 'tournament'],
    provider: 'espn',
    providerLeagueKey: 'college-baseball',
    activeMonths: [2, 3, 4, 5, 6],
    supportsEventDiscovery: true,
  },
  {
    key: 'epl',
    label: 'Premier League',
    sportKey: 'soccer',
    primaryContextKey: 'international',
    contextKeys: ['pro', 'international'],
    provider: 'espn',
    providerLeagueKey: 'eng.1',
    activeMonths: [1, 2, 3, 4, 5, 8, 9, 10, 11, 12],
    supportsEventDiscovery: true,
  },
  {
    key: 'uefa-champions',
    label: 'UEFA Champions League',
    sportKey: 'soccer',
    primaryContextKey: 'international',
    contextKeys: ['international', 'tournament'],
    provider: 'espn',
    providerLeagueKey: 'uefa.champions',
    activeMonths: [1, 2, 3, 4, 9, 10, 11, 12],
    supportsEventDiscovery: true,
  },
  {
    key: 'ufc',
    label: 'UFC',
    sportKey: 'combat',
    primaryContextKey: 'pro',
    contextKeys: ['pro', 'international'],
    provider: 'manual',
    activeMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    supportsEventDiscovery: false,
  },
  {
    key: 'atp',
    label: 'ATP Tour',
    sportKey: 'tennis',
    primaryContextKey: 'pro',
    contextKeys: ['pro', 'tournament', 'international'],
    provider: 'manual',
    activeMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    supportsEventDiscovery: false,
  },
] satisfies ReadonlyArray<NapkinbetsLeagueDefinition>

export const NAPKINBETS_EVENT_LEAGUES = NAPKINBETS_LEAGUES.filter(
  (league) => league.supportsEventDiscovery,
)

export function getNapkinbetsSports() {
  return NAPKINBETS_DEFAULT_SPORTS
}

export function getNapkinbetsContexts() {
  return NAPKINBETS_DEFAULT_CONTEXTS
}

export function getNapkinbetsLeagues(options?: {
  sportKey?: string
  contextKey?: string
  eventBackedOnly?: boolean
}) {
  return NAPKINBETS_LEAGUES.filter((league) => {
    if (options?.eventBackedOnly && !league.supportsEventDiscovery) {
      return false
    }

    if (options?.sportKey && league.sportKey !== options.sportKey) {
      return false
    }

    if (
      options?.contextKey &&
      !league.contextKeys.includes(options.contextKey as NapkinbetsContextKey)
    ) {
      return false
    }

    return true
  })
}

export function findNapkinbetsSport(key: string) {
  return NAPKINBETS_DEFAULT_SPORTS.find((sport) => sport.key === key) ?? null
}

export function findNapkinbetsContext(key: string) {
  return NAPKINBETS_DEFAULT_CONTEXTS.find((context) => context.key === key) ?? null
}

export function findNapkinbetsLeague(key: string) {
  return NAPKINBETS_LEAGUES.find((league) => league.key === key) ?? null
}

export function inferNapkinbetsContextKey(leagueKey: string) {
  return findNapkinbetsLeague(leagueKey)?.primaryContextKey ?? null
}

export function getNapkinbetsLeagueLabel(leagueKey: string) {
  return findNapkinbetsLeague(leagueKey)?.label ?? ''
}

export function getNapkinbetsSportLabel(sportKey: string) {
  return findNapkinbetsSport(sportKey)?.label ?? ''
}

export function getNapkinbetsContextLabel(contextKey: string) {
  return findNapkinbetsContext(contextKey)?.label ?? ''
}

export function normalizeCreateWagerTaxonomyInput(input: CreateWagerTaxonomyInput) {
  const boardType = NAPKINBETS_BOARD_TYPES.find((value) => value === input.boardType)
  if (!boardType) {
    throw new Error('Select a valid bet format before saving the wager.')
  }

  const sport = findNapkinbetsSport(input.sport)
  if (!sport) {
    throw new Error('Select a supported sport before saving the wager.')
  }

  const rawLeague = input.league?.trim() || ''
  const league = rawLeague ? findNapkinbetsLeague(rawLeague) : null
  if (rawLeague && !league) {
    throw new Error('Select a supported league before saving the wager.')
  }

  const contextFromLeague = league ? inferNapkinbetsContextKey(league.key) : null
  const resolvedContextKey =
    boardType === 'event-backed' ? contextFromLeague || input.contextKey : input.contextKey
  const context = findNapkinbetsContext(resolvedContextKey)

  if (!context) {
    throw new Error('Select a valid competition context before saving the wager.')
  }

  if (league) {
    if (league.sportKey !== sport.key) {
      throw new Error('The selected league does not match the chosen sport.')
    }

    if (!league.contextKeys.includes(context.key)) {
      throw new Error('The selected league does not match the chosen competition context.')
    }
  }

  if (boardType === 'event-backed') {
    if (!(input.eventSource?.trim() && input.eventId?.trim())) {
      throw new Error('Event-backed boards need an attached cached event.')
    }

    if (!league) {
      throw new Error('Event-backed boards need a valid league attached from discovery.')
    }
  }

  return {
    boardType,
    sport: sport.key,
    league: league?.key ?? '',
    contextKey: context.key,
    customContextName: input.customContextName?.trim() || '',
  }
}
