import type {
  CreateNapkinbetsGroupInput,
  CreateWagerInput,
  CreatePaymentProfileInput,
  JoinWagerInput,
  NapkinbetsAiCloseoutSummaryInput,
  NapkinbetsAiTermsInput,
  NapkinbetsAdminResponse,
  NapkinbetsAdminFeaturedBetsResponse,
  NapkinbetsDashboardResponse,
  NapkinbetsDiscoveryResponse,
  NapkinbetsFriendSearchResponse,
  NapkinbetsFriendsResponse,
  NapkinbetsGroupsResponse,
  NapkinbetsNotificationsResponse,
  NapkinbetsPaymentProfilesResponse,
  NapkinbetsProfileResponse,
  NapkinbetsTaxonomyResponse,
  NapkinbetsWorkspaceResponse,
  SaveFeaturedBetInput,
  UpdateNapkinbetsAiSettingsInput,
  UpdateProfileInput,
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
    getEventDetail(id: string) {
      return fetch<{ event: NapkinbetsDiscoveryResponse['spotlights'][0] | null }>(`/api/napkinbets/events/${encodeURIComponent(id)}`)
    },
    getTaxonomy() {
      return fetch<NapkinbetsTaxonomyResponse>('/api/napkinbets/taxonomy')
    },
    getWorkspace() {
      return fetch<NapkinbetsWorkspaceResponse>('/api/napkinbets/workspace')
    },
    getNotifications() {
      return fetch<NapkinbetsNotificationsResponse>('/api/napkinbets/notifications')
    },
    getFriends() {
      return fetch<NapkinbetsFriendsResponse>('/api/napkinbets/friends')
    },
    searchUsers(query: string) {
      return fetch<NapkinbetsFriendSearchResponse>('/api/napkinbets/friends/search', {
        query: { q: query },
      })
    },
    sendFriendRequest(targetUserId: string) {
      return fetch('/api/napkinbets/friends/requests', {
        method: 'POST',
        body: { targetUserId },
      })
    },
    acceptFriendRequest(requestId: string) {
      return fetch(`/api/napkinbets/friends/requests/${requestId}/accept`, {
        method: 'POST',
      })
    },
    declineFriendRequest(requestId: string) {
      return fetch(`/api/napkinbets/friends/requests/${requestId}`, {
        method: 'DELETE',
      })
    },
    removeFriend(friendshipId: string) {
      return fetch(`/api/napkinbets/friends/${friendshipId}`, {
        method: 'DELETE',
      })
    },
    getGroups() {
      return fetch<NapkinbetsGroupsResponse>('/api/napkinbets/groups')
    },
    createGroup(payload: CreateNapkinbetsGroupInput) {
      return fetch<{ ok: true; group: { id: string; slug: string; name: string } }>(
        '/api/napkinbets/groups',
        {
          method: 'POST',
          body: payload,
        },
      )
    },
    joinGroup(groupId: string) {
      return fetch(`/api/napkinbets/groups/${groupId}/join`, {
        method: 'POST',
      })
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
    getAdminFeaturedBets() {
      return fetch<NapkinbetsAdminFeaturedBetsResponse>('/api/napkinbets/admin/featured-bets')
    },
    saveAdminFeaturedBet(payload: SaveFeaturedBetInput) {
      return fetch<{ ok: true; id: string }>('/api/napkinbets/admin/featured-bets', {
        method: 'POST',
        body: payload,
      })
    },
    deleteAdminFeaturedBet(id: string) {
      return fetch('/api/napkinbets/admin/featured-bets/' + id, {
        method: 'DELETE',
      })
    },
    getWager(slug: string) {
      return fetch<NapkinbetsWagerResponse>(`/api/napkinbets/wagers/slug/${slug}`)
    },
    getPaymentProfiles() {
      return fetch<NapkinbetsPaymentProfilesResponse>('/api/napkinbets/me/payment-profiles')
    },
    getProfile() {
      return fetch<NapkinbetsProfileResponse>('/api/napkinbets/me/profile')
    },
    updateProfile(payload: UpdateProfileInput) {
      return fetch<{ ok: true }>('/api/napkinbets/me/profile', {
        method: 'POST',
        body: payload,
      })
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
    declineWager(wagerId: string) {
      return fetch('/api/napkinbets/wagers/' + wagerId + '/decline', {
        method: 'POST',
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
    rejectSettlement(wagerId: string, settlementId: string, payload: WagerSettlementReviewInput) {
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
