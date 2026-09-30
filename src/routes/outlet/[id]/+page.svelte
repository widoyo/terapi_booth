<script lang="ts">
  import { ArrowLeft, Cpu, CheckCircle2, XCircle, Ticket, ChevronRight, X, MapPin } from '@lucide/svelte';
  import { enhance } from '$app/forms';
  import { onMount } from 'svelte';

  let { data, form } = $props();
  let outlet = $derived(data.outlet);
  let deviceList = $derived(data.devices ?? []);

  // Menyimpan ID pidiBox yang sedang aktif dipilih form-nya
  let activeDeviceId = $state('');
  let isSubmitting = $state(false);

  // Status Lokasi & Jarak
  let userDistanceKm = $state<number | null>(null);
  let isCheckingLocation = $state(true);

  // Rumus Haversine untuk menghitung jarak dalam kilometer
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Jari-jari bumi (km)
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

  onMount(() => {
    if (!navigator.geolocation || !outlet.latitude || !outlet.longitude) {
      isCheckingLocation = false;
      return;
    }

    const outletLat = parseFloat(outlet.latitude);
    const outletLng = parseFloat(outlet.longitude);

    if (isNaN(outletLat) || isNaN(outletLng)) {
      isCheckingLocation = false;
      return;
    }

    // Ambil posisi pengguna untuk memverifikasi jarak ke outlet
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const dist = calculateDistance(latitude, longitude, outletLat, outletLng);
        userDistanceKm = dist;
        isCheckingLocation = false;
      },
      (err) => {
        console.warn('Gagal mendapatkan lokasi pengguna:', err.message);
        isCheckingLocation = false;
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

  // Apakah pengguna berada dalam radius 30 meter (0.03 km) dari lokasi outlet?
  let isWithinRange = $derived(
    userDistanceKm !== null && userDistanceKm <= 0.03
  );

  function toggleDeviceForm(id: string) {
    if (activeDeviceId === id) {
      activeDeviceId = '';
    } else {
      activeDeviceId = id;
    }
  }

  function closeForm() {
    activeDeviceId = '';
  }
</script>

<div class="p-6 max-w-md mx-auto space-y-4">
  <a href="/outlet" class="btn btn-ghost btn-sm gap-1 pl-0">
    <ArrowLeft class="w-4 h-4" /> Kembali
  </a>

  {#if form?.message}
    <div class="alert alert-error text-sm py-2">
      <span>{form.message}</span>
    </div>
  {/if}

  <!-- Card Detail Outlet & Perangkat -->
  <div class="card bg-base-100 border border-base-300 p-5 shadow-sm space-y-4">
    <div>
      <span class="badge badge-outline badge-neutral text-xs">Outlet Terpilih</span>
      <h2 class="text-xl font-bold text-primary mt-1">{outlet.namaOutlet}</h2>
      <p class="text-xs text-base-content/80 leading-relaxed border-t border-base-200 pt-2 mt-2">
        {outlet.alamat || 'Alamat tidak tersedia.'}
      </p>
    </div>

    <!-- Peringatan jika pengguna berada di luar jangkauan 30 meter 
    {#if !isCheckingLocation && !isWithinRange}
      <div class="alert bg-warning/10 border border-warning/30 p-3 text-xs flex items-start gap-2">
        <MapPin class="w-4 h-4 text-warning shrink-0 mt-0.5" />
        <div>
          <span class="font-bold text-warning-content block">Anda belum berada di lokasi outlet</span>
          <p class="text-base-content/70 mt-0.5">
            {#if userDistanceKm !== null}
              Jarak Anda saat ini: <b>{(userDistanceKm * 1000).toFixed(0)} m</b> dari outlet.
            {:else}
              Izin lokasi dibutuhkan untuk mengaktifkan alat di lokasi.
            {/if}
            Tombol pengaktifan alat hanya aktif jika Anda berada dalam radius <b>30 meter</b>.
          </p>
        </div>
      </div>
    {/if}
    -->
    <!-- Daftar Perangkat pidiBox -->
    <div class="space-y-3">
      <p class="text-sm font-semibold flex items-center gap-1">
        <Cpu class="w-4 h-4 text-primary" /> Daftar Perangkat:
      </p>

      <div class="space-y-2.5">
        {#each deviceList as dev}
          <div 
            class="rounded-xl border transition-all overflow-hidden {activeDeviceId === dev.deviceId ? 'border-primary bg-primary/5 shadow-sm' : 'border-base-200 bg-base-100'}"
          >
            <!-- Baris Utama Perangkat -->
            <div class="p-3 flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="font-mono font-bold text-lg text-base-content">{dev.deviceId}</span>
                {#if dev.statusAktif === 1}
                  <span class="badge badge-success badge-sm gap-1 text-[10px]">
                    <CheckCircle2 class="w-3 h-3" /> Siap
                  </span>
                {:else}
                  <span class="badge badge-error badge-sm gap-1 text-[10px]">
                    <XCircle class="w-3 h-3" /> Off / Dipakai
                  </span>
                {/if}
              </div>

              <!-- Tombol Gunakan Alat ini HANYA tampil jika statusAktif === 1 dan Jarak < 30 meter -->
              {#if dev.statusAktif === 1 && isWithinRange}
                <button
                  type="button"
                  onclick={() => toggleDeviceForm(dev.deviceId)}
                  class="btn btn-md {activeDeviceId === dev.deviceId ? 'btn-ghost' : 'btn-primary'} gap-1"
                >
                  <span>Gunakan Alat ini</span>
                  <ChevronRight class="w-3 h-3 transition-transform {activeDeviceId === dev.deviceId ? 'rotate-90' : ''}" />
                </button>
              {/if}
            </div>

            <!-- Form Input Voucher Sebaris -->
            {#if activeDeviceId === dev.deviceId && isWithinRange}
              <form
                method="POST"
                action="?/useVoucher"
                use:enhance={() => {
                  isSubmitting = true;
                  return async ({ update }) => {
                    isSubmitting = false;
                    await update();
                  };
                }}
                class="p-3 pt-0 border-t border-primary/20 bg-base-100/60"
              >
                <input type="hidden" name="deviceId" value={dev.deviceId} />

                <div class="flex items-center gap-2 mt-2">
                  <div class="relative flex-1">
                    <Ticket class="w-4 h-4 text-primary absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="voucherCode"
                      placeholder="KODE VOUCHER (4 DIGIT)"
                      maxLength={4}
                      required
                      autofocus
                      class="input input-lg input-bordered input-primary w-full text-center pl-4 font-mono uppercase tracking-wider text-lg"
                    />
                  </div>

                  <!-- Tombol Submit -->
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    class="btn btn-lg btn-primary shrink-0"
                  >
                    {#if isSubmitting}
                      <span class="loading loading-spinner loading-xs"></span>
                    {:else}
                      Proses
                    {/if}
                  </button>

                  <!-- Tombol Batal (X) -->
                  <button
                    type="button"
                    onclick={closeForm}
                    class="btn btn-lg btn-square btn-ghost text-base-content/60 hover:text-error shrink-0"
                    title="Batal"
                  >
                    <X class="w-6 h-6" />
                  </button>
                </div>
              </form>
            {/if}
          </div>
        {:else}
          <p class="text-xs text-base-content/40 italic py-2">Belum ada perangkat terdaftar di outlet ini.</p>
        {/each}
      </div>
    </div>
  </div>
</div>