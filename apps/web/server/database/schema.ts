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
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  format: text('format').notNull(),
  sport: text('sport').default(''),
  league: text('league').default(''),
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
  homeTeamName: text('home_team_name'),
  awayTeamName: text('away_team_name'),
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
  sideLabel: text('side_label'),
  joinStatus: text('join_status').notNull().default('invited'),
  draftOrder: integer('draft_order'),
  paymentStatus: text('payment_status').notNull().default('pending'),
  paymentReference: text('payment_reference'),
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
  wagerId: text('wager_id')
    .notNull()
    .references(() => napkinbetsWagers.id, { onDelete: 'cascade' }),
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
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

export const napkinbetsAppSettings = sqliteTable('napkinbets_app_settings', {
  id: integer('id').primaryKey(),
  aiRecommendationsEnabled: integer('ai_recommendations_enabled', { mode: 'boolean' })
    .notNull()
    .default(false),
  aiPropSuggestionsEnabled: integer('ai_prop_suggestions_enabled', { mode: 'boolean' })
    .notNull()
    .default(false),
  aiTermsAssistEnabled: integer('ai_terms_assist_enabled', { mode: 'boolean' })
    .notNull()
    .default(false),
  aiCloseoutAssistEnabled: integer('ai_closeout_assist_enabled', { mode: 'boolean' })
    .notNull()
    .default(false),
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
  broadcast: text('broadcast').notNull(),
  homeTeamJson: text('home_team_json').notNull(),
  awayTeamJson: text('away_team_json').notNull(),
  leadersJson: text('leaders_json').notNull(),
  ideasJson: text('ideas_json').notNull(),
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
