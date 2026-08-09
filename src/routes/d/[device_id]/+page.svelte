<script lang="ts">
  import { enhance } from "$app/forms";
  import { page } from "$app/stores";
  import { onDestroy } from "svelte";

  let { 
    durasiMenit = 5, 
    onCancelPrep, 
    onStopDevice 
  } = $props<{
    durasiMenit?: number;
    onCancelPrep?: () => void;
    onStopDevice?: () => void;
  }>();

  // Konversi durasi operasional ke detik
  let runTimeLeft = $derived(durasiMenit * 60); 
  let prepTimeLeft = $state(10); // Jeda persiapan 10 detik

  // State alur: PREPARATION (10s) -> RUNNING -> COMPLETED
  let currentStatus = $state<'PREPARATION' | 'RUNNING' | 'COMPLETED'>('PREPARATION');

  let prepInterval: ReturnType<typeof setInterval>;
  let runInterval: ReturnType<typeof setInterval>;

  // === STATE SWIPE TO STOP ===
  let isDragging = $state(false);
  let dragX = $state(0);
  let maxDrag = $state(0);
  let trackEl = $state<HTMLDivElement | null>(null);
  let stopFormEl = $state<HTMLFormElement | null>(null);

  // Jalankan hitung mundur persiapan 10 detik saat komponen dimuat
  $effect(() => {
    startPreparation();
    return () => clearAllTimers();
  });

  function startPreparation() {
    prepInterval = setInterval(() => {
      prepTimeLeft -= 1;
      if (prepTimeLeft <= 0) {
        clearInterval(prepInterval);
        startRunning();
      }
    }, 1000);
  }

  async function startRunning() {
    currentStatus = 'RUNNING';

    // Eksekusi penandaan voucher di server
    const voucherCode = $page.url.searchParams.get('v');
    if (voucherCode) {
      try {
        const formData = new FormData();
        await fetch(`?/startDevice&v=${encodeURIComponent(voucherCode)}`, {
          method: 'POST',
          body: formData,
          headers: {
            'x-sveltekit-action': 'true'
          }
        });
      } catch (err) {
        console.error('Gagal memperbarui status voucher:', err);
      }
    }

    runInterval = setInterval(() => {
      runTimeLeft -= 1;
      if (runTimeLeft <= 0) {
        clearInterval(runInterval);
        currentStatus = 'COMPLETED';
      }
    }, 1000);
  }

  function handleCancelPrep() {
    clearAllTimers();
    if (onCancelPrep) onCancelPrep();
  }

  function handleStop() {
    clearAllTimers();
    currentStatus = 'COMPLETED';
    if (onStopDevice) onStopDevice();
  }

  function clearAllTimers() {
    if (prepInterval) clearInterval(prepInterval);
    if (runInterval) clearInterval(runInterval);
  }

  // === LOGIKA DRAG / SWIPE ===
  function onPointerDown(e: PointerEvent) {
    if (!trackEl) return;
    isDragging = true;
    maxDrag = trackEl.clientWidth - 56;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent) {
    if (!isDragging) return;
    const rect = trackEl!.getBoundingClientRect();
    let x = e.clientX - rect.left - 28;
    if (x < 0) x = 0;
    if (x > maxDrag) x = maxDrag;
    dragX = x;
  }

  function onPointerUp(e: PointerEvent) {
    if (!isDragging) return;
    isDragging = false;

    if (dragX >= maxDrag * 0.85) {
      dragX = maxDrag;
      handleStop();
      if (stopFormEl) stopFormEl.requestSubmit();
    } else {
      dragX = 0;
    }
  }

  onDestroy(() => clearAllTimers());
</script>

