<script lang="ts">
  import { QrCode, MapPinHouse, Ticket, ChevronDown, Footprints } from '@lucide/svelte';
  import { onMount } from 'svelte';

  let section2El: HTMLElement;
  let section3El: HTMLElement;

  // Set default awal agar tidak kosong saat SSR
  let heroImage = $state('/img/manrelax.png');

  onMount(() => {
    // Pilih acak antara index 0 atau 1
    const images = ['/img/manrelax.png', '/img/womenrelax.png'];
    heroImage = images[Math.floor(Math.random() * images.length)];
  });

  function scrollToSection2() {
    section2El?.scrollIntoView({ behavior: 'smooth' });
  }

  function scrollToSection3() {
    section3El?.scrollIntoView({ behavior: 'smooth' });
  }
</script>

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
        <p>
          <i>Dipergunakan dengan <b>menempelkan Telapak Kaki</b> (🦶) ke permukaan alat selama 30 menit per sesi.</i>
        </p>
      </div>
    </div>

    <!-- Tombol Navigasi Bawah -->
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

            <a href="/olt" class="btn btn-warning w-full">
        <MapPinHouse class="w-5 h-5" /> Temukan Outlet Terdekat
      </a>
      
      <button onclick={scrollToSection3} class="btn btn-ghost-outline w-full">
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

      <p class="mt-9 border-t">&nbsp;</p>
          <a href="/bayar" class="btn btn-primary w-full">
        <QrCode class="w-5 h-5" /> Beli Voucher
      </a>

      <div class="divider text-xs text-base-content/50 my-5">ATAU</div>

            <a href="/olt" class="btn btn-warning w-full">
        <MapPinHouse class="w-5 h-5" /> Temukan Outlet Terdekat
      </a>
    </div>

  </section>
</main>