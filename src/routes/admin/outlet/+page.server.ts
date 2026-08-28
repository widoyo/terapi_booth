import { error, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { outlets, tenants } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import crypto from 'node:crypto';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  if (!user) throw error(401, 'Unauthorized');

  let outletList = [];
  let tenantOptions: { tenantId: number; namaTenant: string }[] = [];

  if (user.role === 'SUPER_ADMIN') {
    outletList = await db
      .select({
        outletId: outlets.outletId,
        outletHash: outlets.outletHash,
        namaOutlet: outlets.namaOutlet,
        alamat: outlets.alamat,
        latitude: outlets.latitude,
        longitude: outlets.longitude,
        createdAt: outlets.createdAt,
        tenantId: outlets.tenantId,
        namaTenant: tenants.namaTenant
      })
      .from(outlets)
      .leftJoin(tenants, eq(outlets.tenantId, tenants.tenantId))
      .orderBy(desc(outlets.outletId));

    tenantOptions = await db
      .select({
        tenantId: tenants.tenantId,
        namaTenant: tenants.namaTenant
      })
      .from(tenants);
  } else {
    if (!user.tenantId) throw error(403, 'User tidak terasosiasi dengan tenant.');

    outletList = await db
      .select({
        outletId: outlets.outletId,
        outletHash: outlets.outletHash,
        namaOutlet: outlets.namaOutlet,
        alamat: outlets.alamat,
        latitude: outlets.latitude,
        longitude: outlets.longitude,
        createdAt: outlets.createdAt,
        tenantId: outlets.tenantId,
        namaTenant: tenants.namaTenant
      })
      .from(outlets)
      .leftJoin(tenants, eq(outlets.tenantId, tenants.tenantId))
      .where(eq(outlets.tenantId, user.tenantId))
      .orderBy(desc(outlets.outletId));
  }

  return {
    userRole: user.role,
    userTenantId: user.tenantId,
    outlets: outletList,
    tenantOptions
  };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const user = locals.user;
    if (!user) throw error(401, 'Unauthorized');

    const formData = await request.formData();
    const namaOutlet = formData.get('namaOutlet')?.toString().trim();
    const alamat = formData.get('alamat')?.toString().trim();
    const latRaw = formData.get('latitude')?.toString().trim();
    const lngRaw = formData.get('longitude')?.toString().trim();
    const latitude = latRaw ? Number(latRaw) : null;
    const longitude = lngRaw ? Number(lngRaw) : null;

    let tenantId = user.tenantId;
    if (user.role === 'SUPER_ADMIN') {
      const selectedTenant = formData.get('tenantId')?.toString();
      if (selectedTenant) tenantId = Number(selectedTenant);
    }

    if (!namaOutlet || !tenantId) {
      return fail(400, { message: 'Nama outlet dan tenant wajib diisi.' });
    }

    const outletHash = crypto.randomBytes(6).toString('hex');

    try {
      await db.insert(outlets).values({
        namaOutlet,
        alamat: alamat || null,
        tenantId,
        outletHash,
        latitude,
        longitude
      });
      return { success: true };
    } catch (err: any) {
      return fail(400, { message: err.message || 'Gagal menambahkan outlet.' });
    }
  },

  update: async ({ request, locals }) => {
    const user = locals.user;
    if (!user) throw error(401, 'Unauthorized');

    const formData = await request.formData();
    const outletId = Number(formData.get('outletId'));
    const namaOutlet = formData.get('namaOutlet')?.toString().trim();
    const alamat = formData.get('alamat')?.toString().trim();
    const latRaw = formData.get('latitude')?.toString().trim();
    const lngRaw = formData.get('longitude')?.toString().trim();
    const latitude = latRaw ? Number(latRaw) : null;
    const longitude = lngRaw ? Number(lngRaw) : null;

    if (!outletId || !namaOutlet) return fail(400, { message: 'Data outlet tidak valid.' });

    if (user.role !== 'SUPER_ADMIN') {
      const [target] = await db
        .select()
        .from(outlets)
        .where(eq(outlets.outletId, outletId))
        .limit(1);

      if (!target || target.tenantId !== user.tenantId) {
        throw error(403, 'Anda tidak memiliki akses mengubah outlet ini.');
      }
    }

    let tenantId = user.tenantId;
    if (user.role === 'SUPER_ADMIN') {
      const selectedTenant = formData.get('tenantId')?.toString();
      if (selectedTenant) tenantId = Number(selectedTenant);
    }

    try {
      await db
        .update(outlets)
        .set({
          namaOutlet,
          alamat: alamat || null,
          latitude,
          longitude,
          ...(user.role === 'SUPER_ADMIN' && tenantId ? { tenantId } : {})
        })
        .where(eq(outlets.outletId, outletId));

      return { success: true };
    } catch (err: any) {
      return fail(400, { message: err.message || 'Gagal memperbarui outlet.' });
    }
  },

  delete: async ({ request, locals }) => {
    const user = locals.user;
    if (!user) throw error(401, 'Unauthorized');

    const formData = await request.formData();
    const outletId = Number(formData.get('outletId'));

    if (!outletId) return fail(400, { message: 'ID outlet tidak valid.' });

    if (user.role !== 'SUPER_ADMIN') {
      const [target] = await db
        .select()
        .from(outlets)
        .where(eq(outlets.outletId, outletId))
        .limit(1);

      if (!target || target.tenantId !== user.tenantId) {
        throw error(403, 'Anda tidak memiliki akses menghapus outlet ini.');
      }
    }

    await db.delete(outlets).where(eq(outlets.outletId, outletId));
    return { success: true };
  }
};