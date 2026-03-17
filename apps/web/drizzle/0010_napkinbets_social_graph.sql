CREATE TABLE `napkinbets_friendships` (
  `id` text PRIMARY KEY NOT NULL,
  `requester_user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE cascade,
  `addressee_user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE cascade,
  `status` text NOT NULL DEFAULT 'pending',
  `responded_at` text,
  `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX `napkinbets_friendships_request_pair_idx`
  ON `napkinbets_friendships` (`requester_user_id`, `addressee_user_id`);

CREATE TABLE `napkinbets_groups` (
  `id` text PRIMARY KEY NOT NULL,
  `slug` text NOT NULL UNIQUE,
  `owner_user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE cascade,
  `name` text NOT NULL,
  `description` text,
  `visibility` text NOT NULL DEFAULT 'private',
  `join_policy` text NOT NULL DEFAULT 'invite-only',
  `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `napkinbets_group_members` (
  `id` text PRIMARY KEY NOT NULL,
  `group_id` text NOT NULL REFERENCES `napkinbets_groups`(`id`) ON DELETE cascade,
  `user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE cascade,
  `role` text NOT NULL DEFAULT 'member',
  `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX `napkinbets_group_members_group_user_idx`
  ON `napkinbets_group_members` (`group_id`, `user_id`);

ALTER TABLE `napkinbets_wagers`
  ADD COLUMN `group_id` text REFERENCES `napkinbets_groups`(`id`) ON DELETE SET NULL;

ALTER TABLE `napkinbets_wagers`
  ADD COLUMN `napkin_type` text NOT NULL DEFAULT 'pool';

UPDATE `napkinbets_wagers`
SET `napkin_type` = CASE
  WHEN `format` = 'head-to-head' THEN 'simple-bet'
  ELSE 'pool'
END
WHERE 1 = 1;
