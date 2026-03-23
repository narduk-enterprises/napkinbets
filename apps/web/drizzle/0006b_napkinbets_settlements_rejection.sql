ALTER TABLE `napkinbets_settlements`
  ADD COLUMN `rejected_by_user_id` text REFERENCES `users`(`id`) ON DELETE SET NULL;

ALTER TABLE `napkinbets_settlements`
  ADD COLUMN `rejected_at` text;

ALTER TABLE `napkinbets_settlements`
  ADD COLUMN `rejection_note` text;
