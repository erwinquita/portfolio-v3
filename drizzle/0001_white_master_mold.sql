ALTER TABLE `users` RENAME TO `user`;--> statement-breakpoint
DROP INDEX `users_email_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_portfolios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`category_id` integer NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`image_url` text,
	`project_url` text,
	`tags` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_portfolios`("id", "user_id", "category_id", "title", "description", "image_url", "project_url", "tags", "created_at", "updated_at") SELECT "id", "user_id", "category_id", "title", "description", "image_url", "project_url", "tags", "created_at", "updated_at" FROM `portfolios`;--> statement-breakpoint
DROP TABLE `portfolios`;--> statement-breakpoint
ALTER TABLE `__new_portfolios` RENAME TO `portfolios`;--> statement-breakpoint
PRAGMA foreign_keys=ON;