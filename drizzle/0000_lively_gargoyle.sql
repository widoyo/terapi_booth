CREATE TABLE `admin_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `devices` (
	`device_id` text PRIMARY KEY NOT NULL,
	`device_hash` text NOT NULL,
	`tenant_id` integer NOT NULL,
	`mac_address` text,
	`harga_kustom` integer,
	`status_aktif` integer DEFAULT 1,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`tenant_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `devices_device_hash_unique` ON `devices` (`device_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `devices_mac_address_unique` ON `devices` (`mac_address`);--> statement-breakpoint
CREATE INDEX `idx_devices_hash` ON `devices` (`device_hash`);--> statement-breakpoint
CREATE TABLE `invoices` (
	`invoice_id` text PRIMARY KEY NOT NULL,
	`tenant_id` integer NOT NULL,
	`bulan_tahun` text NOT NULL,
	`total_tagihan` integer NOT NULL,
	`file_url` text NOT NULL,
	`status_bayar` text DEFAULT 'UNPAID',
	`tanggal_terbit` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`tenant_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_invoices_tenant` ON `invoices` (`tenant_id`);--> statement-breakpoint
CREATE TABLE `outlets` (
	`outlet_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`outlet_hash` text NOT NULL,
	`tenant_id` integer NOT NULL,
	`nama_outlet` text NOT NULL,
	`alamat` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`tenant_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `outlets_outlet_hash_unique` ON `outlets` (`outlet_hash`);--> statement-breakpoint
CREATE INDEX `idx_outlets_tenant` ON `outlets` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `idx_outlets_hash` ON `outlets` (`outlet_hash`);--> statement-breakpoint
CREATE TABLE `promo_codes` (
	`code` text PRIMARY KEY NOT NULL,
	`tenant_id` integer NOT NULL,
	`tipe_potongan` text NOT NULL,
	`nilai_potongan` real NOT NULL,
	`kuota_total` integer NOT NULL,
	`kuota_terpakai` integer DEFAULT 0,
	`tanggal_kadaluarsa` text NOT NULL,
	`is_active` integer DEFAULT 1,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`tenant_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_promo_codes_tenant` ON `promo_codes` (`tenant_id`);--> statement-breakpoint
CREATE TABLE `tenant_configs` (
	`tenant_id` integer PRIMARY KEY NOT NULL,
	`harga_default` integer DEFAULT 60000,
	`durasi_menit` integer DEFAULT 30,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`tenant_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_tenant_configs_tenant` ON `tenant_configs` (`tenant_id`);--> statement-breakpoint
CREATE TABLE `tenants` (
	`tenant_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nama_tenant` text NOT NULL,
	`alamat` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `therapy_sessions` (
	`session_id` text PRIMARY KEY NOT NULL,
	`device_id` text NOT NULL,
	`tenant_id` integer NOT NULL,
	`voucher_id` text,
	`nama_pelanggan` text,
	`wa` text,
	`status_pembayaran` text NOT NULL,
	`nominal_bayar` integer NOT NULL,
	`kode_promo_terpakai` text,
	`latitude` real,
	`longitude` real,
	`waktu_mulai` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`device_id`) REFERENCES `devices`(`device_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`tenant_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`voucher_id`) REFERENCES `vouchers`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`kode_promo_terpakai`) REFERENCES `promo_codes`(`code`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `therapy_sessions_voucher_id_unique` ON `therapy_sessions` (`voucher_id`);--> statement-breakpoint
CREATE INDEX `idx_therapy_sessions_tenant` ON `therapy_sessions` (`tenant_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`user_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'TENANT_ADMIN' NOT NULL,
	`tenant_id` integer,
	`last_login_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`tenant_id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE INDEX `idx_users_tenant` ON `users` (`tenant_id`);--> statement-breakpoint
CREATE TABLE `vouchers` (
	`id` text PRIMARY KEY NOT NULL,
	`voucher_code` text NOT NULL,
	`tipe_potongan` text NOT NULL,
	`nilai_potongan` real NOT NULL,
	`harga` real NOT NULL,
	`wa` text,
	`kadaluwarsa` text NOT NULL,
	`is_used` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_active_voucher_code` ON `vouchers` (`voucher_code`) WHERE is_used = 0;