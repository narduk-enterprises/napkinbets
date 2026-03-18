export interface NapkinbetsMetric {
  label: string
  value: string
  hint: string
  icon: string
}

export type NapkinbetsBoardType = 'event-backed' | 'manual-curated' | 'community-created'
export type NapkinbetsNapkinType = 'simple-bet' | 'pool'
export type NapkinbetsWagerStatus =
  | 'open'
  | 'locked'
  | 'live'
  | 'settling'
  | 'settled'
  | 'closed'
  | 'archived'
export type NapkinbetsJoinStatus = 'invited' | 'accepted'
export type NapkinbetsPaymentStatus = 'pending' | 'submitted' | 'confirmed'
export type NapkinbetsPickOutcome = 'pending' | 'winning' | 'won' | 'lost' | 'push'
export type NapkinbetsSettlementVerification = 'submitted' | 'confirmed' | 'rejected'
export type NapkinbetsScoringRule =
  | 'proportional'
  | 'most-correct'
  | 'parlay'
  | 'closest'
  | 'price-is-right'
export type NapkinbetsLegType = 'categorical' | 'numeric'
export type NapkinbetsLegOutcomeStatus = 'pending' | 'settled' | 'voided'

export interface NapkinbetsConcept {
  summary: string
  featureRequirements: string[]
  architectureSuggestions: string[]
  implementationPlan: string[]
  compliance: string[]
}

export interface NapkinbetsLiveGame {
  id: string
  name: string
  shortName: string
  status: string
  sport: string
  league: string
  competitors: Array<{
    name: string
    abbreviation: string
    score: string
    homeAway: string
  }>
}

export interface NapkinbetsWeatherSnapshot {
  location: string
  forecastTime: string
  temperatureF: number
  feelsLikeF: number
  windMph: number
  highF: number | null
  lowF: number | null
  conditions: string
}

export interface NapkinbetsParticipant {
  id: string
  userId: string | null
  displayName: string
  avatarUrl: string
  sideLabel: string | null
  joinStatus: string
  draftOrder: number | null
  paymentStatus: string
  paymentReference: string | null
}

export interface NapkinbetsPot {
  id: string
  label: string
  amountCents: number
  sortOrder: number
}

export interface NapkinbetsPick {
  id: string
  participantId: string
  pickLabel: string
  pickType: string
  pickValue: string | null
  wagerLegId: string | null
  pickNumericValue: number | null
  confidence: number
  liveScore: number
  outcome: string
}

export interface NapkinbetsNotification {
  id: string
  title: string
  body: string
  kind: string
  deliveryStatus: string
  createdAt: string
}

export interface NapkinbetsSettlement {
  id: string
  participantId: string
  amountCents: number
  method: string
  handle: string | null
  confirmationCode: string | null
  note: string | null
  verificationStatus: string
  verifiedByUserId: string | null
  verifiedAt: string | null
  rejectedByUserId: string | null
  rejectedAt: string | null
  rejectionNote: string | null
  proofImageUrl: string | null
  recipientAcknowledged: boolean
  recipientAcknowledgedAt: string | null
  recipientUserId: string | null
  recordedAt: string
}

export interface NapkinbetsPaymentProfile {
  id: string
  provider: string
  handle: string
  displayLabel: string | null
  isDefault: boolean
  isPublicOnBoards: boolean
  handleVerificationStatus: 'unverified' | 'verified' | 'failed'
  handleVerifiedAt: string | null
}

export interface NapkinbetsLeaderboardRow {
  participantId: string
  displayName: string
  sideLabel: string
  draftOrder: number | null
  score: number
  pickCount: number
  projectedPayoutCents: number
  confirmedSettlementCents: number
}

export interface NapkinbetsWagerLeg {
  id: string
  sortOrder: number
  questionText: string
  legType: NapkinbetsLegType
  options: string[]
  numericUnit: string | null
  numericPrecision: number
  outcomeStatus: NapkinbetsLegOutcomeStatus
  outcomeOptionKey: string | null
  outcomeNumericValue: number | null
}

