<script lang="ts">
  import { enhance } from '$app/forms';
  import { onMount } from 'svelte';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let devicesList = $state<any[]>([]);
  let selectedDeviceId = $state<string | null>(null);
  let voucherCode = $state('');

  // Simpan rujukan timeout untuk setiap deviceId
  const offlineTimers = new Map<string, ReturnType<typeof setTimeout>>();

  $effect(() => {
    if (data.devicesList) {
      devicesList = [...data.devicesList];
    }
  });

  function updateDeviceStatus(deviceId: string, state: string) {
    const index = devicesList.findIndex((d) => d.deviceId === deviceId);

    if (index !== -1) {
      if (devicesList[index].status !== state) {
        devicesList[index] = { 
          ...devicesList[index], 
          status: state 
        };

        // Urutkan ulang berdasarkan prioritas status
        const priority: Record<string, number> = { IDLE: 1, RUNNING: 2, OFFLINE: 3 };
        devicesList.sort((a, b) => {
          const pA = priority[a.status?.toUpperCase() || 'OFFLINE'] ?? 99;
          const pB = priority[b.status?.toUpperCase() || 'OFFLINE'] ?? 99;
          return pA - pB;
        });
      }
    }
  }

  function resetOfflineTimer(deviceId: string) {
    if (offlineTimers.has(deviceId)) {
      clearTimeout(offlineTimers.get(deviceId));
    }

    const timer = setTimeout(() => {
      updateDeviceStatus(deviceId, 'OFFLINE');
      offlineTimers.delete(deviceId);
    }, 5200);

    offlineTimers.set(deviceId, timer);
  }

  onMount(() => {
    const eventSource = new EventSource('/api/device/stream');

    eventSource.onmessage = (event) => {
      if (!event.data) return;

      try {
        const update = JSON.parse(event.data);
        if (update.type === 'connected') return;

        const deviceId = update.pidibox;
        const state = update.state;

        if (!deviceId || !state) return;

        updateDeviceStatus(deviceId, state);
        resetOfflineTimer(deviceId);

      } catch (err) {
        console.error('[SSE Error]: Gagal parsing data', err);
      }
    };

    return () => {
      offlineTimers.forEach((t) => clearTimeout(t));
      offlineTimers.clear();
      eventSource.close();
    };
  });

  function pilihDevice(id: string) {
    selectedDeviceId = id;
    voucherCode = '';
  }

  function batalPilih() {
    selectedDeviceId = null;
    voucherCode = '';
  }

  function getBadgeClass(status?: string) {
    switch (status?.toUpperCase()) {
      case 'IDLE':
        return 'badge-success text-white';
      case 'RUNNING':
        return 'badge-warning';
      default:
        return 'badge-soft text-base-content/50';
    }
  }
</script>

<div class="min-h-screen bg-base-200 p-4 md:p-8">
  <div class="max-w-3xl mx-auto space-y-6">
    
    <header class="flex justify-between items-center border-b border-base-300 pb-4">
      <div>
        <h1 class="text-2xl font-bold">Daftar Alat Terapi</h1>
        <p class="text-xs text-base-content/70">Pilih alat yang berstatus IDLE untuk memulai</p>
      </div>
      <a href="/" class="btn btn-sm btn-ghost">← Beranda</a>
    </header>

    {#if form?.message}
      <div class="alert alert-error text-sm py-2">
        <span>{form.message}</span>
      </div>
    {/if}

    <!-- List Devices -->
    <div class="grid gap-4">
      {#each devicesList as device (device.deviceId)}
        {@const isIdle = device.status?.toUpperCase() === 'IDLE'}
        {@const isRunning = device.status?.toUpperCase() === 'RUNNING'}
        {@const isSelected = selectedDeviceId === device.deviceId}

        <div class="card bg-base-100 shadow-sm border border-base-300 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="font-bold text-lg">{device.namaDevice || device.deviceId}</span>
              <span class="badge badge-sm uppercase font-semibold {getBadgeClass(device.status)}">
                {device.status || 'OFFLINE'}
              </span>
            </div>
            <p class="text-xs text-base-content/60 font-mono">ID: {device.deviceId}</p>
          </div>

          <div>
            {#if isIdle}
              {#if isSelected}
                <!-- Form Inline Voucher -->
                <form method="POST" use:enhance class="flex items-center gap-4">
                  <input type="hidden" name="deviceId" value={device.deviceId} />
                  
                  <input
                    type="text"
                    name="voucherCode"
                    placeholder="VOUCHER"
                    maxLength="4"
                    required
                    bind:value={voucherCode}
                    class="input input-bordered font-mono uppercase tracking-wider w-28 text-center"
                  />

                  <span>
                  <button
                    type="submit"
                    class="btn btn-primary"
                    disabled={voucherCode.length !== 4}
                  >
                    Mulai
                  </button>

                  <button
                    type="button"
                    class="btn btn-ghost btn-square"
                    onclick={batalPilih}
                    title="Batal"
                  >
                    ✕
                  </button>
                  </span>
                </form>
              {:else}
                <button
                  type="button"
                  class="btn btn-primary btn-outline w-full md:w-auto"
                  onclick={() => pilihDevice(device.deviceId)}
                >
                  Gunakan Alat Ini
                </button>
              {/if}
            {:else if isRunning}
              <a 
                href="/d/{device.deviceId}" 
                class="btn btn-warning btn-outline w-full md:w-auto"
              >
                Pantau Status
              </a>
            {:else}
              <button disabled class="btn btn-disabled w-full md:w-auto">
                Tidak Tersedia
              </button>
            {/if}
          </div>
        </div>
      {:else}
        <div class="text-center py-12 text-base-content/60">
          Belum ada alat yang terdaftar.
        </div>
      {/each}
    </div>

  </div>
</div>