export interface NapkinbetsMetric {
  label: string
  value: string
  hint: string
  icon: string
}

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
  recordedAt: string
}

export interface NapkinbetsPaymentProfile {
  id: string
  provider: string
  handle: string
  displayLabel: string | null
  isDefault: boolean
  isPublicOnBoards: boolean
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

export interface NapkinbetsWager {
  id: string
  ownerUserId: string | null
  slug: string
  title: string
  description: string
  category: string
  format: string
  sport: string
  league: string
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
  homeTeamName: string
  awayTeamName: string
  participants: NapkinbetsParticipant[]
  pots: NapkinbetsPot[]
  picks: NapkinbetsPick[]
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
  homeAway: 'home' | 'away'
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

export interface NapkinbetsEventCard {
  id: string
  source: 'espn'
  sport: string
  sportLabel: string
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
  filters: NapkinbetsDiscoverFilters
  propIdeas: NapkinbetsPropIdea[]
  refreshedAt: string
  stale: boolean
}

export interface NapkinbetsWorkspaceResponse {
  metrics: NapkinbetsMetric[]
  ownedWagers: NapkinbetsWager[]
  joinedWagers: NapkinbetsWager[]
  reminders: NapkinbetsNotification[]
  refreshedAt: string
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
  ingestRuns: NapkinbetsIngestRun[]
  aiSettings: NapkinbetsAiSettings
  refreshedAt: string
}

export interface NapkinbetsAiSettings {
  aiRecommendationsEnabled: boolean
  aiPropSuggestionsEnabled: boolean
  aiTermsAssistEnabled: boolean
  aiCloseoutAssistEnabled: boolean
  xaiConfigured: boolean
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

export interface NapkinbetsPaymentProfilesResponse {
  profiles: NapkinbetsPaymentProfile[]
}

export interface NapkinbetsDashboardResponse {
  concept: NapkinbetsConcept
  metrics: NapkinbetsMetric[]
  liveGames: NapkinbetsLiveGame[]
  weather: NapkinbetsWeatherSnapshot[]
  wagers: NapkinbetsWager[]
  refreshedAt: string
}

export interface CreateWagerInput {
  title: string
  creatorName: string
  description: string
  format: string
  sport: string
  league: string
  sideOptions: string
  participantNames: string
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