export interface NapkinbetsWager {
  id: string
  ownerUserId: string | null
  groupId: string | null
  groupName: string
  slug: string
  title: string
  description: string
  napkinType: NapkinbetsNapkinType
  boardType: NapkinbetsBoardType
  category: string
  format: string
  sport: string
  league: string
  contextKey: string
  customContextName: string
  status: string
  creatorName: string
  sideOptions: string[]
  entryFeeCents: number
  paymentService: string
  paymentHandle: string
  terms: string
  venueName: string
  eventSource: string
  eventId: string
  eventTitle: string
  eventStartsAt: string
  eventStatus: string
  eventState: string
  homeScore: string
  awayScore: string
  homeTeamName: string
  awayTeamName: string
  homeTeamLogo: string
  awayTeamLogo: string
  scoringRule: NapkinbetsScoringRule
  participants: NapkinbetsParticipant[]
  pots: NapkinbetsPot[]
  picks: NapkinbetsPick[]
  legs: NapkinbetsWagerLeg[]
  notifications: NapkinbetsNotification[]
  settlements: NapkinbetsSettlement[]
  leaderboard: NapkinbetsLeaderboardRow[]
  liveGames: NapkinbetsLiveGame[]
  weather: NapkinbetsWeatherSnapshot | null
  totalPotCents: number
}

export interface NapkinbetsEventTeam {
  id: string
  name: string
  shortName: string
  abbreviation: string
  logo: string
  homeAway: string
  score: string
  record: string
  winner: boolean
}

export interface NapkinbetsEventLeader {
  label: string
  athlete: string
  value: string
}

export interface NapkinbetsEventIdea {
  title: string
  description: string
  sideOptions: string[]
  format: string
}

export interface NapkinbetsEventOddsSide {
  label: string
  probability: number | null
}

export interface NapkinbetsEventOddsMarket {
  label: string
  detail: string | null
  left: NapkinbetsEventOddsSide
  right: NapkinbetsEventOddsSide
}

export interface NapkinbetsEventOdds {
  source: 'polymarket'
  url: string
  updatedAt: string
  moneyline: NapkinbetsEventOddsMarket | null
  spread: NapkinbetsEventOddsMarket | null
  total: NapkinbetsEventOddsMarket | null
  extraMarkets: NapkinbetsEventOddsMarket[]
  volume: number | null
  priceChange24h: number | null
  commentCount: number | null
}

export interface NapkinbetsEventDetail {
  id: string
  source: string
  sport: string
  sportLabel: string
  contextKey: string
  contextLabel: string
  league: string
  leagueLabel: string
  eventTitle: string
  summary: string
  status: string
  state: 'pre' | 'in' | 'post'
  shortStatus: string
  startTime: string
  venueName: string
  venueLocation: string
  broadcast: string
  homeTeam: NapkinbetsEventTeam
  awayTeam: NapkinbetsEventTeam
  leaders: NapkinbetsEventLeader[]
  ideas: NapkinbetsEventIdea[]
  lastSyncedAt: string
  sourceUpdatedAt?: string | null
  homeTeamProfileSlug?: string | null
  awayTeamProfileSlug?: string | null
  venueProfileSlug?: string | null
  leagueProfileKey?: string | null
  odds: NapkinbetsEventOdds | null
}

export interface NapkinbetsEventDetailResponse {
  event: NapkinbetsEventDetail | null
}

export interface NapkinbetsCreatePrefillQuery {
  source: string
  eventId: string
  eventTitle: string
  eventStartsAt: string
  eventStatus: string
  sport: string
  contextKey: string
  league: string
  venueName: string
  homeTeamName: string
  awayTeamName: string
  format: string
  sideOptions: string[]
}

