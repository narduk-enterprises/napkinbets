/**
 * Pluggable scoring engine for multi-leg wagers.
 *
 * Each scoring rule implements a strategy that takes participants, picks,
 * legs, pots, and optional config — and returns standings + payouts.
 *
 * Legacy wagers (scoringRule = 'proportional' or no legs) fall through
 * to the existing liveScore-based computation.
 */

// ─── Types ──────────────────────────────────────────────────

interface ScoringParticipant {
  id: string
  joinStatus: string
  draftOrder: number | null
}

interface ScoringPick {
  participantId: string
  wagerLegId: string | null
  pickValue: string | null
  pickNumericValue: number | null
  liveScore: number
  outcome: string
}

interface ScoringLeg {
  id: string
  sortOrder: number
  legType: 'categorical' | 'numeric'
  outcomeStatus: 'pending' | 'settled' | 'voided'
  outcomeOptionKey: string | null
  outcomeNumericValue: number | null
}

interface ScoringPot {
  amountCents: number
}

interface ScoringConfig {
  /** Tiebreak: 'split' (default) | 'earliest' | 'host-decides' */
  tieBreak?: 'split' | 'earliest' | 'host-decides'
  /** Parlay fallback when nobody is perfect: 'closest' | 'no-winner' */
  parlayFallback?: 'closest' | 'no-winner'
  /** Price-is-right fallback when everyone busts: 'closest-overall' | 'no-winner' */
  bustFallback?: 'closest-overall' | 'no-winner'
}

export interface ScoringStanding {
  participantId: string
  score: number
  rank: number
}

export interface ScoringResult {
  standings: ScoringStanding[]
  payouts: Map<string, number>
}

type ScoringRule = 'proportional' | 'most-correct' | 'parlay' | 'closest' | 'price-is-right'

// ─── Strategy Implementations ───────────────────────────────

function filterAccepted(participants: ScoringParticipant[]) {
  return participants.filter((p) => p.joinStatus !== 'pending')
}

function assignRanks(entries: Array<{ participantId: string; score: number }>) {
  const sorted = [...entries].sort((a, b) => b.score - a.score)
  const standings: ScoringStanding[] = []
  let currentRank = 1

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i]!.score < sorted[i - 1]!.score) {
      currentRank = i + 1
    }
    standings.push({
      participantId: sorted[i]!.participantId,
      score: sorted[i]!.score,
      rank: currentRank,
    })
  }

  return standings
}

function winnerTakesAllPayouts(
  standings: ScoringStanding[],
  totalPotCents: number,
  tieBreak: string,
) {
  const payouts = new Map<string, number>()
  if (standings.length === 0) return payouts

  const topRank = standings[0]!.rank
  const winners = standings.filter((s) => s.rank === topRank)

  if (tieBreak === 'split' || winners.length === 1) {
    const share = Math.round(totalPotCents / winners.length)
    for (const winner of winners) {
      payouts.set(winner.participantId, share)
    }
  } else {
    // For 'earliest' or 'host-decides', first winner gets all for now
    payouts.set(winners[0]!.participantId, totalPotCents)
  }

  // Everyone else gets 0
  for (const standing of standings) {
    if (!payouts.has(standing.participantId)) {
      payouts.set(standing.participantId, 0)
    }
  }

  return payouts
}

/**
 * Legacy proportional scoring: sum of liveScore + outcome bonus.
 * This exactly mirrors the existing computeLeaderboard logic.
 */
function scoreProportional(
  participants: ScoringParticipant[],
  picks: ScoringPick[],
  _legs: ScoringLeg[],
  pots: ScoringPot[],
  _config: ScoringConfig,
): ScoringResult {
  const accepted = filterAccepted(participants)
  const totalPotCents = pots.reduce((sum, pot) => sum + pot.amountCents, 0)
  const entries: Array<{ participantId: string; score: number }> = []
  let totalScore = 0

  for (const participant of accepted) {
    const participantPicks = picks.filter((p) => p.participantId === participant.id)
    let score = 0
    for (const pick of participantPicks) {
      score += pick.liveScore
      if (pick.outcome === 'won') score += 5
      else if (pick.outcome === 'winning') score += 3
      else if (pick.outcome === 'pending') score += 1
    }
    totalScore += score
    entries.push({ participantId: participant.id, score })
  }

  const standings = assignRanks(entries)
  const payouts = new Map<string, number>()
  const fallbackSplit = accepted.length > 0 ? Math.round(totalPotCents / accepted.length) : 0

  for (const standing of standings) {
    const payout =
      totalScore > 0 ? Math.round(totalPotCents * (standing.score / totalScore)) : fallbackSplit
    payouts.set(standing.participantId, payout)
  }

  return { standings, payouts }
}

