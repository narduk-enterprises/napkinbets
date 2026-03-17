ALTER TABLE `napkinbets_wagers` ADD COLUMN `owner_user_id` text REFERENCES `users`(`id`) ON DELETE SET NULL;
ALTER TABLE `napkinbets_wagers` ADD COLUMN `event_source` text;
ALTER TABLE `napkinbets_wagers` ADD COLUMN `event_id` text;
ALTER TABLE `napkinbets_wagers` ADD COLUMN `event_title` text;
ALTER TABLE `napkinbets_wagers` ADD COLUMN `event_starts_at` text;
ALTER TABLE `napkinbets_wagers` ADD COLUMN `event_status` text;
ALTER TABLE `napkinbets_wagers` ADD COLUMN `home_team_name` text;
ALTER TABLE `napkinbets_wagers` ADD COLUMN `away_team_name` text;

ALTER TABLE `napkinbets_participants` ADD COLUMN `user_id` text REFERENCES `users`(`id`) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS `napkinbets_wagers_owner_idx` ON `napkinbets_wagers` (`owner_user_id`);
CREATE INDEX IF NOT EXISTS `napkinbets_wagers_event_idx` ON `napkinbets_wagers` (`event_source`, `event_id`);
CREATE INDEX IF NOT EXISTS `napkinbets_participants_user_idx` ON `napkinbets_participants` (`user_id`);
