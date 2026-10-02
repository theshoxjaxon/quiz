CREATE TABLE `questions` (
	`id` integer PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`prompt` text NOT NULL,
	`code` text,
	`options` text NOT NULL,
	`correct_index` integer NOT NULL,
	`points` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`name_key` text NOT NULL,
	`student_id` text NOT NULL,
	`token` text NOT NULL,
	`started_at` integer NOT NULL,
	`team_id` integer,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `students_name_key_unique` ON `students` (`name_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `students_student_id_unique` ON `students` (`student_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `students_token_unique` ON `students` (`token`);--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`student_id` integer NOT NULL,
	`answers` text NOT NULL,
	`score` integer NOT NULL,
	`time_taken_sec` integer NOT NULL,
	`submitted_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `submissions_student_id_unique` ON `submissions` (`student_id`);--> statement-breakpoint
CREATE TABLE `teams` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
