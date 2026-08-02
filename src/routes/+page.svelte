<script lang="ts">
import { QrCode, Ticket } from '@lucide/svelte';
</script>

<div class="hero bg-base-200 min-h-screen">
  <div class="hero-content text-center">
    <div class="max-w-md">
      <h1 class="text-5xl font-bold">Outlet Terapi</h1>
      <p class="py-6">
        Dapatkan <b>Kode Voucher</b> untuk mengakses layanan terapi di outlet terdekat.
      </p>
      <a href="/bayar" class="btn btn-primary">Beli Voucher <QrCode class="w-5 h-5" /></a>
      <div class="divider py-6 text-disabled">ATAU</div>
      <a href="/d" class="btn btn-primary">Sudah Punya Voucher <Ticket class="w-5 h-5" /></a>
    </div>
  </div>
</div>
<section id="voucher" class="py-12 bg-base-200">
  <div class="hero bg-base-200 min-h-screen">
    <div class="hero-content text-center">
      <div class="max-w-md">
        <h1 class="text-5xl font-bold">Kode Voucher</h1>
        <p class="py-6">
          Kode Voucher dipergunakan untuk mengakses alat terapi di outlet.
        </p>
        <a href="#qris" class="btn btn-primary">Bayar QRIS</a>
        <a href="#voucher" class="btn btn-primary btn-outline"
          >Ingin Tahu Lebih Lanjut?</a
        >
      </div>
    </div>
  </div>
</section>
<section id="qris" class="py-12 bg-base-200">
  <div class="hero bg-base-200 min-h-screen">
    <div class="hero-content text-center">
      <div class="max-w-md">
        <h1 class="text-5xl font-bold">QRIS</h1>
        <p class="py-6">Siapkan pembayaran QRIS senilai IDR 10.000.</p>
      </div>
    </div>
  </div>
</section>
