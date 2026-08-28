import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { outlets, devices, vouchers } from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import mqtt from 'mqtt';
import type { PageServerLoad, Actions } from './$types';

const MQTT_URL = 'mqtt://mqtt.prinus.net:14983';

// Singleton MQTT Client di Sisi Server
// @ts-ignore
if (!globalThis.mqttClient) {
  // @ts-ignore
  globalThis.mqttClient = mqtt.connect(MQTT_URL);

  // @ts-ignore
  globalThis.mqttClient.on('connect', () => {
    // @ts-ignore
    globalThis.mqttClient.subscribe('pidibox/status');
  });

  // Penyimpanan state perangkat di memori server
  // @ts-ignore
  globalThis.liveDeviceStatuses = globalThis.liveDeviceStatuses || {};

  // @ts-ignore
  globalThis.mqttClient.on('message', (topic: string, message: Buffer) => {
    if (topic === 'pidibox/status') {
      try {
        const payload = JSON.parse(message.toString());
        if (payload.deviceId && typeof payload.status !== 'undefined') {
          // @ts-ignore
          globalThis.liveDeviceStatuses[payload.deviceId] = payload.status;
        }
      } catch {}
    }
  });
}

export const load: PageServerLoad = async ({ params }) => {
  const outletId = Number(params.id);
  if (!outletId) throw error(400, 'ID Outlet tidak valid');

  const [outlet] = await db
    .select()
    .from(outlets)
    .where(eq(outlets.outletId, outletId))
    .limit(1);

  if (!outlet) throw error(404, 'Outlet tidak ditemukan');

  const outletDevices = await db
    .select()
    .from(devices)
    .where(eq(devices.outletId, outletId));

  // Penggabungan status database dengan status terupdate dari server MQTT
  // @ts-ignore
  const liveStatuses = globalThis.liveDeviceStatuses || {};

  const mappedDevices = outletDevices.map((dev) => ({
    ...dev,
    // Gunakan status MQTT live jika ada, jika tidak gunakan status dari DB
    statusAktif: liveStatuses[dev.deviceId] ?? dev.statusAktif
  }));

  return {
    outlet,
    devices: mappedDevices
  };
};

export const actions: Actions = {
  useVoucher: async ({ request, params }) => {
    const formData = await request.formData();
    const voucherCode = formData.get('voucherCode')?.toString().toUpperCase().trim();
    const deviceId = formData.get('deviceId')?.toString().trim();

    if (!voucherCode || voucherCode.length !== 4) {
      return fail(400, { message: 'Kode Voucher harus 4 digit.' });
    }

    if (!deviceId) {
      return fail(400, { message: 'Pilih perangkat terlebih dahulu.' });
    }

    // 1. Validasi voucher di DB
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
      .set({
        isUsed: 1,
        usedAt: new Date().toISOString(),
        deviceId
      })
      .where(eq(vouchers.voucherCode, voucherCode));

    // 3. Publish Perintah Aktivasi via Server MQTT Client
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

    // 4. Redirect ke halaman sesi/monitoring
    throw redirect(303, `/d/${deviceId}`);
  }
};