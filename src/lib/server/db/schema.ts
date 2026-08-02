import { sqliteTable, text, integer, real, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql, relations } from "drizzle-orm";


export const adminSessions = sqliteTable('admin_sessions', {
  id: text('id').primaryKey(), // Token acak (misal: UUID / crypto.randomUUID)
  username: text('username').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

// 1. TENANTS
export const tenants = sqliteTable("tenants", {
  tenantId: integer("tenant_id").primaryKey({ autoIncrement: true }),
  namaTenant: text("nama_tenant").notNull(),
  alamat: text("alamat"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`)
});

// 1b. OUTLETS
export const outlets = sqliteTable("outlets", {
  outletId: integer("outlet_id").primaryKey({ autoIncrement: true }),
  outletHash: text("outlet_hash").notNull().unique(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.tenantId, { onDelete: 'cascade' }),
  namaOutlet: text("nama_outlet").notNull(),
  alamat: text("alamat"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  idxOutletsTenant: index("idx_outlets_tenant").on(table.tenantId),
  idxOutletsHash: index("idx_outlets_hash").on(table.outletHash)
}));

// 2. USERS
export const users = sqliteTable("users", {
  userId: integer("user_id").primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["SUPER_ADMIN", "TENANT_ADMIN"] }).notNull().default("TENANT_ADMIN"),
  tenantId: integer("tenant_id").references(() => tenants.tenantId, { onDelete: 'set null' }),
  lastLoginAt: text("last_login_at"), // Tanggal/waktu login terakhir
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  idxUsersTenant: index("idx_users_tenant").on(table.tenantId)
}));

// 3. DEVICES (Aset pidiBox)
export const devices = sqliteTable("devices", {
  deviceId: text("device_id").primaryKey(), // e.g., "2606-1"
  deviceHash: text("device_hash").notNull().unique(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.tenantId, { onDelete: 'cascade' }),
  macAddress: text("mac_address").unique(),
  hargaKustom: integer("harga_kustom"),
  statusAktif: integer("status_aktif").default(1),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  idxDevicesHash: index("idx_devices_hash").on(table.deviceHash)
}));

// 4. TENANT CONFIGS
export const tenantConfigs = sqliteTable("tenant_configs", {
  tenantId: integer("tenant_id").primaryKey().references(() => tenants.tenantId, { onDelete: 'cascade' }),
  hargaDefault: integer("harga_default").default(60000),
  durasiMenit: integer("durasi_menit").default(30)
}, (table) => ({
  idxTenantConfigsTenant: index("idx_tenant_configs_tenant").on(table.tenantId)
}));

// 5. PROMO CODES
export const promoCodes = sqliteTable("promo_codes", {
  code: text("code").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.tenantId, { onDelete: 'cascade' }),
  tipePotongan: text("tipe_potongan", { enum: ["PERSEN", "NOMINAL"] }).notNull(),
  nilaiPotongan: real("nilai_potongan").notNull(),
  kuotaTotal: integer("kuota_total").notNull(),
  kuotaTerpakai: integer("kuota_terpakai").default(0),
  tanggalKadaluarsa: text("tanggal_kadaluarsa").notNull(),
  isActive: integer("is_active").default(1)
}, (table) => ({
  idxPromoCodesTenant: index("idx_promo_codes_tenant").on(table.tenantId)
}));

// 7. INVOICES
export const invoices = sqliteTable("invoices", {
  invoiceId: text("invoice_id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.tenantId, { onDelete: 'cascade' }),
  bulanTahun: text("bulan_tahun").notNull(), // "2026-06"
  totalTagihan: integer("total_tagihan").notNull(),
  fileUrl: text("file_url").notNull(),
  statusBayar: text("status_bayar", { enum: ["UNPAID", "PAID"] }).default("UNPAID"),
  tanggalTerbit: text("tanggal_terbit").default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  idxInvoicesTenant: index("idx_invoices_tenant").on(table.tenantId)
}));

// 8. VOUCHERS (Tanpa tenantId)
export const vouchers = sqliteTable("vouchers", {
  id: text("id").primaryKey(), // e.g. "vch_1785501918123_k8x2"
  voucherCode: text("voucher_code").notNull(), // Kode 4 digit (misal: "A1B2")
  tipePotongan: text("tipe_potongan", { enum: ["PERSEN", "NOMINAL"] }).notNull(),
  nilaiPotongan: real("nilai_potongan").notNull(),
  harga: real("harga").notNull(),
  wa: text("wa"),
  kadaluwarsa: text("kadaluwarsa").notNull(),
  isUsed: integer("is_used").default(0).notNull()
}, (table) => ({
  // PARTIAL UNIQUE INDEX: Unik HANYA saat is_used = 0
  uniqueActiveVoucher: uniqueIndex("unique_active_voucher_code")
    .on(table.voucherCode)
    .where(sql`is_used = 0`)
}));

// 6. THERAPY SESSIONS (Pusat Informasi Sesi & Tenant)
export const therapySessions = sqliteTable("therapy_sessions", {
  sessionId: text("session_id").primaryKey(), // Order ID / UUID
  deviceId: text("device_id").notNull().references(() => devices.deviceId),
  tenantId: integer("tenant_id").notNull().references(() => tenants.tenantId),
  
  // Menghubungkan ke Primary Key (id) milik Vouchers
  voucherId: text("voucher_id")
    .unique()
    .references(() => vouchers.id, { onDelete: 'set null' }),

  namaPelanggan: text("nama_pelanggan"),
  wa: text("wa"),
  statusPembayaran: text("status_pembayaran", { 
    enum: ["PENDING", "SETTLEMENT", "EXPIRED", "PROMO_BYPASS"] 
  }).notNull(),
  nominalBayar: integer("nominal_bayar").notNull(),
  kodePromoTerpakai: text("kode_promo_terpakai").references(() => promoCodes.code),
  latitude: real("latitude"),
  longitude: real("longitude"),
  waktuMulai: text("waktu_mulai").default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  idxTherapySessionsTenant: index("idx_therapy_sessions_tenant").on(table.tenantId)
}));

// Relasi Drizzle
export const vouchersRelations = relations(vouchers, ({ one }) => ({
  therapySession: one(therapySessions, {
    fields: [vouchers.id],
    references: [therapySessions.voucherId],
  }),
}));

export const therapySessionsRelations = relations(therapySessions, ({ one }) => ({
  voucher: one(vouchers, {
    fields: [therapySessions.voucherId],
    references: [vouchers.id],
  }),
}));