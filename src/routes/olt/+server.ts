import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { outlets, devices } from '$lib/server/db/schema';
import { isNotNull, and, eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// Rumus Haversine untuk menghitung jarak antara dua koordinat (dalam kilometer)
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Reverse Geocoding untuk mengekstrak Kecamatan & Kota/Kabupaten
async function getWilayahDetail(lat: number, lon: number) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14`,
      {
        headers: { 'User-Agent': 'PidiBoxApp/1.0' }
      }
    );
    if (!res.ok) return { kecamatan: '-', kota: 'Wilayah Lain' };

    const data = await res.json();
    const addr = data.address || {};

    const kecamatan =
      addr.subdistrict ||
      addr.district ||
      addr.suburb ||
      addr.village ||
      '-';

    const kota =
      addr.city ||
      addr.town ||
      addr.city_district ||
      addr.county ||
      addr.state_district ||
      'Wilayah Lain';

    return { kecamatan, kota };
  } catch {
    return { kecamatan: '-', kota: 'Wilayah Lain' };
  }
}

export const GET: RequestHandler = async ({ url }) => {
  const userLatRaw = url.searchParams.get('lat');
  const userLngRaw = url.searchParams.get('lng');

  if (!userLatRaw || !userLngRaw) {
    throw error(400, 'Koordinat pengguna (lat dan lng) wajib disertakan.');
  }

  const userLat = parseFloat(userLatRaw);
  const userLng = parseFloat(userLngRaw);

  if (isNaN(userLat) || isNaN(userLng)) {
    throw error(400, 'Format latitude atau longitude tidak valid.');
  }

  // 1. Ambil seluruh outlet beserta perangkat terkait
  const allOutlets = await db
    .select({
      outletId: outlets.outletId,
      outletHash: outlets.outletHash,
      namaOutlet: outlets.namaOutlet,
      alamat: outlets.alamat,
      latitude: outlets.latitude,
      longitude: outlets.longitude
    })
    .from(outlets)
    .where(and(isNotNull(outlets.latitude), isNotNull(outlets.longitude)));

  // Ambil semua data perangkat untuk dihitung per outlet
  const allDevices = await db
    .select({
      outletId: devices.outletId,
      statusAktif: devices.statusAktif
    })
    .from(devices);

  // 2. Olah data jarak, wilayah, dan statistik perangkat
  const processedOutlets = await Promise.all(
    allOutlets.map(async (outlet) => {
      const outletLat = parseFloat(outlet.latitude!);
      const outletLng = parseFloat(outlet.longitude!);

      const distanceKm = calculateHaversineDistance(
        userLat,
        userLng,
        outletLat,
        outletLng
      );

      // Detail Wilayah
      const wilayah = await getWilayahDetail(outletLat, outletLng);

      // Hitung perangkat per outlet
      const outletDevs = allDevices.filter((d) => d.outletId === outlet.outletId);
      const totalDevices = outletDevs.length;
      const activeDevices = outletDevs.filter((d) => d.statusAktif === 1).length;

      // Link Google Maps Direction dari posisi user ke outlet
      const gmapsDirectionUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${outletLat},${outletLng}&travelmode=driving`;

      return {
        ...outlet,
        distanceKm: Number(distanceKm.toFixed(2)),
        kecamatan: wilayah.kecamatan,
        kota: wilayah.kota,
        gmapsDirectionUrl,
        totalDevices,
        activeDevices
      };
    })
  );

  // 3. Filter outlet dalam radius 50 km
  const nearbyOutlets = processedOutlets
    .filter((outlet) => outlet.distanceKm <= 50)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  // 4. Jika tidak ada outlet dalam radius 50 km
  if (nearbyOutlets.length === 0) {
    const availableCities = Array.from(
      new Set(processedOutlets.map((o) => o.kota))
    ).filter((c) => c !== 'Wilayah Lain');

    return json({
      found: false,
      message: 'Tidak ada outlet dalam radius 50 km dari lokasi Anda.',
      availableCities,
      outlets: []
    });
  }

  return json({
    found: true,
    radiusKm: 50,
    totalFound: nearbyOutlets.length,
    outlets: nearbyOutlets,
    availableCities: []
  });
};