import type { H3Event } from 'h3'
import { desc, eq, inArray, sql } from 'drizzle-orm'
import {
  napkinbetsParticipants,
  napkinbetsPicks,
  napkinbetsPots,
  napkinbetsSettlements,
  napkinbetsUserPaymentProfiles,
  napkinbetsWagers,
} from '#server/database/schema'
import { users } from '#layer/server/database/schema'
import { useAppDatabase } from '#server/utils/database'

const FINISHED_STATUSES = new Set(['settling', 'settled', 'closed', 'archived'])

function nowIso() {
  return new Date().toISOString()
}

/**
 * Compute the projected payout for each participant on a single wager.
 * This mirrors the leaderboard scoring logic in pools.ts but returns
 * a simple participantId → payoutCents map.
 */
function computePayouts(
  participants: Array<{
    id: string
    joinStatus: string
    draftOrder: number | null
  }>,
  picks: Array<{
    participantId: string
    liveScore: number
    outcome: string
  }>,
  pots: Array<{
    amountCents: number
  }>,
) {
  const totalPotCents = pots.reduce((sum, pot) => sum + pot.amountCents, 0)
  const accepted = participants.filter((p) => p.joinStatus !== 'pending')

  const scores = new Map<string, number>()
  let totalScore = 0

  for (const participant of accepted) {
    const participantPicks = picks.filter((pick) => pick.participantId === participant.id)
    let score = 0
    for (const pick of participantPicks) {
      score += pick.liveScore
      if (pick.outcome === 'won') {
        score += 5
      } else if (pick.outcome === 'winning') {
        score += 3
      } else if (pick.outcome === 'pending') {
        score += 1
      }
    }
    totalScore += score
    scores.set(participant.id, score)
  }

  const fallbackSplit = accepted.length > 0 ? Math.round(totalPotCents / accepted.length) : 0
  const payoutMap = new Map<string, number>()

  for (const participant of accepted) {
    const score = scores.get(participant.id) ?? 0
    const payout = totalScore > 0 ? Math.round(totalPotCents * (score / totalScore)) : fallbackSplit
    payoutMap.set(participant.id, payout)
  }

  return payoutMap
}

interface LedgerEntry {
  wagerId: string
  wagerSlug: string
  wagerTitle: string
  counterpartyUserId: string
  amountCents: number // positive = current user owes, negative = current user is owed
  paymentStatus: string
  settlementId: string | null
  verificationStatus: string | null
  method: string | null
}

/**
 * Compute the cross-wager payment reconciliation ledger for a user.
 * Returns net balances grouped by counterparty.
 */
