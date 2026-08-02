<!-- src/routes/bayar/+page.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();

  let dialogQr: HTMLDialogElement;
  let tampilFormWa = $state(false);
  let noHp = $state('');
  let simpanNo = $state(false);

  // Hitung tanggal 7 hari ke depan, atur jam ke 20:00
  function getTanggalKadaluwarsa() {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(20, 0, 0, 0);

    const opsiHari: Intl.DateTimeFormatOptions = { weekday: 'long' };
    const opsiTanggal: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };

    const hari = new Intl.DateTimeFormat('id-ID', opsiHari).format(d);
    const tanggal = new Intl.DateTimeFormat('id-ID', opsiTanggal).format(d);

    return `${hari}, ${tanggal} jam 20:00 WIB`;
  }

  function kirimKeWhatsApp() {
    if (!form?.kodeVoucher) return;

    let nomorPonsel = noHp.replace(/\D/g, '');
    if (nomorPonsel.startsWith('0')) {
      nomorPonsel = '62' + nomorPonsel.slice(1);
    }

    const tglExpired = getTanggalKadaluwarsa();
    const pesan = `[pidiBox] Kode Voucher terapi pidiBox Anda: *${form.kodeVoucher}*.\nBerlaku hingga: *${tglExpired}*.\n\nTerima kasih!`;
    const urlWa = `https://wa.me/${nomorPonsel}?text=${encodeURIComponent(pesan)}`;

    window.open(urlWa, '_blank');
  }
</script>

<div class="min-h-screen bg-base-200 flex flex-col items-center justify-center p-4">
  <div class="card w-full max-w-md bg-base-100 shadow-xl p-6 text-center">
    
    {#if !form?.success}
      <!-- Tampilan Sebelum Bayar -->
      <h1 class="text-3xl font-bold">Beli Voucher</h1>
      <ol class="list-decimal list-inside text-left mt-6 text-sm space-y-1">
        <li>Voucher berupa <b>kode unik</b> yang digunakan untuk mengakses layanan terapi.</li>
        <li>Voucher berlaku selama 7 hari.</li>
        <li>Voucher dapat dikirim ke WhatsApp</li>
        <li>Voucher yang telah dibeli tidak dapat diuangkan.</li>
      </ol>

      <p class="py-4 text-sm text-base-content/80">
        Siapkan pembayaran QRIS senilai <span class="font-bold text-base-content">IDR ??.000</span>.
      </p>

      <button type="button" class="btn btn-primary w-full mt-5" onclick={() => dialogQr?.showModal()}>
        Bayar
      </button>

    {:else}
      <!-- Tampilan Setelah Voucher Berhasil Digenerate -->
      <h2 class="text-xl font-bold text-success mb-2">Pembayaran Berhasil!</h2>
      <span class="block text-xs text-base-content/70">Kode Voucher Anda:</span>
      <span class="text-4xl font-mono font-bold tracking-widest text-primary my-2 block">
        {form.kodeVoucher}
      </span>

      <!-- Info Kadaluwarsa di UI -->
      <p class="text-xs text-base-content/70 mt-1 mb-3">
        Berlaku hingga: <span class="font-semibold text-base-content">{getTanggalKadaluwarsa()}</span>
      </p>

      {#if !tampilFormWa}
        <button 
          type="button"
          class="text-sm text-primary underline mt-2 cursor-pointer hover:opacity-80 border-none bg-transparent"
          onclick={() => (tampilFormWa = true)}
        >
          Kirim ke WhatsApp
        </button>
      {:else}
        <div class="mt-4 pt-4 border-t border-base-300 flex flex-col items-center gap-3">
          <label class="block text-center w-full">
            <span class="text-xs font-medium block mb-1">No HP:</span>
            <input
              type="tel"
              placeholder="081234567890"
              maxLength="15"
              bind:value={noHp}
              class="input text-3xl input-bordered text-center w-[17ch] font-mono"
            />
          </label>

          <label class="label cursor-pointer flex items-center gap-2 text-left">
            <input 
              type="checkbox" 
              bind:checked={simpanNo} 
              class="checkbox checkbox-primary checkbox-sm" 
            />
            <span class="label-text text-xs">Simpan no ini, hanya untuk intern sistem</span>
          </label>

          <button
            type="button"
            class="btn btn-sm btn-outline btn-primary w-full"
            onclick={kirimKeWhatsApp}
            disabled={!noHp}
          >
            Kirim ke WhatsApp
          </button>
        </div>
      {/if}
    {/if}

    {#if form?.message}
      <div class="alert alert-error mt-4 text-sm">
        <span>{form.message}</span>
      </div>
    {/if}

    <div class="mt-6 pt-4 border-t border-base-200 text-left">
      <a href="/" class="text-xs text-base-content/60 hover:underline flex items-center gap-1">
        ← Kembali ke Halaman Utama
      </a>
    </div>

  </div>
</div>

<!-- Modal QR Code -->
<dialog bind:this={dialogQr} class="modal">
  <div class="modal-box text-center max-w-xs">
    <h3 class="font-bold text-lg mb-2">Scan QRIS</h3>
    <p class="text-xs text-base-content/70 mb-4">Lakukan pembayaran melalui aplikasi e-wallet / m-banking Anda.</p>
    
    <div class="bg-white p-4 rounded-lg border border-base-300 inline-block mb-4">
      <img 
        src="/qris-static.png" 
        alt="QRIS Payment" 
        class="w-48 h-48 object-contain mx-auto"
      />
    </div>

    <form 
      method="POST" 
      use:enhance={() => {
        // Tutup dialog secara terprogram saat form di-submit
        dialogQr?.close();
        return async ({ update }) => {
          await update();
        };
      }}
    >
      <button type="submit" class="btn btn-primary w-full">
        Saya Sudah Bayar (OK)
      </button>
    </form>

    <div class="modal-action justify-center mt-2">
      <form method="dialog">
        <button class="btn btn-sm btn-ghost">Batal</button>
      </form>
    </div>
  </div>
</dialog>