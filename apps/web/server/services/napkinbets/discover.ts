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

interface EspnCompetitor {
  id?: string
  homeAway?: 'home' | 'away'
  score?: string
  winner?: boolean
  team?: {
    id?: string
    displayName?: string
    shortDisplayName?: string
    abbreviation?: string
    logo?: string
  }
  records?: EspnTeamRecord[]
  leaders?: EspnLeader[]
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
  competitions?: Array<{
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
      address?: {
        city?: string
        state?: string
      }
    }
    broadcasts?: Array<{ names?: string[] }>
    geoBroadcasts?: Array<{ media?: { shortName?: string } }>
    competitors?: EspnCompetitor[]
  }>
}

interface EspnScoreboardResponse {
  events?: EspnEvent[]
}

interface DiscoverEventIdea {
  title: string
  description: string
  sideOptions: string[]
  format: string
}

interface DiscoverEventLeader {
  label: string
  athlete: string
  value: string
}

interface DiscoverEventCard {
  id: string
  source: 'espn'
  sport: string
  sportLabel: string
  league: string
  leagueLabel: string
  status: string
  state: 'pre' | 'in' | 'post'
  shortStatus: string
  startTime: string
  venueName: string
  venueLocation: string
  broadcast: string
  summary: string
  homeTeam: {
    id: string
    name: string
    shortName: string
    abbreviation: string
    logo: string
    homeAway: 'home'
    score: string
    record: string
    winner: boolean
  }
  awayTeam: {
    id: string
    name: string
    shortName: string
    abbreviation: string
    logo: string
    homeAway: 'away'
    score: string
    record: string
    winner: boolean
  }
  leaders: DiscoverEventLeader[]
  ideas: DiscoverEventIdea[]
}

const LEAGUES = [
  {
    sport: 'basketball',
    sportLabel: 'Basketball',
    league: 'nba',
    leagueLabel: 'NBA',
  },
  {
    sport: 'basketball',
    sportLabel: 'Basketball',
    league: 'ncaamb',
    leagueLabel: "Men's College Basketball",
  },
  {
    sport: 'hockey',
    sportLabel: 'Hockey',
    league: 'nhl',
    leagueLabel: 'NHL',
  },
  {
    sport: 'baseball',
    sportLabel: 'Baseball',
    league: 'mlb',
    leagueLabel: 'MLB',
  },
] as const

const GENERIC_PROP_IDEAS = [
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
    settlementHint: 'Only use prompts with clear public outcomes that the group can verify together.',
  },
] as const