export interface NapkinbetsSpotlightAsset {
  kind: 'editorial' | 'mark' | 'logo' | 'headshot'
  src: string
  alt: string
}

export interface NapkinbetsDiscoverySpotlight {
  id: string
  label: string
  title: string
  subtitle: string
  summary: string
  windowLabel: string
  venueLabel: string
  accent: 'major' | 'tour' | 'watch'
  assets: NapkinbetsSpotlightAsset[]
  prefill: NapkinbetsCreatePrefillQuery
}

export interface NapkinbetsEventCard {
  id: string
  source: 'espn' | 'curated'
  sport: string
  sportLabel: string
  contextKey: string
  contextLabel: string
  league: string
  leagueLabel: string
  eventTitle: string
  status: string
  state: 'pre' | 'in' | 'post'
  shortStatus: string
  startTime: string
  venueName: string
  venueLocation: string
  broadcast: string
  summary: string
  homeTeam: NapkinbetsEventTeam
  awayTeam: NapkinbetsEventTeam
  leaders: NapkinbetsEventLeader[]
  ideas: NapkinbetsEventIdea[]
  lastSyncedAt: string
  odds?: NapkinbetsEventOdds | null
}

export interface NapkinbetsDiscoverySection {
  key: 'live-now' | 'starting-soon' | 'today' | 'next-up'
  label: string
  description: string
  events: NapkinbetsEventCard[]
}

export interface NapkinbetsDiscoverFilterOption {
  value: string
  label: string
}

export interface NapkinbetsDiscoverFilters {
  sports: NapkinbetsDiscoverFilterOption[]
  contexts: NapkinbetsDiscoverFilterOption[]
  leagues: NapkinbetsDiscoverFilterOption[]
  states: NapkinbetsDiscoverFilterOption[]
}

export interface NapkinbetsPropIdea {
  id: string
  category: string
  title: string
  context: string
  summary: string
  examples: string[]
  settlementHint: string
}

export interface NapkinbetsDiscoveryResponse {
  sections: NapkinbetsDiscoverySection[]
  spotlights: NapkinbetsDiscoverySpotlight[]
  filters: NapkinbetsDiscoverFilters
  propIdeas: NapkinbetsPropIdea[]
  refreshedAt: string
  stale: boolean
}

export interface NapkinbetsWorkspaceResponse {
  metrics: NapkinbetsMetric[]
  ownedWagers: NapkinbetsWager[]
  joinedWagers: NapkinbetsWager[]
  invitedWagers: NapkinbetsWager[]
  reminders: NapkinbetsNotification[]
  refreshedAt: string
}

export interface NapkinbetsUserNotification {
  id: string
  wagerId: string
  wagerTitle: string
  wagerSlug: string
  title: string
  body: string
  kind: string
  deliveryStatus: string
  createdAt: string
}

export interface NapkinbetsNotificationsResponse {
  notifications: NapkinbetsUserNotification[]
  unreadCount: number
}

export interface NapkinbetsNotificationSettingsResponse {
  notifyFriendRequests: boolean
  notifyGroupInvites: boolean
  notifyWagerUpdates: boolean
}

export interface UpdateNotificationSettingsInput {
  notifyFriendRequests: boolean
  notifyGroupInvites: boolean
  notifyWagerUpdates: boolean
}

export interface NapkinbetsProfileResponse {
  id: string
  email: string
  name: string
  avatarUrl: string
}

export interface UpdateProfileInput {
  name?: string
  avatarUrl?: string
}

export interface NapkinbetsWagerResponse {
  wager: NapkinbetsWager | null
  refreshedAt: string
}

export interface NapkinbetsAdminUser {
  id: string
  email: string
  name: string | null
  isAdmin: boolean
  createdAt: string
  ownedWagerCount: number
  joinedWagerCount: number
}

