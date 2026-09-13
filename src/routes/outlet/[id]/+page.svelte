<script lang="ts">
  import { ArrowLeft, Cpu, CheckCircle2, XCircle, Ticket, ChevronRight, X } from '@lucide/svelte';
  import { enhance } from '$app/forms';

  let { data, form } = $props();
  let outlet = $derived(data.outlet);
  let deviceList = $derived(data.devices ?? []);

  // Menyimpan ID pidiBox yang sedang aktif dipilih form-nya
  let activeDeviceId = $state('');
  let isSubmitting = $state(false);

  function toggleDeviceForm(id: string) {
    if (activeDeviceId === id) {
      activeDeviceId = '';
    } else {
      activeDeviceId = id;
    }
  }

  function closeForm() {
    activeDeviceId = '';
  }
</script>

<div class="p-6 max-w-md mx-auto space-y-4">
  <a href="/outlet" class="btn btn-ghost btn-sm gap-1 pl-0">
    <ArrowLeft class="w-4 h-4" /> Kembali
  </a>

  {#if form?.message}
    <div class="alert alert-error text-sm py-2">
      <span>{form.message}</span>
    </div>
  {/if}

  <!-- Card Detail Outlet & Perangkat -->
  <div class="card bg-base-100 border border-base-300 p-5 shadow-sm space-y-4">
    <div>
      <span class="badge badge-outline badge-neutral text-xs">Outlet Terpilih</span>
      <h2 class="text-xl font-bold text-primary mt-1">{outlet.namaOutlet}</h2>
      <p class="text-xs text-base-content/80 leading-relaxed border-t border-base-200 pt-2 mt-2">
        {outlet.alamat || 'Alamat tidak tersedia.'}
      </p>
    </div>

    <!-- Daftar Perangkat pidiBox -->
    <div class="space-y-3">
      <p class="text-sm font-semibold flex items-center gap-1">
        <Cpu class="w-4 h-4 text-primary" /> Daftar Perangkat:
      </p>

      <div class="space-y-2.5">
        {#each deviceList as dev}
          <div 
            class="rounded-xl border transition-all overflow-hidden {activeDeviceId === dev.deviceId ? 'border-primary bg-primary/5 shadow-sm' : 'border-base-200 bg-base-100'}"
          >
            <!-- Baris Utama Perangkat -->
            <div class="p-3 flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="font-mono font-bold text-lg text-base-content">{dev.deviceId}</span>
                {#if dev.statusAktif === 1}
                  <span class="badge badge-success badge-sm gap-1 text-[10px]">
                    <CheckCircle2 class="w-3 h-3" /> Siap
                  </span>
                {:else}
                  <span class="badge badge-error badge-sm gap-1 text-[10px]">
                    <XCircle class="w-3 h-3" /> Off / Dipakai
                  </span>
                {/if}
              </div>

              {#if dev.statusAktif === 1}
                <button
                  type="button"
                  onclick={() => toggleDeviceForm(dev.deviceId)}
                  class="btn btn-md {activeDeviceId === dev.deviceId ? 'btn-ghost' : 'btn-primary'} gap-1"
                >
                  <span>Gunakan Alat ini</span>
                  <ChevronRight class="w-3 h-3 transition-transform {activeDeviceId === dev.deviceId ? 'rotate-90' : ''}" />
                </button>
              {/if}
            </div>

            <!-- Form Input Voucher Sebaris -->
            {#if activeDeviceId === dev.deviceId}
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
                class="p-3 pt-0 border-t border-primary/20 bg-base-100/60"
              >
                <input type="hidden" name="deviceId" value={dev.deviceId} />

                <div class="flex items-center gap-2 mt-2">
                  <div class="relative flex-1">
                    <Ticket class="w-4 h-4 text-primary absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="voucherCode"
                      placeholder="KODE VOUCHER (4 DIGIT)"
                      maxLength={4}
                      required
                      autofocus
                      class="input input-lg input-bordered input-primary w-full text-center pl-4 font-mono uppercase tracking-wider text-lg"
                    />
                  </div>

                  <!-- Tombol Submit -->
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    class="btn btn-lg btn-primary shrink-0"
                  >
                    {#if isSubmitting}
                      <span class="loading loading-spinner loading-xs"></span>
                    {:else}
                      Proses
                    {/if}
                  </button>

                  <!-- Tombol Batal (X) -->
                  <button
                    type="button"
                    onclick={closeForm}
                    class="btn btn-lg btn-square btn-ghost text-base-content/60 hover:text-error shrink-0"
                    title="Batal"
                  >
                    <X class="w-6 h-6" />
                  </button>
                </div>
              </form>
            {/if}
          </div>
        {:else}
          <p class="text-xs text-base-content/40 italic py-2">Belum ada perangkat terdaftar di outlet ini.</p>
        {/each}
      </div>
    </div>
  </div>
</div>