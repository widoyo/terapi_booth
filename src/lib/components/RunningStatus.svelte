<!-- RunningStatus.svelte -->
<script lang="ts">
  let { remainingSeconds = 0 } = $props<{ remainingSeconds?: number }>();

  // Hitung menit dan detik
  let minutes = $derived(Math.floor(remainingSeconds / 60));
  let seconds = $derived(remainingSeconds % 60);

  // Cek apakah countdown 10 menit ke bawah perlu ditampilkan
  let showCountdown = $derived(remainingSeconds > 0 && remainingSeconds <= 600);
</script>

<div class="p-5 bg-error/5 border border-error/20 rounded-xl space-y-4 w-full">
  <div class="flex items-center justify-center gap-2">
    <span class="w-2.5 h-2.5 rounded-full bg-error animate-ping"></span>
    <span class="text-xs text-error font-bold uppercase tracking-wider">
      Terapi Sedang Berjalan
    </span>
  </div>

  {#if showCountdown}
    <!-- Tampilan Timer Countdown (< 10 Menit) -->
    <div class="bg-base-100 p-3 rounded-lg border border-error/30 text-center space-y-1">
      <div class="text-[10px] uppercase font-bold text-error tracking-wider">
        Sesi Akan Berakhir Dalam
      </div>
      <div class="text-2xl font-mono font-black text-error">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
    </div>
  {:else}
    <p class="text-xs opacity-70 text-center">
      Alat sedang digunakan oleh pelanggan saat ini. Tombol transaksi dikunci demi keamanan.
    </p>
  {/if}

  <div class="divider my-1"></div>

  <!-- Form Penguncian Akses -->
  <button
    class="btn bg-gray-400 text-gray-200 border-none w-full cursor-not-allowed"
    disabled
  >
    Bayar QRIS (Terkunci)
  </button>
  <input
    type="text"
    placeholder="0000"
    class="input input-bordered w-full text-center h-12 bg-base-200 text-gray-400 cursor-not-allowed"
    disabled
  />
</div>