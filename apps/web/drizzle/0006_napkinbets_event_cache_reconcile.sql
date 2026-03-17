DROP TABLE IF EXISTS `napkinbets_event_snapshots`;
DROP TABLE IF EXISTS `napkinbets_ingest_runs`;
DROP TABLE IF EXISTS `napkinbets_events`;

CREATE TABLE `napkinbets_events` (
  `id` text PRIMARY KEY NOT NULL,
  `source` text NOT NULL,
  `external_event_id` text NOT NULL,
  `sport` text NOT NULL,
  `sport_label` text NOT NULL,
  `league` text NOT NULL,
  `league_label` text NOT NULL,
  `state` text NOT NULL,
  `status` text NOT NULL,
  `short_status` text NOT NULL,
  `start_time` text NOT NULL,
  `event_title` text NOT NULL,
  `summary` text NOT NULL,
  `venue_name` text NOT NULL,
  `venue_location` text NOT NULL,
  `broadcast` text NOT NULL,
  `home_team_json` text NOT NULL,
  `away_team_json` text NOT NULL,
  `leaders_json` text NOT NULL,
  `ideas_json` text NOT NULL,
  `raw_payload_json` text,
  `source_updated_at` text,
  `last_synced_at` text NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);

CREATE TABLE `napkinbets_event_snapshots` (
  `id` text PRIMARY KEY NOT NULL,
  `event_id` text NOT NULL REFERENCES `napkinbets_events`(`id`) ON DELETE CASCADE,
  `state` text NOT NULL,
  `status` text NOT NULL,
  `short_status` text NOT NULL,
  `summary` text NOT NULL,
  `home_score` text NOT NULL,
  `away_score` text NOT NULL,
  `leaders_json` text NOT NULL,
  `captured_at` text NOT NULL
);

CREATE TABLE `napkinbets_ingest_runs` (
  `id` text PRIMARY KEY NOT NULL,
  `source` text NOT NULL,
  `sport` text NOT NULL,
  `league` text NOT NULL,
  `tier` text NOT NULL,
  `window_starts_at` text NOT NULL,
  `window_ends_at` text NOT NULL,
  `event_count` integer NOT NULL DEFAULT 0,
  `status` text NOT NULL,
  `error_message` text,
  `started_at` text NOT NULL,
  `completed_at` text
);

CREATE UNIQUE INDEX IF NOT EXISTS `napkinbets_events_source_external_idx`
  ON `napkinbets_events` (`source`, `external_event_id`);
CREATE INDEX IF NOT EXISTS `napkinbets_events_state_start_idx`
  ON `napkinbets_events` (`state`, `start_time`);
CREATE INDEX IF NOT EXISTS `napkinbets_events_sport_league_start_idx`
  ON `napkinbets_events` (`sport`, `league`, `start_time`);
CREATE INDEX IF NOT EXISTS `napkinbets_events_last_synced_idx`
  ON `napkinbets_events` (`last_synced_at`);
CREATE INDEX IF NOT EXISTS `napkinbets_event_snapshots_event_captured_idx`
  ON `napkinbets_event_snapshots` (`event_id`, `captured_at`);
CREATE INDEX IF NOT EXISTS `napkinbets_ingest_runs_source_tier_started_idx`
  ON `napkinbets_ingest_runs` (`source`, `tier`, `started_at`);

ALTER TABLE `napkinbets_settlements`
  ADD COLUMN `rejected_by_user_id` text REFERENCES `users`(`id`) ON DELETE SET NULL;

ALTER TABLE `napkinbets_settlements`
  ADD COLUMN `rejected_at` text;

ALTER TABLE `napkinbets_settlements`
  ADD COLUMN `rejection_note` text;