export interface NapkinbetsAdminWager {
  id: string
  slug: string
  title: string
  status: string
  creatorName: string
  ownerUserId: string | null
  ownerEmail: string | null
  league: string
  eventTitle: string
  participantCount: number
  openSettlementCount: number
  createdAt: string
}

export interface NapkinbetsAdminResponse {
  metrics: NapkinbetsMetric[]
  users: NapkinbetsAdminUser[]
  wagers: NapkinbetsAdminWager[]
  totalCachedEvents: number
  featuredBetCount: number
  ingestRuns: NapkinbetsIngestRun[]
  tierSummaries: Record<string, NapkinbetsIngestTierSummary>
  aiSettings: NapkinbetsAiSettings
  refreshedAt: string
}

export interface NapkinbetsAiSettings {
  chatModel: string
  aiRecommendationsEnabled: boolean
  aiPropSuggestionsEnabled: boolean
  aiTermsAssistEnabled: boolean
  aiCloseoutAssistEnabled: boolean
  xaiConfigured: boolean
  theSportsDbConfigured: boolean
}

export interface NapkinbetsIngestRun {
  id: string
  source: string
  sport: string
  league: string
  tier: string
  status: string
  eventCount: number
  errorMessage: string | null
  startedAt: string
  completedAt: string | null
}

export interface NapkinbetsIngestTierSummary {
  tier: string
  lastRunAt: string | null
  lastStatus: string | null
  lastEventCount: number
  totalRunsLast24h: number
}

export interface NapkinbetsPaymentProfilesResponse {
  profiles: NapkinbetsPaymentProfile[]
}

export interface NapkinbetsFriend {
  id: string
  friendshipId: string
  displayName: string
  email: string
  createdAt: string
}

export interface NapkinbetsFriendRequest {
  id: string
  friendshipId: string
  displayName: string
  email: string
  createdAt: string
}

export interface NapkinbetsFriendSearchResult {
  id: string
  displayName: string
  email: string
}

export interface NapkinbetsFriendsResponse {
  friends: NapkinbetsFriend[]
  incomingRequests: NapkinbetsFriendRequest[]
  outgoingRequests: NapkinbetsFriendRequest[]
}

export interface NapkinbetsFriendSearchResponse {
  results: NapkinbetsFriendSearchResult[]
}

export interface NapkinbetsGroup {
  id: string
  slug: string
  name: string
  description: string
  visibility: 'public' | 'private'
  joinPolicy: 'open' | 'invite-only' | 'closed'
  memberCount: number
  ownerName: string
  userRole: 'owner' | 'admin' | 'member' | null
  joinedAt: string | null
}

export interface NapkinbetsGroupsResponse {
  groups: NapkinbetsGroup[]
  myGroups: NapkinbetsGroup[]
}

export interface CreateNapkinbetsGroupInput {
  name: string
  description: string
  visibility: 'public' | 'private'
  joinPolicy: 'open' | 'invite-only' | 'closed'
}

export interface NapkinbetsDashboardResponse {
  concept: NapkinbetsConcept
  metrics: NapkinbetsMetric[]
  liveGames: NapkinbetsLiveGame[]
  weather: NapkinbetsWeatherSnapshot[]
  wagers: NapkinbetsWager[]
  refreshedAt: string
}

export interface NapkinbetsTaxonomySport {
  value: string
  label: string
  icon: string
  supportsEventDiscovery: boolean
}

export interface NapkinbetsTaxonomyContext {
  value: string
  label: string
  description: string
}

export interface NapkinbetsTaxonomyLeague {
  value: string
  label: string
  sport: string
  contextKey: string
  contextKeys: string[]
  supportsEventDiscovery: boolean
}

export interface NapkinbetsAdminTaxonomySport {
  key: string
  label: string
  icon: string
  supportsEventDiscovery: boolean
}

export interface NapkinbetsAdminTaxonomyContext {
  key: string
  label: string
  description: string
}

