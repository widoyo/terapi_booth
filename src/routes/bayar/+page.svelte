<!-- src/routes/bayar/+page.svelte -->
<script lang="ts">
  import { enhance } from "$app/forms";
  import type { ActionData } from "./$types";
  import { ExternalLink } from '@lucide/svelte'
  import QRCode from "qrcode";

  let { form }: { form: ActionData } = $props();

  let dialogQr: HTMLDialogElement;
  let tampilFormWa = $state(false);
  let noHp = $state("");
  let simpanNo = $state(true);
  let isLoading = $state(false);
  let qrDataUrl = $state("");

  // Generate QR Code saat komponen / voucher siap
  $effect(() => {
    if (form?.kodeVoucher) {
      QRCode.toDataURL(`https://pb.prinus.net/d?v=${form.kodeVoucher}`, {
        width: 160,
        margin: 1,
        color: { dark: "#1f2937", light: "#ffffff" },
      }).then((url) => {
        qrDataUrl = url;
      });
    }
  });

  // Hitung tanggal 7 hari ke depan, atur jam ke 20:00
  function getTanggalKadaluwarsa() {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(20, 0, 0, 0);

    const opsiHari: Intl.DateTimeFormatOptions = { weekday: "long" };
    const opsiTanggal: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "long",
      year: "numeric",
    };

    const hari = new Intl.DateTimeFormat("id-ID", opsiHari).format(d);
    const tanggal = new Intl.DateTimeFormat("id-ID", opsiTanggal).format(d);

    return `${hari}, ${tanggal}`;
  }

  async function kirimKeWhatsApp() {
    console.log("Kirim ke WhatsApp:", noHp, simpanNo, form?.kodeVoucher);
    if (!form?.kodeVoucher) return;
    console.log("Form kodeVoucher:", form.kodeVoucher);

    let nomorPonsel = noHp.replace(/\D/g, "");
    if (nomorPonsel.startsWith("0")) {
      nomorPonsel = "62" + nomorPonsel.slice(1);
    }

    try {
      isLoading = true;

      // 1. Simpan ke database jika checkbox 'simpanNo' dicentang
      if (simpanNo) {
        await fetch("/api/voucher/save-wa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            voucherCode: form.kodeVoucher,
            wa: nomorPonsel,
          }),
        });
      }
      const tglExpired = getTanggalKadaluwarsa();
      const urlVoucher = `https://pb.prinus.net/d?v=${form.kodeVoucher}`;
      const pesan = `*[pidiBox]* Kode Voucher terapi Anda: *${form.kodeVoucher}*.\nBerlaku hingga: *${tglExpired}*.\n\nGunakan Voucher: ${urlVoucher}\n\nTerima kasih!`;
      const urlWa = `https://wa.me/${nomorPonsel}?text=${encodeURIComponent(pesan)}`;

      window.open(urlWa, "_blank");
      tampilFormWa = false;
      noHp = "";
    } catch (err) {
      console.error("Gagal menyimpan No WA:", err);
    } finally {
      isLoading = false;
    }
  }
</script>

<div
  class="min-h-screen bg-base-200 flex flex-col items-center justify-center p-4"
