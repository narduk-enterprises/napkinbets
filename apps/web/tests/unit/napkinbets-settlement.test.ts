import { describe, expect, it, vi } from 'vitest'

import { evaluatePickOutcome } from '../../server/services/napkinbets/settlement'
import type { NapkinbetsCachedEvent } from '../../server/services/napkinbets/event-queries'

// Mock Nuxt aliases that are imported by settlement.ts
vi.mock('#server/database/schema', () => ({}))
vi.mock('#server/utils/database', () => ({}))

describe('napkinbets settlement grading logic', () => {
  const mockEventTemplate: NapkinbetsCachedEvent = {
    id: 'mock-1',
    eventTitle: 'Titans @ Jaguars',
    summary: 'Jaguars vs Titans',
    state: 'post',
    status: 'Final',
    league: 'nfl',
    sport: 'football',
    homeTeam: {
      name: 'Jacksonville Jaguars',
      abbreviation: 'JAX',
      score: '24',
      winner: true,
      logo: '',
      homeAway: 'home',
    },
    awayTeam: {
      name: 'Tennessee Titans',
      abbreviation: 'TEN',
      score: '17',
      winner: false,
      logo: '',
      homeAway: 'away',
    },
    leaders: [],
    venueName: 'EverBank Stadium',
    venueLocation: 'Jacksonville, FL',
  }

  describe('Home Team Winning Scenarios', () => {
    it('grades correctly when picking the full home team name', () => {
      const outcome = evaluatePickOutcome('Jacksonville Jaguars', mockEventTemplate, 'pending')
      expect(outcome).toBe('won')
    })

    it('grades correctly when picking the home abbreviation', () => {
      const outcome = evaluatePickOutcome('JAX', mockEventTemplate, 'pending')
      expect(outcome).toBe('won')
    })

    it('grades correctly when picking a partial substring of the home team', () => {
      const outcome = evaluatePickOutcome('Jaguars', mockEventTemplate, 'pending')
      expect(outcome).toBe('won')
    })

    it('is case-insensitive for home team picks', () => {
      const outcome = evaluatePickOutcome('jaCkSonVille jAguaRs', mockEventTemplate, 'pending')
      expect(outcome).toBe('won')
    })
  })

  describe('Away Team Losing Scenarios', () => {
    it('grades correctly when picking the full away team name', () => {
      const outcome = evaluatePickOutcome('Tennessee Titans', mockEventTemplate, 'pending')
      expect(outcome).toBe('lost')
    })

    it('grades correctly when picking the away abbreviation', () => {
      const outcome = evaluatePickOutcome('TEN', mockEventTemplate, 'pending')
      expect(outcome).toBe('lost')
    })

    it('grades correctly when picking a partial substring of the away team', () => {
      const outcome = evaluatePickOutcome('Titans', mockEventTemplate, 'pending')
      expect(outcome).toBe('lost')
    })

    it('is case-insensitive for away team picks', () => {
      const outcome = evaluatePickOutcome('tItAnS', mockEventTemplate, 'pending')
      expect(outcome).toBe('lost')
    })
  })

  describe('Tie / Push Scenarios', () => {
    const tiedEvent: NapkinbetsCachedEvent = {
      ...mockEventTemplate,
      homeTeam: { ...mockEventTemplate.homeTeam, score: '20', winner: false },
      awayTeam: { ...mockEventTemplate.awayTeam, score: '20', winner: false },
    }

    it('grades home pick as push on tie', () => {
      const outcome = evaluatePickOutcome('JAX', tiedEvent, 'pending')
      expect(outcome).toBe('push')
    })

    it('grades away pick as push on tie', () => {
      const outcome = evaluatePickOutcome('TEN', tiedEvent, 'pending')
      expect(outcome).toBe('push')
    })
  })

  describe('Unmatched and Invalid Picks', () => {
    it('retains original outcome if the pick string does not match any team', () => {
      const outcome = evaluatePickOutcome('Houston Texans', mockEventTemplate, 'pending')
      expect(outcome).toBe('pending')
    })

    it('retains original outcome if the pick is empty', () => {
      const outcome = evaluatePickOutcome('', mockEventTemplate, 'pending')
      expect(outcome).toBe('pending')
    })

    it('retains original outcome if the pick is null', () => {
      const outcome = evaluatePickOutcome(null, mockEventTemplate, 'pending')
      expect(outcome).toBe('pending')
    })

    it('does not incorrectly override an already settled outcome if unmatched', () => {
      const outcome = evaluatePickOutcome('Unknown', mockEventTemplate, 'won')
      expect(outcome).toBe('won')
    })
  })
})