export interface NapkinbetsAdminTaxonomyLeague {
  key: string
  label: string
  sportKey: string
  sportLabel?: string
  primaryContextKey: string
  primaryContextLabel?: string
  contextKeys: string[]
  provider: 'espn' | 'manual'
  providerLeagueKey?: string
  entityProvider?: 'manual' | 'api-sports'
  entityProviderSportKey?: 'american-football' | 'baseball' | 'basketball' | 'football' | 'hockey'
  entityProviderLeagueId?: string
  entityProviderSeason?: string
  entitySyncEnabled?: boolean
  scoreSyncEnabled?: boolean
  entityLastSyncAt?: string | null
  entityLastSyncStatus?: 'idle' | 'success' | 'error' | 'partial'
  entityLastSyncMessage?: string | null
  entityResolvedSeason?: string | null
  scoreboardQueryParams?: Record<string, string>
  eventShape?: 'head-to-head' | 'tournament'
  activeMonths: number[]
  supportsDateWindow?: boolean
  supportsEventDiscovery: boolean
  sortOrder?: number
  isActive?: boolean
}

export interface NapkinbetsAdminTaxonomyResponse {
  sports: NapkinbetsAdminTaxonomySport[]
  contexts: NapkinbetsAdminTaxonomyContext[]
  leagues: NapkinbetsAdminTaxonomyLeague[]
  entityCounts: {
    teams: number
    players: number
    venues: number
    rosters: number
  }
}

export interface NapkinbetsAdminTaxonomySyncResponse {
  ok: true
  league: string
  resolvedSeason: string
  teamCount: number
  playerCount: number
  rosterCount: number
  rosterTeamsSynced: number
  remainingRosterTeams: number
  teamsRefreshed: boolean
  venueCount: number
  warnings: string[]
}

export interface NapkinbetsAdminLeagueViewerResponse {
  league: NapkinbetsAdminTaxonomyLeague
  entityCounts: {
    teams: number
    players: number
    venues: number
    rosters: number
  }
  teams: Array<{
    id: string
    slug: string
    name: string
    abbreviation: string | null
    city: string | null
    logoUrl: string | null
  }>
}

export interface SaveNapkinbetsTaxonomyLeagueInput {
  key: string
  label: string
  sportKey: string
  primaryContextKey: string
  contextKeys: string[]
  provider: 'espn' | 'manual'
  providerLeagueKey?: string
  entityProvider?: 'manual' | 'api-sports'
  entityProviderSportKey?: 'american-football' | 'baseball' | 'basketball' | 'football' | 'hockey'
  entityProviderLeagueId?: string
  entityProviderSeason?: string
  entitySyncEnabled?: boolean
  scoreSyncEnabled?: boolean
  scoreboardQueryParams?: Record<string, string>
  eventShape?: 'head-to-head' | 'tournament' | null
  activeMonths: number[]
  supportsDateWindow?: boolean
  supportsEventDiscovery?: boolean
  sortOrder?: number
  isActive?: boolean
}

export interface NapkinbetsScoreEventSummary {
  id: string
  leagueKey: string
  leagueLabel: string
  eventTitle: string
  startTime: string
  state: 'pre' | 'in' | 'post'
  status: string
  venueName: string
  venueLocation: string
  homeTeam: {
    name: string
    score: string
  }
  awayTeam: {
    name: string
    score: string
  }
}

export interface NapkinbetsLeagueProfileResponse {
  league: NapkinbetsAdminTaxonomyLeague
  teams: Array<{
    id: string
    slug: string
    name: string
    abbreviation: string
    city: string
    logoUrl: string
  }>
  recentEvents: NapkinbetsScoreEventSummary[]
}

