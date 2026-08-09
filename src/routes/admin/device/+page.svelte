<script lang="ts">
  import { Cpu, CheckCircle2, XCircle } from '@lucide/svelte';

  let { data } = $props();
  let deviceList = $derived(data.devices ?? []);
  let isSuperAdmin = $derived(data.userRole === 'SUPER_ADMIN');
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold flex items-center gap-2">
        <Cpu class="w-6 h-6 text-primary" /> Kelola Device Booth
      </h1>
      <p class="text-sm text-base-content/70">
        {isSuperAdmin ? 'Daftar seluruh perangkat terdaftar di semua tenant.' : 'Daftar perangkat milik tenant Anda.'}
      </p>
    </div>
  </div>

  <!-- Tabel Device -->
  <div class="card bg-base-100 border border-base-300 shadow-sm overflow-hidden">
    <div class="overflow-x-auto">
      <table class="table table-zebra w-full">
        <thead>
          <tr>
            <th>ID Device</th>
            {#if isSuperAdmin}
              <th>Tenant</th>
            {/if}
            <th>MAC Address</th>
            <th>Harga Kustom</th>
            <th>Status</th>
            <th>Terdaftar</th>
          </tr>
        </thead>
        <tbody>
          {#each deviceList as dev}
            <tr>
              <td class="font-mono font-bold text-primary">{dev.deviceId}</td>
              
              {#if isSuperAdmin}
                <td class="font-medium">
                  {dev.tenantName ?? `Tenant #${dev.tenantId}`}
                </td>
              {/if}

              <td class="font-mono text-xs">
                {dev.macAddress ?? '-'}
              </td>

              <td>
                {#if dev.hargaKustom}
                  <span class="font-semibold text-base-content">
                    Rp {dev.hargaKustom.toLocaleString('id-ID')}
                  </span>
                {:else}
                  <span class="text-xs text-base-content/50 italic">Harga Standar</span>
                {/if}
              </td>

              <td>
                {#if dev.statusAktif === 1}
                  <div class="badge badge-success gap-1 text-xs">
                    <CheckCircle2 class="w-3 h-3" /> Aktif
                  </div>
                {:else}
                  <div class="badge badge-error gap-1 text-xs">
                    <XCircle class="w-3 h-3" /> Nonaktif
                  </div>
                {/if}
              </td>

              <td class="text-xs text-base-content/70">
                {dev.createdAt ?? '-'}
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan={isSuperAdmin ? 6 : 5} class="text-center py-8 text-base-content/50">
                Belum ada data device terdaftar.
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>