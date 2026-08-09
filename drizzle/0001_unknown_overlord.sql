ALTER TABLE `vouchers` ADD `used_at` text;--> statement-breakpoint
ALTER TABLE `vouchers` ADD `device_id` text REFERENCES devices(device_id);