export interface NapkinbetsTeamProfileResponse {
  team: {
    id: string
    slug: string
    source: string
    externalTeamId: string
    sportKey: string
    primaryLeagueKey: string | null
    venueId: string | null
    name: string
    shortName: string
    abbreviation: string
    city: string
    country: string
    logoUrl: string
    isNational: boolean
    foundedYear: number | null
    metadataJson: string
    rawPayloadJson: string | null
    sourceUpdatedAt: string | null
    lastSyncedAt: string
    createdAt: string
    updatedAt: string
    venue: {
      id: string
      slug: string
      name: string
      city: string
      stateRegion: string
      country: string
      capacity: number | null
    } | null
  }
  rosterSeason: string
  roster: Array<{
    id: string
    slug: string
    displayName: string
    position: string
    jerseyNumber: string
    imageUrl: string
    nationality: string
  }>
  recentEvents: NapkinbetsScoreEventSummary[]
}

export interface NapkinbetsPlayerProfileResponse {
  player: {
    id: string
    slug: string
    source: string
    externalPlayerId: string
    sportKey: string
    currentTeamId: string | null
    currentLeagueKey: string | null
    displayName: string
    firstName: string
    lastName: string
    shortName: string
    position: string
    groupLabel: string
    jerseyNumber: string
    nationality: string
    age: number | null
    birthDate: string | null
    height: string
    weight: string
    imageUrl: string
    metadataJson: string
    rawPayloadJson: string | null
    sourceUpdatedAt: string | null
    lastSyncedAt: string
    createdAt: string
    updatedAt: string
  }
  rosterHistory: Array<{
    season: string
    team: {
      id: string
      slug: string
      name: string
      logoUrl: string
    } | null
    position: string
    jerseyNumber: string
    status: string
  }>
  recentEvents: NapkinbetsScoreEventSummary[]
}

export interface NapkinbetsVenueProfileResponse {
  venue: {
    id: string
    slug: string
    source: string
    externalVenueId: string | null
    sportKey: string | null
    primaryLeagueKey: string | null
    name: string
    shortName: string
    city: string
    stateRegion: string
    country: string
    address: string
    postalCode: string
    timezone: string
    latitude: string
    longitude: string
    capacity: number | null
    surface: string
    roofType: string
    imageUrl: string
    metadataJson: string
    rawPayloadJson: string | null
    sourceUpdatedAt: string | null
    lastSyncedAt: string
    createdAt: string
    updatedAt: string
  }
  teams: Array<{
    id: string
    slug: string
    name: string
    logoUrl: string
  }>
  recentEvents: NapkinbetsScoreEventSummary[]
}

export interface NapkinbetsTaxonomyResponse {
  sports: NapkinbetsTaxonomySport[]
  contexts: NapkinbetsTaxonomyContext[]
  leagues: NapkinbetsTaxonomyLeague[]
}

export interface CreateWagerInput {
  title: string
  creatorName: string
  description: string
  napkinType: NapkinbetsNapkinType
  boardType: NapkinbetsBoardType
  format: string
  sport: string
  league: string
  contextKey: string
  customContextName: string
  groupId: string
  sideOptions: string
  participantNames: string
  participantSeeds?: Array<{
    displayName: string
    userId?: string | null
  }>
  shuffleParticipants?: boolean
  potRules: string
  entryFeeDollars: number
  paymentService: string
  paymentHandle: string
  venueName: string
  latitude: string
  longitude: string
  terms: string
  eventSource?: string
  eventId?: string
  eventTitle?: string
  eventStartsAt?: string
  eventStatus?: string
  homeTeamName?: string
  awayTeamName?: string
  scoringRule?: NapkinbetsScoringRule
  legs?: Array<{
    questionText: string
    legType: NapkinbetsLegType
    options?: string[]
    numericUnit?: string
    numericPrecision?: number
  }>
}

export interface JoinWagerInput {
  displayName: string
  sideLabel: string
}

export interface WagerPickInput {
  participantName: string
  pickLabel: string
  pickType: string
  pickValue: string
  confidence: number
}

