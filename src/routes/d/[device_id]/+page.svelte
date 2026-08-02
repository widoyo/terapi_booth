<script lang="ts">
  import { enhance } from "$app/forms";
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
  let runTimeLeft = $state(durasiMenit * 60); 
  let prepTimeLeft = $state(10); // Jeda persiapan 10 detik

  // State alur: PREPARATION (10s) -> RUNNING -> COMPLETED
  let currentStatus = $state<'PREPARATION' | 'RUNNING' | 'COMPLETED'>('PREPARATION');

  let prepInterval: ReturnType<typeof setInterval>;
  let runInterval: ReturnType<typeof setInterval>;

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

  function startRunning() {
    currentStatus = 'RUNNING';

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

  onDestroy(() => clearAllTimers());
</script>

<div class="space-y-5 animate-fadeIn flex flex-col items-center w-full max-w-sm mx-auto">

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

      <!-- Tombol Penghentian Darurat (Stop) -->
      <form method="POST" action="?/stop" use:enhance>
        <button
          type="submit"
          onclick={handleStop}
          class="btn btn-error text-white w-full h-12 font-bold shadow-md flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><rect width="6" height="6" x="9" y="9" rx="1"/>
          </svg>
          HENTIKAN ALAT (STOP)
        </button>
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