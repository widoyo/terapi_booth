import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { devices, therapySessions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { publishMqttCmd } from '$lib/server/mqtt';

export const POST: RequestHandler = async ({ request }) => {
  let orderId = '';

  try {
    const notification = await request.json();

    orderId = notification.order_id;
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;
    const deviceId = notification.custom_field1 || null;

    console.log(`[Webhook Midtrans] Order: ${orderId} | Status: ${transactionStatus} | Device: ${deviceId || 'N/A'}`);

    // 1. Kondisi Pembayaran SUKSES
    if (transactionStatus === 'settlement' || (transactionStatus === 'capture' && fraudStatus === 'accept')) {
      console.log(`[Webhook] Pembayaran SUKSES untuk Order: ${orderId}`);

      if (deviceId) {
        const [device] = await db
          .select({ tenantId: devices.tenantId })
          .from(devices)
          .where(eq(devices.deviceId, deviceId))
          .limit(1);

        if (device) {
          // INSERT transaksi ke tabel therapySessions
          await db.insert(therapySessions).values({
            sessionId: orderId,
            deviceId: deviceId,
            tenantId: device.tenantId,
            namaPelanggan: 'Pelanggan QRIS',
            statusPembayaran: 'SETTLEMENT',
            nominalBayar: Number(notification.gross_amount),
            kodePromoTerpakai: null,
            latitude: null,
            longitude: null
          });

          console.log(`[SQLite DB] Transaksi ${orderId} berhasil dicatat.`);

          // Kirim perintah menyalakan alat via koneksi MQTT utama
          publishMqttCmd(`pidibox/cmd/${deviceId}`, {
            pidibox: deviceId,
            cmd: 'start',
            duration: 30
          });
        } else {
          console.error(`[Webhook Error] Device ID ${deviceId} tidak ditemukan di SQLite.`);
        }
      }
    }

    // 2. Kondisi Transaksi EXPIRED
    if (transactionStatus === 'expire') {
      console.log(`[Webhook] Transaksi ${orderId} EXPIRED.`);

      try {
        await db
          .update(therapySessions)
          .set({ statusPembayaran: 'EXPIRED' })
          .where(eq(therapySessions.sessionId, orderId));
      } catch (dbErr) {
        console.warn(`[SQLite DB Warn] Gagal update EXPIRED untuk ${orderId}:`, dbErr);
      }

      if (deviceId) {
        publishMqttCmd(`pidibox/status`, {
          pidibox: deviceId,
          state: 'idle',
          transaction: 'expired',
          order_id: orderId
        });
      }
    }

    return json({ status: 'OK', message: 'Notification received successfully' }, { status: 200 });

  } catch (err: any) {
    console.error(`[Webhook Error] Gagal memproses order ${orderId}:`, err);
    return json({ status: 'ERROR_HANDLED', message: 'Error processing notification' }, { status: 200 });
  }
};