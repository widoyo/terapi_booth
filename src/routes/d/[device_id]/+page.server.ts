import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getDb } from '$lib/server/db';
import { getDeviceById, getVoucherByCode } from '$lib/server/db/queries';

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const d1 = await getDb(platform?.env?.DB);
  const deviceId = params.device_id;
  const voucherCode = url.searchParams.get('v')?.trim().toUpperCase();

  // 1. Jika tidak ada parameter query voucher 'v', redirect langsung ke /d
  if (!voucherCode) {
    throw redirect(303, '/d');
  }

  // 2. Ambil data perangkat & validasi voucher dari DB / Service Anda
  // (Sesuaikan logika query DB ini dengan Drizzle/ORM yang Anda gunakan)
  const device = await getDeviceById(d1, deviceId);
  const voucher = await getVoucherByCode(d1, voucherCode);

  // Jika device tidak ditemukan, voucher salah, atau voucher sudah terpakai
  if (!device || !voucher || voucher.isUsed || voucher.deviceId !== deviceId) {
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
    if (voucherCode) {
      await markVoucherAsUsed(voucherCode);
    }
    return { success: true };
  },

  // Action Emergency Stop
  stop: async ({ params }) => {
    const deviceId = params.device_id;
    // Kirim instruksi MQTT / API ke perangkat untuk STOP
    throw redirect(303, '/d');
  }
};