<div class="space-y-5 animate-fadeIn flex flex-col items-center w-full max-w-sm mx-auto select-none">

  <!-- TAMPILAN 1: WAKTU TUNGGU PERSIAPAN (10 DETIK) -->
  {#if currentStatus === 'PREPARATION'}
    <div class="card bg-warning/10 border border-warning/30 p-6 text-center space-y-4 w-full shadow-sm">
      <div class="space-y-1">
        <h3 class="font-bold text-lg text-warning-content">Persiapan Alat</h3>
        <p class="text-xs text-base-content/70">
          Silakan atur posisi atau kancingkan alat. Operasi dimulai otomatis dalam:
        </p>
      </div>

      <div class="font-mono text-6xl font-black text-warning animate-pulse my-2">
        {prepTimeLeft}s
      </div>

      <!-- Tombol Batal Sebelum Voucher Digunakan / Hangus -->
      <form method="POST" action="?/cancelPrep" use:enhance>
        <button
          type="submit"
          onclick={handleCancelPrep}
          class="btn btn-outline btn-error btn-sm w-full font-semibold"
        >
          Batal (Voucher Belum Dipakai)
        </button>
      </form>
    </div>

  <!-- TAMPILAN 2: ALAT BERJALAN (RUNNING) & TIMER DOWN -->
  {:else if currentStatus === 'RUNNING'}
    <div class="card bg-base-100 border border-base-300 shadow-md p-6 text-center space-y-6 w-full">
      <div class="flex items-center justify-center gap-2">
        <span class="relative flex h-3 w-3">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
          <span class="relative inline-flex rounded-full h-3 w-3 bg-error"></span>
        </span>
        <span class="font-bold text-xs uppercase tracking-widest text-error">Status: RUNNING</span>
      </div>

      <!-- Hitung Mundur Operasional -->
      <div class="py-2">
        {#if runTimeLeft <= 10}
          <div class="text-xs text-error font-bold mb-1 animate-bounce">Sisa Waktu Hampir Habis!</div>
          <div class="font-mono text-6xl font-black text-error animate-pulse">
            {runTimeLeft}s
          </div>
        {:else}
          <div class="text-xs text-base-content/60 mb-1">Sisa Waktu Penggunaan</div>
          <div class="font-mono text-5xl font-extrabold tracking-tight">
            {Math.floor(runTimeLeft / 60)}:{String(runTimeLeft % 60).padStart(2, '0')}
          </div>
        {/if}
      </div>

      <!-- SWIPE TO STOP DARURAT -->
      <form method="POST" action="?/stop" use:enhance bind:this={stopFormEl}>
        <div class="space-y-2">
          <div 
            bind:this={trackEl}
            class="relative w-full h-14 bg-error/15 border border-error/30 rounded-full flex items-center p-1 overflow-hidden touch-none"
          >
            <!-- Teks Petunjuk di Belakang -->
            <span class="absolute inset-0 flex items-center justify-center text-xs font-bold text-error uppercase tracking-wider pointer-events-none opacity-80">
              Geser untuk STOP ➔
            </span>

            <!-- Tombol Geser (Handle) dengan Aksesibilitas ARIA -->
            <div
              role="slider"
              aria-label="Geser untuk menghentikan alat"
              aria-valuenow={Math.round((dragX / (maxDrag || 1)) * 100)}
              aria-valuemin="0"
              aria-valuemax="100"
              tabindex="0"
              class="w-12 h-12 bg-error text-white rounded-full flex items-center justify-center shadow-md cursor-grab active:cursor-grabbing z-10 transition-transform duration-75 focus:outline-none focus:ring-2 focus:ring-error"
              style="transform: translateX({dragX}px);"
              onpointerdown={onPointerDown}
              onpointermove={onPointerMove}
              onpointerup={onPointerUp}
              onpointercancel={onPointerUp}
              onkeydown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'Enter') {
                  handleStop();
                  if (stopFormEl) stopFormEl.requestSubmit();
                }
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </div>
          </div>
          <p class="text-[10px] text-base-content/50">Usap tombol merah sampai ujung untuk penghentian darurat.</p>
        </div>
      </form>
    </div>

  <!-- TAMPILAN 3: SELESAI -->
  {:else}
    <div class="card bg-base-100 border border-base-200 p-6 text-center space-y-3 w-full">
      <h3 class="font-bold text-lg text-success">Sesi Selesai</h3>
      <p class="text-xs text-base-content/70">Terima kasih telah menggunakan layanan kami.</p>
      <a href="/d" class="btn btn-sm btn-ghost w-full">Kembali ke Daftar Alat</a>
    </div>
  {/if}

</div>