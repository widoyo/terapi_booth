<script lang="ts">
  import { QrCode, MapPinHouse, Ticket, ChevronDown, Footprints, MapPin } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  // Svelte 5: Terima data dari +page.server.ts
  let { data }: { data: PageData } = $props();

  let section2El: HTMLElement;
  let section3El: HTMLElement;

  let heroImage = $state('/img/manrelax.png');

  interface NearestOutlet {
    outletId: number;
    namaOutlet: string;
    alamat: string | null;
    distance: number;
  }

  let nearestOutlet = $state<NearestOutlet | null>(null);

  // Mengambil daftar nama kota unik yang tersedia dari data.outlets
  let availableCities = $derived(
    Array.from(
      new Set(
        (data.outlets ?? [])
          .map((o) => o.kota?.trim())
          .filter((k): k is string => Boolean(k))
      )
    )
  );

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
    const images = ['/img/manrelax.png', '/img/womenrelax.png'];
    heroImage = images[Math.floor(Math.random() * images.length)];

    if ('geolocation' in navigator && data.outlets.length > 0) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLon = position.coords.longitude;

          const nearby = data.outlets
            .map((o) => {
              if (!o.latitude || !o.longitude) return null;
              const lat = parseFloat(o.latitude);
              const lon = parseFloat(o.longitude);
              if (isNaN(lat) || isNaN(lon)) return null;

              const dist = calculateDistance(userLat, userLon, lat, lon);
              return {
                outletId: o.outletId,
                namaOutlet: o.namaOutlet,
                alamat: o.alamat,
                distance: dist
              };
            })
            .filter((o): o is NearestOutlet => o !== null && o.distance < 10)
            .sort((a, b) => a.distance - b.distance);

          if (nearby.length > 0) {
            nearestOutlet = nearby[0];
          }
        },
        (error) => {
          console.log('[Geo] Gagal mendapatkan lokasi:', error.message);
        }
      );
    }
  });

  function scrollToSection2() {
    section2El?.scrollIntoView({ behavior: 'smooth' });
  }

  function scrollToSection3() {
    section3El?.scrollIntoView({ behavior: 'smooth' });
  }
</script>

<svelte:head>
  <title>Outlet Terapi</title>
  <meta name="description" content="Layanan terapi alat frekuensi untuk kesehatan sel tubuh. Temukan outlet terdekat dan dapatkan kode voucher." />
</svelte:head>

