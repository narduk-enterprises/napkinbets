import { relations } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { users } from '#layer/server/database/schema'

/**
 * App-specific database schema.
 *
 * Re-exports the layer's base tables (users, sessions, todos) so that
 * drizzle-kit can discover them from this workspace. Add app-specific
 * tables below the re-export.
 */
export * from '#layer/server/database/schema'

// ─── Napkinbets Prototype Tables ────────────────────────────

export const napkinbetsWagers = sqliteTable('napkinbets_wagers', {
  id: text('id').primaryKey(),
  ownerUserId: text('owner_user_id').references(() => users.id, { onDelete: 'set null' }),
  groupId: text('group_id').references(() => napkinbetsGroups.id, { onDelete: 'set null' }),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  napkinType: text('napkin_type').notNull().default('pool'),
  boardType: text('board_type').notNull().default('community-created'),
  category: text('category').notNull(),
  format: text('format').notNull(),
  sport: text('sport').default(''),
  league: text('league').default(''),
  contextKey: text('context_key').notNull().default('community'),
  customContextName: text('custom_context_name'),
  status: text('status').notNull().default('open'),
  creatorName: text('creator_name').notNull(),
  sideOptionsJson: text('side_options_json').notNull(),
  entryFeeCents: integer('entry_fee_cents').notNull().default(0),
  paymentService: text('payment_service').notNull(),
  paymentHandle: text('payment_handle'),
  terms: text('terms').notNull(),
  venueName: text('venue_name'),
  latitude: text('latitude'),
  longitude: text('longitude'),
  eventSource: text('event_source'),
  eventId: text('event_id'),
  eventTitle: text('event_title'),
  eventStartsAt: text('event_starts_at'),
  eventStatus: text('event_status'),
  eventState: text('event_state').notNull().default(''),
  homeTeamName: text('home_team_name'),
  awayTeamName: text('away_team_name'),
  homeScore: text('home_score').notNull().default(''),
  awayScore: text('away_score').notNull().default(''),
  scoringRule: text('scoring_rule').notNull().default('proportional'),
  scoringConfigJson: text('scoring_config_json').notNull().default('{}'),
  outcomeCalledAt: text('outcome_called_at'),
  outcomeReviewExpiresAt: text('outcome_review_expires_at'),
  outcomeNote: text('outcome_note'),
  disputeReason: text('dispute_reason'),
  disputedByUserId: text('disputed_by_user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

export const napkinbetsWagerLegs = sqliteTable('napkinbets_wager_legs', {
  id: text('id').primaryKey(),
  wagerId: text('wager_id')
    .notNull()
    .references(() => napkinbetsWagers.id, { onDelete: 'cascade' }),
  sortOrder: integer('sort_order').notNull().default(0),
  questionText: text('question_text').notNull(),
  legType: text('leg_type').notNull().default('categorical'),
  optionsJson: text('options_json').notNull().default('[]'),
  numericUnit: text('numeric_unit'),
  numericPrecision: integer('numeric_precision').default(0),
  outcomeStatus: text('outcome_status').notNull().default('pending'),
  outcomeOptionKey: text('outcome_option_key'),
  outcomeNumericValue: integer('outcome_numeric_value'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

export const napkinbetsFriendships = sqliteTable('napkinbets_friendships', {
  id: text('id').primaryKey(),
  requesterUserId: text('requester_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  addresseeUserId: text('addressee_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('pending'),
  respondedAt: text('responded_at'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

export const napkinbetsGroups = sqliteTable('napkinbets_groups', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  ownerUserId: text('owner_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  visibility: text('visibility').notNull().default('private'),
  joinPolicy: text('join_policy').notNull().default('invite-only'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

export const napkinbetsGroupMembers = sqliteTable('napkinbets_group_members', {
  id: text('id').primaryKey(),
  groupId: text('group_id')
    .notNull()
    .references(() => napkinbetsGroups.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('member'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

export const napkinbetsParticipants = sqliteTable('napkinbets_participants', {
  id: text('id').primaryKey(),
  wagerId: text('wager_id')
    .notNull()
    .references(() => napkinbetsWagers.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url').notNull().default(''),
  sideLabel: text('side_label'),
  joinStatus: text('join_status').notNull().default('invited'),
  draftOrder: integer('draft_order'),
  paymentStatus: text('payment_status').notNull().default('pending'),
  paymentReference: text('payment_reference'),
  outcomeAcknowledged: integer('outcome_acknowledged', { mode: 'boolean' })
    .notNull()
    .default(false),
  outcomeAcknowledgedAt: text('outcome_acknowledged_at'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

export const napkinbetsPots = sqliteTable('napkinbets_pots', {
  id: text('id').primaryKey(),
  wagerId: text('wager_id')
    .notNull()
    .references(() => napkinbetsWagers.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  amountCents: integer('amount_cents').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const napkinbetsPicks = sqliteTable('napkinbets_picks', {
  id: text('id').primaryKey(),
  wagerId: text('wager_id')
    .notNull()
    .references(() => napkinbetsWagers.id, { onDelete: 'cascade' }),
  participantId: text('participant_id')
    .notNull()
    .references(() => napkinbetsParticipants.id, { onDelete: 'cascade' }),
  pickLabel: text('pick_label').notNull(),
  pickType: text('pick_type').notNull().default('custom'),
  pickValue: text('pick_value'),
  wagerLegId: text('wager_leg_id').references(() => napkinbetsWagerLegs.id, {
    onDelete: 'set null',
  }),
  pickNumericValue: integer('pick_numeric_value'),
  confidence: integer('confidence').notNull().default(0),
  liveScore: integer('live_score').notNull().default(0),
  outcome: text('outcome').notNull().default('pending'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

export const napkinbetsNotifications = sqliteTable('napkinbets_notifications', {
  id: text('id').primaryKey(),
  wagerId: text('wager_id').references(() => napkinbetsWagers.id, { onDelete: 'cascade' }),
  targetUserId: text('target_user_id').references(() => users.id, { onDelete: 'cascade' }),
  participantId: text('participant_id').references(() => napkinbetsParticipants.id, {
    onDelete: 'set null',
  }),
  kind: text('kind').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  deliveryStatus: text('delivery_status').notNull().default('queued'),
  scheduledFor: text('scheduled_for'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  sentAt: text('sent_at'),
})

export const napkinbetsSettlements = sqliteTable('napkinbets_settlements', {
  id: text('id').primaryKey(),
  wagerId: text('wager_id')
    .notNull()
    .references(() => napkinbetsWagers.id, { onDelete: 'cascade' }),
  participantId: text('participant_id')
    .notNull()
    .references(() => napkinbetsParticipants.id, { onDelete: 'cascade' }),
  amountCents: integer('amount_cents').notNull(),
  method: text('method').notNull(),
  handle: text('handle'),
  confirmationCode: text('confirmation_code'),
  note: text('note'),
  verificationStatus: text('verification_status').notNull().default('submitted'),
  verifiedByUserId: text('verified_by_user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  verifiedAt: text('verified_at'),
  rejectedByUserId: text('rejected_by_user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  rejectedAt: text('rejected_at'),
  rejectionNote: text('rejection_note'),
  proofImageUrl: text('proof_image_url'),
  recipientAcknowledged: integer('recipient_acknowledged', { mode: 'boolean' })
    .notNull()
    .default(false),
  recipientAcknowledgedAt: text('recipient_acknowledged_at'),
  recipientUserId: text('recipient_user_id').references(() => users.id, { onDelete: 'set null' }),
  recordedAt: text('recorded_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

export const napkinbetsUserPaymentProfiles = sqliteTable('napkinbets_user_payment_profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  handle: text('handle').notNull(),
  displayLabel: text('display_label'),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  isPublicOnBoards: integer('is_public_on_boards', { mode: 'boolean' }).notNull().default(true),
  handleVerificationStatus: text('handle_verification_status').notNull().default('unverified'),
  handleVerifiedAt: text('handle_verified_at'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

export const napkinbetsAppSettings = sqliteTable('napkinbets_app_settings', {
  id: integer('id').primaryKey(),
  chatModel: text('chat_model').notNull().default('grok-3-mini'),
  aiRecommendationsEnabled: integer('ai_recommendations_enabled', { mode: 'boolean' })
    .notNull()
    .default(true),
  aiPropSuggestionsEnabled: integer('ai_prop_suggestions_enabled', { mode: 'boolean' })
    .notNull()
    .default(true),
  aiTermsAssistEnabled: integer('ai_terms_assist_enabled', { mode: 'boolean' })
    .notNull()
    .default(true),
  aiCloseoutAssistEnabled: integer('ai_closeout_assist_enabled', { mode: 'boolean' })
    .notNull()
    .default(true),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

export const napkinbetsSystemPrompts = sqliteTable('napkinbets_system_prompts', {
  name: text('name').primaryKey().notNull(),
  content: text('content').notNull(),
  description: text('description').notNull(),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

export const napkinbetsUserNotificationSettings = sqliteTable(
  'napkinbets_user_notification_settings',
  {
    userId: text('user_id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
    notifyFriendRequests: integer('notify_friend_requests', { mode: 'boolean' })
      .notNull()
      .default(true),
    notifyGroupInvites: integer('notify_group_invites', { mode: 'boolean' })
      .notNull()
      .default(true),
    notifyWagerUpdates: integer('notify_wager_updates', { mode: 'boolean' })
      .notNull()
      .default(true),
    createdAt: text('created_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text('updated_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
)

export const napkinbetsTaxonomySports = sqliteTable('napkinbets_taxonomy_sports', {
  key: text('key').primaryKey(),
  label: text('label').notNull(),
  icon: text('icon').notNull(),
  supportsEventDiscovery: integer('supports_event_discovery', { mode: 'boolean' })
    .notNull()
    .default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

export const napkinbetsTaxonomyContexts = sqliteTable('napkinbets_taxonomy_contexts', {
  key: text('key').primaryKey(),
  label: text('label').notNull(),
  description: text('description').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

export const napkinbetsTaxonomyLeagues = sqliteTable('napkinbets_taxonomy_leagues', {
  key: text('key').primaryKey(),
  label: text('label').notNull(),
  sportKey: text('sport_key')
    .notNull()
    .references(() => napkinbetsTaxonomySports.key, { onDelete: 'cascade' }),
  primaryContextKey: text('primary_context_key')
    .notNull()
    .references(() => napkinbetsTaxonomyContexts.key, { onDelete: 'cascade' }),
  contextKeysJson: text('context_keys_json').notNull(),
  provider: text('provider').notNull(),
  providerLeagueKey: text('provider_league_key'),
  entityProvider: text('entity_provider').notNull().default('manual'),
  entityProviderSportKey: text('entity_provider_sport_key'),
  entityProviderLeagueId: text('entity_provider_league_id'),
  entityProviderSeason: text('entity_provider_season'),
  entitySyncEnabled: integer('entity_sync_enabled', { mode: 'boolean' }).notNull().default(false),
  scoreSyncEnabled: integer('score_sync_enabled', { mode: 'boolean' }).notNull().default(false),
  entityLastSyncAt: text('entity_last_sync_at'),
  entityLastSyncStatus: text('entity_last_sync_status').notNull().default('idle'),
  entityLastSyncMessage: text('entity_last_sync_message'),
  entityResolvedSeason: text('entity_resolved_season'),
  scoreboardQueryParamsJson: text('scoreboard_query_params_json').notNull().default('{}'),
  eventShape: text('event_shape'),
  activeMonthsJson: text('active_months_json').notNull(),
  supportsDateWindow: integer('supports_date_window', { mode: 'boolean' }).notNull().default(true),
  supportsEventDiscovery: integer('supports_event_discovery', { mode: 'boolean' })
    .notNull()
    .default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

export const napkinbetsVenues = sqliteTable('napkinbets_venues', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  source: text('source').notNull(),
  externalVenueId: text('external_venue_id'),
  sportKey: text('sport_key').references(() => napkinbetsTaxonomySports.key, {
    onDelete: 'cascade',
  }),
  primaryLeagueKey: text('primary_league_key').references(() => napkinbetsTaxonomyLeagues.key, {
    onDelete: 'set null',
  }),
  name: text('name').notNull(),
  shortName: text('short_name').notNull().default(''),
  city: text('city').notNull().default(''),
  stateRegion: text('state_region').notNull().default(''),
  country: text('country').notNull().default(''),
  address: text('address').notNull().default(''),
  postalCode: text('postal_code').notNull().default(''),
  timezone: text('timezone').notNull().default(''),
  latitude: text('latitude').notNull().default(''),
  longitude: text('longitude').notNull().default(''),
  capacity: integer('capacity'),
  surface: text('surface').notNull().default(''),
  roofType: text('roof_type').notNull().default(''),
  imageUrl: text('image_url').notNull().default(''),
  metadataJson: text('metadata_json').notNull().default('{}'),
  rawPayloadJson: text('raw_payload_json'),
  sourceUpdatedAt: text('source_updated_at'),
  lastSyncedAt: text('last_synced_at').notNull(),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

export const napkinbetsTeams = sqliteTable('napkinbets_teams', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  source: text('source').notNull(),
  externalTeamId: text('external_team_id').notNull(),
  sportKey: text('sport_key')
    .notNull()
    .references(() => napkinbetsTaxonomySports.key, { onDelete: 'cascade' }),
  primaryLeagueKey: text('primary_league_key').references(() => napkinbetsTaxonomyLeagues.key, {
    onDelete: 'set null',
  }),
  venueId: text('venue_id').references(() => napkinbetsVenues.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  shortName: text('short_name').notNull().default(''),
  abbreviation: text('abbreviation').notNull().default(''),
  city: text('city').notNull().default(''),
  country: text('country').notNull().default(''),
  logoUrl: text('logo_url').notNull().default(''),
  isNational: integer('is_national', { mode: 'boolean' }).notNull().default(false),
  foundedYear: integer('founded_year'),
  metadataJson: text('metadata_json').notNull().default('{}'),
  rawPayloadJson: text('raw_payload_json'),
  sourceUpdatedAt: text('source_updated_at'),
  lastSyncedAt: text('last_synced_at').notNull(),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

export const napkinbetsPlayers = sqliteTable('napkinbets_players', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  source: text('source').notNull(),
  externalPlayerId: text('external_player_id').notNull(),
  sportKey: text('sport_key')
    .notNull()
    .references(() => napkinbetsTaxonomySports.key, { onDelete: 'cascade' }),
  currentTeamId: text('current_team_id').references(() => napkinbetsTeams.id, {
    onDelete: 'set null',
  }),
  currentLeagueKey: text('current_league_key').references(() => napkinbetsTaxonomyLeagues.key, {
    onDelete: 'set null',
  }),
  displayName: text('display_name').notNull(),
  firstName: text('first_name').notNull().default(''),
  lastName: text('last_name').notNull().default(''),
  shortName: text('short_name').notNull().default(''),
  position: text('position').notNull().default(''),
  groupLabel: text('group_label').notNull().default(''),
  jerseyNumber: text('jersey_number').notNull().default(''),
  nationality: text('nationality').notNull().default(''),
  age: integer('age'),
  birthDate: text('birth_date'),
  height: text('height').notNull().default(''),
  weight: text('weight').notNull().default(''),
  imageUrl: text('image_url').notNull().default(''),
  metadataJson: text('metadata_json').notNull().default('{}'),
  rawPayloadJson: text('raw_payload_json'),
  sourceUpdatedAt: text('source_updated_at'),
  lastSyncedAt: text('last_synced_at').notNull(),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

export const napkinbetsTeamRosters = sqliteTable('napkinbets_team_rosters', {
  id: text('id').primaryKey(),
  leagueKey: text('league_key').references(() => napkinbetsTaxonomyLeagues.key, {
    onDelete: 'set null',
  }),
  teamId: text('team_id')
    .notNull()
    .references(() => napkinbetsTeams.id, { onDelete: 'cascade' }),
  playerId: text('player_id')
    .notNull()
    .references(() => napkinbetsPlayers.id, { onDelete: 'cascade' }),
  season: text('season').notNull(),
  jerseyNumber: text('jersey_number').notNull().default(''),
  position: text('position').notNull().default(''),
  status: text('status').notNull().default('active'),
  sortOrder: integer('sort_order').notNull().default(0),
  metadataJson: text('metadata_json').notNull().default('{}'),
  rawPayloadJson: text('raw_payload_json'),
  sourceUpdatedAt: text('source_updated_at'),
  lastSyncedAt: text('last_synced_at').notNull(),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

export const napkinbetsEvents = sqliteTable('napkinbets_events', {
  id: text('id').primaryKey(),
  source: text('source').notNull(),
  externalEventId: text('external_event_id').notNull(),
  sport: text('sport').notNull(),
  sportLabel: text('sport_label').notNull(),
  contextKey: text('context_key').notNull().default('community'),
  contextLabel: text('context_label').notNull().default('Community'),
  league: text('league').notNull(),
  leagueLabel: text('league_label').notNull(),
  state: text('state').notNull(),
  status: text('status').notNull(),
  shortStatus: text('short_status').notNull(),
  startTime: text('start_time').notNull(),
  eventTitle: text('event_title').notNull(),
  summary: text('summary').notNull(),
  venueName: text('venue_name').notNull(),
  venueLocation: text('venue_location').notNull(),
  venueId: text('venue_id').references(() => napkinbetsVenues.id, { onDelete: 'set null' }),
  broadcast: text('broadcast').notNull(),
  homeTeamId: text('home_team_id').references(() => napkinbetsTeams.id, { onDelete: 'set null' }),
  awayTeamId: text('away_team_id').references(() => napkinbetsTeams.id, { onDelete: 'set null' }),
  homeTeamJson: text('home_team_json').notNull(),
  awayTeamJson: text('away_team_json').notNull(),
  leadersJson: text('leaders_json').notNull(),
  ideasJson: text('ideas_json').notNull(),
  homeScore: text('home_score').notNull().default(''),
  awayScore: text('away_score').notNull().default(''),
  rawPayloadJson: text('raw_payload_json'),
  sourceUpdatedAt: text('source_updated_at'),
  importanceScore: integer('importance_score').notNull().default(0),
  importanceReason: text('importance_reason').notNull().default(''),
  importanceScoredAt: text('importance_scored_at'),
  lastSyncedAt: text('last_synced_at').notNull(),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

export const napkinbetsEventSnapshots = sqliteTable('napkinbets_event_snapshots', {
  id: text('id').primaryKey(),
  eventId: text('event_id')
    .notNull()
    .references(() => napkinbetsEvents.id, { onDelete: 'cascade' }),
  state: text('state').notNull(),
  status: text('status').notNull(),
  shortStatus: text('short_status').notNull(),
  summary: text('summary').notNull(),
  homeScore: text('home_score').notNull(),
  awayScore: text('away_score').notNull(),
  leadersJson: text('leaders_json').notNull(),
  capturedAt: text('captured_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

export const napkinbetsIngestRuns = sqliteTable('napkinbets_ingest_runs', {
  id: text('id').primaryKey(),
  source: text('source').notNull(),
  sport: text('sport').notNull(),
  league: text('league').notNull(),
  tier: text('tier').notNull(),
  windowStartsAt: text('window_starts_at').notNull(),
  windowEndsAt: text('window_ends_at').notNull(),
  eventCount: integer('event_count').notNull().default(0),
  status: text('status').notNull(),
  errorMessage: text('error_message'),
  startedAt: text('started_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  completedAt: text('completed_at'),
})

export const napkinbetsEventOdds = sqliteTable('napkinbets_event_odds', {
  id: text('id').primaryKey(),
  eventId: text('event_id')
    .notNull()
    .references(() => napkinbetsEvents.id, { onDelete: 'cascade' }),
  source: text('source').notNull().default('polymarket'),
  polymarketEventSlug: text('polymarket_event_slug'),
  polymarketUrl: text('polymarket_url'),
  moneylineJson: text('moneyline_json'),
  spreadJson: text('spread_json'),
  totalJson: text('total_json'),
  extraMarketsJson: text('extra_markets_json').notNull().default('[]'),
  volume: integer('volume'),
  priceChange24h: integer('price_change_24h'),
  commentCount: integer('comment_count'),
  fetchedAt: text('fetched_at').notNull(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

// ─── Featured Bets ─────────────────────────────────────────

export const napkinbetsFeaturedBets = sqliteTable('napkinbets_featured_bets', {
  id: text('id').primaryKey(),
  label: text('label').notNull(),
  title: text('title').notNull(),
  subtitle: text('subtitle').notNull().default(''),
  summary: text('summary').notNull().default(''),
  windowLabel: text('window_label').notNull().default(''),
  venueLabel: text('venue_label').notNull().default(''),
  accent: text('accent').notNull().default('tour'),
  imageUrl: text('image_url').notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  prefillJson: text('prefill_json').notNull().default('{}'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

export const napkinbetsWagersRelations = relations(napkinbetsWagers, ({ many }) => ({
  participants: many(napkinbetsParticipants),
  legs: many(napkinbetsWagerLegs),
}))

export const napkinbetsWagerLegsRelations = relations(napkinbetsWagerLegs, ({ one }) => ({
  wager: one(napkinbetsWagers, {
    fields: [napkinbetsWagerLegs.wagerId],
    references: [napkinbetsWagers.id],
  }),
}))

export const napkinbetsParticipantsRelations = relations(napkinbetsParticipants, ({ one }) => ({
  wager: one(napkinbetsWagers, {
    fields: [napkinbetsParticipants.wagerId],
    references: [napkinbetsWagers.id],
  }),
  user: one(users, {
    fields: [napkinbetsParticipants.userId],
    references: [users.id],
  }),
}))
