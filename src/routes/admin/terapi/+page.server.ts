import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { therapySessions, tenants } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  if (!user) throw error(401, 'Unauthorized');

  let sessionList = [];

  if (user.role === 'SUPER_ADMIN') {
    // Super Admin: Melihat seluruh sesi beserta nama tenant
    sessionList = await db
      .select({
        sessionId: therapySessions.sessionId,
        deviceId: therapySessions.deviceId,
        tenantId: therapySessions.tenantId,
        tenantName: tenants.namaTenant,
        voucherId: therapySessions.voucherId,
        namaPelanggan: therapySessions.namaPelanggan,
        wa: therapySessions.wa,
        statusPembayaran: therapySessions.statusPembayaran,
        nominalBayar: therapySessions.nominalBayar,
        kodePromoTerpakai: therapySessions.kodePromoTerpakai,
        waktuMulai: therapySessions.waktuMulai
      })
      .from(therapySessions)
      .leftJoin(tenants, eq(therapySessions.tenantId, tenants.tenantId))
      .orderBy(desc(therapySessions.waktuMulai));
  } else {
    // Tenant Admin: Hanya melihat sesi milik tenant yang bersangkutan
    if (!user.tenantId) throw error(403, 'User tidak terasosiasi dengan tenant.');

    sessionList = await db
      .select()
      .from(therapySessions)
      .where(eq(therapySessions.tenantId, user.tenantId))
      .orderBy(desc(therapySessions.waktuMulai));
  }

  return {
    userRole: user.role,
    sessions: sessionList
  };
};