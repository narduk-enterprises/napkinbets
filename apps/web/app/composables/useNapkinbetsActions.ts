import type {
  CreatePaymentProfileInput,
  CreateWagerInput,
  JoinWagerInput,
  SaveFeaturedBetInput,
  UpdateNapkinbetsAiSettingsInput,
  WagerPickInput,
  WagerSettlementInput,
  WagerSettlementReviewInput,
} from '../../types/napkinbets'
import { useNapkinbetsApi } from '../services/napkinbets-api'

interface FeedbackMessage {
  type: 'success' | 'error'
  text: string
}

export function useNapkinbetsActions(refresh: () => Promise<unknown>) {
  const api = useNapkinbetsApi()
  const activeAction = useState<string | null>('napkinbets-active-action', () => null)
  const feedback = useState<FeedbackMessage | null>('napkinbets-feedback', () => null)

  async function runAction<T>(
    actionKey: string,
    successText: string,
    runner: () => Promise<T>,
  ): Promise<T | null> {
    activeAction.value = actionKey
    feedback.value = null

    try {
      const result = await runner()
      await refresh()
      feedback.value = {
        type: 'success',
        text: successText,
      }
      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong.'
      feedback.value = {
        type: 'error',
        text: message,
      }
      return null
    } finally {
      activeAction.value = null
    }
  }

  return {
    activeAction,
    feedback,
    clearFeedback() {
      feedback.value = null
    },
    createWager(payload: CreateWagerInput) {
      return runAction('create-wager', 'Bet created and ready to share.', () =>
        api.createWager(payload),
      )
    },
    joinWager(wagerId: string, payload: JoinWagerInput) {
      return runAction(`join:${wagerId}`, 'Participant added to the bet.', () =>
        api.joinWager(wagerId, payload),
      )
    },
    declineWager(wagerId: string) {
      return runAction(`decline:${wagerId}`, 'Invitation declined.', () =>
        api.declineWager(wagerId),
      )
    },
    addPick(wagerId: string, payload: WagerPickInput) {
      return runAction(`pick:${wagerId}`, 'Pick added to the bet.', () =>
        api.addPick(wagerId, payload),
      )
    },
    recordSettlement(wagerId: string, payload: WagerSettlementInput) {
      return runAction(`settlement:${wagerId}`, 'Settlement confirmation recorded.', () =>
        api.recordSettlement(wagerId, payload),
      )
    },
    confirmSettlement(wagerId: string, settlementId: string) {
      return runAction(`settlement-confirm:${settlementId}`, 'Settlement proof confirmed.', () =>
        api.confirmSettlement(wagerId, settlementId),
      )
    },
    rejectSettlement(wagerId: string, settlementId: string, payload: WagerSettlementReviewInput) {
      return runAction(
        `settlement-reject:${settlementId}`,
        'Settlement proof sent back for correction.',
        () => api.rejectSettlement(wagerId, settlementId, payload),
      )
    },
    shuffleDraftOrder(wagerId: string) {
      return runAction(`shuffle:${wagerId}`, 'Draft order rerolled.', () =>
        api.shuffleDraftOrder(wagerId),
      )
    },
    queueReminder(wagerId: string, message?: string) {
      return runAction(`reminder:${wagerId}`, 'Reminder queued for the group.', () =>
        api.queueReminder(wagerId, message),
      )
    },
    clearWager(wagerId: string) {
      return runAction(`clear:${wagerId}`, 'Bet cleared.', () => api.clearWager(wagerId))
    },
    setAdminStatus(userId: string, isAdmin: boolean) {
      return runAction(
        `admin-role:${userId}`,
        isAdmin ? 'Admin access granted.' : 'Admin access removed.',
        () => api.setAdminStatus(userId, isAdmin),
      )
    },
    setWagerStatus(wagerId: string, status: string) {
      return runAction(`admin-status:${wagerId}`, 'Wager status updated.', () =>
        api.setWagerStatus(wagerId, status),
      )
    },
    saveAdminAiSettings(payload: UpdateNapkinbetsAiSettingsInput) {
      return runAction('admin-ai-settings', 'AI controls updated.', () =>
        api.saveAdminAiSettings(payload),
      )
    },
    runAdminIngest(tier: string) {
      return runAction(`admin-ingest:${tier}`, 'Event refresh started.', () =>
        api.runAdminIngest(tier),
      )
    },
    savePaymentProfile(payload: CreatePaymentProfileInput) {
      return runAction('payment-profile:create', 'Payment profile saved.', () =>
        api.savePaymentProfile(payload),
      )
    },
    removePaymentProfile(profileId: string) {
      return runAction(`payment-profile:remove:${profileId}`, 'Payment profile removed.', () =>
        api.removePaymentProfile(profileId),
      )
    },
    setDefaultPaymentProfile(profileId: string) {
      return runAction(
        `payment-profile:default:${profileId}`,
        'Default payment profile updated.',
        () => api.setDefaultPaymentProfile(profileId),
      )
    },
    saveFeaturedBet(payload: SaveFeaturedBetInput) {
      return runAction('featured-bet:save', 'Featured bet saved.', () =>
        api.saveAdminFeaturedBet(payload),
      )
    },
    deleteFeaturedBet(id: string) {
      return runAction(`featured-bet:delete:${id}`, 'Featured bet removed.', () =>
        api.deleteAdminFeaturedBet(id),
      )
    },
  }
}
