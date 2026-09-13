import { db } from '$lib/server/db';
import { deviceLogs } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';

export async function load() {
  // Ambil 50 log terbaru
  const logs = await db
    .select()
    .from(deviceLogs)
    .orderBy(desc(deviceLogs.id))
    .limit(50);

  return { logs };
}