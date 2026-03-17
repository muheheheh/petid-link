ALTER TABLE `pets` RENAME COLUMN "medical_notes" TO "gender";--> statement-breakpoint
ALTER TABLE `pets` ADD `description` text;--> statement-breakpoint
ALTER TABLE `pets` ADD `contacts` text;--> statement-breakpoint
ALTER TABLE `pets` ADD `contact_name` text;--> statement-breakpoint
ALTER TABLE `pets` ADD `remark` text;--> statement-breakpoint
ALTER TABLE `devices` ADD `user_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `devices` ADD `activated_at` integer;