CREATE TABLE `napkinbets_featured_bets` (
  `id` text PRIMARY KEY NOT NULL,
  `label` text NOT NULL,
  `title` text NOT NULL,
  `subtitle` text NOT NULL DEFAULT '',
  `summary` text NOT NULL DEFAULT '',
  `window_label` text NOT NULL DEFAULT '',
  `venue_label` text NOT NULL DEFAULT '',
  `accent` text NOT NULL DEFAULT 'tour',
  `image_url` text NOT NULL DEFAULT '',
  `sort_order` integer NOT NULL DEFAULT 0,
  `is_active` integer NOT NULL DEFAULT 1,
  `prefill_json` text NOT NULL DEFAULT '{}',
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