export async function computeLedger(event: H3Event, userId: string) {
  const db = useAppDatabase(event)

  // 1. Find all wagers where this user is a participant
  const myParticipantRows = await db
    .select({
      id: napkinbetsParticipants.id,
      wagerId: napkinbetsParticipants.wagerId,
    })
    .from(napkinbetsParticipants)
    .where(eq(napkinbetsParticipants.userId, userId))

  if (myParticipantRows.length === 0) {
    return {
      counterparties: [],
      totalOwedCents: 0,
      totalOwedToYouCents: 0,
      refreshedAt: nowIso(),
    }
  }

  const wagerIds = [...new Set(myParticipantRows.map((row) => row.wagerId))]

  // 2. Load all related data in parallel
  const [wagerRows, allParticipants, allPicks, allPots, allSettlements] = await Promise.all([
    db.select().from(napkinbetsWagers).where(inArray(napkinbetsWagers.id, wagerIds)),
    db
      .select()
      .from(napkinbetsParticipants)
      .where(inArray(napkinbetsParticipants.wagerId, wagerIds)),
    db.select().from(napkinbetsPicks).where(inArray(napkinbetsPicks.wagerId, wagerIds)),
    db.select().from(napkinbetsPots).where(inArray(napkinbetsPots.wagerId, wagerIds)),
    db.select().from(napkinbetsSettlements).where(inArray(napkinbetsSettlements.wagerId, wagerIds)),
  ])

  // 3. Only process finished wagers
  const finishedWagers = wagerRows.filter((w) => FINISHED_STATUSES.has(w.status))

  const entries: LedgerEntry[] = []

  for (const wager of finishedWagers) {
    const wagerParticipants = allParticipants.filter((p) => p.wagerId === wager.id)
    const wagerPicks = allPicks.filter((p) => p.wagerId === wager.id)
    const wagerPots = allPots.filter((p) => p.wagerId === wager.id)
    const wagerSettlements = allSettlements.filter((s) => s.wagerId === wager.id)

    const myParticipant = wagerParticipants.find((p) => p.userId === userId)
    if (!myParticipant) continue

    const otherParticipants = wagerParticipants.filter((p) => p.userId && p.userId !== userId)
    if (otherParticipants.length === 0) continue

    const payouts = computePayouts(wagerParticipants, wagerPicks, wagerPots)
    const myPayout = payouts.get(myParticipant.id) ?? 0
    const myEntry = wager.entryFeeCents

    // For simple-bet (1v1): loser pays winner the entry fee
    if (wager.napkinType === 'simple-bet' && otherParticipants.length === 1) {
      const opponent = otherParticipants[0]!

      // Determine direction: if opponent got more payout, I owe them; vice versa
      // The net transfer is: what I should receive minus what I paid in
      const myNetPosition = myPayout - myEntry // negative = I owe money
      const amountCents = -myNetPosition // positive = I owe, negative = they owe me

      if (amountCents === 0) continue

      // Check if there's a settlement for this
      const mySettlement = wagerSettlements.find((s) => s.participantId === myParticipant.id)
      const opponentSettlement = wagerSettlements.find((s) => s.participantId === opponent.id)

      // Use whichever settlement is relevant
      const relevantSettlement = amountCents > 0 ? mySettlement : opponentSettlement

      entries.push({
        wagerId: wager.id,
        wagerSlug: wager.slug,
        wagerTitle: wager.title,
        counterpartyUserId: opponent.userId!,
        amountCents,
        paymentStatus: amountCents > 0 ? myParticipant.paymentStatus : opponent.paymentStatus,
        settlementId: relevantSettlement?.id ?? null,
        verificationStatus: relevantSettlement?.verificationStatus ?? null,
        method: relevantSettlement?.method ?? null,
      })
    } else {
      // Pool: distribute proportionally among other participants
      // My net position = myPayout - myEntry
      // Distribute my debt/credit proportionally among other participants based on their payout share
      const myNetPosition = myPayout - myEntry

      if (myNetPosition === 0) continue

      const totalOtherPayout = otherParticipants.reduce(
        (sum, p) => sum + (payouts.get(p.id) ?? 0),
        0,
      )

      for (const other of otherParticipants) {
        const otherPayout = payouts.get(other.id) ?? 0
        const share =
          totalOtherPayout > 0 ? otherPayout / totalOtherPayout : 1 / otherParticipants.length
        const amountCents = Math.round(-myNetPosition * share)

        if (amountCents === 0) continue

        const relevantSettlement = wagerSettlements.find(
          (s) => s.participantId === (amountCents > 0 ? myParticipant.id : other.id),
        )

        entries.push({
          wagerId: wager.id,
          wagerSlug: wager.slug,
          wagerTitle: wager.title,
          counterpartyUserId: other.userId!,
          amountCents,
          paymentStatus: amountCents > 0 ? myParticipant.paymentStatus : other.paymentStatus,
          settlementId: relevantSettlement?.id ?? null,
          verificationStatus: relevantSettlement?.verificationStatus ?? null,
          method: relevantSettlement?.method ?? null,
        })
      }
    }
  }

  // 4. Group by counterparty and compute net balances
  const counterpartyMap = new Map<
    string,
    {
      userId: string
      entries: LedgerEntry[]
      netBalanceCents: number
    }
  >()

  for (const entry of entries) {
    const existing = counterpartyMap.get(entry.counterpartyUserId)
    if (existing) {
      existing.entries.push(entry)
      existing.netBalanceCents += entry.amountCents
    } else {
      counterpartyMap.set(entry.counterpartyUserId, {
        userId: entry.counterpartyUserId,
        entries: [entry],
        netBalanceCents: entry.amountCents,
      })
    }
  }

  // 5. Load user info and payment profiles for counterparties
  const counterpartyUserIds = [...counterpartyMap.keys()]

  const [userRows, paymentProfiles] =
    counterpartyUserIds.length > 0
      ? await Promise.all([
          db
            .select({
              id: users.id,
              name: users.name,
              avatarUrl: sql<string>`avatar_url`.as('avatar_url'),
            })
            .from(users)
            .where(inArray(users.id, counterpartyUserIds)),
          db
            .select()
            .from(napkinbetsUserPaymentProfiles)
            .where(inArray(napkinbetsUserPaymentProfiles.userId, counterpartyUserIds))
            .orderBy(desc(napkinbetsUserPaymentProfiles.isDefault)),
        ])
      : [[], []]

  const userById = new Map(userRows.map((u) => [u.id, u]))
  const defaultProfileByUserId = new Map<string, { provider: string; handle: string }>()
  for (const profile of paymentProfiles) {
    if (!defaultProfileByUserId.has(profile.userId)) {
      defaultProfileByUserId.set(profile.userId, {
        provider: profile.provider,
        handle: profile.handle,
      })
    }
  }

  // 6. Build final response
  const counterparties = [...counterpartyMap.values()]
    .filter((cp) => cp.netBalanceCents !== 0)
    .map((cp) => {
      const user = userById.get(cp.userId)
      const profile = defaultProfileByUserId.get(cp.userId)

      return {
        userId: cp.userId,
        displayName: user?.name || 'Unknown',
        avatarUrl: user?.avatarUrl || '',
        netBalanceCents: cp.netBalanceCents,
        wagerEntries: cp.entries.map((e) => ({
          wagerId: e.wagerId,
          wagerSlug: e.wagerSlug,
          wagerTitle: e.wagerTitle,
          amountCents: e.amountCents,
          paymentStatus: e.paymentStatus,
          settlementId: e.settlementId,
          verificationStatus: e.verificationStatus,
          method: e.method,
        })),
        preferredPaymentMethod: profile?.provider ?? null,
        preferredPaymentHandle: profile?.handle ?? null,
      }
    })
    .sort((a, b) => Math.abs(b.netBalanceCents) - Math.abs(a.netBalanceCents))

  const totalOwedCents = counterparties
    .filter((cp) => cp.netBalanceCents > 0)
    .reduce((sum, cp) => sum + cp.netBalanceCents, 0)

  const totalOwedToYouCents = counterparties
    .filter((cp) => cp.netBalanceCents < 0)
    .reduce((sum, cp) => sum + Math.abs(cp.netBalanceCents), 0)

  return {
    counterparties,
    totalOwedCents,
    totalOwedToYouCents,
    refreshedAt: nowIso(),
  }
}