<main class="h-screen w-full overflow-y-auto snap-y snap-mandatory scroll-smooth">
  <!-- SECTION 1: HERO -->
  <section class="h-screen w-full snap-start bg-base-200 flex flex-col justify-between items-center p-6">
    <div></div>

    <div class="hero-content flex-col lg:flex-row gap-8 max-w-4xl">
      <img 
        src={heroImage} 
        alt="Ilustrasi Relaksasi" 
        class="w-full max-w-xs lg:max-w-sm rounded-lg shadow-2xl object-cover" 
      />
      <div class="max-w-md text-center lg:text-left">
        <h1 class="text-4xl lg:text-5xl font-bold mb-4">Outlet Terapi</h1>
        <p class="mb-4">
          <i>Alat terapi dengan gelombang frekuensi tertentu yang akan <b>mengaktifkan sel-sel untuk kembali menjadi sehat</b>.</i>
        </p>
        <p class="mb-4">
          <i>Dipergunakan dengan <b>menempelkan Telapak Kaki</b> (🦶) ke permukaan alat selama 30 menit per sesi.</i>
        </p>
        
        <!-- Info Outlet Terdekat (< 10 km) -->
        {#if nearestOutlet}
          <div class="alert bg-primary text-primary-content shadow-sm mt-4 text-left flex items-start gap-2 p-3">
            <MapPin class="w-5 h-5 shrink-0 mt-0.5" />
            <div class="text-lg">
              <span class="font-normal block text-sm opacity-80">Outlet Terdekat</span>
              <a href={`/outlet/${nearestOutlet.outletId}`} class="link link-hover font-bold">{nearestOutlet.namaOutlet}</a> (~{nearestOutlet.distance.toFixed(1)} km)
            </div>
          </div>
        {:else}
          <div class="alert bg-base-100 border border-base-300 shadow-sm mt-4 text-left flex items-start gap-2 p-3">
            <MapPin class="w-5 h-5 shrink-0 mt-0.5 text-base-content/70" />
            <div class="text-sm">
              <span class="font-semibold block text-base-content">Tidak ada outlet di sekitar Anda</span>
              {#if availableCities.length > 0}
                <p class="text-xs text-base-content/70 mt-1">
                  Outlet kami saat ini tersedia di kota:
                </p>
                <div class="flex flex-wrap gap-1.5 mt-2">
                  {#each availableCities as kota}
                    <a 
                      href={`/outlet?kota=${encodeURIComponent(kota)}`} 
                      class="badge badge-primary badge-outline hover:badge-primary text-xs cursor-pointer transition-colors"
                    >
                      {kota}
                    </a>
                  {/each}
                </div>
              {:else}
                <p class="mt-1">
                  <a href="/outlet" class="link link-primary font-medium">Lihat semua outlet</a>
                </p>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    </div>

    <button 
      onclick={scrollToSection2} 
      class="btn btn-circle btn-ghost animate-bounce mb-2"
      aria-label="Lanjut ke bagian voucher"
    >
      <ChevronDown class="w-8 h-8" />
    </button>
  </section>

  <!-- SECTION 2: AKSES VOUCHER -->
  <section 
    bind:this={section2El} 
    class="h-screen w-full snap-start bg-base-100 flex flex-col items-center justify-center p-6 text-center"
  >
    <div class="max-w-xs sm:max-w-sm w-full space-y-4">
      <p class="text-lg py-2">
        Dapatkan <b>Kode Voucher</b> untuk mengakses layanan terapi di outlet terdekat.
      </p>

      <a href="/bayar" class="btn btn-primary w-full">
        <QrCode class="w-5 h-5" /> Beli Voucher
      </a>

      <div class="divider text-xs text-base-content/50 my-5">ATAU</div>

      <a href="/outlet" class="btn btn-warning w-full">
        <MapPinHouse class="w-5 h-5" /> Temukan Outlet Terdekat
      </a>
      
      <button onclick={scrollToSection3} class="btn btn-ghost w-full">
        Tata Cara Penggunaan
      </button>
    </div>
  </section>

  <!-- SECTION 3: TATA CARA PENGGUNAAN -->
  <section 
    bind:this={section3El} 
    class="h-screen w-full snap-start bg-base-200 flex flex-col items-center justify-center p-6 text-center"
  >
    <div class="max-w-xs sm:max-w-sm w-full space-y-4">
      <h1 class="text-2xl font-bold tracking-tight">
        <Footprints class="inline-block w-6 h-6 mr-2" /> Tata Cara Penggunaan Alat
      </h1>
      <p class="text-lg py-2 text-left">
        <b>1.</b> Pastikan kaki dalam keadaan <b>bersih dan kering</b>.<br>
        <b>2.</b> Duduklah dengan <b>posisi nyaman, santai</b>, satu sesi <strong>30 menit</strong><br>
        <b>3.</b> Tempelkan telapak kaki ke permukaan alat terapi, <b>JANGAN angkat telapak kaki</b> selama terapi<br>
        <b>4.</b> Masukkan <Ticket class="inline-block w-4 h-4 text-error" /> <strong>Kode Voucher</strong> untuk menggunakan alat terpilih<br>
      </p>

      <p class="mt-9 border-t border-base-300">&nbsp;</p>
      <a href="/bayar" class="btn btn-primary w-full">
        <QrCode class="w-5 h-5" /> Beli Voucher
      </a>

      <div class="divider text-xs text-base-content/50 my-5">ATAU</div>

      <a href="/outlet" class="btn btn-warning w-full">
        <MapPinHouse class="w-5 h-5" /> Temukan Outlet Terdekat
      </a>
    </div>
  </section>
</main>