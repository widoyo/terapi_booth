import { fail } from '@sveltejs/kit';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { vouchers } from '$lib/server/db/schema'; // Sesuaikan path schema Anda
import { db } from '$lib/server/db'; // Sesuaikan path db Anda
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ platform }) => {

  // Ambil seluruh list voucher
  const voucherList = await db.select().from(vouchers);

  return {
    voucherList
  };
};

export const actions: Actions = {
  delete: async ({ request, platform }) => {
    const formData = await request.formData();
    const voucherCode = formData.get('voucherCode')?.toString();

    if (!voucherCode) {
      return fail(400, { message: 'Kode voucher tidak valid' });
    }

    try {
      await db.delete(vouchers).where(eq(vouchers.voucherCode, voucherCode));
      return { success: true };
    } catch (error) {
      return fail(500, { message: 'Gagal menghapus voucher' });
    }
  }
};