import { devices, vouchers, adminSessions, users } from '$lib/server/db/schema';
import { tenants, outlets, tenantConfigs } from '$lib/server/db/schema';
import { eq, count, sql } from 'drizzle-orm';
import { db, type DB } from '$lib/server/db';

interface NewUserData {
  username: string;
  passwordPlain: string;
  role?: 'SUPER_ADMIN' | 'TENANT_ADMIN';
  tenantId?: number | null;
}

// Mengambil semua tenant beserta jumlah outlet & device
export async function getAllTenants() {
  return await db
    .select({
      tenantId: tenants.tenantId,
      namaTenant: tenants.namaTenant,
      alamat: tenants.alamat,
      createdAt: tenants.createdAt,
      totalOutlets: count(outlets.outletId),
      totalDevices: count(devices.deviceId)
    })
    .from(tenants)
    .leftJoin(outlets, eq(tenants.tenantId, outlets.tenantId))
    .leftJoin(devices, eq(tenants.tenantId, devices.tenantId))
    .groupBy(tenants.tenantId);
}

// Mengambil detail 1 tenant beserta relasi outlet, device, user, dan config
export async function getTenantDetail(tenantId: number) {
  const tenantData = await db
    .select()
    .from(tenants)
    .where(eq(tenants.tenantId, tenantId))
    .limit(1);

  if (!tenantData[0]) return null;

  const [outletList, deviceList, userList, configData] = await Promise.all([
    db.select().from(outlets).where(eq(outlets.tenantId, tenantId)),
    db.select().from(devices).where(eq(devices.tenantId, tenantId)),
    db.select({
      userId: users.userId,
      username: users.username,
      role: users.role,
      lastLoginAt: users.lastLoginAt
    }).from(users).where(eq(users.tenantId, tenantId)),
    db.select().from(tenantConfigs).where(eq(tenantConfigs.tenantId, tenantId)).limit(1)
  ]);

  return {
    ...tenantData[0],
    outlets: outletList,
    devices: deviceList,
    users: userList,
    config: configData[0] || null
  };
}

/**
 * Verifikasi plain password terhadap hash SHA-256 yang tersimpan
 */
export async function verifyPassword(passwordPlain: string, storedHash: string): Promise<boolean> {
  const inputHash = await hashPassword(passwordPlain);
  return inputHash === storedHash;
}

/**
 * Mengambil data user berdasarkan username
 */
export async function getUserByUsername(dbClient: DB, username: string) {
  try {
    const cleanUsername = username.trim().toLowerCase();
    const result = await dbClient
      .select()
      .from(users)
      .where(eq(users.username, cleanUsername))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error(`[DB Query Error] Gagal mengambil user ${username}:`, error);
    return null;
  }
}

export async function markVoucherAsUsed(dbClient: DB, voucherCode: string, deviceId?: string) {
  const cleanCode = voucherCode.trim().toUpperCase();
  await dbClient.update(vouchers)
    .set({
      voucherCode: sql`'_' || ${cleanCode}`, // Tandai voucher sebagai terpakai dengan menambahkan prefix '_'
      isUsed: 1,
      usedAt: sql`datetime('now')`,
      deviceId: deviceId || null
    })
    .where(eq(vouchers.voucherCode, cleanCode));
}

