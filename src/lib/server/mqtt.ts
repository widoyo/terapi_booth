import mqtt from 'mqtt';
import { env } from '$env/dynamic/private';

// 1. Variabel client diletakkan di luar fungsi (Module Scope / Singleton)
let client: mqtt.MqttClient | null = null;

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

  client.on('message', (topic, message) => {
    console.log(`[MQTT] ${topic}:`, message.toString());
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