import { fail, type Actions } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { devices, tenants } from "$lib/db/schema";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ platform }) => {
  if (!platform?.env?.DB) {
    return { deviceList: [], tenantList: [] };
  }

  const db = drizzle(platform.env.DB);

  // Read: Ambil semua device beserta nama tenant-nya
  const deviceList = await db
    .select({
      deviceId: devices.deviceId,
      deviceHash: devices.deviceHash,
      tenantId: devices.tenantId,
      tenantName: tenants.namaTenant,
      macAddress: devices.macAddress,
      hargaKustom: devices.hargaKustom,
      statusAktif: devices.statusAktif,
      createdAt: devices.createdAt,
    })
    .from(devices)
    .leftJoin(tenants, eq(devices.tenantId, tenants.tenantId));

  // Ambil daftar tenant untuk pilihan dropdown di form
  const tenantList = await db.select().from(tenants);

  return {
    deviceList,
    tenantList,
  };
};

export const actions: Actions = {
  // CREATE: Tambah Perangkat Baru
  create: async ({ request, platform }) => {
    if (!platform?.env?.DB) return fail(500, { message: "Database D1 tidak ditemukan." });

    const formData = await request.formData();
    const deviceId = formData.get("deviceId") as string;
    const deviceHash = formData.get("deviceHash") as string;
    const tenantId = Number(formData.get("tenantId"));
    const macAddress = (formData.get("macAddress") as string) || null;
    const hargaKustomRaw = formData.get("hargaKustom");
    const hargaKustom = hargaKustomRaw ? Number(hargaKustomRaw) : null;

    if (!deviceId || !deviceHash || !tenantId) {
      return fail(400, { message: "ID Perangkat, Hash, dan Tenant wajib diisi." });
    }

    const db = drizzle(platform.env.DB);

    try {
      await db.insert(devices).values({
        deviceId,
        deviceHash,
        tenantId,
        macAddress,
        hargaKustom,
        statusAktif: 1,
      });

      return { success: true, message: "Perangkat berhasil ditambahkan." };
    } catch (err: any) {
      return fail(500, { message: "Gagal menyimpan: " + err.message });
    }
  },

  // UPDATE: Perbarui Data Perangkat
  update: async ({ request, platform }) => {
    if (!platform?.env?.DB) return fail(500, { message: "Database D1 tidak ditemukan." });

    const formData = await request.formData();
    const deviceId = formData.get("deviceId") as string;
    const tenantId = Number(formData.get("tenantId"));
    const macAddress = (formData.get("macAddress") as string) || null;
    const hargaKustomRaw = formData.get("hargaKustom");
    const hargaKustom = hargaKustomRaw ? Number(hargaKustomRaw) : null;
    const statusAktif = Number(formData.get("statusAktif") ?? 1);

    if (!deviceId || !tenantId) {
      return fail(400, { message: "ID Perangkat dan Tenant wajib diisi." });
    }

    const db = drizzle(platform.env.DB);

    try {
      await db
        .update(devices)
        .set({
          tenantId,
          macAddress,
          hargaKustom,
          statusAktif,
        })
        .where(eq(devices.deviceId, deviceId));

      return { success: true, message: "Perangkat berhasil diperbarui." };
    } catch (err: any) {
      return fail(500, { message: "Gagal memperbarui: " + err.message });
    }
  },

  // DELETE: Hapus Perangkat
  delete: async ({ request, platform }) => {
    if (!platform?.env?.DB) return fail(500, { message: "Database D1 tidak ditemukan." });

    const formData = await request.formData();
    const deviceId = formData.get("deviceId") as string;

    if (!deviceId) return fail(400, { message: "ID Perangkat tidak valid." });

    const db = drizzle(platform.env.DB);

    try {
      await db.delete(devices).where(eq(devices.deviceId, deviceId));
      return { success: true, message: "Perangkat berhasil dihapus." };
    } catch (err: any) {
      return fail(500, { message: "Gagal menghapus: " + err.message });
    }
  },
};