import { describe, expect, it } from 'vitest'
import {
  buildIngestWindows,
  buildEspnScoreboardUrl,
  isDiscoverCacheStale,
  normalizeMatchupEspnEvent,
  normalizeTournamentEspnEvent,
} from '../../server/services/napkinbets/espn'
import { findNapkinbetsLeague } from '../../server/services/napkinbets/taxonomy'

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

  it('builds chunked 8-week ingest windows for broader coverage', () => {
    const windows = buildIngestWindows('next-8w', new Date('2026-03-17T12:00:00.000Z'))
    const mls = findNapkinbetsLeague('mls')
    const epl = findNapkinbetsLeague('epl')

    expect(windows).toHaveLength(8)
    expect(windows[0]?.datesParam).toBe('20260317-20260324')
    expect(windows.at(-1)?.datesParam).toBe('20260505-20260512')
    expect(mls?.providerLeagueKey).toBe('usa.1')
    expect(mls?.supportsEventDiscovery).toBe(true)
    expect(epl?.providerLeagueKey).toBe('eng.1')
    expect(epl?.supportsEventDiscovery).toBe(true)
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
})
