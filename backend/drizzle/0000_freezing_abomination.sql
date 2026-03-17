CREATE TABLE `devices` (
	`id` text PRIMARY KEY NOT NULL,
	`activation_code` text NOT NULL,
	`pet_id` text,
	`bound_at` integer,
	`created_at` integer,
	FOREIGN KEY (`pet_id`) REFERENCES `pets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `pets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`name` text NOT NULL,
	`avatar` text,
	`breed` text,
	`medical_notes` text,
	`status` text DEFAULT 'normal',
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `scan_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`device_id` text,
	`ip` text,
	`user_agent` text,
	`city` text,
	`latitude` text,
	`longitude` text,
	`scanned_at` integer,
	FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`nickname` text,
	`avatar` text,
	`phone` text,
	`auth_provider` text,
	`auth_open_id` text,
	`created_at` integer
);
