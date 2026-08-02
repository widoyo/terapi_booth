import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import mqtt from 'mqtt';

const MQTT_URL = 'mqtt://mqtt.prinus.net:14983';

export const POST: RequestHandler = async ({ request, platform }) => {
    try {
        const notification = await request.json();
        
        const orderId = notification.order_id;
        const transactionStatus = notification.transaction_status;
        const fraudStatus = notification.fraud_status;
        
        // Ambil kembali data device_id yang kita titipkan di custom_field1
        const deviceId = notification.custom_field1; 

        console.log(`[Webhook] Menerima notifikasi untuk Order: ${orderId} | Status: ${transactionStatus}`);

        // Kondisi validasi pembayaran sukses sesuai dokumentasi Midtrans
        if (transactionStatus === 'settlement' || (transactionStatus === 'capture' && fraudStatus === 'accept')) {
            
            console.log(`[Webhook] Pembayaran SUKSES untuk pidiBox: ${deviceId}. Menyalakan alat...`);

// 1. Ambil tenant_id dari tabel devices berdasarkan device_id
            const device = await platform.env.DB.prepare(
                "SELECT tenant_id FROM devices WHERE device_id = ?"
            ).bind(deviceId).first();

            if (!device) {
                console.error(`[Webhook Error] Device ID ${deviceId} tidak ditemukan di database.`);
                return json({ error: 'Device tidak valid' }, { status: 400 });
            }

            // 2. INSERT data ke tabel therapy_sessions
            // Catatan: Nama, koordinat, dan kode_promo dikosongkan karena ini jalur pembayaran QRIS langsung murni
            await platform.env.DB.prepare(`
                INSERT INTO therapy_sessions (
                    session_id, 
                    device_id, 
                    tenant_id, 
                    nama_pelanggan, 
                    status_pembayaran, 
                    nominal_bayar, 
                    kode_promo_terpakai, 
                    latitude, 
                    longitude
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                orderId,            // session_id
                deviceId,           // device_id
                device.tenant_id,   // tenant_id (hasil query di atas)
                'Pelanggan QRIS',    // nama_pelanggan
                'SETTLEMENT',       // status_pembayaran
                notification.gross_amount,        // nominal_bayar
                null,               // kode_promo_terpakai
                null,               // latitude
                null                // longitude
            ).run();

            console.log(`[D1 Database] Transaksi ${orderId} berhasil dicatat ke therapy_sessions.`);

            // Kirim publish ke broker MQTT
            const client = mqtt.connect(MQTT_URL);
            client.on('connect', () => {
                const payload = {
                    pidibox: deviceId,
                    cmd: "start",
                    duration: 30 // Durasi operasi standar
                };
                client.publish('pidibox/cmd', JSON.stringify(payload), {}, () => {
                    client.end();
                });
            });

            // Opsional: Catat riwayat transaksi sukses ke Cloudflare D1 di sini jika diperlukan
        }

        if (transactionStatus === 'expire') {
            console.log(`[Webhook] Transaksi ${orderId} EXPIRED untuk pidiBox: ${deviceId}. Update DB & kirim sinyal ke frontend...`);

            // 1. Update status di database D1 menjadi EXPIRED
            await platform.env.DB.prepare(`
                UPDATE therapy_sessions 
                SET status_pembayaran = 'EXPIRED' 
                WHERE session_id = ?
            `).bind(orderId).run();

            // 2. Kirim sinyal info ke MQTT agar SSE bisa meneruskannya ke frontend
            // Kita bisa mengirimkan payload yang menyatakan bahwa QRIS sudah tidak berlaku
            const client = mqtt.connect(MQTT_URL);
            client.on('connect', () => {
                const payload = {
                    pidibox: deviceId,
                    state: "idle",       // Kembalikan status alat ke idle (bisa discan ulang / input voucher lagi)
                    transaction: "expired",
                    order_id: orderId
                };
                // Publikasikan ke topik status perangkat yang didengarkan oleh SSE Stream Anda
                client.publish(`pidibox/status`, JSON.stringify(payload), {}, () => {
                    client.end();
                });
            });
        }

        return json({ status: 'OK' }, { status: 200 });

    } catch (err) {
        console.error('[Webhook Error]:', err);
        return json({ error: 'Invalid payload' }, { status: 400 });
    }
};