/**
 * Most-correct: count of settled legs where pick matches outcome.
 * Winner(s) = participant(s) with most correct picks.
 */
function scoreMostCorrect(
  participants: ScoringParticipant[],
  picks: ScoringPick[],
  legs: ScoringLeg[],
  pots: ScoringPot[],
  config: ScoringConfig,
): ScoringResult {
  const accepted = filterAccepted(participants)
  const totalPotCents = pots.reduce((sum, pot) => sum + pot.amountCents, 0)
  const settledLegs = legs.filter((l) => l.outcomeStatus === 'settled')
  const settledLegIds = new Set(settledLegs.map((l) => l.id))
  const legMap = new Map(settledLegs.map((l) => [l.id, l]))

  const entries: Array<{ participantId: string; score: number }> = []

  for (const participant of accepted) {
    const participantPicks = picks.filter(
      (p) => p.participantId === participant.id && p.wagerLegId && settledLegIds.has(p.wagerLegId),
    )

    let correct = 0
    for (const pick of participantPicks) {
      const leg = legMap.get(pick.wagerLegId!)
      if (!leg) continue

      if (leg.legType === 'categorical') {
        if (pick.pickValue === leg.outcomeOptionKey) correct++
      } else if (leg.legType === 'numeric' && pick.pickNumericValue === leg.outcomeNumericValue)
        correct++
    }

    entries.push({ participantId: participant.id, score: correct })
  }

  const standings = assignRanks(entries)
  const payouts = winnerTakesAllPayouts(standings, totalPotCents, config.tieBreak ?? 'split')

  return { standings, payouts }
}

/**
 * Parlay: all legs must be correct to win.
 * If nobody goes perfect, fallback option applies.
 */
function scoreParlay(
  participants: ScoringParticipant[],
  picks: ScoringPick[],
  legs: ScoringLeg[],
  pots: ScoringPot[],
  config: ScoringConfig,
): ScoringResult {
  const accepted = filterAccepted(participants)
  const totalPotCents = pots.reduce((sum, pot) => sum + pot.amountCents, 0)
  const activeLegIds = legs.filter((l) => l.outcomeStatus !== 'voided').map((l) => l.id)
  const settledLegs = legs.filter((l) => l.outcomeStatus === 'settled')
  const legMap = new Map(settledLegs.map((l) => [l.id, l]))

  const entries: Array<{ participantId: string; score: number }> = []

  for (const participant of accepted) {
    let correct = 0
    for (const legId of activeLegIds) {
      const pick = picks.find((p) => p.participantId === participant.id && p.wagerLegId === legId)
      const leg = legMap.get(legId)
      if (!pick || !leg) continue

      if (leg.legType === 'categorical' && pick.pickValue === leg.outcomeOptionKey) {
        correct++
      } else if (leg.legType === 'numeric' && pick.pickNumericValue === leg.outcomeNumericValue) {
        correct++
      }
    }
    entries.push({ participantId: participant.id, score: correct })
  }

  const totalLegs = activeLegIds.length
  const perfectEntries = entries.filter((e) => e.score === totalLegs)

  if (perfectEntries.length > 0) {
    // Perfect entries win; split among them
    const standings = assignRanks(entries)
    const payouts = new Map<string, number>()
    const share = Math.round(totalPotCents / perfectEntries.length)
    const perfectIds = new Set(perfectEntries.map((e) => e.participantId))

    for (const standing of standings) {
      payouts.set(standing.participantId, perfectIds.has(standing.participantId) ? share : 0)
    }

    return { standings, payouts }
  }

  // Nobody perfect — apply fallback
  const standings = assignRanks(entries)
  const fallback = config.parlayFallback ?? 'closest'

  if (fallback === 'closest') {
    // Closest (most correct) wins
    return {
      standings,
      payouts: winnerTakesAllPayouts(standings, totalPotCents, config.tieBreak ?? 'split'),
    }
  }

  // No winner — everyone gets 0
  const payouts = new Map<string, number>()
  for (const standing of standings) {
    payouts.set(standing.participantId, 0)
  }
  return { standings, payouts }
}

/**
 * Closest: minimize total absolute error across all numeric legs.
 * Score = negative total error (higher = better for ranking).
 */
