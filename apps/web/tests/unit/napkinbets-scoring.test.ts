import { describe, expect, it } from 'vitest'
import { computeScoringResult } from '../../server/services/napkinbets/scoring'

// ─── Helpers ────────────────────────────────────────────────

function makeParticipants(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    joinStatus: 'accepted',
    draftOrder: i + 1,
  }))
}

function makePots(totalCents: number) {
  return [{ amountCents: totalCents }]
}

// ─── Proportional (Legacy) ──────────────────────────────────

describe('scoring: proportional', () => {
  it('distributes payout proportionally to liveScore + outcome bonus', () => {
    const participants = makeParticipants(3)
    const picks = [
      {
        participantId: 'p1',
        wagerLegId: null,
        pickValue: null,
        pickNumericValue: null,
        liveScore: 10,
        outcome: 'won',
      },
      {
        participantId: 'p2',
        wagerLegId: null,
        pickValue: null,
        pickNumericValue: null,
        liveScore: 6,
        outcome: 'pending',
      },
      {
        participantId: 'p3',
        wagerLegId: null,
        pickValue: null,
        pickNumericValue: null,
        liveScore: 4,
        outcome: 'lost',
      },
    ]
    const result = computeScoringResult('proportional', participants, picks, [], makePots(3000))

    // p1: 10+5=15, p2: 6+1=7, p3: 4+0=4 → total=26
    expect(result.standings[0]!.participantId).toBe('p1')
    expect(result.standings[0]!.score).toBe(15)
    expect(result.standings[1]!.participantId).toBe('p2')
    expect(result.standings[1]!.score).toBe(7)
    expect(result.standings[2]!.participantId).toBe('p3')
    expect(result.standings[2]!.score).toBe(4)

    // Payouts proportional: p1=15/26*3000≈1731, p2=7/26*3000≈808, p3=4/26*3000≈462
    expect(result.payouts.get('p1')).toBe(Math.round(3000 * (15 / 26)))
    expect(result.payouts.get('p2')).toBe(Math.round(3000 * (7 / 26)))
    expect(result.payouts.get('p3')).toBe(Math.round(3000 * (4 / 26)))
  })

  it('splits evenly when all scores are zero', () => {
    const participants = makeParticipants(2)
    const result = computeScoringResult('proportional', participants, [], [], makePots(1000))
    expect(result.payouts.get('p1')).toBe(500)
    expect(result.payouts.get('p2')).toBe(500)
  })
})

// ─── Most Correct ───────────────────────────────────────────

