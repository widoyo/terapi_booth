import mqtt from 'mqtt';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { deviceLogs, devices } from '$lib/server/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export interface DeviceStatus {
  deviceId: string;
  status: string;
  isActive: boolean;
  lastSeen: number; // Unix Epoch Timestamp (ms)
  lastUp?: string | null; // ISO Date String
  firmwareBuild?: string;
  uptimeSeconds?: number;
}

let client: mqtt.MqttClient | null = null;
const lastKnownStatuses = new Map<string, DeviceStatus>();

export function getDeviceStatus(deviceId: string): DeviceStatus | undefined {
  return lastKnownStatuses.get(deviceId);
}

export function getAllDevicesStatus(): DeviceStatus[] {
  return Array.from(lastKnownStatuses.values());
}

async function ensureDeviceExists(pidibox: string) {
  const defaultHash = `hash-${pidibox}`; 
  const DEFAULT_TENANT_ID = 1;

  await db.insert(devices)
    .values({
      deviceId: pidibox,
      deviceHash: defaultHash,
      tenantId: DEFAULT_TENANT_ID,
      statusAktif: 1
    })
    .onConflictDoNothing({ target: devices.deviceId });
}

// Mengisi in-memory map dari SQLite saat server baru dinyalakan
async function seedInitialStatuses() {
  try {
    // Ambil semua device beserta status log terakhirnya
    const allDevices = await db.select({
      deviceId: devices.deviceId,
      lastUp: devices.lastUp
    }).from(devices);

    for (const dev of allDevices) {
      const latestLog = await db.select()
        .from(deviceLogs)
        .where(eq(deviceLogs.deviceId, dev.deviceId))
        .orderBy(desc(deviceLogs.id))
        .limit(1);

      if (latestLog.length > 0) {
        lastKnownStatuses.set(dev.deviceId, {
          deviceId: dev.deviceId,
          status: latestLog[0].status,
          isActive: true,
          lastSeen: new Date(latestLog[0].timestamp || Date.now()).getTime(),
          lastUp: dev.lastUp
        });
      }
    }
    console.log(`[MQTT] In-memory status seeded for ${lastKnownStatuses.size} devices`);
  } catch (err) {
    console.error('[MQTT] Failed to seed initial statuses:', err);
  }
}

export function initMqtt() {
  if (client) return client;

  // Jalankan seeding data awal dari SQLite
  seedInitialStatuses();

  const brokerUrl = env.MQTT_BROKER || 'mqtt://127.0.0.1:14983';

  client = mqtt.connect(brokerUrl, {
    reconnectPeriod: 2000
  });

  client.on('connect', () => {
    console.log('[MQTT] Terhubung ke broker lokal');
    if (env.PIDIBOX_STATUS_TOPIC) {
      client?.subscribe(env.PIDIBOX_STATUS_TOPIC);
    }
  });

  client.on('message', async (topic, message) => {
    try {
      const payload = JSON.parse(message.toString());
      if (typeof payload !== 'object' || payload === null) return;

      let { pidibox, state } = payload;
      if (!pidibox || !state) return;

      const hasBuildTime = 'build_time' in payload;
      if (hasBuildTime) {
        state = 'startup';
      }

      const nowIso = new Date().toISOString();
      const current = lastKnownStatuses.get(pidibox);
      const isStatusChanged = !current || current.status !== state;

      // HANYA proses jika status berubah atau membawa parameter build_time baru
      if (!isStatusChanged && !hasBuildTime) {
        // Cukup update lastSeen jika status sama
        if (current) current.lastSeen = Date.now();
        return;
      }

      await ensureDeviceExists(pidibox);

      let newLastUp = current?.lastUp || null;

      // Update kolom lastUp jika mengandung build_time
      if (hasBuildTime) {
        newLastUp = nowIso;
        await db.update(devices)
          .set({ lastUp: newLastUp })
          .where(eq(devices.deviceId, pidibox));
      }

      // 1. Simpan ke database HANYA jika status berubah
      if (isStatusChanged) {
        await db.insert(deviceLogs).values({
          deviceId: pidibox,
          status: state,
          timestamp: nowIso
        });
        console.log(`[DB Write] ${pidibox} status changed: ${current?.status || 'none'} -> ${state}`);
      }

      // 2. Update status in-memory
      lastKnownStatuses.set(pidibox, {
        deviceId: pidibox,
        status: state,
        isActive: true,
        lastSeen: Date.now(),
        lastUp: newLastUp,
        firmwareBuild: payload.build_time || current?.firmwareBuild,
        uptimeSeconds: payload.uptime || current?.uptimeSeconds
      });

    } catch (err) {
      console.error('[MQTT] Failed to process message:', err);
    }
  });

  client.on('error', (err) => {
    console.error('[MQTT] Error:', err.message);
  });

  return client;
}

export function getMqttClient() {
  return client;
}

async function handleShutdown() {
  if (client && client.connected) {
    await client.end();
    console.log('[MQTT] Connection closed gracefully');
  }
  process.exit(0);
}

/**
 * Helper untuk mengirimkan perintah/payload MQTT menggunakan koneksi singleton yang sudah ada.
 */
export function publishMqttCmd(topic: string, payload: object | string): boolean {
  if (!client || !client.connected) {
    console.warn('[MQTT] Tidak dapat mengirim pesan, client belum terhubung.');
    return false;
  }

  const message = typeof payload === 'object' ? JSON.stringify(payload) : payload;
  
  client.publish(topic, message, { qos: 1 }, (err) => {
    if (err) {
      console.error(`[MQTT] Gagal publish ke ${topic}:`, err);
    } else {
      console.log(`[MQTT] Publish sukses ke ${topic}:`, message);
    }
  });

  return true;
}

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);