import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';
import { outlets, devices } from '$lib/server/db/schema';
import { getAllDevicesStatus } from '$lib/server/mqtt';
import { eq } from 'drizzle-orm';

export const load: LayoutServerLoad = async ({ locals }) => {
  // 1. Ambil data outlet beserta daftar device-nya dari SQLite
  const outletList = await db
    .select({
      outletId: outlets.outletId,
      outletHash: outlets.outletHash,
      namaOutlet: outlets.namaOutlet,
      alamat: outlets.alamat,
      kota: outlets.kota,
      kecamatan: outlets.kecamatan,
      kelurahan: outlets.kelurahan,
      latitude: outlets.latitude,
      longitude: outlets.longitude,
      deviceId: devices.deviceId
    })
    .from(outlets)
    .leftJoin(devices, eq(devices.outletId, outlets.outletId));

  // 2. Ambil status in-memory dari MQTT service
  const activeStatuses = getAllDevicesStatus();
  const statusMap = new Map(activeStatuses.map((s) => [s.deviceId, s]));

  // 3. Gabungkan data outlet dengan status device dari memori
  const outletsWithStatus = outletList.map((item) => {
    const liveStatus = item.deviceId ? statusMap.get(item.deviceId) : undefined;

    return {
      outletId: item.outletId,
      namaOutlet: item.namaOutlet,
      alamat: item.alamat,
      kota: item.kota,
      latitude: item.latitude,
      longitude: item.longitude,
      device: item.deviceId
        ? {
            deviceId: item.deviceId,
            status: liveStatus?.status || 'offline',
            isActive: liveStatus?.isActive ?? false,
            lastSeen: liveStatus?.lastSeen || null,
            lastUp: liveStatus?.lastUp || null
          }
        : null
    };
  });

  return {
    user: locals.user || null,
    outlets: outletsWithStatus
  };
};