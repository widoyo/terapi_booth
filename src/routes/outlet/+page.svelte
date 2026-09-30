<script lang="ts">
  import { MapPin, Navigation, Building2, AlertCircle, ArrowLeft, Cpu } from '@lucide/svelte';
  import { onMount } from 'svelte';

  let loading = $state(false);
  let errorMessage = $state('');
  let nearbyOutlets = $state<any[]>([]);
  let availableCities = $state<string[]>([]);
  let isFound = $state(true);

  function deteksiLokasiDanCari() {
    if (!navigator.geolocation) {
      errorMessage = 'Browser Anda tidak mendukung deteksi lokasi.';
      return;
    }

    loading = true;
    errorMessage = '';

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const res = await fetch(`/outlet?lat=${latitude}&lng=${longitude}`);
          if (!res.ok) throw new Error('Gagal mengambil data outlet.');

          const data = await res.json();
          isFound = data.found;
          nearbyOutlets = data.outlets || [];
          availableCities = data.availableCities || [];
        } catch (err: any) {
          errorMessage = err.message || 'Terjadi kesalahan pada server.';
        } finally {
          loading = false;
        }
      },
      (err) => {
        loading = false;
        errorMessage = err.code === err.PERMISSION_DENIED ? 'Izin lokasi ditolak.' : 'Gagal mendeteksi lokasi.';
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  onMount(() => deteksiLokasiDanCari());
</script>

<div class="p-6 max-w-md mx-auto space-y-5">
  <a href="/" class="btn btn-ghost btn-sm gap-1 pl-0">
    <ArrowLeft class="w-4 h-4" /> Beranda
  </a>

  <div class="text-center space-y-1">
    <h1 class="text-2xl font-bold flex items-center justify-center gap-2">
      <MapPin class="w-6 h-6 text-primary" /> Outlet Terdekat
    </h1>
    <p class="text-base-content/70">Mencari lokasi terapi di sekitar Anda.</p>
  </div>

  <button onclick={deteksiLokasiDanCari} class="btn btn-primary w-full gap-2" disabled={loading}>
    {#if loading}
      <span class="loading loading-spinner loading-xs"></span> Mendeteksi Lokasi...
    {:else}
      <Navigation class="w-4 h-4" /> Deteksi Ulang Lokasi
    {/if}
  </button>

  {#if errorMessage}
    <div class="alert alert-error text-sm py-2"><span>{errorMessage}</span></div>
  {/if}

  {#if !loading && !errorMessage}
    {#if isFound && nearbyOutlets.length > 0}
      <div class="space-y-3">
        <p class="text-xs font-semibold text-base-content/60">Daftar Outlet Terdekat:</p>
        {#each nearbyOutlets as item}
          <div class="card bg-base-100 border border-base-300 p-4 shadow-sm space-y-3">
            <div class="flex justify-between items-start gap-2">
              <div>
                <h3 class="font-bold text-base text-primary">{item.kota}</h3>
              </div>
              
              <!-- Pengondisian Link Google Maps berdasarkan Jarak (< 50 km Rute, >= 50 km Titik Lokasi) -->
              <button>
                {#if item.distanceKm < 50}
                  <a 
                    href={item.gmapsDirectionUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    title="Petunjuk Rute ke Outlet"
                  >
                    <span class="badge badge-soft badge-neutral font-mono text-xs text-gray-500 shrink-0 flex items-center gap-1 hover:badge-primary transition-colors">
                      {item.distanceKm}&nbsp;km 
                      <Navigation class="w-3.5 h-3.5" />
                    </span>
                  </a>
                {:else}
                  <a 
                    href={item.gmapsPlaceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    title="Lihat Titik Lokasi Outlet"
                  >
                    <span class="badge badge-soft badge-neutral font-mono text-xs text-gray-500 shrink-0 flex items-center gap-1 hover:badge-primary transition-colors">
                      
                      <MapPin class="w-3.5 h-3.5" />
                    </span>
                  </a>
                {/if}
                </button>
            </div>

            <p class="text-xs text-base-content/70 leading-relaxed">
              <strong>{item.namaOutlet}</strong><br>
              {item.alamat || 'Alamat tidak tersedia.'}, Kec. {item.kecamatan}
            </p>

            <div class="pt-2 border-t border-base-200 flex items-center justify-between text-xs">
              <div class="flex items-center gap-1.5">
                <Cpu class="w-4 h-4 text-base-content/60" />
                {#if item.totalDevices > 0}
                  <span>Tersedia <b>{item.totalDevices}</b> Alat</span>
                {:else}
                  <span class="text-base-content/40 italic">Belum ada alat</span>
                {/if}
              </div>

              <div class="flex gap-2">
              <!-- Belum ada gunanya untuk pilih outlet
                {#if item.totalDevices > 0}
                  <a href={`/outlet/${item.outletId}`} class="btn btn-xs btn-primary">Pilih Outlet Ini</a>
                {/if}
              -->
              </div>
            </div>
          </div>
        {/each}
      </div>
    {:else if !isFound}
      <div class="card bg-warning/10 border border-warning/30 p-5 space-y-4">
        <div class="flex items-start gap-3">
          <AlertCircle class="w-6 h-6 text-warning shrink-0 mt-0.5" />
          <div>
            <h3 class="font-bold text-sm text-warning-content">Outlet Belum Tersedia</h3>
            <p class="text-xs text-base-content/70 mt-1">Belum ada outlet terdaftar di lokasi Anda.</p>
          </div>
        </div>

        {#if availableCities.length > 0}
          <div class="pt-2 border-t border-warning/20">
            <p class="text-xs font-semibold mb-2 flex items-center gap-1">
              <Building2 class="w-3.5 h-3.5 text-primary" /> Outlet tersedia di kota:
            </p>
            <div class="flex flex-wrap gap-1.5">
              {#each availableCities as city}
                <span class="badge badge-outline badge-primary text-xs font-medium py-2">{city}</span>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}
  {/if}
</div>