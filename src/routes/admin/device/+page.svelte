<script lang="ts">
  import { Cpu, Plus, Edit2, Trash2, CheckCircle2, XCircle, Hash, Store } from '@lucide/svelte';

  let { data, form } = $props();
  let deviceList = $derived(data.devices ?? []);
  let isSuperAdmin = $derived(data.userRole === 'SUPER_ADMIN');

  let modalEl: HTMLDialogElement;
  let isEdit = $state(false);

  // Form State
  let formState = $state({
    deviceId: '',
    tenantId: data.userTenantId ?? 0,
    outletId: 0,
    hargaKustom: '',
    statusAktif: 1
  });

  // Filter pilihan outlet berdasarkan tenantId yang dipilih (khusus Super Admin)
  let filteredOutletOptions = $derived(
    isSuperAdmin
      ? (data.outletOptions ?? []).filter((o) => o.tenantId === formState.tenantId)
      : (data.outletOptions ?? [])
  );

  function openCreateModal() {
    isEdit = false;
    formState = {
      deviceId: '',
      tenantId: data.userTenantId ?? 0,
      outletId: 0,
      hargaKustom: '',
      statusAktif: 1
    };
    modalEl?.showModal();
  }

  function openEditModal(dev: any) {
    isEdit = true;
    formState = {
      deviceId: dev.deviceId,
      tenantId: dev.tenantId,
      outletId: dev.outletId ?? 0,
      hargaKustom: dev.hargaKustom ?? '',
      statusAktif: dev.statusAktif
    };
    modalEl?.showModal();
  }

  function closeModal() {
    modalEl?.close();
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold flex items-center gap-2">
        <Cpu class="w-6 h-6 text-primary" /> Kelola pidiBox
      </h1>
      <p class="text-sm text-base-content/70">
        {isSuperAdmin ? 'Daftar seluruh perangkat terdaftar di semua tenant.' : 'Daftar perangkat milik tenant Anda.'}
      </p>
    </div>

    <button onclick={openCreateModal} class="btn btn-primary btn-sm gap-2">
      <Plus class="w-4 h-4" /> Tambah pidiBox
    </button>
  </div>

  {#if form?.message}
    <div class="alert alert-error text-sm py-2 rounded-lg">
      <span>{form.message}</span>
    </div>
  {/if}

  <!-- Tabel Device -->
  <div class="card bg-base-100 border border-base-300 shadow-sm overflow-hidden">
    <div class="overflow-x-auto">
      <table class="table table-zebra w-full">
        <thead>
          <tr>
            <th>ID Device</th>
            <th>Hash</th>
            {#if isSuperAdmin}
              <th>Tenant</th>
            {/if}
            <th>Outlet</th>
            <th>Harga Kustom</th>
            <th>Status</th>
            <th class="text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {#each deviceList as dev}
            <tr>
              <td class="font-mono font-bold text-primary">{dev.deviceId}</td>

              <td>
                <span class="badge badge-ghost font-mono text-xs gap-1">
                  <Hash class="w-3 h-3 text-base-content/50" /> {dev.deviceHash}
                </span>
              </td>

              {#if isSuperAdmin}
                <td class="font-medium text-xs">
                  {dev.tenantName ?? `Tenant #${dev.tenantId}`}
                </td>
              {/if}

              <td class="text-xs">
                {#if dev.namaOutlet}
                  <span class="flex items-center gap-1 font-medium">
                    <Store class="w-3.5 h-3.5 text-primary" /> {dev.namaOutlet}
                  </span>
                {:else}
                  <span class="text-base-content/40 italic">- Belum diatur -</span>
                {/if}
              </td>

              <td>
                {#if dev.hargaKustom}
                  <span class="font-semibold text-xs">
                    Rp {dev.hargaKustom.toLocaleString('id-ID')}
                  </span>
                {:else}
                  <span class="text-xs text-base-content/40 italic">Standar</span>
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

              <td class="text-right">
                <div class="flex items-center justify-end gap-1">
                  <button 
                    onclick={() => openEditModal(dev)} 
                    class="btn btn-ghost btn-xs text-info"
                    title="Edit Device"
                  >
                    <Edit2 class="w-4 h-4" />
                  </button>

                  <form action="?/delete" method="POST" onsubmit={() => confirm('Hapus device ini?')}>
                    <input type="hidden" name="deviceId" value={dev.deviceId} />
                    <button type="submit" class="btn btn-ghost btn-xs text-error" title="Hapus Device">
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan={isSuperAdmin ? 7 : 6} class="text-center py-8 text-base-content/50">
                Belum ada data device terdaftar.
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- Modal Tambah / Edit Device -->
<dialog bind:this={modalEl} class="modal">
  <div class="modal-box max-w-md">
    <h3 class="font-bold text-lg mb-4">
      {isEdit ? 'Edit Device' : 'Tambah Device Baru'}
    </h3>

    <form method="POST" action={isEdit ? '?/update' : '?/create'} class="space-y-4" onsubmit={closeModal}>
      <label class="form-control w-full">
        <div class="label"><span class="label-text font-medium">ID Device</span></div>
        <input 
          type="text" 
          name="deviceId" 
          placeholder="mis. 2606-1" 
          bind:value={formState.deviceId}
          readonly={isEdit}
          class="input input-bordered w-full font-mono" 
          required 
        />
      </label>

      {#if isSuperAdmin}
        <label class="form-control w-full">
          <div class="label"><span class="label-text font-medium">Pilih Tenant</span></div>
          <select 
            name="tenantId" 
            bind:value={formState.tenantId} 
            onchange={() => (formState.outletId = 0)}
            class="select select-bordered w-full" 
            required
          >
            <option value={0} disabled>-- Pilih Tenant --</option>
            {#each data.tenantOptions as t}
              <option value={t.tenantId}>{t.namaTenant}</option>
            {/each}
          </select>
        </label>
      {/if}

      <label class="form-control w-full">
        <div class="label"><span class="label-text font-medium">Pilih Outlet (Lokasi)</span></div>
        <select name="outletId" bind:value={formState.outletId} class="select select-bordered w-full">
          <option value={0}>-- Tanpa Outlet (Belum Ditempatkan) --</option>
          {#each filteredOutletOptions as o}
            <option value={o.outletId}>{o.namaOutlet}</option>
          {/each}
        </select>
      </label>

      <label class="form-control w-full">
        <div class="label"><span class="label-text font-medium">Harga Kustom (Opsional)</span></div>
        <input 
          type="number" 
          name="hargaKustom" 
          placeholder="Kosongkan jika pakai harga standar" 
          bind:value={formState.hargaKustom}
          class="input input-bordered w-full" 
        />
      </label>

      {#if isEdit}
        <label class="form-control w-full">
          <div class="label"><span class="label-text font-medium">Status Perangkat</span></div>
          <select name="statusAktif" bind:value={formState.statusAktif} class="select select-bordered w-full">
            <option value={1}>Aktif</option>
            <option value={0}>Nonaktif</option>
          </select>
        </label>
      {/if}

      <div class="modal-action">
        <button type="button" class="btn btn-ghost" onclick={closeModal}>Batal</button>
        <button type="submit" class="btn btn-primary">Simpan</button>
      </div>
    </form>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>