CREATE TABLE `device_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`device_id` text NOT NULL,
	`status` text NOT NULL,
	`timestamp` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`device_id`) REFERENCES `devices`(`device_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_device_logs_device` ON `device_logs` (`device_id`);--> statement-breakpoint
ALTER TABLE `devices` ADD `outlet_id` integer REFERENCES outlets(outlet_id);--> statement-breakpoint
CREATE INDEX `idx_devices_outlet` ON `devices` (`outlet_id`);