-- Make password_hash nullable to support OIDC-only users (no local password).
-- SQLite does not support ALTER COLUMN, so we must recreate the table.
CREATE TABLE `users_new` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password_hash` text,
	`role` text DEFAULT 'user' NOT NULL,
	`team` text DEFAULT 'Default' NOT NULL,
	`must_change_password` integer DEFAULT true NOT NULL,
	`auth_provider` text DEFAULT 'local' NOT NULL,
	`external_id` text,
	`email` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`analytics_enabled` integer,
	`analytics_consent_shown_at` integer,
	`analytics_consent_remind_at` integer
);--> statement-breakpoint
INSERT INTO `users_new` SELECT * FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `users_new` RENAME TO `users`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);
