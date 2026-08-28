import { error, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { devices, tenants, outlets } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import crypto from 'node:crypto';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  if (!user) throw error(401, 'Unauthorized');

  let deviceList = [];
  let tenantOptions: { tenantId: number; namaTenant: string }[] = [];
  let outletOptions: { outletId: number; namaOutlet: string; tenantId: number }[] = [];

  if (user.role === 'SUPER_ADMIN') {
    deviceList = await db
      .select({
        deviceId: devices.deviceId,
        deviceHash: devices.deviceHash,
        outletId: devices.outletId,
        namaOutlet: outlets.namaOutlet,
        hargaKustom: devices.hargaKustom,
        statusAktif: devices.statusAktif,
        createdAt: devices.createdAt,
        tenantId: devices.tenantId,
        tenantName: tenants.namaTenant
      })
      .from(devices)
      .leftJoin(tenants, eq(devices.tenantId, tenants.tenantId))
      .leftJoin(outlets, eq(devices.outletId, outlets.outletId))
      .orderBy(desc(devices.createdAt));

    tenantOptions = await db
      .select({
        tenantId: tenants.tenantId,
        namaTenant: tenants.namaTenant
      })
      .from(tenants);

    outletOptions = await db
      .select({
        outletId: outlets.outletId,
        namaOutlet: outlets.namaOutlet,
        tenantId: outlets.tenantId
      })
      .from(outlets);
  } else {
    if (!user.tenantId) throw error(403, 'User tidak terasosiasi dengan tenant.');

    deviceList = await db
      .select({
        deviceId: devices.deviceId,
        deviceHash: devices.deviceHash,
        outletId: devices.outletId,
        namaOutlet: outlets.namaOutlet,
        hargaKustom: devices.hargaKustom,
        statusAktif: devices.statusAktif,
        createdAt: devices.createdAt,
        tenantId: devices.tenantId,
        tenantName: tenants.namaTenant
      })
      .from(devices)
      .leftJoin(tenants, eq(devices.tenantId, tenants.tenantId))
      .leftJoin(outlets, eq(devices.outletId, outlets.outletId))
      .where(eq(devices.tenantId, user.tenantId))
      .orderBy(desc(devices.createdAt));

    outletOptions = await db
      .select({
        outletId: outlets.outletId,
        namaOutlet: outlets.namaOutlet,
        tenantId: outlets.tenantId
      })
      .from(outlets)
      .where(eq(outlets.tenantId, user.tenantId));
  }

  return {
    userRole: user.role,
    userTenantId: user.tenantId,
    devices: deviceList,
    tenantOptions,
    outletOptions
  };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const user = locals.user;
    if (!user) throw error(401, 'Unauthorized');

    const formData = await request.formData();
    const deviceId = formData.get('deviceId')?.toString().trim();
    const outletIdRaw = formData.get('outletId')?.toString().trim();
    const outletId = outletIdRaw ? Number(outletIdRaw) : null;
    const hargaKustomRaw = formData.get('hargaKustom')?.toString().trim();
    const hargaKustom = hargaKustomRaw ? Number(hargaKustomRaw) : null;

    let tenantId = user.tenantId;
    if (user.role === 'SUPER_ADMIN') {
      const selectedTenant = formData.get('tenantId')?.toString();
      if (selectedTenant) tenantId = Number(selectedTenant);
    }

    if (!deviceId || !tenantId) {
      return fail(400, { message: 'ID Device dan Tenant wajib diisi.' });
    }

    const deviceHash = crypto.randomBytes(6).toString('hex');

    try {
      await db.insert(devices).values({
        deviceId,
        deviceHash,
        tenantId,
        outletId,
        hargaKustom,
        statusAktif: 1
      });
      return { success: true };
    } catch (err: any) {
      return fail(400, { message: err.message || 'Gagal menambahkan device.' });
    }
  },

  update: async ({ request, locals }) => {
    const user = locals.user;
    if (!user) throw error(401, 'Unauthorized');

    const formData = await request.formData();
    const deviceId = formData.get('deviceId')?.toString().trim();
    const outletIdRaw = formData.get('outletId')?.toString().trim();
    const outletId = outletIdRaw ? Number(outletIdRaw) : null;
    const hargaKustomRaw = formData.get('hargaKustom')?.toString().trim();
    const hargaKustom = hargaKustomRaw ? Number(hargaKustomRaw) : null;
    const statusAktif = formData.get('statusAktif') === '1' ? 1 : 0;

    if (!deviceId) return fail(400, { message: 'ID Device tidak valid.' });

    if (user.role !== 'SUPER_ADMIN') {
      const [target] = await db
        .select()
        .from(devices)
        .where(eq(devices.deviceId, deviceId))
        .limit(1);

      if (!target || target.tenantId !== user.tenantId) {
        throw error(403, 'Anda tidak memiliki akses mengubah device ini.');
      }
    }

    let tenantId = user.tenantId;
    if (user.role === 'SUPER_ADMIN') {
      const selectedTenant = formData.get('tenantId')?.toString();
      if (selectedTenant) tenantId = Number(selectedTenant);
    }

    try {
      await db
        .update(devices)
        .set({
          outletId,
          hargaKustom,
          statusAktif,
          ...(user.role === 'SUPER_ADMIN' && tenantId ? { tenantId } : {})
        })
        .where(eq(devices.deviceId, deviceId));

      return { success: true };
    } catch (err: any) {
      return fail(400, { message: err.message || 'Gagal memperbarui device.' });
    }
  },

  delete: async ({ request, locals }) => {
    const user = locals.user;
    if (!user) throw error(401, 'Unauthorized');

    const formData = await request.formData();
    const deviceId = formData.get('deviceId')?.toString().trim();

    if (!deviceId) return fail(400, { message: 'ID Device tidak valid.' });

    if (user.role !== 'SUPER_ADMIN') {
      const [target] = await db
        .select()
        .from(devices)
        .where(eq(devices.deviceId, deviceId))
        .limit(1);

      if (!target || target.tenantId !== user.tenantId) {
        throw error(403, 'Anda tidak memiliki akses menghapus device ini.');
      }
    }

    await db.delete(devices).where(eq(devices.deviceId, deviceId));
    return { success: true };
  }
};