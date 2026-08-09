import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { vouchers } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const { voucherCode, wa } = await request.json();

  if (!voucherCode || !wa) {
    throw error(400, 'Kode Voucher dan No WA wajib diisi');
  }

  await db
    .update(vouchers)
    .set({ wa })
    .where(eq(vouchers.voucherCode, voucherCode));

  return json({ success: true });
};