-- Custom bet outcome calling & dispute fields
ALTER TABLE `napkinbets_wagers`
  ADD COLUMN `outcome_called_at` text;

ALTER TABLE `napkinbets_wagers`
  ADD COLUMN `outcome_review_expires_at` text;

ALTER TABLE `napkinbets_wagers`
  ADD COLUMN `outcome_note` text;

ALTER TABLE `napkinbets_wagers`
  ADD COLUMN `dispute_reason` text;

ALTER TABLE `napkinbets_wagers`
  ADD COLUMN `disputed_by_user_id` text REFERENCES `users`(`id`) ON DELETE SET NULL;

-- Participant outcome acknowledgement
ALTER TABLE `napkinbets_participants`
  ADD COLUMN `outcome_acknowledged` integer NOT NULL DEFAULT 0;

ALTER TABLE `napkinbets_participants`
  ADD COLUMN `outcome_acknowledged_at` text;
