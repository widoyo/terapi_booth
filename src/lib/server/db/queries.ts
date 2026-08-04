import { devices, vouchers, adminSessions, users } from '$lib/server/db/schema';
import { eq, or, sql } from 'drizzle-orm';

interface NewUserData {
  username: string;
  passwordPlain: string;
  role?: 'SUPER_ADMIN' | 'TENANT_ADMIN';
  tenantId?: number | null;
}

export async function markVoucherAsUsed(db: AppDb, voucherCode: string) {
  await db.update(vouchers)
    .set({
      isUsed: 1,
      usedAt: sql`datetime('now')`
    })
    .where(eq(vouchers.voucherCode, voucherCode));
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

export async function createUser(db: AppDb, data: NewUserData) {
  const passwordHash = await hashPassword(data.passwordPlain);

  const [newUser] = await db
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

export async function createAdminSession(db: AppDb, username: string) {
  const token = crypto.randomUUID();
  // Sesi berlaku 1 hari (24 jam)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db.insert(adminSessions).values({
    id: token,
    username,
    expiresAt
  });

  return token;
}

export async function validateAdminSession(db: AppDb, token: string) {
  const result = await db
    .select()
    .from(adminSessions)
    .where(eq(adminSessions.id, token))
    .limit(1);

  const session = result[0];
  if (!session) return null;

  // Cek apakah expired
  if (session.expiresAt < new Date()) {
    await db.delete(adminSessions).where(eq(adminSessions.id, token));
    return null;
  }

  return session;
}

export async function deleteAdminSession(db: AppDb, token: string) {
  await db.delete(adminSessions).where(eq(adminSessions.id, token));
}

/**
 * Mengambil data detail perangkat berdasarkan deviceId
 * 
 * @param db - Instans Drizzle ORM (AppDb)
 * @param deviceId - ID Perangkat (contoh: '2606-1')
 * @returns Data device atau null jika tidak ditemukan
 */
export async function getDeviceById(db: AppDb, deviceId: string) {
  try {
    const result = await db
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
 * @param db - Instans Drizzle ORM (AppDb)
 * @param code - Kode voucher (contoh: 'A1B2')
 * @returns Data voucher atau null jika tidak ditemukan
 */
export async function getVoucherByCode(db: AppDb, code: string) {
  try {
    const cleanCode = code.trim().toUpperCase();

    const result = await db
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
export async function createVoucherTx(db: AppDb, generateCodeFn: () => string) {
  // 1. Hapus voucher bekas / kadaluwarsa
  await db.delete(vouchers).where(
    or(
      eq(vouchers.isUsed, 1),
      sql`datetime(${vouchers.kadaluwarsa}) < datetime('now')`
    )
  );

  // 2. Simpan voucher baru dengan mekanisme retry jika bentrok
  let kodeVoucher = '';
  let berhasilSimpan = false;
  let percobaan = 0;
  const MAKS_PERCOBAAN = 5;

  while (!berhasilSimpan && percobaan < MAKS_PERCOBAAN) {
    kodeVoucher = generateCodeFn();
    const voucherId = `vch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    try {
      await db.insert(vouchers).values({
        id: voucherId,
        voucherCode: kodeVoucher,
        tipePotongan: 'NOMINAL',
        nilaiPotongan: 10000,
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