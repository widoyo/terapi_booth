<script lang="ts">
  import { ArrowLeft, Cpu, CheckCircle2, XCircle, Ticket } from '@lucide/svelte';
  import { enhance } from '$app/forms';

  let { data, form } = $props();
  let outlet = $derived(data.outlet);
  let deviceList = $derived(data.devices ?? []);

  let selectedDeviceId = $state('');
  let isSubmitting = $state(false);

  // Set default ke perangkat pertama yang aktif
  $effect(() => {
    if (deviceList.length > 0 && !selectedDeviceId) {
      const activeDev = deviceList.find((d) => d.statusAktif === 1);
      selectedDeviceId = activeDev ? activeDev.deviceId : deviceList[0].deviceId;
    }
  });
</script>

<div class="p-6 max-w-md mx-auto space-y-4">
  <a href="/olt" class="btn btn-ghost btn-sm gap-1 pl-0">
    <ArrowLeft class="w-4 h-4" /> Kembali
  </a>

  {#if form?.message}
    <div class="alert alert-error text-sm py-2">
      <span>{form.message}</span>
    </div>
  {/if}

  <!-- Card Detail Outlet & Perangkat -->
  <div class="card bg-base-100 border border-base-300 p-5 shadow-sm space-y-3">
    <div>
      <span class="badge badge-primary text-[10px]">Outlet Terpilih</span>
      <h2 class="text-xl font-bold text-primary mt-1">{outlet.namaOutlet}</h2>
    </div>

    <p class="text-xs text-base-content/80 leading-relaxed border-t border-base-200 pt-2">
      {outlet.alamat || 'Alamat tidak tersedia.'}
    </p>

    <!-- Daftar Perangkat -->
    <div class="pt-2">
      <p class="text-xs font-semibold mb-2 flex items-center gap-1">
        <Cpu class="w-4 h-4 text-primary" /> Pilih Perangkat pidiBox:
      </p>

      <div class="space-y-2">
        {#each deviceList as dev}
          <label
            class="flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors {selectedDeviceId === dev.deviceId ? 'border-primary bg-primary/5' : 'border-base-200 bg-base-100'}"
          >
            <div class="flex items-center gap-3">
              <input
                type="radio"
                name="deviceChoice"
                value={dev.deviceId}
                bind:group={selectedDeviceId}
                disabled={dev.statusAktif !== 1}
                class="radio radio-primary radio-sm"
              />
              <span class="font-mono font-bold text-sm">{dev.deviceId}</span>
            </div>

            {#if dev.statusAktif === 1}
              <span class="badge badge-success badge-sm gap-1 text-[10px]">
                <CheckCircle2 class="w-3 h-3" /> Siap
              </span>
            {:else}
              <span class="badge badge-error badge-sm gap-1 text-[10px]">
                <XCircle class="w-3 h-3" /> Dipakai / Offline
              </span>
            {/if}
          </label>
        {:else}
          <p class="text-xs text-base-content/40 italic">Belum ada perangkat terdaftar di outlet ini.</p>
        {/each}
      </div>
    </div>
  </div>

  <!-- Form Gunakan Voucher via Form Action Server -->
  <form
    method="POST"
    action="?/useVoucher"
    use:enhance={() => {
      isSubmitting = true;
      return async ({ update }) => {
        isSubmitting = false;
        await update();
      };
    }}
    class="card bg-primary/5 border border-primary/20 p-5 shadow-sm space-y-3"
  >
    <input type="hidden" name="deviceId" value={selectedDeviceId} />

    <h3 class="font-bold text-sm flex items-center gap-1.5">
      <Ticket class="w-4 h-4 text-primary" /> Masukkan Kode Voucher
    </h3>

    <div class="space-y-2">
      <input
        type="text"
        name="voucherCode"
        placeholder="KODE VOUCHER (4 Digit)"
        maxLength={4}
        required
        class="input input-bordered input-primary w-full text-center text-lg font-mono uppercase tracking-widest"
      />

      <button
        type="submit"
        disabled={!selectedDeviceId || isSubmitting}
        class="btn btn-primary w-full"
      >
        {#if isSubmitting}
          <span class="loading loading-spinner loading-xs"></span> Memproses...
        {:else}
          Gunakan Voucher
        {/if}
      </button>
    </div>
  </form>
</div>