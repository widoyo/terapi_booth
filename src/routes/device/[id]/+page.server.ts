import { error } from '@sveltejs/kit';

export const load = async ({ params, platform }) => {
  const deviceId = params.id;
  const db = platform?.env?.DB; // Binding Cloudflare D1

  if (!db) {
    // Fallback jika dijalankan di lokal tanpa miniflare/d1 binding saat dev
    return {
      device: { device_id: deviceId, tenant_id: 1, harga: 20000, durasi_menit: 15 }
    };
  }

  // Query menggabungkan data device dengan config default tenant-nya
  const query = `
    SELECT 
      d.device_id, 
      d.tenant_id, 
      d.harga_kustom, 
      c.harga_default, 
      c.durasi_menit
    FROM devices d
    JOIN tenant_configs c ON d.tenant_id = c.tenant_id
    WHERE d.device_id = ? AND d.status_aktif = 1
    LIMIT 1
  `;

  const { results } = await db.prepare(query).bind(deviceId).all();

  if (results.length === 0) {
    throw error(404, { message: 'Perangkat tidak ditemukan atau sedang dinonaktifkan.' });
  }

  const row = results[0];
  
  // Logika penentuan harga: gunakan harga_kustom jika ada, jika NULL pakai harga_default
  const hargaFinal = row.harga_kustom !== null ? row.harga_kustom : row.harga_default;

  return {
    device: {
      device_id: row.device_id,
      tenant_id: row.tenant_id,
      harga: hargaFinal,
      durasi_menit: row.durasi_menit
    }
  };
};