CREATE TABLE `napkinbets_app_settings` (
  `id` integer PRIMARY KEY NOT NULL,
  `ai_recommendations_enabled` integer NOT NULL DEFAULT false,
  `ai_prop_suggestions_enabled` integer NOT NULL DEFAULT false,
  `ai_terms_assist_enabled` integer NOT NULL DEFAULT false,
  `ai_closeout_assist_enabled` integer NOT NULL DEFAULT false,
  `updated_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO `napkinbets_app_settings` (
  `id`,
  `ai_recommendations_enabled`,
  `ai_prop_suggestions_enabled`,
  `ai_terms_assist_enabled`,
  `ai_closeout_assist_enabled`,
  `updated_at`
) VALUES (
  1,
  false,
  false,
  false,
  false,
  CURRENT_TIMESTAMP
);
