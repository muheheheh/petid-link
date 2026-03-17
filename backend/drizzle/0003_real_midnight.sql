CREATE TABLE `user_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`app` text,
	`device_type` text,
	`device` text,
	`os` text,
	`os_version` text,
	`ip` text,
	`user_agent` text,
	`status` text DEFAULT 'active',
	`last_active_at` integer,
	`logged_out_at` integer,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
DROP TABLE `sessions`;