export interface WagerSettlementInput {
  participantId?: string
  participantName: string
  amountDollars: number
  method: string
  handle: string
  confirmationCode: string
  note: string
  proofImage?: File | null
}

export interface WagerSettlementReviewInput {
  note: string
}

export interface CreatePaymentProfileInput {
  provider: string
  handle: string
  displayLabel: string
  isDefault: boolean
  isPublicOnBoards: boolean
}

export interface NapkinbetsAiTermsInput {
  title: string
  description: string
  format: string
  paymentService: string
  terms: string
}

export interface NapkinbetsAiCloseoutSummaryInput {
  title: string
  paymentService: string
  pendingCount: number
  submittedCount: number
  confirmedCount: number
  rejectedCount: number
  leaderboard: Array<{
    displayName: string
    projectedPayoutCents: number
    score: number
  }>
}

export interface UpdateNapkinbetsAiSettingsInput {
  aiRecommendationsEnabled: boolean
  aiPropSuggestionsEnabled: boolean
  aiTermsAssistEnabled: boolean
  aiCloseoutAssistEnabled: boolean
}

export interface NapkinbetsAdminFeaturedBet {
  id: string
  label: string
  title: string
  subtitle: string
  summary: string
  windowLabel: string
  venueLabel: string
  accent: string
  imageUrl: string
  sortOrder: number
  isActive: boolean
  prefillJson: string
  createdAt: string
  updatedAt: string
}

export interface NapkinbetsAdminFeaturedBetsResponse {
  featuredBets: NapkinbetsAdminFeaturedBet[]
}

export interface SaveFeaturedBetInput {
  id?: string
  label: string
  title: string
  subtitle?: string
  summary?: string
  windowLabel?: string
  venueLabel?: string
  accent?: 'major' | 'tour' | 'watch'
  imageUrl?: string
  sortOrder?: number
  isActive?: boolean
  prefillJson?: string
}

export interface NapkinbetsAdminWagersResponse {
  wagers: NapkinbetsAdminWager[]
  total: number
}

export interface NapkinbetsAdminWagerCreateInput {
  title: string
  description: string
  status: NapkinbetsWagerStatus
  league: string
  eventTitle: string
  slug?: string
}

export interface NapkinbetsAdminWagerUpdateInput {
  title?: string
  description?: string
  status?: NapkinbetsWagerStatus
  league?: string
  eventTitle?: string
  slug?: string
}

// ─── Payment Reconciliation Ledger ──────────────────────────────────

export interface NapkinbetsLedgerWagerEntry {
  wagerId: string
  wagerSlug: string
  wagerTitle: string
  amountCents: number
  paymentStatus: string
  settlementId: string | null
  verificationStatus: string | null
  method: string | null
}

export interface NapkinbetsLedgerCounterparty {
  userId: string
  displayName: string
  avatarUrl: string
  netBalanceCents: number
  wagerEntries: NapkinbetsLedgerWagerEntry[]
  preferredPaymentMethod: string | null
  preferredPaymentHandle: string | null
}

export interface NapkinbetsLedgerResponse {
  counterparties: NapkinbetsLedgerCounterparty[]
  totalOwedCents: number
  totalOwedToYouCents: number
  refreshedAt: string
}

// ─── AI Napkin Generator ─────────────────────────────────────

export interface NapkinbetsGeneratedNapkin {
  title: string
  description: string
  category: string
  format: string
  sideOptions: string[]
  terms: string
  legs: Array<{
    questionText: string
    legType: 'categorical' | 'numeric'
    options: string[]
    numericUnit: string | null
  }>
  message: string
}

// ─── Admin AI Model & System Prompts ─────────────────────────

export interface NapkinbetsAdminAiModelSettingsResponse {
  currentModel: string
  chatModels: string[]
  preferredChatModel: string | null
}

export interface NapkinbetsSystemPromptEntry {
  name: string
  content: string
  description: string
  updatedAt: string
}
