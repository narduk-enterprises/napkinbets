CREATE TABLE `napkinbets_taxonomy_sports` (
  `key` text PRIMARY KEY NOT NULL,
  `label` text NOT NULL,
  `icon` text NOT NULL,
  `supports_event_discovery` integer NOT NULL DEFAULT 0,
  `sort_order` integer NOT NULL DEFAULT 0,
  `is_active` integer NOT NULL DEFAULT 1,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);

CREATE TABLE `napkinbets_taxonomy_contexts` (
  `key` text PRIMARY KEY NOT NULL,
  `label` text NOT NULL,
  `description` text NOT NULL,
  `sort_order` integer NOT NULL DEFAULT 0,
  `is_active` integer NOT NULL DEFAULT 1,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);

CREATE TABLE `napkinbets_taxonomy_leagues` (
  `key` text PRIMARY KEY NOT NULL,
  `label` text NOT NULL,
  `sport_key` text NOT NULL REFERENCES `napkinbets_taxonomy_sports`(`key`) ON DELETE CASCADE,
  `primary_context_key` text NOT NULL REFERENCES `napkinbets_taxonomy_contexts`(`key`) ON DELETE CASCADE,
  `context_keys_json` text NOT NULL,
  `provider` text NOT NULL,
  `provider_league_key` text,
  `scoreboard_query_params_json` text NOT NULL DEFAULT '{}',
  `event_shape` text,
  `active_months_json` text NOT NULL,
  `supports_date_window` integer NOT NULL DEFAULT 1,
  `supports_event_discovery` integer NOT NULL DEFAULT 0,
  `sort_order` integer NOT NULL DEFAULT 0,
  `is_active` integer NOT NULL DEFAULT 1,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);

CREATE INDEX `napkinbets_taxonomy_sports_sort_idx`
  ON `napkinbets_taxonomy_sports` (`is_active`, `sort_order`);
CREATE INDEX `napkinbets_taxonomy_contexts_sort_idx`
  ON `napkinbets_taxonomy_contexts` (`is_active`, `sort_order`);
CREATE INDEX `napkinbets_taxonomy_leagues_sort_idx`
  ON `napkinbets_taxonomy_leagues` (`is_active`, `sort_order`);
CREATE INDEX `napkinbets_taxonomy_leagues_sport_idx`
  ON `napkinbets_taxonomy_leagues` (`sport_key`, `is_active`);

INSERT INTO `napkinbets_taxonomy_sports`
  (`key`, `label`, `icon`, `supports_event_discovery`, `sort_order`, `is_active`, `created_at`, `updated_at`)
