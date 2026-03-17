import type {
  CreateNapkinbetsGroupInput,
  CreateWagerInput,
  CreatePaymentProfileInput,
  JoinWagerInput,
  NapkinbetsAiCloseoutSummaryInput,
  NapkinbetsAiTermsInput,
  NapkinbetsAdminResponse,
  NapkinbetsAdminFeaturedBetsResponse,
  NapkinbetsAdminTaxonomyResponse,
  NapkinbetsDashboardResponse,
  NapkinbetsDiscoveryResponse,
  NapkinbetsEventDetailResponse,
  NapkinbetsFriendSearchResponse,
  NapkinbetsFriendsResponse,
  NapkinbetsGroupsResponse,
  NapkinbetsNotificationSettingsResponse,
  NapkinbetsNotificationsResponse,
  NapkinbetsPaymentProfilesResponse,
  NapkinbetsPlayerProfileResponse,
  NapkinbetsProfileResponse,
  NapkinbetsTaxonomyResponse,
  NapkinbetsTeamProfileResponse,
  NapkinbetsLeagueProfileResponse,
  NapkinbetsVenueProfileResponse,
  NapkinbetsWorkspaceResponse,
  SaveFeaturedBetInput,
  SaveNapkinbetsTaxonomyLeagueInput,
  UpdateNapkinbetsAiSettingsInput,
  UpdateNotificationSettingsInput,
  UpdateProfileInput,
  WagerPickInput,
  NapkinbetsWagerResponse,
  WagerSettlementInput,
  WagerSettlementReviewInput,
  NapkinbetsAdminWagersResponse,
  NapkinbetsAdminWagerCreateInput,
  NapkinbetsAdminWagerUpdateInput,
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
      return fetch<NapkinbetsEventDetailResponse>(
        `/api/napkinbets/events/${encodeURIComponent(id)}`,
      )
    },
    getLeagueProfile(key: string) {
      return fetch<NapkinbetsLeagueProfileResponse>(
        `/api/napkinbets/leagues/${encodeURIComponent(key)}`,
      )
    },
    getTeamProfile(slug: string) {
      return fetch<NapkinbetsTeamProfileResponse>(
        `/api/napkinbets/teams/${encodeURIComponent(slug)}`,
      )
    },
    getPlayerProfile(slug: string) {
      return fetch<NapkinbetsPlayerProfileResponse>(
        `/api/napkinbets/players/${encodeURIComponent(slug)}`,
      )
    },
    getVenueProfile(slug: string) {
      return fetch<NapkinbetsVenueProfileResponse>(
        `/api/napkinbets/venues/${encodeURIComponent(slug)}`,
      )
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
    getAdminTaxonomy() {
      return fetch<NapkinbetsAdminTaxonomyResponse>('/api/napkinbets/admin/taxonomy')
    },
    saveAdminTaxonomyLeague(payload: SaveNapkinbetsTaxonomyLeagueInput) {
      return fetch<{ ok: true }>('/api/napkinbets/admin/taxonomy/leagues', {
        method: 'POST',
        body: payload,
      })
    },
    syncAdminTaxonomyLeague(key: string) {
      return fetch<{
        ok: true
        league: string
        resolvedSeason: string
        teamCount: number
        playerCount: number
        rosterCount: number
        venueCount: number
        warnings: string[]
      }>(`/api/napkinbets/admin/taxonomy/leagues/${encodeURIComponent(key)}/sync`, {
        method: 'POST',
      })
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
    getNotificationSettings() {
      return fetch<NapkinbetsNotificationSettingsResponse>('/api/napkinbets/settings/notifications')
    },
    updateNotificationSettings(payload: UpdateNotificationSettingsInput) {
      return fetch<{ ok: true }>('/api/napkinbets/settings/notifications', {
        method: 'PUT',
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
    getAdminWagers(params: { page: number; limit: number; search?: string }) {
      return fetch<NapkinbetsAdminWagersResponse>('/api/napkinbets/admin/wagers', {
        query: params,
      })
    },
    createAdminWager(payload: NapkinbetsAdminWagerCreateInput) {
      return fetch<{ id: string; slug: string }>('/api/napkinbets/admin/wagers', {
        method: 'POST',
        body: payload,
      })
    },
    updateAdminWager(wagerId: string, payload: NapkinbetsAdminWagerUpdateInput) {
      return fetch<{ success: boolean }>(`/api/napkinbets/admin/wagers/${wagerId}`, {
        method: 'PATCH',
        body: payload,
      })
    },
    deleteAdminWager(wagerId: string) {
      return fetch<{ success: boolean }>(`/api/napkinbets/admin/wagers/${wagerId}`, {
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
