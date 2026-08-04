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
      <a href="/bayar" class="btn btn-primary"><QrCode class="w-5 h-5" /> Beli Voucher</a>
      <div class="divider py-6 text-disabled">ATAU</div>
      <a href="/d" class="btn btn-primary"><Ticket class="w-5 h-5" /> Sudah Punya Voucher </a>
    </div>
  </div>
</div>
