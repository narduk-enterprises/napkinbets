ALTER TABLE `napkinbets_wagers`
  ADD COLUMN `board_type` text NOT NULL DEFAULT 'community-created';

ALTER TABLE `napkinbets_wagers`
  ADD COLUMN `context_key` text NOT NULL DEFAULT 'community';

ALTER TABLE `napkinbets_wagers`
  ADD COLUMN `custom_context_name` text;

UPDATE `napkinbets_wagers`
SET
  `board_type` = CASE
    WHEN `event_id` IS NOT NULL AND `event_id` <> '' THEN 'event-backed'
    ELSE 'community-created'
  END,
  `context_key` = CASE
    WHEN `league` IN ('ncaamb', 'ncaaf') THEN 'college'
    WHEN `league` IN ('pga', 'lpga') THEN 'pro'
    WHEN `league` IN ('nba', 'wnba', 'nfl', 'mlb', 'nhl', 'mls', 'ufc', 'atp') THEN 'pro'
    ELSE 'community'
  END
WHERE 1 = 1;