describe('scoring: most-correct', () => {
  const legs = [
    {
      id: 'leg1',
      sortOrder: 0,
      legType: 'categorical' as const,
      outcomeStatus: 'settled' as const,
      outcomeOptionKey: 'Home',
      outcomeNumericValue: null,
    },
    {
      id: 'leg2',
      sortOrder: 1,
      legType: 'categorical' as const,
      outcomeStatus: 'settled' as const,
      outcomeOptionKey: 'Over',
      outcomeNumericValue: null,
    },
    {
      id: 'leg3',
      sortOrder: 2,
      legType: 'categorical' as const,
      outcomeStatus: 'settled' as const,
      outcomeOptionKey: 'Red',
      outcomeNumericValue: null,
    },
  ]

  it('winner = most correct answers; takes all', () => {
    const participants = makeParticipants(3)
    const picks = [
      // p1: 3/3 correct
      {
        participantId: 'p1',
        wagerLegId: 'leg1',
        pickValue: 'Home',
        pickNumericValue: null,
        liveScore: 0,
        outcome: 'pending',
      },
      {
        participantId: 'p1',
        wagerLegId: 'leg2',
        pickValue: 'Over',
        pickNumericValue: null,
        liveScore: 0,
        outcome: 'pending',
      },
      {
        participantId: 'p1',
        wagerLegId: 'leg3',
        pickValue: 'Red',
        pickNumericValue: null,
        liveScore: 0,
        outcome: 'pending',
      },
      // p2: 2/3 correct
      {
        participantId: 'p2',
        wagerLegId: 'leg1',
        pickValue: 'Home',
        pickNumericValue: null,
        liveScore: 0,
        outcome: 'pending',
      },
      {
        participantId: 'p2',
        wagerLegId: 'leg2',
        pickValue: 'Under',
        pickNumericValue: null,
        liveScore: 0,
        outcome: 'pending',
      },
      {
        participantId: 'p2',
        wagerLegId: 'leg3',
        pickValue: 'Red',
        pickNumericValue: null,
        liveScore: 0,
        outcome: 'pending',
      },
      // p3: 0/3 correct
      {
        participantId: 'p3',
        wagerLegId: 'leg1',
        pickValue: 'Away',
        pickNumericValue: null,
        liveScore: 0,
        outcome: 'pending',
      },
      {
        participantId: 'p3',
        wagerLegId: 'leg2',
        pickValue: 'Under',
        pickNumericValue: null,
        liveScore: 0,
        outcome: 'pending',
      },
      {
        participantId: 'p3',
        wagerLegId: 'leg3',
        pickValue: 'Blue',
        pickNumericValue: null,
        liveScore: 0,
        outcome: 'pending',
      },
    ]

    const result = computeScoringResult('most-correct', participants, picks, legs, makePots(3000))
    expect(result.standings[0]!.participantId).toBe('p1')
    expect(result.standings[0]!.score).toBe(3)
    expect(result.payouts.get('p1')).toBe(3000)
    expect(result.payouts.get('p2')).toBe(0)
    expect(result.payouts.get('p3')).toBe(0)
  })

  it('splits pot on tie', () => {
    const participants = makeParticipants(2)
    const picks = [
      {
        participantId: 'p1',
        wagerLegId: 'leg1',
        pickValue: 'Home',
        pickNumericValue: null,
        liveScore: 0,
        outcome: 'pending',
      },
      {
        participantId: 'p2',
        wagerLegId: 'leg1',
        pickValue: 'Home',
        pickNumericValue: null,
        liveScore: 0,
        outcome: 'pending',
      },
    ]

    const result = computeScoringResult('most-correct', participants, picks, legs, makePots(2000))
    expect(result.payouts.get('p1')).toBe(1000)
    expect(result.payouts.get('p2')).toBe(1000)
  })
})

// ─── Parlay ─────────────────────────────────────────────────

