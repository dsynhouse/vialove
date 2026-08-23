CREATE TABLE `bond_members` (
	`id` text PRIMARY KEY NOT NULL,
	`bond_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`bond_id`) REFERENCES `bonds`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `bonds` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`label` text NOT NULL,
	`accent` text NOT NULL,
	`accent_soft` text NOT NULL,
	`accent_strong` text NOT NULL,
	`invite_code` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `check_ins` (
	`id` text PRIMARY KEY NOT NULL,
	`bond_id` text NOT NULL,
	`person_id` text NOT NULL,
	`date` text NOT NULL,
	`mood` integer NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`visibility` text DEFAULT 'shared' NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`bond_id`) REFERENCES `bonds`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`person_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`bond_id` text NOT NULL,
	`created_by` text NOT NULL,
	`title` text NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`type` text NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`bond_id`) REFERENCES `bonds`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `goal_cheers` (
	`id` text PRIMARY KEY NOT NULL,
	`goal_id` text NOT NULL,
	`person_id` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`goal_id`) REFERENCES `goals`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`person_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` text PRIMARY KEY NOT NULL,
	`bond_id` text NOT NULL,
	`owner_id` text,
	`title` text NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`bond_id`) REFERENCES `bonds`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `journal_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`bond_id` text NOT NULL,
	`author_id` text NOT NULL,
	`kind` text NOT NULL,
	`prompt` text NOT NULL,
	`content` text NOT NULL,
	`visibility` text DEFAULT 'shared' NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`bond_id`) REFERENCES `bonds`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `mindful_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`bond_id` text NOT NULL,
	`person_id` text NOT NULL,
	`session_id` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`bond_id`) REFERENCES `bonds`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`person_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `support_signals` (
	`id` text PRIMARY KEY NOT NULL,
	`bond_id` text NOT NULL,
	`person_id` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`bond_id`) REFERENCES `bonds`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`person_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `vault_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`bond_id` text NOT NULL,
	`person_id` text NOT NULL,
	`category` text NOT NULL,
	`content` text NOT NULL,
	`visibility` text DEFAULT 'private' NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`bond_id`) REFERENCES `bonds`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`person_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `weekly_pulses` (
	`id` text PRIMARY KEY NOT NULL,
	`bond_id` text NOT NULL,
	`week_of` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`bond_id`) REFERENCES `bonds`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `weekly_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`pulse_id` text NOT NULL,
	`person_id` text NOT NULL,
	`appreciation` text DEFAULT '' NOT NULL,
	`friction` text DEFAULT '' NOT NULL,
	`request` text DEFAULT '' NOT NULL,
	`win` text DEFAULT '' NOT NULL,
	`try_this` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`pulse_id`) REFERENCES `weekly_pulses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`person_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bond_members_bond_user_idx` ON `bond_members` (`bond_id`,`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `bonds_invite_code_unique` ON `bonds` (`invite_code`);--> statement-breakpoint
CREATE UNIQUE INDEX `goal_cheers_goal_person_idx` ON `goal_cheers` (`goal_id`,`person_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `weekly_pulses_bond_week_idx` ON `weekly_pulses` (`bond_id`,`week_of`);--> statement-breakpoint
CREATE UNIQUE INDEX `weekly_responses_pulse_person_idx` ON `weekly_responses` (`pulse_id`,`person_id`);