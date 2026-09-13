import mqtt from 'mqtt';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { deviceLogs, devices } from '$lib/server/db/schema';

// 1. Variabel client diletakkan di luar fungsi (Module Scope / Singleton)
let client: mqtt.MqttClient | null = null;
const lastKnownStatuses = new Map();

// Helper function untuk auto-insert device baru jika belum terdaftar
async function ensureDeviceExists(pidibox: string) {
  // Buat hash placeholder sederhana jika deviceHash belum ada
  const defaultHash = `hash-${pidibox}`; 
  const DEFAULT_TENANT_ID = 1; // Pastikan tenant_id dengan ID ini sudah ada di database kamu

  await db.insert(devices)
    .values({
      deviceId: pidibox,
      deviceHash: defaultHash,
      tenantId: DEFAULT_TENANT_ID,
      statusAktif: 1
    })
    .onConflictDoNothing({ target: devices.deviceId });
}

export function initMqtt() {
  // Jika client sudah dibuat sebelumnya, kembalikan instance yang ada
  if (client) {
    return client;
  }

  const brokerUrl = env.MQTT_BROKER || 'mqtt://127.0.0.1:14983';

  // 2. Inisialisasi instance baru jika belum ada
  client = mqtt.connect(brokerUrl, {
    reconnectPeriod: 2000
  });

  client.on('connect', () => {
    console.log('[MQTT] Terhubung ke broker lokal');
    client?.subscribe(env.PIDIBOX_STATUS_TOPIC);
  });

  client.on('message', async (topic, message) => {
    console.log(`[MQTT] ${topic}:`, message.toString());
    try {
      // Asumsi payload JSON: { "deviceId": "box-01", "status": "running" }
      const payload = JSON.parse(message.toString());
      if (typeof payload !== 'object' || payload === null) return;
      let { pidibox, state } = payload;
      console.log(`[MQTT] Received status update for ${pidibox}: ${state}`);

      if (!pidibox || !state) return;

      if ('build_time' in payload) {
        state = 'startup'; // Override status jika ada build_time
      }
      const currentStatus = lastKnownStatuses.get(pidibox);

      // Cek in-memory: abaikan jika status tidak berubah
      if (currentStatus === state) {
        return;
      }

      // 1. Pastikan device terdaftar dulu di tabel devices
      await ensureDeviceExists(pidibox);

      // Update memori & tulis ke SQLite hanya jika status berubah
      lastKnownStatuses.set(pidibox, state);

      await db.insert(deviceLogs).values({
        deviceId: pidibox,
        status: state,
        timestamp: new Date().toISOString()
      });

      console.log(`[DB Write] ${pidibox} status changed: ${currentStatus} -> ${state}`);
    } catch (err) {
      console.error('[MQTT] Failed to process message:', err);
    }
  });

  client.on('error', (err) => {
    console.error('[MQTT] Error:', err.message);
  });

  return client;
}

// 3. Helper jika ingin menggunakan instance client di tempat lain (misal: publikasi pesan dari API)
export function getMqttClient() {
  return client;
}

async function handleShutdown() {
  if (client && client.connected) {
    // Tutup koneksi MQTT secara bersih
    await client.end();
    console.log('[MQTT] Connection closed gracefully');
  }
  process.exit(0);
}

// Tangkap sinyal shutdown aplikasi (misal Ctrl+C atau restart PM2)
process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);