CREATE TABLE `napkinbets_user_notification_settings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`notify_friend_requests` integer DEFAULT true NOT NULL,
	`notify_group_invites` integer DEFAULT true NOT NULL,
	`notify_wager_updates` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `__new_napkinbets_notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`wager_id` text,
	`target_user_id` text,
	`participant_id` text,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`delivery_status` text DEFAULT 'queued' NOT NULL,
	`scheduled_for` text,
	`created_at` text NOT NULL,
	`sent_at` text,
	FOREIGN KEY (`wager_id`) REFERENCES `napkinbets_wagers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`target_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`participant_id`) REFERENCES `napkinbets_participants`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_napkinbets_notifications`("id", "wager_id", "participant_id", "kind", "title", "body", "delivery_status", "scheduled_for", "created_at", "sent_at") SELECT "id", "wager_id", "participant_id", "kind", "title", "body", "delivery_status", "scheduled_for", "created_at", "sent_at" FROM `napkinbets_notifications`;
--> statement-breakpoint
DROP TABLE `napkinbets_notifications`;
--> statement-breakpoint
ALTER TABLE `__new_napkinbets_notifications` RENAME TO `napkinbets_notifications`;
