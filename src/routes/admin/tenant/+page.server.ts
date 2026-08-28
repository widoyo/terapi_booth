import { error, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { tenants, outlets, devices, invoices, therapySessions, tenantConfigs } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
  const user = locals.user;
  if (!user || user.role !== 'SUPER_ADMIN') {
    throw error(403, 'Akses ditolak. Fitur ini khusus Super Admin.');
  }

  // 1. Ambil daftar semua tenant
  const tenantList = await db
    .select()
    .from(tenants)
    .orderBy(desc(tenants.tenantId));

  // 2. Jika ada query param ?id=X, ambil detail relasi tenant tersebut
  const selectedId = url.searchParams.get('id');
  let selectedTenantData = null;

  if (selectedId) {
    const tid = Number(selectedId);
    
    const [tenant] = await db.select().from(tenants).where(eq(tenants.tenantId, tid)).limit(1);

    if (tenant) {
      const [config] = await db.select().from(tenantConfigs).where(eq(tenantConfigs.tenantId, tid)).limit(1);
      const tenantOutlets = await db.select().from(outlets).where(eq(outlets.tenantId, tid));
      const tenantDevices = await db.select().from(devices).where(eq(devices.tenantId, tid));
      const tenantInvoices = await db.select().from(invoices).where(eq(invoices.tenantId, tid)).orderBy(desc(invoices.tanggalTerbit));
      const tenantSessions = await db.select().from(therapySessions).where(eq(therapySessions.tenantId, tid)).orderBy(desc(therapySessions.waktuMulai)).limit(20);

      selectedTenantData = {
        ...tenant,
        config,
        outlets: tenantOutlets,
        devices: tenantDevices,
        invoices: tenantInvoices,
        therapySessions: tenantSessions
      };
    }
  }

  return {
    tenants: tenantList,
    selectedTenant: selectedTenantData
  };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    if (locals.user?.role !== 'SUPER_ADMIN') throw error(403, 'Unauthorized');

    const formData = await request.formData();
    const namaTenant = formData.get('namaTenant')?.toString().trim();
    const alamat = formData.get('alamat')?.toString().trim();
    const hargaDefault = Number(formData.get('hargaDefault') || 60000);
    const durasiMenit = Number(formData.get('durasiMenit') || 30);

    if (!namaTenant) return fail(400, { message: 'Nama Tenant wajib diisi.' });

    try {
      await db.transaction(async (tx) => {
        const [inserted] = await tx.insert(tenants).values({
          namaTenant,
          alamat: alamat || null
        }).returning({ insertedId: tenants.tenantId });

        // Buat default config
        await tx.insert(tenantConfigs).values({
          tenantId: inserted.insertedId,
          hargaDefault,
          durasiMenit
        });
      });

      return { success: true };
    } catch (err: any) {
      return fail(400, { message: err.message || 'Gagal menambahkan tenant.' });
    }
  },

  update: async ({ request, locals }) => {
    if (locals.user?.role !== 'SUPER_ADMIN') throw error(403, 'Unauthorized');

    const formData = await request.formData();
    const tenantId = Number(formData.get('tenantId'));
    const namaTenant = formData.get('namaTenant')?.toString().trim();
    const alamat = formData.get('alamat')?.toString().trim();
    const hargaDefault = Number(formData.get('hargaDefault'));
    const durasiMenit = Number(formData.get('durasiMenit'));

    if (!tenantId || !namaTenant) return fail(400, { message: 'Data tidak valid.' });

    try {
      await db.transaction(async (tx) => {
        await tx.update(tenants)
          .set({ namaTenant, alamat: alamat || null })
          .where(eq(tenants.tenantId, tenantId));

        await tx.insert(tenantConfigs)
          .values({ tenantId, hargaDefault, durasiMenit })
          .onConflictDoUpdate({
            target: tenantConfigs.tenantId,
            set: { hargaDefault, durasiMenit }
          });
      });

      return { success: true };
    } catch (err: any) {
      return fail(400, { message: err.message || 'Gagal memperbarui tenant.' });
    }
  },

  delete: async ({ request, locals }) => {
    if (locals.user?.role !== 'SUPER_ADMIN') throw error(403, 'Unauthorized');

    const formData = await request.formData();
    const tenantId = Number(formData.get('tenantId'));

    if (!tenantId) return fail(400, { message: 'ID Tenant tidak valid.' });

    await db.delete(tenants).where(eq(tenants.tenantId, tenantId));
    return { success: true };
  }
};