>
  <div class="card w-full max-w-md bg-base-100 shadow-xl p-6 text-center">
    {#if !form?.success}
      <!-- Tampilan Sebelum Bayar -->
      <h1 class="text-3xl font-bold">Beli Voucher</h1>
      <ol class="list-decimal text-lg list-inside text-left mt-6 space-y-1">
        <li>
          Voucher berupa <b>kode unik</b> (4 karakter) untuk menggunakan alat
          terapi.
        </li>
        <li>Voucher berlaku selama 7 hari.</li>
        <li>Voucher dapat dikirim ke WhatsApp</li>
        <li>Voucher yang telah dibeli tidak dapat diuangkan.</li>
        <li>Kebijakan <a href="/t&s" class="link link-hover">Syarat & Ketentuan</a></li>
      </ol>

      <p class="py-4 text-sm text-base-content/80">
        Siapkan pembayaran QRIS senilai <span
          class="font-bold text-base-content">IDR ??.000</span>.
      </p>

      <button
        type="button"
        class="btn btn-primary w-full mt-5"
        onclick={() => dialogQr?.showModal()}
      >
        Bayar
      </button>
    {:else}
      <!-- Tampilan Setelah Voucher Berhasil Digenerate -->
      <h2 class="text-xl font-bold text-success mb-2">Pembayaran Berhasil!</h2>
      <!-- KARTU TIKET VOUCHER -->
      <div
        class="ticket-card relative bg-base-100 border-2 border-base-content/20 rounded-2xl p-4 my-4 shadow-md"
      >
        <div class="flex flex-row items-center justify-between gap-3">
          <!-- SISI KIRI: DATA VOUCHER -->
          <div
            class="flex-1 text-left border-r-2 border-dashed border-base-content/20 pr-3"
          >
            <span class="block text-xs text-base-content/70"
              >Kode Voucher Anda:</span
            >
            <span
              class="text-3xl sm:text-3xl font-mono font-bold tracking-wider text-primary my-1 block"
            >
              {form.kodeVoucher}
            </span>
            <p class="text-[11px] text-base-content/70 mt-1">
              Berlaku hingga: <br />
              <span class="font-semibold text-base-content"
                >{getTanggalKadaluwarsa()}</span
              >
            </p>
          </div>

          <!-- SISI KANAN: QR CODE -->
          <div class="flex flex-col items-center justify-center pl-1">
            {#if qrDataUrl}
              <img
                src={qrDataUrl}
                alt="QR Akses"
                class="w-20 h-20 rounded border border-base-content/10"
              />
            {:else}
              <div class="w-20 h-20 bg-base-200 animate-pulse rounded"></div>
            {/if}
            <span class="text-[9px] font-mono text-base-content/50 mt-1"
              >Scan / Akses</span
            >
          </div>
        </div>

        <!-- LEKUKAN KIRI & KANAN (TICKET NOTCH) -->
        <div class="notch notch-left bg-base-200"></div>
        <div class="notch notch-right bg-base-200"></div>
      </div>
      {#if !tampilFormWa}
        <button
          type="button"
          class="btn btn-3xl btn-primary mt-3"
          onclick={() => (tampilFormWa = true)}
        >
          Kirim kode ke WhatsApp
        </button>
        <p class="text-xs text-base-content/70">
          Sebagai pengingat untuk menggunakan voucher
        </p>
      {:else}
        <div
          class="mt-4 pt-4 border-t border-base-300 flex flex-col items-center gap-3"
        >
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
            <span class="label-text text-xs"
              >Simpan no ini, hanya untuk intern sistem</span
            >
          </label>

          <!-- UI Tombol -->
          <button
            type="button"
            class="btn btn-sm btn-outline btn-primary w-full"
            onclick={kirimKeWhatsApp}
            disabled={!noHp || isLoading}
          >
            {#if isLoading}
              <span class="loading loading-spinner loading-xs"></span>
            {/if}
           <ExternalLink class="inline-block w-4 h-4 mr-1" /> 
            Kirim ke WhatsApp
          </button> <button class="btn btn-sm btn-ghost w-full" type="button" onclick={() => (tampilFormWa = false)}>Batal</button>
        </div>
      {/if}
      <div class="divider text-xs text-base-content/50 my-5">ATAU</div>
      <a href="/d?v={form.kodeVoucher}" class="btn btn-3xl btn-primary btn-outline mt-5" type="button" >
        Gunakan Sekarang
      </a>
    {/if}

    {#if form?.message}
      <div class="alert alert-error text-sm">
        <span>{form.message}</span>
      </div>
    {/if}

    <div class="mt-6 pt-4 border-t border-base-200 text-left">
      <a
        href="/"
        class="text-xs text-base-content/60 hover:underline flex items-center gap-1"
      >
        ← Kembali ke Halaman Utama
      </a>
    </div>
  </div>
</div>

<!-- Modal QR Code -->
<dialog bind:this={dialogQr} class="modal">
  <div class="modal-box text-center max-w-xs">
    <h3 class="font-bold text-lg mb-2">Scan QRIS</h3>
    <p class="text-xs text-base-content/70 mb-4">
      Lakukan pembayaran melalui aplikasi e-wallet / m-banking Anda.
    </p>

    <div
      class="bg-white p-4 rounded-lg border border-base-300 inline-block mb-4"
    >
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

<style>
  /* Menambahkan lekukan bundar di pinggir tiket */
  .ticket-card {
    /* Membuat cerukan lingkaran di tengah kiri dan kanan secara transparan */
    --circle-size: 10px;
    -webkit-mask-image: radial-gradient(
        circle var(--circle-size) at 0 50%,
        #0000 98%,
        #000
      ),
      radial-gradient(circle var(--circle-size) at 100% 50%, #0000 98%, #000);
    mask-image: radial-gradient(
        circle var(--circle-size) at 0 50%,
        #0000 98%,
        #000
      ),
      radial-gradient(circle var(--circle-size) at 100% 50%, #0000 98%, #000);
    -webkit-mask-composite: destination-in;
    mask-composite: intersect;
  }
  .notch {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    border-radius: 50%;
    z-index: 10;
  }

  .notch-left {
    left: -11px;
    border-right: 2px solid rgba(0, 0, 0, 0.5);
  }

  .notch-right {
    right: -11px;
    border-left: 2px solid rgba(0, 0, 0, 0.5);
  }
</style>
