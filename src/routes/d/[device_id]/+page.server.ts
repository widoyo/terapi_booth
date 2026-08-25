import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { devices, vouchers, therapySessions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { getDeviceById, getVoucherByCode, markVoucherAsUsed } from '$lib/server/db/queries';
import { getMqttClient } from '$lib/server/mqtt';

const client = getMqttClient();

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const deviceId = params.device_id;
  const voucherCode = url.searchParams.get('v')?.trim().toUpperCase();
  console.log(`[LOAD] Device: ${deviceId}, Voucher: ${voucherCode}`);

  // 1. Jika tidak ada parameter query voucher 'v', redirect langsung ke /d
  if (!voucherCode) {
    throw redirect(303, '/d');
  }

  // 2. Ambil data perangkat & validasi voucher dari DB / Service Anda
  // (Sesuaikan logika query DB ini dengan Drizzle/ORM yang Anda gunakan)
  const device = await getDeviceById(db, deviceId);
  const voucher = await getVoucherByCode(db, voucherCode);

  // Debugging eksplisit untuk mengecek nilai setiap variabel
  console.log('[DEBUG_CHECK]', {
    deviceFound: !!device,
    voucherFound: !!voucher,
    isUsed: voucher?.isUsed, // Harus 0
    voucherDeviceId: voucher?.deviceId, // Apakah null atau cocok dengan deviceId?
    targetDeviceId: deviceId
  });

  const isVoucherUsed = Boolean(voucher?.isUsed);
  const isDeviceMismatch = voucher?.deviceId && voucher.deviceId !== deviceId;

  if (!device || !voucher || isVoucherUsed || isDeviceMismatch) {
    console.warn('[REJECTED] Navigasi ditolak karena kriteria tidak terpenuhi.');
    throw redirect(303, '/d');
  }

  return {
    device,
    voucherCode,
    // Kirim durasi operasional berdasarkan data voucher
    durasiMenit: voucher.durationMinutes || 5
  };
};

export const actions: Actions = {
  startPrep: async ({ params, url }) => {
    const deviceId = params.device_id;
    
    // Ambil durasi dari voucher/query jika diperlukan
    const voucherCode = url.searchParams.get('v');
    const voucher = voucherCode ? await getVoucherByCode(db, voucherCode) : null;
    const duration = voucher?.durationMinutes || 5;

    const payload = {
      target: deviceId,
      cmd: 'start',
      duration: duration
    };

    // Kirim ke broker MQTT (gunakan modul MQTT server Anda)
    await client?.publish(`pidibox/cmd`, JSON.stringify(payload));

    return { success: true };
  },
  // Action saat pengguna menekan Batal di masa jeda persiapan 10 detik
  cancelPrep: async ({ params, url }) => {
    const deviceId = params.device_id;
    // Logika reset/pembatalan di server jika diperlukan
    throw redirect(303, '/d');
  },

  // Action saat timer 10 detik selesai atau saat alat mulai RUNNING
  // Di sini status voucher diubah menjadi isUsed = true
  startDevice: async ({ params, url }) => {
    const voucherCode = url.searchParams.get('v');
    const deviceId = params.device_id;

    if (!voucherCode) {
      return error(400, 'Kode voucher tidak ditemukan.');
    }

    try {
      await db.transaction(async (tx) => {
        // 1. Ambil data voucher
        const [voucher] = await tx
          .select()
          .from(vouchers)
          .where(eq(vouchers.voucherCode, voucherCode))
          .limit(1);

        if (!voucher) {
          throw new Error('Voucher tidak ditemukan.');
        }

        if (voucher.isUsed) {
          throw new Error('Voucher sudah pernah digunakan.');
        }

        // 2. Ambil data device untuk memastikan tenantId sesuai
        const [device] = await tx
          .select()
          .from(devices)
          .where(eq(devices.deviceId, deviceId))
          .limit(1);

        if (!device) {
          throw new Error('Device tidak terdaftar.');
        }

        // 3. Generate Session ID & Salin Data ke therapy_sessions
        const sessionId = `SES-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

        await tx.insert(therapySessions).values({
          sessionId,
          deviceId: device.deviceId,
          tenantId: device.tenantId,
          voucherId: voucher.id,
          wa: voucher.wa ?? null,
          statusPembayaran: 'SETTLEMENT', // Dianggap lunas karena voucher valid
          nominalBayar: voucher.nominalBayar ?? 0,
          kodePromoTerpakai: voucher.kodePromo ?? null
        });

        // 4. Tandai voucher sebagai terpakai
        await markVoucherAsUsed(tx, voucherCode, deviceId);
      });

      return { success: true };
    } catch (err: any) {
      return error(400, err.message || 'Gagal memulai sesi terapi.');
    }
  },
  // Action Emergency Stop
  stop: async ({ params }) => {
    const deviceId = params.device_id;
    // Kirim instruksi MQTT / API ke perangkat untuk STOP
    throw redirect(303, '/d');
  }
};