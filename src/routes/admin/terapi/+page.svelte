<script lang="ts">
  import { Activity, User, Phone, Ticket } from '@lucide/svelte';

  let { data } = $props();
  let sessionList = $derived(data.sessions ?? []);
  let isSuperAdmin = $derived(data.userRole === 'SUPER_ADMIN');

  // Helper warna badge status
  function getStatusBadgeClass(status: string) {
    switch (status) {
      case 'SETTLEMENT':
        return 'badge-success';
      case 'PENDING':
        return 'badge-warning';
      case 'EXPIRED':
        return 'badge-error';
      case 'PROMO_BYPASS':
        return 'badge-info';
      default:
        return 'badge-ghost';
    }
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold flex items-center gap-2">
        <Activity class="w-6 h-6 text-primary" /> Riwayat Sesi Terapi
      </h1>
      <p class="text-sm text-base-content/70">
        {isSuperAdmin ? 'Daftar seluruh transaksi dan sesi terapi semua tenant.' : 'Daftar transaksi dan sesi terapi di booth Anda.'}
      </p>
    </div>
  </div>

  <!-- Tabel Sesi Terapi -->
  <div class="card bg-base-100 border border-base-300 shadow-sm overflow-hidden">
    <div class="overflow-x-auto">
      <table class="table table-zebra w-full">
        <thead>
          <tr>
            <th>ID Sesi / Waktu</th>
            <th>Device</th>
            {#if isSuperAdmin}
              <th>Tenant</th>
            {/if}
            <th>Pelanggan</th>
            <th>Nominal</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {#each sessionList as item}
            <tr>
              <!-- ID Sesi & Waktu -->
              <td>
                <span class="font-mono font-bold text-xs block text-primary">{item.sessionId}</span>
                <span class="text-[11px] text-base-content/60">{item.waktuMulai ?? '-'}</span>
              </td>

              <!-- Device ID -->
              <td>
                <span class="badge badge-outline font-mono text-xs">{item.deviceId}</span>
              </td>

              <!-- Tenant (Super Admin Only) -->
              {#if isSuperAdmin}
                <td class="font-medium text-xs">
                  {item.tenantName ?? `Tenant #${item.tenantId}`}
                </td>
              {/if}

              <!-- Detail Pelanggan -->
              <td>
                <div class="flex flex-col gap-0.5 text-xs">
                  <span class="font-semibold flex items-center gap-1">
                    <User class="w-3 h-3 text-base-content/50" /> {item.namaPelanggan || 'Anonim'}
                  </span>
                  {#if item.wa}
                    <span class="text-base-content/60 flex items-center gap-1 font-mono">
                      <Phone class="w-3 h-3 text-base-content/50" /> {item.wa}
                    </span>
                  {/if}
                </div>
              </td>

              <!-- Nominal & Promo -->
              <td>
                <span class="font-semibold text-xs block">
                  Rp {item.nominalBayar.toLocaleString('id-ID')}
                </span>
                {#if item.kodePromoTerpakai}
                  <span class="badge badge-ghost badge-xs gap-1 font-mono text-[10px] mt-0.5">
                    <Ticket class="w-2.5 h-2.5" /> {item.kodePromoTerpakai}
                  </span>
                {/if}
              </td>

              <!-- Status Pembayaran -->
              <td>
                <div class="badge {getStatusBadgeClass(item.statusPembayaran)} text-xs font-bold">
                  {item.statusPembayaran}
                </div>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan={isSuperAdmin ? 6 : 5} class="text-center py-8 text-base-content/50">
                Belum ada data sesi terapi terdaftar.
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>