VALUES
  ('basketball', 'Basketball', 'i-lucide-badge-info', 1, 0, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('football', 'Football', 'i-lucide-badge-info', 1, 1, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('baseball', 'Baseball', 'i-lucide-badge-info', 1, 2, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('hockey', 'Hockey', 'i-lucide-badge-info', 1, 3, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('golf', 'Golf', 'i-lucide-badge-info', 1, 4, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('soccer', 'Soccer', 'i-lucide-badge-info', 1, 5, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('motorsports', 'Motorsports', 'i-lucide-badge-info', 0, 6, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('combat', 'Combat', 'i-lucide-badge-info', 0, 7, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('tennis', 'Tennis', 'i-lucide-badge-info', 0, 8, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('track-field', 'Track & field', 'i-lucide-badge-info', 0, 9, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('entertainment', 'Entertainment', 'i-lucide-badge-info', 0, 10, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('other', 'Other', 'i-lucide-badge-info', 0, 11, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

INSERT INTO `napkinbets_taxonomy_contexts`
  (`key`, `label`, `description`, `sort_order`, `is_active`, `created_at`, `updated_at`)
VALUES
  ('pro', 'Professional', 'Top-flight leagues and tours with regular public schedule data.', 0, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('college', 'College', 'NCAA and campus-level pools tied to college events.', 1, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('high-school', 'High school', 'School meets, district tournaments, and other prep events.', 2, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('tournament', 'Tournament', 'Majors, invitationals, and bracket-style event runs.', 3, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('international', 'International', 'National-team competitions and international event windows.', 4, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('community', 'Community', 'Neighborhood runs, club matches, or friend-group events.', 5, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('entertainment', 'Entertainment', 'Shows, culture moments, and non-sports social bets.', 6, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

INSERT INTO `napkinbets_taxonomy_leagues`
  (
    `key`,
    `label`,
    `sport_key`,
    `primary_context_key`,
    `context_keys_json`,
    `provider`,
    `provider_league_key`,
    `scoreboard_query_params_json`,
    `event_shape`,
    `active_months_json`,
    `supports_date_window`,
    `supports_event_discovery`,
    `sort_order`,
    `is_active`,
    `created_at`,
    `updated_at`
  )
VALUES
  ('nba', 'NBA', 'basketball', 'pro', '["pro"]', 'espn', NULL, '{}', NULL, '[1,2,3,4,5,6,10,11,12]', 1, 1, 0, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('wnba', 'WNBA', 'basketball', 'pro', '["pro"]', 'espn', NULL, '{}', NULL, '[5,6,7,8,9,10]', 1, 1, 1, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('ncaamb', 'Men''s College Basketball', 'basketball', 'college', '["college","tournament"]', 'espn', 'mens-college-basketball', '{"groups":"50"}', NULL, '[1,2,3,4,11,12]', 1, 1, 2, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('ncaaw', 'Women''s College Basketball', 'basketball', 'college', '["college","tournament"]', 'espn', 'womens-college-basketball', '{"groups":"50"}', NULL, '[1,2,3,4,11,12]', 1, 1, 3, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('nfl', 'NFL', 'football', 'pro', '["pro"]', 'espn', NULL, '{}', NULL, '[1,8,9,10,11,12]', 1, 1, 4, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('ncaaf', 'College Football', 'football', 'college', '["college","tournament"]', 'espn', 'college-football', '{}', NULL, '[1,8,9,10,11,12]', 1, 1, 5, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('mlb', 'MLB', 'baseball', 'pro', '["pro","international"]', 'espn', NULL, '{}', NULL, '[2,3,4,5,6,7,8,9,10,11]', 1, 1, 6, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('nhl', 'NHL', 'hockey', 'pro', '["pro","international"]', 'espn', NULL, '{}', NULL, '[1,2,3,4,5,6,9,10,11,12]', 1, 1, 7, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('pga', 'PGA Tour', 'golf', 'tournament', '["pro","tournament"]', 'espn', NULL, '{}', 'tournament', '[1,2,3,4,5,6,7,8,9,10,11,12]', 1, 1, 8, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('lpga', 'LPGA Tour', 'golf', 'tournament', '["pro","tournament"]', 'espn', NULL, '{}', 'tournament', '[1,2,3,4,5,6,7,8,9,10,11,12]', 1, 1, 9, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('mls', 'MLS', 'soccer', 'pro', '["pro","international"]', 'espn', 'usa.1', '{}', NULL, '[2,3,4,5,6,7,8,9,10,11]', 1, 1, 10, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('nwsl', 'NWSL', 'soccer', 'pro', '["pro","international"]', 'espn', 'usa.nwsl', '{}', NULL, '[3,4,5,6,7,8,9,10,11]', 1, 1, 11, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('college-baseball', 'College Baseball', 'baseball', 'college', '["college","tournament"]', 'espn', 'college-baseball', '{}', NULL, '[2,3,4,5,6]', 1, 1, 12, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('epl', 'Premier League', 'soccer', 'international', '["pro","international"]', 'espn', 'eng.1', '{}', NULL, '[1,2,3,4,5,8,9,10,11,12]', 1, 1, 13, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('uefa-champions', 'UEFA Champions League', 'soccer', 'international', '["international","tournament"]', 'espn', 'uefa.champions', '{}', NULL, '[1,2,3,4,9,10,11,12]', 1, 1, 14, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('ufc', 'UFC', 'combat', 'pro', '["pro","international"]', 'manual', NULL, '{}', NULL, '[1,2,3,4,5,6,7,8,9,10,11,12]', 1, 0, 15, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('atp', 'ATP Tour', 'tennis', 'pro', '["pro","tournament","international"]', 'manual', NULL, '{}', NULL, '[1,2,3,4,5,6,7,8,9,10,11,12]', 1, 0, 16, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

ALTER TABLE `napkinbets_events`
  ADD COLUMN `context_key` text NOT NULL DEFAULT 'community';

ALTER TABLE `napkinbets_events`
  ADD COLUMN `context_label` text NOT NULL DEFAULT 'Community';

UPDATE `napkinbets_events`
SET
  `context_key` = CASE
    WHEN `league` IN ('ncaamb', 'ncaaw', 'ncaaf', 'college-baseball') THEN 'college'
    WHEN `league` IN ('pga', 'lpga', 'uefa-champions') THEN 'tournament'
    WHEN `league` = 'epl' THEN 'international'
    WHEN `league` IN ('nba', 'wnba', 'nfl', 'mlb', 'nhl', 'mls', 'nwsl') THEN 'pro'
    ELSE 'community'
  END,
  `context_label` = CASE
    WHEN `league` IN ('ncaamb', 'ncaaw', 'ncaaf', 'college-baseball') THEN 'College'
    WHEN `league` IN ('pga', 'lpga', 'uefa-champions') THEN 'Tournament'
    WHEN `league` = 'epl' THEN 'International'
    WHEN `league` IN ('nba', 'wnba', 'nfl', 'mlb', 'nhl', 'mls', 'nwsl') THEN 'Professional'
    ELSE 'Community'
  END
WHERE 1 = 1;

