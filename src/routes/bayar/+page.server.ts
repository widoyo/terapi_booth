import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { MIDTRANS_SERVER_KEY } from '$env/static/private';
import { generateVoucherCode, createVoucherTx } from '$lib/server/db/queries';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const MIDTRANS_BASE_URL = IS_PRODUCTION
  ? 'https://api.midtrans.com/v2'
  : 'https://api.sandbox.midtrans.com/v2';

export const actions: Actions = {
  // Action 1: Request QRIS Core API (Mendapatkan qr_string)
  generateQris: async () => {
    const orderId = `PIDI-${Date.now()}`;
    const grossAmount = 60000;

    const authHeader = 'Basic ' + Buffer.from(MIDTRANS_SERVER_KEY + ':').toString('base64');

    try {
      const res = await fetch(`${MIDTRANS_BASE_URL}/charge`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({
          payment_type: 'qris',
          transaction_details: {
            order_id: orderId,
            gross_amount: grossAmount
          },
          qris: {
            acquirer: 'gopay'
          }
        })
      });

      const responseData = await res.json();

      if (!res.ok || (responseData.status_code !== '201' && responseData.status_code !== '200')) {
        return fail(400, { 
          message: responseData.status_message || 'Gagal membuat QRIS Midtrans.' 
        });
      }

      const qrString = responseData.qr_string;

      if (!qrString) {
        return fail(400, { message: 'Data QRIS (qr_string) tidak ditemukan dari Midtrans.' });
      }

      return {
        qrisSuccess: true,
        qrString,
        orderId
      };
    } catch (err: any) {
      console.error('MIDTRANS QRIS ERROR:', err?.message || err);
      return fail(500, { 
        message: err?.message || 'Gagal terhubung ke server Midtrans.' 
      });
    }
  },

  // Action 2: Konfirmasi Pembayaran Selesai & Generate Kode Voucher ke DB
  konfirmasiBayar: async () => {
    try {
      const kodeVoucher = await createVoucherTx(db, generateVoucherCode);

      return {
        success: true,
        kodeVoucher
      };
    } catch (err: any) {
      console.error('BAYAR ACTION ERROR:', err?.message || err);
      return fail(500, { 
        message: err?.message || 'Gagal memproses pembuatan voucher.' 
      });
    }
  }
};