function scoreClosest(
  participants: ScoringParticipant[],
  picks: ScoringPick[],
  legs: ScoringLeg[],
  pots: ScoringPot[],
  config: ScoringConfig,
): ScoringResult {
  const accepted = filterAccepted(participants)
  const totalPotCents = pots.reduce((sum, pot) => sum + pot.amountCents, 0)
  const settledNumericLegs = legs.filter(
    (l) =>
      l.outcomeStatus === 'settled' && l.legType === 'numeric' && l.outcomeNumericValue != null,
  )
  const entries: Array<{ participantId: string; score: number }> = []

  for (const participant of accepted) {
    let totalError = 0
    let legsCounted = 0

    for (const leg of settledNumericLegs) {
      const pick = picks.find((p) => p.participantId === participant.id && p.wagerLegId === leg.id)
      if (!pick || pick.pickNumericValue == null) continue

      totalError += Math.abs(pick.pickNumericValue - leg.outcomeNumericValue!)
      legsCounted++
    }

    // Score = negative error so higher is better; missing legs count as worst
    const score = legsCounted > 0 ? -totalError : -Number.MAX_SAFE_INTEGER
    entries.push({ participantId: participant.id, score })
  }

  const standings = assignRanks(entries)
  const payouts = winnerTakesAllPayouts(standings, totalPotCents, config.tieBreak ?? 'split')

  return { standings, payouts }
}

/**
 * Price is Right: closest without going over.
 * "Bust" = pick > actual. Among non-busted, highest pick wins.
 * If everyone busts, apply fallback (default: closest overall).
 */
function scorePriceIsRight(
  participants: ScoringParticipant[],
  picks: ScoringPick[],
  legs: ScoringLeg[],
  pots: ScoringPot[],
  config: ScoringConfig,
): ScoringResult {
  const accepted = filterAccepted(participants)
  const totalPotCents = pots.reduce((sum, pot) => sum + pot.amountCents, 0)
  const settledNumericLegs = legs.filter(
    (l) =>
      l.outcomeStatus === 'settled' && l.legType === 'numeric' && l.outcomeNumericValue != null,
  )

  const entries: Array<{ participantId: string; score: number; busted: boolean }> = []

  for (const participant of accepted) {
    let totalPick = 0
    let busted = false
    let hasAnyPick = false

    for (const leg of settledNumericLegs) {
      const pick = picks.find((p) => p.participantId === participant.id && p.wagerLegId === leg.id)
      if (!pick || pick.pickNumericValue == null) continue

      hasAnyPick = true
      totalPick += pick.pickNumericValue

      if (pick.pickNumericValue > leg.outcomeNumericValue!) {
        busted = true
      }
    }

    if (!hasAnyPick) {
      entries.push({ participantId: participant.id, score: -Number.MAX_SAFE_INTEGER, busted: true })
    } else {
      // Non-busted: score = total pick (higher = closer without going over)
      // Busted: score = negative total error
      const totalActual = settledNumericLegs.reduce((sum, l) => sum + l.outcomeNumericValue!, 0)
      const score = busted ? -(totalPick - totalActual) : totalPick
      entries.push({ participantId: participant.id, score, busted })
    }
  }

  const nonBusted = entries.filter((e) => !e.busted)

  if (nonBusted.length > 0) {
    // Among non-busted, highest pick total wins (closest without going over)
    const standings = assignRanks(
      entries.map((e) => ({
        participantId: e.participantId,
        score: e.busted ? -Number.MAX_SAFE_INTEGER : e.score,
      })),
    )
    const payouts = winnerTakesAllPayouts(standings, totalPotCents, config.tieBreak ?? 'split')
    return { standings, payouts }
  }

  // Everyone busted — apply fallback
  const bustFallback = config.bustFallback ?? 'closest-overall'

  if (bustFallback === 'closest-overall') {
    // Use closest scoring (absolute error) as fallback
    return scoreClosest(participants, picks, legs, pots, config)
  }

  // No winner
  const standings = assignRanks(entries.map((e) => ({ participantId: e.participantId, score: 0 })))
  const payouts = new Map<string, number>()
  for (const standing of standings) {
    payouts.set(standing.participantId, 0)
  }
  return { standings, payouts }
}

// ─── Public API ─────────────────────────────────────────────

const STRATEGIES: Record<
  ScoringRule,
  (
    participants: ScoringParticipant[],
    picks: ScoringPick[],
    legs: ScoringLeg[],
    pots: ScoringPot[],
    config: ScoringConfig,
  ) => ScoringResult
> = {
  proportional: scoreProportional,
  'most-correct': scoreMostCorrect,
  parlay: scoreParlay,
  closest: scoreClosest,
  'price-is-right': scorePriceIsRight,
}

/**
 * Compute scoring result for a wager using the specified rule.
 * Falls through to proportional for unknown rules.
 */
export function computeScoringResult(
  rule: string,
  participants: ScoringParticipant[],
  picks: ScoringPick[],
  legs: ScoringLeg[],
  pots: ScoringPot[],
  configJson: string = '{}',
): ScoringResult {
  let config: ScoringConfig = {}
  try {
    config = JSON.parse(configJson) as ScoringConfig
  } catch {
    config = {}
  }

  const strategy = STRATEGIES[rule as ScoringRule] ?? scoreProportional
  return strategy(participants, picks, legs, pots, config)
}
