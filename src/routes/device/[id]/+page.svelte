<script>
  import { onMount } from 'svelte';

  // Mengambil data hasil kiriman dari +page.server.js menggunakan rune $props
  let { data } = $props();
  const { device } = data;

  // State Runes Svelte 5
  let namaPelanggan = $state("");
  let kodeKupon = $state("");
  let infoPesan = $state("");
  let statusSesi = $state("MENUNGGU_PEMBAYARAN"); // MENUNGGU_PEMBAYARAN, PROSES, JALAN
  
  let latitude = $state(null);
  let longitude = $state(null);

  // Jalankan pelacakan lokasi saat halaman pertama kali dibuka
  onMount(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
          console.log(`Lokasi dikunci: ${latitude}, ${longitude}`);
        },
        (error) => {
          console.warn(`Akses lokasi ditolak: ${error.message}`);
        },
        { enableHighAccuracy: true, timeout: 7000 }
      );
    }
  });

  // Fungsi klaim kupon via API internal SvelteKit
  async function terapkanKupon() {
    if (!kodeKupon.trim()) return;
    
    infoPesan = "Memverifikasi kupon...";
    
    const response = await fetch('/api/promo/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: kodeKupon.toUpperCase(),
        device_id: device.device_id,
        tenant_id: device.tenant_id,
        nama: namaPelanggan || "Pelanggan Tanpa Nama",
        lat: latitude,
        lon: longitude
      })
    });

    const hasil = await response.json();
    
    if (hasil.success) {
      statusSesi = "JALAN";
      infoPesan = hasil.message;
    } else {
      infoPesan = hasil.message;
    }
  }

  // Format rupiah sederhana
  function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka);
  }
</script>

<div class="min-h-screen bg-base-300 text-base-content p-6 flex flex-col items-center">
  <div class="max-w-md w-full space-y-6">
    
    <div class="card bg-base-100 shadow-xl text-center p-6 border border-base-200">
      <h1 class="text-xs font-bold tracking-widest text-base-content/40 uppercase">Akses Layanan pidi</h1>
      <h2 class="text-3xl font-black text-primary mt-1">ID: {device.device_id}</h2>
      <p class="text-xs text-base-content/60 mt-1">Tarif: {formatRupiah(device.harga)} / {device.durasi_menit} Menit</p>
    </div>

    {#if statusSesi === "MENUNGGU_PEMBAYARAN"}
      <div class="card bg-base-100 shadow-xl p-5 border border-base-200 space-y-4">
        <div class="form-control">
          <label class="label pt-0" for="nama">
            <span class="label-text text-xs font-bold opacity-60">Nama Anda (Opsional)</span>
          </label>
          <input id="nama" type="text" bind:value={namaPelanggan} placeholder="Masukkan nama Anda..." class="input input-bordered input-sm w-full" />
        </div>

        <div class="text-center py-2 space-y-3">
          <h3 class="text-sm font-semibold">Scan QRIS Untuk Memulai Terapi</h3>
          <div class="bg-white p-4 inline-block mx-auto rounded-xl shadow-inner">
            <div class="w-48 h-48 bg-slate-200 flex items-center justify-center text-xs text-black font-mono">
              [ Placeholder QRIS ]
            </div>
          </div>
        </div>

        <div class="divider text-[10px] font-bold opacity-40 uppercase tracking-widest">Atau Gunakan Kupon</div>

        <div class="form-control">
          <div class="flex gap-2">
            <input type="text" bind:value={kodeKupon} placeholder="Contoh: GRTSKR" class="input input-bordered input-sm w-full font-mono uppercase tracking-wider" />
            <button onclick={terapkanKupon} class="btn btn-neutral btn-sm px-4">Terapkan</button>
          </div>
        </div>

        {#if infoPesan}
          <p class="text-center text-xs font-semibold text-error mt-2">{infoPesan}</p>
        {/if}
      </div>
    {:else if statusSesi === "JALAN"}
      <div class="card bg-neutral text-neutral-content shadow-xl p-6 text-center space-y-2">
        <h3 class="text-success font-bold">Aktivasi Sukses!</h3>
        <p class="text-xs opacity-70">Perintah aktivasi telah dikirim ke pidiBox {device.device_id}. Mengalihkan ke timer...</p>
      </div>
    {/if}

  </div>
</div>