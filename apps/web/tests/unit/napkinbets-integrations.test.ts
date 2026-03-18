import { describe, expect, it } from 'vitest'
import { normalizeMsfEvent } from '../../server/services/napkinbets/mysportsfeeds'
import { normalizeBdlEvent } from '../../server/services/napkinbets/balldontlie'
import { findNapkinbetsLeague } from '../../server/services/napkinbets/taxonomy'

describe('napkinbets integrations', () => {
  it('normalizes MySportsFeeds events correctly', () => {
    const mlb = findNapkinbetsLeague('mlb')
    expect(mlb).not.toBeNull()

    const msfGameMock = {
      schedule: {
        id: 12345,
        startTime: '2026-05-10T19:00:00.000Z',
        playedStatus: 'COMPLETED',
        homeTeam: { id: 11, abbreviation: 'NYY', city: 'New York', name: 'Yankees' },
        awayTeam: { id: 14, abbreviation: 'BOS', city: 'Boston', name: 'Red Sox' },
        venue: { name: 'Yankee Stadium', city: 'Bronx' },
      },
      score: {
        homeScoreTotal: 5,
        awayScoreTotal: 2,
      },
    }

    const normalized = normalizeMsfEvent(msfGameMock, mlb!, '2026-05-11T00:00:00.000Z')

    expect(normalized.id).toBe('mysportsfeeds:mlb:12345')
    expect(normalized.state).toBe('post')
    expect(normalized.homeTeam.name).toBe('New York Yankees')
    expect(normalized.awayTeam.name).toBe('Boston Red Sox')
    expect(normalized.homeTeam.score).toBe('5')
    expect(normalized.awayTeam.score).toBe('2')
    expect(normalized.homeTeam.winner).toBe(true)
    expect(normalized.awayTeam.winner).toBe(false)
    expect(normalized.venueName).toBe('Yankee Stadium')
  })

  it('normalizes BallDontLie events correctly', () => {
    const nba = findNapkinbetsLeague('nba')
    expect(nba).not.toBeNull()

    const bdlGameMock = {
      id: 999123,
      date: '2026-04-12T00:00:00.000Z',
      home_team: {
        id: 2,
        abbreviation: 'BOS',
        city: 'Boston',
        name: 'Celtics',
        full_name: 'Boston Celtics',
      },
      visitor_team: {
        id: 14,
        abbreviation: 'MIA',
        city: 'Miami',
        name: 'Heat',
        full_name: 'Miami Heat',
      },
      home_team_score: 110,
      visitor_team_score: 95,
      status: 'Final',
      period: 4,
      time: ' ',
      postseason: false,
    }

    const normalized = normalizeBdlEvent(bdlGameMock, nba!, '2026-04-13T00:00:00.000Z')

    expect(normalized.id).toBe('balldontlie:nba:999123')
    expect(normalized.state).toBe('post')
    expect(normalized.homeTeam.name).toBe('Boston Celtics')
    expect(normalized.awayTeam.name).toBe('Miami Heat')
    expect(normalized.homeTeam.score).toBe('110')
    expect(normalized.awayTeam.score).toBe('95')
    expect(normalized.homeTeam.winner).toBe(true)
  })
})
