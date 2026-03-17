CREATE TABLE IF NOT EXISTS `napkinbets_wagers` (
  `id` text PRIMARY KEY NOT NULL,
  `slug` text NOT NULL,
  `title` text NOT NULL,
  `description` text NOT NULL,
  `category` text NOT NULL,
  `format` text NOT NULL,
  `sport` text DEFAULT '',
  `league` text DEFAULT '',
  `status` text NOT NULL DEFAULT 'open',
  `creator_name` text NOT NULL,
  `side_options_json` text NOT NULL,
  `entry_fee_cents` integer NOT NULL DEFAULT 0,
  `payment_service` text NOT NULL,
  `payment_handle` text,
  `terms` text NOT NULL,
  `venue_name` text,
  `latitude` text,
  `longitude` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS `napkinbets_wagers_slug_unique` ON `napkinbets_wagers` (`slug`);

CREATE TABLE IF NOT EXISTS `napkinbets_participants` (
  `id` text PRIMARY KEY NOT NULL,
  `wager_id` text NOT NULL REFERENCES `napkinbets_wagers`(`id`) ON DELETE CASCADE,
  `display_name` text NOT NULL,
  `side_label` text,
  `join_status` text NOT NULL DEFAULT 'invited',
  `draft_order` integer,
  `payment_status` text NOT NULL DEFAULT 'pending',
  `payment_reference` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);

CREATE INDEX IF NOT EXISTS `napkinbets_participants_wager_idx` ON `napkinbets_participants` (`wager_id`);

CREATE TABLE IF NOT EXISTS `napkinbets_pots` (
  `id` text PRIMARY KEY NOT NULL,
  `wager_id` text NOT NULL REFERENCES `napkinbets_wagers`(`id`) ON DELETE CASCADE,
  `label` text NOT NULL,
  `amount_cents` integer NOT NULL,
  `sort_order` integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS `napkinbets_pots_wager_idx` ON `napkinbets_pots` (`wager_id`);

CREATE TABLE IF NOT EXISTS `napkinbets_picks` (
  `id` text PRIMARY KEY NOT NULL,
  `wager_id` text NOT NULL REFERENCES `napkinbets_wagers`(`id`) ON DELETE CASCADE,
  `participant_id` text NOT NULL REFERENCES `napkinbets_participants`(`id`) ON DELETE CASCADE,
  `pick_label` text NOT NULL,
  `pick_type` text NOT NULL DEFAULT 'custom',
  `pick_value` text,
  `confidence` integer NOT NULL DEFAULT 0,
  `live_score` integer NOT NULL DEFAULT 0,
  `outcome` text NOT NULL DEFAULT 'pending',
  `sort_order` integer NOT NULL DEFAULT 0,
  `created_at` text NOT NULL
);

CREATE INDEX IF NOT EXISTS `napkinbets_picks_wager_idx` ON `napkinbets_picks` (`wager_id`);
CREATE INDEX IF NOT EXISTS `napkinbets_picks_participant_idx` ON `napkinbets_picks` (`participant_id`);

CREATE TABLE IF NOT EXISTS `napkinbets_notifications` (
  `id` text PRIMARY KEY NOT NULL,
  `wager_id` text NOT NULL REFERENCES `napkinbets_wagers`(`id`) ON DELETE CASCADE,
  `participant_id` text REFERENCES `napkinbets_participants`(`id`) ON DELETE SET NULL,
  `kind` text NOT NULL,
  `title` text NOT NULL,
  `body` text NOT NULL,
  `delivery_status` text NOT NULL DEFAULT 'queued',
  `scheduled_for` text,
  `created_at` text NOT NULL,
  `sent_at` text
);

CREATE INDEX IF NOT EXISTS `napkinbets_notifications_wager_idx` ON `napkinbets_notifications` (`wager_id`);

CREATE TABLE IF NOT EXISTS `napkinbets_settlements` (
  `id` text PRIMARY KEY NOT NULL,
  `wager_id` text NOT NULL REFERENCES `napkinbets_wagers`(`id`) ON DELETE CASCADE,
  `participant_id` text NOT NULL REFERENCES `napkinbets_participants`(`id`) ON DELETE CASCADE,
  `amount_cents` integer NOT NULL,
  `method` text NOT NULL,
  `handle` text,
  `confirmation_code` text,
  `note` text,
  `recorded_at` text NOT NULL
);

CREATE INDEX IF NOT EXISTS `napkinbets_settlements_wager_idx` ON `napkinbets_settlements` (`wager_id`);