function getLeagueIdeas(sport: string, homeTeam: string, awayTeam: string) {
  switch (sport) {
    case 'basketball':
      return [
        {
          title: 'Race market',
          description: `Turn ${awayTeam} vs ${homeTeam} into a simple run-race board.`,
          sideOptions: ['First to 25 points', 'First to 50 points', 'Winning margin 1-5 / 6-10 / 11+'],
          format: 'sports-race',
        },
        {
          title: 'Closer call',
          description: 'Give the room one late-game prop that settles cleanly off the broadcast.',
          sideOptions: ['Game goes to overtime', 'Home team covers final spread band', 'Last made three-pointer team'],
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
          sideOptions: ['First team to score', 'Lead after 3 innings', 'Total runs over 2.5 by the 5th'],
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
  return (
    competition?.geoBroadcasts?.find((item) => item.media?.shortName)?.media?.shortName ||
    competition?.broadcasts?.flatMap((item) => item.names ?? [])[0] ||
    ''
  )
}

function getEventLocation(event: EspnEvent) {
  const address = event.competitions?.[0]?.venue?.address
  const parts = [address?.city, address?.state].filter(Boolean)
  return parts.join(', ')
}

function getStatus(event: EspnEvent) {
  return event.competitions?.[0]?.status?.type ?? event.status?.type
}

function buildLeaders(competitors: EspnCompetitor[]) {
  const leaders = competitors.flatMap((competitor) =>
    (competitor.leaders ?? [])
      .map((leader) => {
        const top = leader.leaders?.[0]
        if (!leader.displayName || !top?.athlete?.displayName || !top.displayValue) {
          return null
        }

        return {
          label: leader.displayName,
          athlete: top.athlete.displayName,
          value: top.displayValue,
        }
      })
      .filter((leader): leader is DiscoverEventLeader => Boolean(leader)),
  )

  return leaders.slice(0, 3)
}

async function fetchLeagueEvents(config: (typeof LEAGUES)[number]) {
  try {
    const response = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/${config.sport}/${config.league}/scoreboard`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'napkinbets-discover',
        },
      },
    )

    if (!response.ok) {
      return []
    }

    const payload = (await response.json()) as EspnScoreboardResponse
    const events = payload.events ?? []

    const mappedEvents = events.map<DiscoverEventCard | null>((event) => {
        const competition = event.competitions?.[0]
        const competitors = competition?.competitors ?? []
        const homeTeam = competitors.find((competitor) => competitor.homeAway === 'home')
        const awayTeam = competitors.find((competitor) => competitor.homeAway === 'away')
        const status = getStatus(event)

        if (!homeTeam?.team?.displayName || !awayTeam?.team?.displayName || !status?.state) {
          return null
        }

        if (status.state === 'post') {
          return null
        }

        const startTime = competition?.date ?? event.date ?? new Date().toISOString()
        const venueName = competition?.venue?.fullName ?? 'Venue TBD'
        const venueLocation = getEventLocation(event)
        const broadcast = getEventBroadcast(event)

        return {
          id: event.id ?? crypto.randomUUID(),
          source: 'espn' as const,
          sport: config.sport,
          sportLabel: config.sportLabel,
          league: config.league,
          leagueLabel: config.leagueLabel,
          status: status.description ?? 'Scheduled',
          state: status.state,
          shortStatus: status.shortDetail ?? status.description ?? 'Scheduled',
          startTime,
          venueName,
          venueLocation,
          broadcast,
          summary:
            status.state === 'in'
              ? `${awayTeam.team.displayName} and ${homeTeam.team.displayName} are in progress now.`
              : `${awayTeam.team.displayName} at ${homeTeam.team.displayName} starts ${new Intl.DateTimeFormat(
                  'en-US',
                  { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' },
                ).format(new Date(startTime))}.`,
          homeTeam: {
            id: homeTeam.team.id ?? '',
            name: homeTeam.team.displayName,
            shortName: homeTeam.team.shortDisplayName ?? homeTeam.team.displayName,
            abbreviation: homeTeam.team.abbreviation ?? '',
            logo: homeTeam.team.logo ?? '',
            homeAway: 'home' as const,
            score: homeTeam.score ?? '0',
            record: homeTeam.records?.[0]?.summary ?? '',
            winner: Boolean(homeTeam.winner),
          },
          awayTeam: {
            id: awayTeam.team.id ?? '',
            name: awayTeam.team.displayName,
            shortName: awayTeam.team.shortDisplayName ?? awayTeam.team.displayName,
            abbreviation: awayTeam.team.abbreviation ?? '',
            logo: awayTeam.team.logo ?? '',
            homeAway: 'away' as const,
            score: awayTeam.score ?? '0',
            record: awayTeam.records?.[0]?.summary ?? '',
            winner: Boolean(awayTeam.winner),
          },
          leaders: buildLeaders(competitors),
          ideas: getLeagueIdeas(config.sport, homeTeam.team.displayName, awayTeam.team.displayName),
        }
      })
    return mappedEvents.filter((event): event is DiscoverEventCard => event !== null)
  } catch {
    return []
  }
}

export async function loadDiscoverData() {
  const events: DiscoverEventCard[] = (await Promise.all(LEAGUES.map((config) => fetchLeagueEvents(config)))).flat()

  const liveEvents = events
    .filter((event) => event.state === 'in')
    .sort((left, right) => left.startTime.localeCompare(right.startTime))
    .slice(0, 8)

  const upcomingEvents = events
    .filter((event) => event.state === 'pre')
    .sort((left, right) => left.startTime.localeCompare(right.startTime))
    .slice(0, 12)

  return {
    liveEvents,
    upcomingEvents,
    propIdeas: [...GENERIC_PROP_IDEAS],
    refreshedAt: new Date().toISOString(),
  }
}
