CREATE TABLE `admin_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`admin_id` text NOT NULL,
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
	FOREIGN KEY (`admin_id`) REFERENCES `admins`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `admins` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`nickname` text,
	`email` text,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admins_username_unique` ON `admins` (`username`);--> statement-breakpoint
CREATE TABLE `sessions` (
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
ALTER TABLE `user_auths` ADD `union_id` text;--> statement-breakpoint
ALTER TABLE `scan_logs` DROP COLUMN `city`;