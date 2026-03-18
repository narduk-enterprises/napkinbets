import type { NapkinbetsSettlement, NapkinbetsWager } from '../../types/napkinbets'

export type NapkinbetsWagerSettlementStage =
  | 'upcoming'
  | 'live'
  | 'calling'
  | 'ready'
  | 'submitted'
  | 'rejected'
  | 'settled'

type NapkinbetsSettlementStageSettlement = Pick<
  NapkinbetsSettlement,
  'participantId' | 'verificationStatus' | 'recipientAcknowledged'
>

type NapkinbetsSettlementStageWager = Pick<NapkinbetsWager, 'status' | 'eventState'> & {
  settlements: NapkinbetsSettlementStageSettlement[]
}

const COMPLETED_WAGER_STATUSES = new Set(['settled', 'closed', 'archived'])
const FINISHED_WAGER_STATUSES = new Set(['settling', 'settled', 'closed', 'archived'])
const OUTCOME_CALLING_STATUSES = new Set(['calling', 'disputed'])

export function getNapkinbetsWagerSettlementStage(
  wager: NapkinbetsSettlementStageWager,
  participantId?: string | null,
): NapkinbetsWagerSettlementStage {
  if (COMPLETED_WAGER_STATUSES.has(wager.status)) {
    return 'settled'
  }

  // Custom bet is in outcome review — not yet ready for financial settlement
  if (OUTCOME_CALLING_STATUSES.has(wager.status)) {
    return 'calling'
  }

  const participantSettlement = participantId
    ? (wager.settlements.find((settlement) => settlement.participantId === participantId) ?? null)
    : null

  if (participantSettlement?.verificationStatus === 'rejected') {
    return 'rejected'
  }

  if (participantSettlement) {
    return 'submitted'
  }

  if (wager.settlements.some((settlement) => settlement.verificationStatus !== 'rejected')) {
    return 'submitted'
  }

  if (wager.eventState === 'post' || FINISHED_WAGER_STATUSES.has(wager.status)) {
    return 'ready'
  }

  if (wager.eventState === 'in' || wager.status === 'live') {
    return 'live'
  }

  return 'upcoming'
}
