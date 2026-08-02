// src/routes/bayar/+page.server.ts
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { getDb } from '$lib/server/db';
import { generateVoucherCode, createVoucherTx } from '$lib/server/db/queries';

export const actions: Actions = {
  default: async ({ platform }) => {
    try {
      // 1. Dapatkan instance Drizzle melalui getDb
      const db = getDb(platform?.env?.DB);

      // 2. Eksekusi pembuatan voucher via queries helper
      const kodeVoucher = await createVoucherTx(db, generateVoucherCode);

      // 3. Wajib mengembalikan objek hasil ke UI
      return {
        success: true,
        kodeVoucher
      };

    } catch (err: any) {
      console.error('BAYAR ACTION ERROR:', err?.message || err);
      return fail(500, { 
        message: err?.message || 'Gagal memproses pembayaran.' 
      });
    }
  }
};