/**
 * Hash password sederhana menggunakan SHA-256 (Web Crypto API)
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function createUser(dbClient: DB, data: NewUserData) {
  const passwordHash = await hashPassword(data.passwordPlain);

  const [newUser] = await dbClient
    .insert(users)
    .values({
      username: data.username.trim().toLowerCase(),
      passwordHash: passwordHash,
      role: data.role || 'TENANT_ADMIN',
      tenantId: data.tenantId || null
    })
    .returning();

  return newUser;
}

export async function createAdminSession(dbClient: DB, username: string) {
  const token = crypto.randomUUID();
  // Sesi berlaku 1 hari (24 jam)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await dbClient.insert(adminSessions).values({
    id: token,
    username,
    expiresAt
  });

  return token;
}

export async function validateAdminSession(dbClient: DB, token: string) {
  const result = await dbClient
    .select({
      sessionId: adminSessions.id,
      username: adminSessions.username,
      expiresAt: adminSessions.expiresAt,
      role: users.role,
      tenantId: users.tenantId
    })
    .from(adminSessions)
    .innerJoin(users, eq(adminSessions.username, users.username))
    .where(eq(adminSessions.id, token))
    .limit(1);

  const session = result[0];
  if (!session) return null;

  // Cek kadaluwarsa
  if (session.expiresAt < new Date()) {
    await dbClient.delete(adminSessions).where(eq(adminSessions.id, token));
    return null;
  }

  return session;
}
export async function deleteAdminSession(dbClient: DB, token: string) {
  await db.delete(adminSessions).where(eq(adminSessions.id, token));
}

/**
 * Mengambil data detail perangkat berdasarkan deviceId
 * 
 * @param dbClient - Instans Drizzle ORM (AppDb)
 * @param deviceId - ID Perangkat (contoh: '2606-1')
 * @returns Data device atau null jika tidak ditemukan
 */
export async function getDeviceById(dbClient: DB, deviceId: string) {
  try {
    const result = await dbClient
      .select()
      .from(devices)
      .where(eq(devices.deviceId, deviceId))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error(`[DB Query Error] Gagal mengambil device ${deviceId}:`, error);
    return null;
  }
}

export function generateVoucherCode(): string {
  const huruf = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const angka = '23456789';

  const h1 = huruf[Math.floor(Math.random() * huruf.length)];
  const a1 = angka[Math.floor(Math.random() * angka.length)];
  const h2 = huruf[Math.floor(Math.random() * huruf.length)];
  const a2 = angka[Math.floor(Math.random() * angka.length)];

  return `${h1}${a1}${h2}${a2}`;
}

/**
 * Mengambil data voucher berdasarkan kode unik 4 digit.
 * 
 * @param dbClient - Instans Drizzle ORM (AppDb)
 * @param code - Kode voucher (contoh: 'A1B2')
 * @returns Data voucher atau null jika tidak ditemukan
 */
export async function getVoucherByCode(dbClient: DB, code: string) {
  try {
    const cleanCode = code.trim().toUpperCase();

    const result = await dbClient
      .select()
      .from(vouchers)
      .where(eq(vouchers.voucherCode, cleanCode))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error(`[DB Query Error] Gagal mengambil voucher ${code}:`, error);
    return null;
  }
}

/**
 * Membersihkan voucher kadaluwarsa/terpakai dan membuat voucher baru.
 */
export async function createVoucherTx(dbClient: DB, generateCodeFn: () => string) {
  // 1. Hapus voucher bekas / kadaluwarsa

  // 2. Simpan voucher baru dengan mekanisme retry jika bentrok
  let kodeVoucher = '';
  let berhasilSimpan = false;
  let percobaan = 0;
  const MAKS_PERCOBAAN = 5;

  while (!berhasilSimpan && percobaan < MAKS_PERCOBAAN) {
    kodeVoucher = generateCodeFn();
    const voucherId = `vch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    try {
      await dbClient.insert(vouchers).values({
        id: voucherId,
        voucherCode: kodeVoucher,
        tipePotongan: 'NOMINAL',
        nilaiPotongan: 0,
        harga: 10000,
        kadaluwarsa: sql`datetime('now', '+7 day')`,
        isUsed: 0
      });

      berhasilSimpan = true;
    } catch (insertErr: any) {
      percobaan++;
      if (percobaan >= MAKS_PERCOBAAN) {
        throw new Error('Gagal mengalokasikan kode voucher unik setelah beberapa kali percobaan.');
      }
    }
  }

  return kodeVoucher;
}