describe('scoring: parlay', () => {
  const legs = [
    {
      id: 'leg1',
      sortOrder: 0,
      legType: 'categorical' as const,
      outcomeStatus: 'settled' as const,
      outcomeOptionKey: 'Home',
      outcomeNumericValue: null,
    },
    {
      id: 'leg2',
      sortOrder: 1,
      legType: 'categorical' as const,
      outcomeStatus: 'settled' as const,
      outcomeOptionKey: 'Over',
      outcomeNumericValue: null,
    },
    {
      id: 'leg3',
      sortOrder: 2,
      legType: 'categorical' as const,
      outcomeStatus: 'settled' as const,
      outcomeOptionKey: 'Red',
      outcomeNumericValue: null,
    },
  ]

  it('only perfect entries win', () => {
    const participants = makeParticipants(3)
    const picks = [
      // p1: 3/3
      {
        participantId: 'p1',
        wagerLegId: 'leg1',
        pickValue: 'Home',
        pickNumericValue: null,
        liveScore: 0,
        outcome: 'pending',
      },
      {
        participantId: 'p1',
        wagerLegId: 'leg2',
        pickValue: 'Over',
        pickNumericValue: null,
        liveScore: 0,
        outcome: 'pending',
      },
      {
        participantId: 'p1',
        wagerLegId: 'leg3',
        pickValue: 'Red',
        pickNumericValue: null,
        liveScore: 0,
        outcome: 'pending',
      },
      // p2: 2/3
      {
        participantId: 'p2',
        wagerLegId: 'leg1',
        pickValue: 'Home',
        pickNumericValue: null,
        liveScore: 0,
        outcome: 'pending',
      },
      {
        participantId: 'p2',
        wagerLegId: 'leg2',
        pickValue: 'Under',
        pickNumericValue: null,
        liveScore: 0,
        outcome: 'pending',
      },
      {
        participantId: 'p2',
        wagerLegId: 'leg3',
        pickValue: 'Red',
        pickNumericValue: null,
        liveScore: 0,
        outcome: 'pending',
      },
      // p3: 0/3
      {
        participantId: 'p3',
        wagerLegId: 'leg1',
        pickValue: 'Away',
        pickNumericValue: null,
        liveScore: 0,
        outcome: 'pending',
      },
      {
        participantId: 'p3',
        wagerLegId: 'leg2',
        pickValue: 'Under',
        pickNumericValue: null,
        liveScore: 0,
        outcome: 'pending',
      },
      {
        participantId: 'p3',
        wagerLegId: 'leg3',
        pickValue: 'Blue',
        pickNumericValue: null,
        liveScore: 0,
        outcome: 'pending',
      },
    ]

    const result = computeScoringResult('parlay', participants, picks, legs, makePots(3000))
    expect(result.payouts.get('p1')).toBe(3000)
    expect(result.payouts.get('p2')).toBe(0)
    expect(result.payouts.get('p3')).toBe(0)
  })

  it('falls back to closest when nobody is perfect (default)', () => {
    const participants = makeParticipants(2)
    const picks = [
      // p1: 2/3
      {
        participantId: 'p1',
        wagerLegId: 'leg1',
        pickValue: 'Home',
        pickNumericValue: null,
        liveScore: 0,
        outcome: 'pending',
      },
      {
        participantId: 'p1',
        wagerLegId: 'leg2',
        pickValue: 'Over',
        pickNumericValue: null,
        liveScore: 0,
        outcome: 'pending',
      },
      {
        participantId: 'p1',
        wagerLegId: 'leg3',
        pickValue: 'Blue',
        pickNumericValue: null,
        liveScore: 0,
        outcome: 'pending',
      },
      // p2: 1/3
      {
        participantId: 'p2',
        wagerLegId: 'leg1',
        pickValue: 'Home',
        pickNumericValue: null,
        liveScore: 0,
        outcome: 'pending',
      },
      {
        participantId: 'p2',
        wagerLegId: 'leg2',
        pickValue: 'Under',
        pickNumericValue: null,
        liveScore: 0,
        outcome: 'pending',
      },
      {
        participantId: 'p2',
        wagerLegId: 'leg3',
        pickValue: 'Blue',
        pickNumericValue: null,
        liveScore: 0,
        outcome: 'pending',
      },
    ]

    const result = computeScoringResult('parlay', participants, picks, legs, makePots(2000))
    // Default fallback = closest (most correct), p1 wins
    expect(result.payouts.get('p1')).toBe(2000)
    expect(result.payouts.get('p2')).toBe(0)
  })

  it('no-winner fallback gives everyone zero', () => {
    const participants = makeParticipants(2)
    const picks = [
      {
        participantId: 'p1',
        wagerLegId: 'leg1',
        pickValue: 'Away',
        pickNumericValue: null,
        liveScore: 0,
        outcome: 'pending',
      },
      {
        participantId: 'p2',
        wagerLegId: 'leg1',
        pickValue: 'Away',
        pickNumericValue: null,
        liveScore: 0,
        outcome: 'pending',
      },
    ]

    const config = JSON.stringify({ parlayFallback: 'no-winner' })
    const result = computeScoringResult('parlay', participants, picks, legs, makePots(2000), config)
    expect(result.payouts.get('p1')).toBe(0)
    expect(result.payouts.get('p2')).toBe(0)
  })
})

// ─── Closest ────────────────────────────────────────────────

