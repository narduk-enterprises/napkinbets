import type {
  CreateWagerInput,
  CreatePaymentProfileInput,
  JoinWagerInput,
  NapkinbetsAiCloseoutSummaryInput,
  NapkinbetsAiTermsInput,
  NapkinbetsAdminResponse,
  NapkinbetsDashboardResponse,
  NapkinbetsDiscoveryResponse,
  NapkinbetsPaymentProfilesResponse,
  NapkinbetsWorkspaceResponse,
  UpdateNapkinbetsAiSettingsInput,
  WagerPickInput,
  NapkinbetsWagerResponse,
  WagerSettlementInput,
  WagerSettlementReviewInput,
} from '../../types/napkinbets'

export function useNapkinbetsApi() {
  const fetch = useAppFetch()

  return {
    getLanding() {
      return fetch<NapkinbetsDashboardResponse>('/api/napkinbets/dashboard')
    },
    getDiscover() {
      return fetch<NapkinbetsDiscoveryResponse>('/api/napkinbets/discover')
    },
    getWorkspace() {
      return fetch<NapkinbetsWorkspaceResponse>('/api/napkinbets/workspace')
    },
    getAdminOverview() {
      return fetch<NapkinbetsAdminResponse>('/api/napkinbets/admin/overview')
    },
    saveAdminAiSettings(payload: UpdateNapkinbetsAiSettingsInput) {
      return fetch('/api/napkinbets/admin/ai-settings', {
        method: 'POST',
        body: payload,
      })
    },
    runAdminIngest(tier: string) {
      return fetch<{ refreshedAt: string }>('/api/napkinbets/admin/ingest', {
        method: 'POST',
        body: { tier },
      })
    },
    getWager(slug: string) {
      return fetch<NapkinbetsWagerResponse>(`/api/napkinbets/wagers/slug/${slug}`)
    },
    getPaymentProfiles() {
      return fetch<NapkinbetsPaymentProfilesResponse>('/api/napkinbets/me/payment-profiles')
    },
    rewriteTermsWithAi(payload: NapkinbetsAiTermsInput) {
      return fetch<{ terms: string }>('/api/napkinbets/ai/terms', {
        method: 'POST',
        body: payload,
      })
    },
    draftCloseoutSummary(payload: NapkinbetsAiCloseoutSummaryInput) {
      return fetch<{ summary: string }>('/api/napkinbets/ai/closeout-summary', {
        method: 'POST',
        body: payload,
      })
    },
    createWager(payload: CreateWagerInput) {
      return fetch<{ ok: true; wagerId: string; slug: string }>('/api/napkinbets/wagers', {
        method: 'POST',
        body: payload,
      })
    },
    joinWager(wagerId: string, payload: JoinWagerInput) {
      return fetch('/api/napkinbets/wagers/' + wagerId + '/join', {
        method: 'POST',
        body: payload,
      })
    },
    addPick(wagerId: string, payload: WagerPickInput) {
      return fetch('/api/napkinbets/wagers/' + wagerId + '/picks', {
        method: 'POST',
        body: payload,
      })
    },
    recordSettlement(wagerId: string, payload: WagerSettlementInput) {
      return fetch('/api/napkinbets/wagers/' + wagerId + '/settlements', {
        method: 'POST',
        body: payload,
      })
    },
    confirmSettlement(wagerId: string, settlementId: string) {
      return fetch(`/api/napkinbets/wagers/${wagerId}/settlements/${settlementId}/confirm`, {
        method: 'POST',
      })
    },
    rejectSettlement(
      wagerId: string,
      settlementId: string,
      payload: WagerSettlementReviewInput,
    ) {
      return fetch(`/api/napkinbets/wagers/${wagerId}/settlements/${settlementId}/reject`, {
        method: 'POST',
        body: payload,
      })
    },
    shuffleDraftOrder(wagerId: string) {
      return fetch('/api/napkinbets/wagers/' + wagerId + '/draft-order', {
        method: 'POST',
      })
    },
    queueReminder(wagerId: string, message?: string) {
      return fetch('/api/napkinbets/wagers/' + wagerId + '/reminders', {
        method: 'POST',
        body: { message },
      })
    },
    clearWager(wagerId: string) {
      return fetch('/api/napkinbets/wagers/' + wagerId, {
        method: 'DELETE',
      })
    },
    setAdminStatus(userId: string, isAdmin: boolean) {
      return fetch('/api/napkinbets/admin/users/' + userId + '/role', {
        method: 'POST',
        body: { isAdmin },
      })
    },
    setWagerStatus(wagerId: string, status: string) {
      return fetch('/api/napkinbets/admin/wagers/' + wagerId + '/status', {
        method: 'POST',
        body: { status },
      })
    },
    savePaymentProfile(payload: CreatePaymentProfileInput) {
      return fetch('/api/napkinbets/me/payment-profiles', {
        method: 'POST',
        body: payload,
      })
    },
    removePaymentProfile(profileId: string) {
      return fetch('/api/napkinbets/me/payment-profiles/' + profileId, {
        method: 'DELETE',
      })
    },
    setDefaultPaymentProfile(profileId: string) {
      return fetch('/api/napkinbets/me/payment-profiles/' + profileId + '/default', {
        method: 'POST',
      })
    },
  }
}
