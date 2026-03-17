ALTER TABLE `napkinbets_taxonomy_leagues`
  ADD COLUMN `entity_provider` text NOT NULL DEFAULT 'manual';
ALTER TABLE `napkinbets_taxonomy_leagues`
  ADD COLUMN `entity_provider_sport_key` text;
ALTER TABLE `napkinbets_taxonomy_leagues`
  ADD COLUMN `entity_provider_league_id` text;
ALTER TABLE `napkinbets_taxonomy_leagues`
  ADD COLUMN `entity_provider_season` text;
ALTER TABLE `napkinbets_taxonomy_leagues`
  ADD COLUMN `entity_sync_enabled` integer NOT NULL DEFAULT 0;
ALTER TABLE `napkinbets_taxonomy_leagues`
  ADD COLUMN `score_sync_enabled` integer NOT NULL DEFAULT 0;
ALTER TABLE `napkinbets_taxonomy_leagues`
  ADD COLUMN `entity_last_sync_at` text;
ALTER TABLE `napkinbets_taxonomy_leagues`
  ADD COLUMN `entity_last_sync_status` text NOT NULL DEFAULT 'idle';
ALTER TABLE `napkinbets_taxonomy_leagues`
  ADD COLUMN `entity_last_sync_message` text;
ALTER TABLE `napkinbets_taxonomy_leagues`
  ADD COLUMN `entity_resolved_season` text;

CREATE TABLE `napkinbets_venues` (
  `id` text PRIMARY KEY NOT NULL,
  `slug` text NOT NULL UNIQUE,
  `source` text NOT NULL,
  `external_venue_id` text,
  `sport_key` text REFERENCES `napkinbets_taxonomy_sports`(`key`) ON DELETE CASCADE,
  `primary_league_key` text REFERENCES `napkinbets_taxonomy_leagues`(`key`) ON DELETE SET NULL,
  `name` text NOT NULL,
  `short_name` text NOT NULL DEFAULT '',
  `city` text NOT NULL DEFAULT '',
  `state_region` text NOT NULL DEFAULT '',
  `country` text NOT NULL DEFAULT '',
  `address` text NOT NULL DEFAULT '',
  `postal_code` text NOT NULL DEFAULT '',
  `timezone` text NOT NULL DEFAULT '',
  `latitude` text NOT NULL DEFAULT '',
  `longitude` text NOT NULL DEFAULT '',
  `capacity` integer,
  `surface` text NOT NULL DEFAULT '',
  `roof_type` text NOT NULL DEFAULT '',
  `image_url` text NOT NULL DEFAULT '',
  `metadata_json` text NOT NULL DEFAULT '{}',
  `raw_payload_json` text,
  `source_updated_at` text,
  `last_synced_at` text NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);

CREATE TABLE `napkinbets_teams` (
  `id` text PRIMARY KEY NOT NULL,
  `slug` text NOT NULL UNIQUE,
  `source` text NOT NULL,
  `external_team_id` text NOT NULL,
  `sport_key` text NOT NULL REFERENCES `napkinbets_taxonomy_sports`(`key`) ON DELETE CASCADE,
  `primary_league_key` text REFERENCES `napkinbets_taxonomy_leagues`(`key`) ON DELETE SET NULL,
  `venue_id` text REFERENCES `napkinbets_venues`(`id`) ON DELETE SET NULL,
  `name` text NOT NULL,
  `short_name` text NOT NULL DEFAULT '',
  `abbreviation` text NOT NULL DEFAULT '',
  `city` text NOT NULL DEFAULT '',
  `country` text NOT NULL DEFAULT '',
  `logo_url` text NOT NULL DEFAULT '',
  `is_national` integer NOT NULL DEFAULT 0,
  `founded_year` integer,
  `metadata_json` text NOT NULL DEFAULT '{}',
  `raw_payload_json` text,
  `source_updated_at` text,
  `last_synced_at` text NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);