describe('scoring: closest', () => {
  const legs = [
    {
      id: 'leg1',
      sortOrder: 0,
      legType: 'numeric' as const,
      outcomeStatus: 'settled' as const,
      outcomeOptionKey: null,
      outcomeNumericValue: 100,
    },
    {
      id: 'leg2',
      sortOrder: 1,
      legType: 'numeric' as const,
      outcomeStatus: 'settled' as const,
      outcomeOptionKey: null,
      outcomeNumericValue: 50,
    },
    {
      id: 'leg3',
      sortOrder: 2,
      legType: 'numeric' as const,
      outcomeStatus: 'settled' as const,
      outcomeOptionKey: null,
      outcomeNumericValue: 200,
    },
  ]

  it('smallest total absolute error wins', () => {
    const participants = makeParticipants(3)
    const picks = [
      // p1: |102-100| + |48-50| + |195-200| = 2+2+5 = 9
      {
        participantId: 'p1',
        wagerLegId: 'leg1',
        pickValue: null,
        pickNumericValue: 102,
        liveScore: 0,
        outcome: 'pending',
      },
      {
        participantId: 'p1',
        wagerLegId: 'leg2',
        pickValue: null,
        pickNumericValue: 48,
        liveScore: 0,
        outcome: 'pending',
      },
      {
        participantId: 'p1',
        wagerLegId: 'leg3',
        pickValue: null,
        pickNumericValue: 195,
        liveScore: 0,
        outcome: 'pending',
      },
      // p2: |110-100| + |55-50| + |180-200| = 10+5+20 = 35
      {
        participantId: 'p2',
        wagerLegId: 'leg1',
        pickValue: null,
        pickNumericValue: 110,
        liveScore: 0,
        outcome: 'pending',
      },
      {
        participantId: 'p2',
        wagerLegId: 'leg2',
        pickValue: null,
        pickNumericValue: 55,
        liveScore: 0,
        outcome: 'pending',
      },
      {
        participantId: 'p2',
        wagerLegId: 'leg3',
        pickValue: null,
        pickNumericValue: 180,
        liveScore: 0,
        outcome: 'pending',
      },
      // p3: |90-100| + |40-50| + |210-200| = 10+10+10 = 30
      {
        participantId: 'p3',
        wagerLegId: 'leg1',
        pickValue: null,
        pickNumericValue: 90,
        liveScore: 0,
        outcome: 'pending',
      },
      {
        participantId: 'p3',
        wagerLegId: 'leg2',
        pickValue: null,
        pickNumericValue: 40,
        liveScore: 0,
        outcome: 'pending',
      },
      {
        participantId: 'p3',
        wagerLegId: 'leg3',
        pickValue: null,
        pickNumericValue: 210,
        liveScore: 0,
        outcome: 'pending',
      },
    ]

    const result = computeScoringResult('closest', participants, picks, legs, makePots(3000))
    expect(result.standings[0]!.participantId).toBe('p1')
    expect(result.standings[0]!.score).toBe(-9)
    expect(result.payouts.get('p1')).toBe(3000)
    expect(result.payouts.get('p2')).toBe(0)
    expect(result.payouts.get('p3')).toBe(0)
  })
})

// ─── Price is Right ─────────────────────────────────────────

describe('scoring: price-is-right', () => {
  const legs = [
    {
      id: 'leg1',
      sortOrder: 0,
      legType: 'numeric' as const,
      outcomeStatus: 'settled' as const,
      outcomeOptionKey: null,
      outcomeNumericValue: 100,
    },
  ]

  it('closest without going over wins', () => {
    const participants = makeParticipants(3)
    const picks = [
      // p1: 95 (under, diff = 5)
      {
        participantId: 'p1',
        wagerLegId: 'leg1',
        pickValue: null,
        pickNumericValue: 95,
        liveScore: 0,
        outcome: 'pending',
      },
      // p2: 105 (over — busted)
      {
        participantId: 'p2',
        wagerLegId: 'leg1',
        pickValue: null,
        pickNumericValue: 105,
        liveScore: 0,
        outcome: 'pending',
      },
      // p3: 99 (under, diff = 1 — closest without going over)
      {
        participantId: 'p3',
        wagerLegId: 'leg1',
        pickValue: null,
        pickNumericValue: 99,
        liveScore: 0,
        outcome: 'pending',
      },
    ]

    const result = computeScoringResult('price-is-right', participants, picks, legs, makePots(3000))
    expect(result.payouts.get('p3')).toBe(3000) // closest without going over
    expect(result.payouts.get('p1')).toBe(0)
    expect(result.payouts.get('p2')).toBe(0)
  })

  it('everyone busts: falls back to closest overall', () => {
    const participants = makeParticipants(2)
    const picks = [
      // p1: 110 (over by 10)
      {
        participantId: 'p1',
        wagerLegId: 'leg1',
        pickValue: null,
        pickNumericValue: 110,
        liveScore: 0,
        outcome: 'pending',
      },
      // p2: 120 (over by 20)
      {
        participantId: 'p2',
        wagerLegId: 'leg1',
        pickValue: null,
        pickNumericValue: 120,
        liveScore: 0,
        outcome: 'pending',
      },
    ]

    const result = computeScoringResult('price-is-right', participants, picks, legs, makePots(2000))
    // Default bustFallback = 'closest-overall' → p1 wins (closer to 100)
    expect(result.payouts.get('p1')).toBe(2000)
    expect(result.payouts.get('p2')).toBe(0)
  })
})
