import { describe, expect, it } from 'vitest'
import {
  buildDiscoverSpotlights,
  buildEspnScoreboardUrl,
  isDiscoverCacheStale,
  type NapkinbetsCachedEvent,
  normalizeMatchupEspnEvent,
  normalizeTournamentEspnEvent,
} from '../../server/services/napkinbets/events'
import { findNapkinbetsLeague } from '../../server/services/napkinbets/taxonomy'

function createCachedGolfEvent(
  overrides: Partial<NapkinbetsCachedEvent> = {},
): NapkinbetsCachedEvent {
  return {
    id: 'espn:pga:401811941',
    source: 'espn',
    sport: 'golf',
    sportLabel: 'Golf',
    contextKey: 'tournament',
    contextLabel: 'Tournament',
    league: 'pga',
    leagueLabel: 'PGA Tour',
    eventTitle: 'Valspar Championship',
    summary: 'Rory McIlroy leads the Valspar Championship.',
    status: 'Scheduled',
    state: 'pre',
    shortStatus: 'Thu, Mar 19',
    startTime: '2026-03-19T15:00:00.000Z',
    venueName: 'Innisbrook Resort',
    venueLocation: 'Palm Harbor, FL',
    broadcast: 'Golf Channel',
    homeTeam: {
      id: '4363',
      name: 'Scottie Scheffler',
      shortName: 'S. Scheffler',
      abbreviation: '2',
      logo: 'https://example.com/scottie.png',
      homeAway: 'chase',
      score: '-6',
      record: '2',
      winner: false,
    },
    awayTeam: {
      id: '3470',
      name: 'Rory McIlroy',
      shortName: 'R. McIlroy',
      abbreviation: '1',
      logo: 'https://example.com/rory.png',
      homeAway: 'leader',
      score: '-8',
      record: '1',
      winner: false,
    },
    leaders: [
      {
        label: '1',
        athlete: 'Rory McIlroy',
        value: '-8',
      },
    ],
    ideas: [
      {
        title: 'Featured golfer lane',
        description: 'Keep the featured golfers at the center of the board.',
        sideOptions: ['Best finish among featured golfers', 'Both golfers make the cut'],
        format: 'golf-draft',
      },
    ],
    lastSyncedAt: '2026-03-17T12:00:00.000Z',
    ...overrides,
  }
}

