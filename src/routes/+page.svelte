<script lang="ts">
  import { QrCode, Ticket, ChevronDown } from '@lucide/svelte';

  let section2El: HTMLElement;

  function scrollToSection2() {
    section2El?.scrollIntoView({ behavior: 'smooth' });
  }
</script>

<main class="h-screen w-full overflow-y-auto snap-y snap-mandatory scroll-smooth">
  <!-- SECTION 1: HERO -->
  <section class="h-screen w-full snap-start bg-base-200 flex flex-col justify-between items-center p-6">
    <!-- Spacer atas untuk menyeimbangkan posisi tengah -->
    <div></div>

    <div class="hero-content flex-col lg:flex-row gap-8 max-w-4xl">
      <img 
        src="/img/nenek_terapi.webp" 
        alt="Nenek Bahagia" 
        class="w-full max-w-xs lg:max-w-sm rounded-lg shadow-2xl object-cover" 
      />
      <div class="max-w-md text-center lg:text-left">
        <h1 class="text-4xl lg:text-5xl font-bold mb-4">Outlet Terapi</h1>
        <p class="mb-4">
          <i>Alat terapi dengan gelombang frekuensi tertentu yang akan <b>mengaktifkan kembali sel-sel untuk kembali menjadi sehat</b>.</i>
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

      <div class="divider text-xs text-base-content/50 my-2">ATAU</div>

      <a href="/d" class="btn btn-outline btn-primary w-full">
        <Ticket class="w-5 h-5" /> Sudah Punya Voucher
      </a>
    </div>
  </section>
</main>