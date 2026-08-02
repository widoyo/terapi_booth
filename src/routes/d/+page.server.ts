// src/routes/d/+page.server.ts
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import { devices, vouchers } from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import mqtt from 'mqtt';

// Gunakan singleton MQTT client yang sama
const MQTT_URL = 'mqtt://mqtt.prinus.net:14983';

// @ts-ignore
if (!globalThis.mqttClient) {
  // @ts-ignore
  globalThis.mqttClient = mqtt.connect(MQTT_URL);
}

export const load: PageServerLoad = async ({ platform }) => {
  const d1 = platform?.env?.DB;
  if (!d1) return { devicesList: [] };

  const db = drizzle(d1);
  const list = await db.select().from(devices);

  // Bobot urutan: IDLE (1), RUNNING (2), OFFLINE (3)
  const statusPriority: Record<string, number> = {
    IDLE: 1,
    RUNNING: 2,
    OFFLINE: 3
  };

  list.sort((a, b) => {
    const pA = statusPriority[a.status?.toUpperCase() || 'OFFLINE'] ?? 99;
    const pB = statusPriority[b.status?.toUpperCase() || 'OFFLINE'] ?? 99;
    return pA - pB;
  });

  return { devicesList: list };
};

export const actions: Actions = {
  default: async ({ request, platform }) => {
    const formData = await request.formData();
    const deviceId = formData.get('deviceId')?.toString();
    const voucherCode = formData.get('voucherCode')?.toString().toUpperCase().trim();

    if (!deviceId || !voucherCode) {
      return fail(400, { message: 'Perangkat dan Kode Voucher wajib diisi.' });
    }

    if (voucherCode.length !== 4) {
      return fail(400, { message: 'Kode Voucher harus 4 digit.' });
    }

    const d1 = platform?.env?.DB;
    if (!d1) return fail(500, { message: 'Database tidak ditemukan.' });

    const db = drizzle(d1);

    // 1. Validasi voucher
    const [voucher] = await db
      .select()
      .from(vouchers)
      .where(
        and(
          eq(vouchers.voucherCode, voucherCode),
          eq(vouchers.isUsed, 0),
          sql`${vouchers.kadaluwarsa} > DATETIME('now')`
        )
      )
      .limit(1);

    if (!voucher) {
      return fail(400, { message: 'Kode Voucher tidak valid atau sudah kadaluwarsa.' });
    }

    // 2. Tandai voucher sebagai terpakai
    await db
      .update(vouchers)
      .set({ isUsed: 1 })
      .where(eq(vouchers.voucherCode, voucherCode));

    // 3. Kirim Perintah Aktivasi ke MQTT Hardware
    // @ts-ignore
    const client = globalThis.mqttClient;
    if (client && client.connected) {
      const payload = JSON.stringify({
        pidibox: deviceId,
        action: 'START',
        voucher: voucherCode
      });
      client.publish(`pidibox/cmd/${deviceId}`, payload);
    }

    // 4. Redirect ke halaman monitoring real-time
    throw redirect(303, `/d/${deviceId}`);
  }
};