describe('napkinbets event ingest helpers', () => {
  it('builds ESPN scoreboard URLs with league-specific query params', () => {
    const ncaamb = findNapkinbetsLeague('ncaamb')
    const nfl = findNapkinbetsLeague('nfl')

    expect(ncaamb).not.toBeNull()
    expect(nfl).not.toBeNull()

    const ncaambUrl = buildEspnScoreboardUrl(
      ncaamb!,
      'next-7d',
      new Date('2026-03-17T12:00:00.000Z'),
    ).url
    const nflUrl = buildEspnScoreboardUrl(
      nfl!,
      'next-48h',
      new Date('2026-01-03T12:00:00.000Z'),
    ).url

    expect(ncaambUrl.pathname).toContain('/basketball/mens-college-basketball/scoreboard')
    expect(ncaambUrl.searchParams.get('groups')).toBe('50')
    expect(ncaambUrl.searchParams.get('dates')).toBe('20260317-20260324')

    expect(nflUrl.pathname).toContain('/football/nfl/scoreboard')
    expect(nflUrl.searchParams.get('groups')).toBeNull()
    expect(nflUrl.searchParams.get('dates')).toBe('20260103-20260105')
  })

  it('normalizes head-to-head ESPN events into cached discovery cards', () => {
    const nba = findNapkinbetsLeague('nba')

    const normalized = normalizeMatchupEspnEvent(
      {
        id: '401000001',
        name: 'Houston Rockets at Chicago Bulls',
        shortName: 'HOU @ CHI',
        competitions: [
          {
            date: '2026-03-18T00:30:00.000Z',
            venue: {
              fullName: 'United Center',
              address: {
                city: 'Chicago',
                state: 'IL',
              },
            },
            broadcasts: [{ names: ['ESPN'] }],
            status: {
              type: {
                state: 'pre',
                description: 'Scheduled',
                shortDetail: 'Tonight, 7:30 PM',
              },
            },
            competitors: [
              {
                homeAway: 'home',
                score: '0',
                team: {
                  id: '4',
                  displayName: 'Chicago Bulls',
                  shortDisplayName: 'Bulls',
                  abbreviation: 'CHI',
                  logo: 'https://example.com/chi.png',
                },
                records: [{ summary: '41-23' }],
              },
              {
                homeAway: 'away',
                score: '0',
                team: {
                  id: '10',
                  displayName: 'Houston Rockets',
                  shortDisplayName: 'Rockets',
                  abbreviation: 'HOU',
                  logo: 'https://example.com/hou.png',
                },
                records: [{ summary: '39-25' }],
                leaders: [
                  {
                    displayName: 'Points',
                    leaders: [
                      {
                        displayValue: '28.1',
                        athlete: {
                          displayName: 'Jalen Green',
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      nba!,
      '2026-03-17T12:00:00.000Z',
    )

    expect(normalized).not.toBeNull()
    expect(normalized?.league).toBe('nba')
    expect(normalized?.eventTitle).toBe('HOU @ CHI')
    expect(normalized?.homeTeam.name).toBe('Chicago Bulls')
    expect(normalized?.awayTeam.name).toBe('Houston Rockets')
    expect(normalized?.venueLocation).toBe('Chicago, IL')
    expect(normalized?.broadcast).toBe('ESPN')
    expect(normalized?.leaders).toEqual([
      {
        label: 'Points',
        athlete: 'Jalen Green',
        value: '28.1',
      },
    ])
  })

  it('normalizes golf tournaments into leaderboard-friendly discovery cards', () => {
    const pga = findNapkinbetsLeague('pga')

    const normalized = normalizeTournamentEspnEvent(
      {
        id: '401811941',
        name: 'Masters Tournament',
        shortName: 'Masters Tournament',
        tournament: {
          displayName: 'Masters Tournament',
          numberOfRounds: 4,
          major: true,
        },
        courses: [
          {
            name: 'Augusta National Golf Club',
            shotsToPar: 72,
            address: {
              city: 'Augusta',
              state: 'GA',
              country: 'United States',
            },
          },
        ],
        competitions: [
          {
            date: '2026-04-09T04:00:00.000Z',
            status: {
              type: {
                state: 'in',
                description: 'In Progress',
                shortDetail: 'Round 2',
              },
            },
            broadcasts: [
              {
                media: {
                  shortName: 'CBS',
                },
              },
            ],
            competitors: [
              {
                id: '3470',
                sortOrder: 0,
                score: {
                  displayValue: '-8',
                },
                status: {
                  detail: '-8 thru 16',
                  position: {
                    displayName: '1',
                  },
                  type: {
                    state: 'in',
                  },
                },
                athlete: {
                  id: '3470',
                  displayName: 'Rory McIlroy',
                  shortName: 'R. McIlroy',
                  headshot: {
                    href: 'https://example.com/rory.png',
                  },
                },
              },
              {
                id: '4363',
                sortOrder: 1,
                score: {
                  displayValue: '-6',
                },
                status: {
                  detail: '-6 thru 15',
                  position: {
                    displayName: '2',
                  },
                  type: {
                    state: 'in',
                  },
                },
                athlete: {
                  id: '4363',
                  displayName: 'Scottie Scheffler',
                  shortName: 'S. Scheffler',
                  headshot: {
                    href: 'https://example.com/scottie.png',
                  },
                },
              },
            ],
          },
        ],
      },
      pga!,
      '2026-04-10T12:00:00.000Z',
    )

    expect(normalized).not.toBeNull()
    expect(normalized?.league).toBe('pga')
    expect(normalized?.venueName).toBe('Augusta National Golf Club')
    expect(normalized?.venueLocation).toBe('Augusta, GA')
    expect(normalized?.broadcast).toBe('CBS')
    expect(normalized?.awayTeam.homeAway).toBe('leader')
    expect(normalized?.awayTeam.name).toBe('Rory McIlroy')
    expect(normalized?.awayTeam.score).toBe('-8')
    expect(normalized?.homeTeam.homeAway).toBe('chase')
    expect(normalized?.leaders[0]).toEqual({
      label: '1',
      athlete: 'Rory McIlroy',
      value: '-8',
    })
    expect(normalized?.summary).toContain('Rory McIlroy leads Masters Tournament')
  })

  it('detects stale discover caches from the last sync timestamp', () => {
    expect(
      isDiscoverCacheStale('2026-03-17T12:20:00.000Z', Date.parse('2026-03-17T12:35:00.000Z')),
    ).toBe(false)
    expect(
      isDiscoverCacheStale('2026-03-17T11:20:00.000Z', Date.parse('2026-03-17T12:35:00.000Z')),
    ).toBe(true)
    expect(isDiscoverCacheStale('', Date.parse('2026-03-17T12:35:00.000Z'))).toBe(true)
  })
  it('builds golf spotlights for masters week and active tours with imagery', () => {
    const pgaEvent = createCachedGolfEvent()
    const lpgaEvent = createCachedGolfEvent({
      id: 'espn:lpga:401811950',
      league: 'lpga',
      leagueLabel: 'LPGA Tour',
      eventTitle: 'Ford Championship',
      summary: 'Nelly Korda sets the pace heading into the weekend.',
      venueName: 'Whirlwind Golf Club',
      awayTeam: {
        id: '1',
        name: 'Nelly Korda',
        shortName: 'N. Korda',
        abbreviation: '1',
        logo: 'https://example.com/nelly.png',
        homeAway: 'leader',
        score: '-9',
        record: '1',
        winner: false,
      },
      homeTeam: {
        id: '2',
        name: 'Lydia Ko',
        shortName: 'L. Ko',
        abbreviation: '2',
        logo: 'https://example.com/lydia.png',
        homeAway: 'chase',
        score: '-7',
        record: '2',
        winner: false,
      },
    })

    const spotlights = buildDiscoverSpotlights(
      [pgaEvent, lpgaEvent],
      new Date('2026-03-17T12:00:00.000Z'),
    )

    expect(spotlights).toHaveLength(4)

    const mastersWeek = spotlights.find((spotlight) => spotlight.id === 'masters-2026')
    expect(mastersWeek?.windowLabel).toBe('Apr 6-12, 2026')
    expect(mastersWeek?.assets[0]).toEqual({
      kind: 'editorial',
      src: '/brand/imagery/masters-week-editorial.webp',
      alt: 'Napkinbets golf spotlight',
    })
    expect(mastersWeek?.assets).toHaveLength(3)

    const pgaSpotlight = spotlights.find(
      (spotlight) => spotlight.id === 'spotlight:espn:pga:401811941',
    )
    expect(pgaSpotlight?.label).toBe('PGA tour')
    expect(pgaSpotlight?.assets).toEqual([
      {
        kind: 'editorial',
        src: '/brand/imagery/live-room-editorial.webp',
        alt: 'Valspar Championship editorial',
      },
      {
        kind: 'headshot',
        src: 'https://example.com/rory.png',
        alt: 'Rory McIlroy',
      },
      {
        kind: 'headshot',
        src: 'https://example.com/scottie.png',
        alt: 'Scottie Scheffler',
      },
    ])
  })
})
