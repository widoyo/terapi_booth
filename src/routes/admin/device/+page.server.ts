import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { devices, tenants } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  if (!user) throw error(401, 'Unauthorized');

  let deviceList = [];

  if (user.role === 'SUPER_ADMIN' || user.role === 'TENANT_ADMIN') {
    // Super Admin: Join dengan tabel tenants untuk menampilkan nama tenant
    deviceList = await db
      .select({
        deviceId: devices.deviceId,
        deviceHash: devices.deviceHash,
        macAddress: devices.macAddress,
        hargaKustom: devices.hargaKustom,
        statusAktif: devices.statusAktif,
        createdAt: devices.createdAt,
        tenantId: devices.tenantId,
        tenantName: tenants.namaTenant
      })
      .from(devices)
      .leftJoin(tenants, eq(devices.tenantId, tenants.tenantId))
      .where(eq(devices.tenantId, user.tenantId));
  } else {
    // Tenant Admin: Hanya ambil device sesuai tenantId user
    if (!user.tenantId) throw error(403, 'User tidak terasosiasi dengan tenant.');

    deviceList = await db
      .select()
      .from(devices)
      .where(eq(devices.tenantId, user.tenantId));
  }

  return {
    userRole: user.role,
    devices: deviceList
  };
};