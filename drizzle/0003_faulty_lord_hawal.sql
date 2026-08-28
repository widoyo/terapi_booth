ALTER TABLE `devices` RENAME COLUMN "mac_address" TO "latitude";--> statement-breakpoint
DROP INDEX `devices_mac_address_unique`;--> statement-breakpoint
ALTER TABLE `devices` ADD `longitude` text;--> statement-breakpoint
ALTER TABLE `outlets` ADD `latitude` text;--> statement-breakpoint
ALTER TABLE `outlets` ADD `longitude` text;