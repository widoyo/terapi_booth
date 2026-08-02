<!-- IdleAccess.svelte -->
<script lang="ts">
  import { enhance } from "$app/forms";

  let { form = $bindable(), onCancelQris } = $props<{
    form: any;
    onCancelQris?: () => void;
  }>();
</script>

<div class="space-y-5 animate-fadeIn flex flex-col items-center w-full">
  <!-- Skenario QRIS Aktif -->
  {#if form?.success && form?.qrUrl}
    <div
      class="p-4 bg-white rounded-xl shadow-md border border-base-200 text-center space-y-3 animate-fadeIn w-full max-w-[240px]"
    >
      <img
        src={form.qrUrl}
        alt="QRIS Payment"
        class="w-full h-auto aspect-square object-contain mx-auto"
      />
      <div class="text-[10px] font-mono text-base-content/60 tracking-wider uppercase">
        QRIS BERLAKU
      </div>

      <!-- Tombol Batal Transaksi (Kebutuhan Poin 4) -->
      <form method="POST" action="?/cancelQris" use:enhance>
        <button
          type="submit"
          onclick={() => {
            if (onCancelQris) onCancelQris();
          }}
          class="btn btn-xs btn-outline btn-error w-full font-semibold"
        >
          Batal Transaksi
        </button>
      </form>
    </div>

    <div class="flex items-center gap-2 text-xs text-success font-medium animate-pulse">
      <span class="loading loading-ring loading-xs"></span>
      Menunggu pembayaran terdeteksi...
    </div>
  {:else}
    <!-- Form Bayar QRIS -->
    <form method="POST" action="?/qris" use:enhance class="w-full">
      <button
        type="submit"
        class="btn btn-primary text-white w-full h-12 shadow-lg flex items-center justify-center gap-2 font-bold"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect width="5" height="5" x="3" y="3" rx="1" /><rect width="5" height="5" x="16" y="3" rx="1" />
          <rect width="5" height="5" x="3" y="16" rx="1" /><path d="M21 16h-3a2 2 0 0 0-2 2v3M21 21v.01M12 7v3a2 2 0 0 1-2 2H7M3 12h.01M12 3h.01M12 16v.01M16 12h1M21 12v.01M12 21v-1a2 2 0 0 1 2-2h2" />
        </svg>
        Bayar QRIS
      </button>
    </form>
  {/if}

  <div class="divider w-full text-[10px] font-bold opacity-30 uppercase tracking-widest">
    Atau Masukkan Voucher
  </div>

  <!-- Form Input Voucher -->
  <form method="POST" action="?/voucher" use:enhance class="w-full">
    <div class="flex gap-2 items-center">
      <input
        type="text"
        name="voucher_code"
        placeholder="0000"
        maxlength="4"
        minlength="4"
        inputmode="numeric"
        pattern="[0-9]{4}"
        class="input input-bordered text-2xl font-mono text-center tracking-widest w-2/3 h-12 focus:border-warning"
        required
      />
      <button
        type="submit"
        class="btn btn-warning text-white w-1/3 h-12 min-h-0 shadow-lg font-bold"
      >
        Jalankan
      </button>
    </div>
  </form>
</div>