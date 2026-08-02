import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

/**
 * Membuka / menginisialisasi Drizzle ORM menggunakan D1 Binding dari Cloudflare Platform.
 * 
 * @param d1Obj - Objek platform.env.DB dari SvelteKit RequestEvent
 */
export function getDb(d1Obj: D1Database | undefined) {
  if (!d1Obj) {
    throw new Error('Database D1 tidak ditemukan. Pastikan binding platform.env.DB dikonfigurasi dengan benar.');
  }

  // Menggabungkan Drizzle dengan D1 dan menyertakan Schema untuk type-safety
  return drizzle(d1Obj, { schema });
}

export type AppDb = ReturnType<typeof getDb>;