CREATE TABLE `napkinbets_players` (
  `id` text PRIMARY KEY NOT NULL,
  `slug` text NOT NULL UNIQUE,
  `source` text NOT NULL,
  `external_player_id` text NOT NULL,
  `sport_key` text NOT NULL REFERENCES `napkinbets_taxonomy_sports`(`key`) ON DELETE CASCADE,
  `current_team_id` text REFERENCES `napkinbets_teams`(`id`) ON DELETE SET NULL,
  `current_league_key` text REFERENCES `napkinbets_taxonomy_leagues`(`key`) ON DELETE SET NULL,
  `display_name` text NOT NULL,
  `first_name` text NOT NULL DEFAULT '',
  `last_name` text NOT NULL DEFAULT '',
  `short_name` text NOT NULL DEFAULT '',
  `position` text NOT NULL DEFAULT '',
  `group_label` text NOT NULL DEFAULT '',
  `jersey_number` text NOT NULL DEFAULT '',
  `nationality` text NOT NULL DEFAULT '',
  `age` integer,
  `birth_date` text,
  `height` text NOT NULL DEFAULT '',
  `weight` text NOT NULL DEFAULT '',
  `image_url` text NOT NULL DEFAULT '',
  `metadata_json` text NOT NULL DEFAULT '{}',
  `raw_payload_json` text,
  `source_updated_at` text,
  `last_synced_at` text NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);

CREATE TABLE `napkinbets_team_rosters` (
  `id` text PRIMARY KEY NOT NULL,
  `league_key` text REFERENCES `napkinbets_taxonomy_leagues`(`key`) ON DELETE SET NULL,
  `team_id` text NOT NULL REFERENCES `napkinbets_teams`(`id`) ON DELETE CASCADE,
  `player_id` text NOT NULL REFERENCES `napkinbets_players`(`id`) ON DELETE CASCADE,
  `season` text NOT NULL,
  `jersey_number` text NOT NULL DEFAULT '',
  `position` text NOT NULL DEFAULT '',
  `status` text NOT NULL DEFAULT 'active',
  `sort_order` integer NOT NULL DEFAULT 0,
  `metadata_json` text NOT NULL DEFAULT '{}',
  `raw_payload_json` text,
  `source_updated_at` text,
  `last_synced_at` text NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);

CREATE UNIQUE INDEX `napkinbets_teams_source_external_idx`
  ON `napkinbets_teams` (`source`, `external_team_id`);
CREATE UNIQUE INDEX `napkinbets_players_source_external_idx`
  ON `napkinbets_players` (`source`, `external_player_id`);
CREATE UNIQUE INDEX `napkinbets_team_rosters_unique_idx`
  ON `napkinbets_team_rosters` (`team_id`, `player_id`, `league_key`, `season`);
CREATE INDEX `napkinbets_teams_league_idx`
  ON `napkinbets_teams` (`primary_league_key`, `name`);
CREATE INDEX `napkinbets_players_team_idx`
  ON `napkinbets_players` (`current_team_id`, `display_name`);
CREATE INDEX `napkinbets_venues_league_idx`
  ON `napkinbets_venues` (`primary_league_key`, `name`);

ALTER TABLE `napkinbets_events`
  ADD COLUMN `venue_id` text REFERENCES `napkinbets_venues`(`id`) ON DELETE SET NULL;
ALTER TABLE `napkinbets_events`
  ADD COLUMN `home_team_id` text REFERENCES `napkinbets_teams`(`id`) ON DELETE SET NULL;
ALTER TABLE `napkinbets_events`
  ADD COLUMN `away_team_id` text REFERENCES `napkinbets_teams`(`id`) ON DELETE SET NULL;

UPDATE `napkinbets_taxonomy_leagues`
SET
  `entity_provider` = CASE `key`
    WHEN 'nba' THEN 'api-sports'
    WHEN 'nfl' THEN 'api-sports'
    WHEN 'mlb' THEN 'api-sports'
    WHEN 'nhl' THEN 'api-sports'
    ELSE `entity_provider`
  END,
  `entity_provider_sport_key` = CASE `key`
    WHEN 'nba' THEN 'basketball'
    WHEN 'nfl' THEN 'american-football'
    WHEN 'mlb' THEN 'baseball'
    WHEN 'nhl' THEN 'hockey'
    ELSE `entity_provider_sport_key`
  END,
  `entity_provider_league_id` = CASE `key`
    WHEN 'nba' THEN '12'
    WHEN 'nfl' THEN '1'
    WHEN 'mlb' THEN '1'
    WHEN 'nhl' THEN '57'
    ELSE `entity_provider_league_id`
  END,
  `entity_sync_enabled` = CASE `key`
    WHEN 'nba' THEN 1
    WHEN 'nfl' THEN 1
    WHEN 'mlb' THEN 1
    WHEN 'nhl' THEN 1
    ELSE `entity_sync_enabled`
  END,
  `score_sync_enabled` = CASE `key`
    WHEN 'nba' THEN 1
    WHEN 'nfl' THEN 1
    WHEN 'mlb' THEN 1
    WHEN 'nhl' THEN 1
    ELSE `score_sync_enabled`
  END
WHERE `key` IN ('nba', 'nfl', 'mlb', 'nhl');
