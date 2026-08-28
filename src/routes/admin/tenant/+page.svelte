<script lang="ts">
  import { 
    Building2, Plus, Edit2, Trash2, Eye, Store, Cpu, 
    FileText, Activity, MapPin, X, ChevronRight 
  } from '@lucide/svelte';
  import { goto, invalidateAll } from '$app/navigation';

  let { data, form } = $props();
  let tenantList = $derived(data.tenants ?? []);
  let selected = $derived(data.selectedTenant);

  let modalFormEl: HTMLDialogElement;
  let modalDetailEl: HTMLDialogElement;
  let activeTab = $state<'outlets' | 'devices' | 'invoices' | 'sessions'>('outlets');

  let isEdit = $state(false);
  let formState = $state({
    tenantId: 0,
    namaTenant: '',
    alamat: '',
    hargaDefault: 60000,
    durasiMenit: 30
  });

  // Buka modal detail otomatis jika ada query param ?id=X
  $effect(() => {
    if (selected) {
      modalDetailEl?.showModal();
    }
  });

  function openCreateModal() {
    isEdit = false;
    formState = { tenantId: 0, namaTenant: '', alamat: '', hargaDefault: 60000, durasiMenit: 30 };
    modalFormEl?.showModal();
  }

  function openEditModal(item: any) {
    isEdit = true;
    formState = {
      tenantId: item.tenantId,
      namaTenant: item.namaTenant,
      alamat: item.alamat ?? '',
      hargaDefault: item.config?.hargaDefault ?? 60000,
      durasiMenit: item.config?.durasiMenit ?? 30
    };
    modalFormEl?.showModal();
  }

  async function showDetail(id: number) {
    await goto(`?id=${id}`, {keepFocus: true, noScroll: true});
    await invalidateAll();
  }

  async function closeDetailModal() {
    modalDetailEl?.close();
    await goto('?', { replaceState: true, noScroll: true });
    await invalidateAll();
  }

  function closeModal() {
    modalFormEl?.close();
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold flex items-center gap-2">
        <Building2 class="w-6 h-6 text-primary" /> Kelola Tenant
      </h1>
      <p class="text-sm text-base-content/70">Daftar penyewa/pemilik lokasi operasional booth.</p>
    </div>

    <button onclick={openCreateModal} class="btn btn-primary btn-sm gap-2">
      <Plus class="w-4 h-4" /> Tambah Tenant
    </button>
  </div>

  {#if form?.message}
    <div class="alert alert-error text-sm py-2 rounded-lg">
      <span>{form.message}</span>
    </div>
  {/if}

  <!-- Tabel Tenant -->
  <div class="card bg-base-100 border border-base-300 shadow-sm overflow-hidden">
    <div class="overflow-x-auto">
      <table class="table table-zebra w-full">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nama Tenant</th>
            <th>Alamat</th>
            <th>Terdaftar</th>
            <th class="text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {#each tenantList as item}
            <tr>
              <td class="font-mono text-xs font-bold text-base-content/70">#{item.tenantId}</td>
              <td class="font-bold text-primary">{item.namaTenant}</td>
              <td class="text-xs text-base-content/80 max-w-xs truncate">
                {item.alamat || '-'}
              </td>
              <td class="text-xs text-base-content/60">{item.createdAt ?? '-'}</td>
              <td class="text-right">
                <div class="flex items-center justify-end gap-1">
                  <button 
                    onclick={() => showDetail(item.tenantId)} 
                    class="btn btn-ghost btn-xs text-primary"
                    title="Lihat Detail & Relasi"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                  <button 
                    onclick={() => openEditModal(item)} 
                    class="btn btn-ghost btn-xs text-info"
                    title="Edit Tenant"
                  >
                    <Edit2 class="w-4 h-4" />
                  </button>
                  <form action="?/delete" method="POST" onsubmit={() => confirm('Hapus tenant ini? Semua outlet, device, dan data terkait akan ikut terhapus!')}>
                    <input type="hidden" name="tenantId" value={item.tenantId} />
                    <button type="submit" class="btn btn-ghost btn-xs text-error" title="Hapus Tenant">
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="5" class="text-center py-8 text-base-content/50">
                Belum ada tenant terdaftar.
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- MODAL TAMBAH / EDIT TENANT -->
<dialog bind:this={modalFormEl} class="modal">
  <div class="modal-box max-w-md">
    <h3 class="font-bold text-lg mb-4">{isEdit ? 'Edit Tenant' : 'Tambah Tenant Baru'}</h3>

    <form method="POST" action={isEdit ? '?/update' : '?/create'} class="space-y-4" onsubmit={closeModal}>
      {#if isEdit}
        <input type="hidden" name="tenantId" value={formState.tenantId} />
      {/if}

      <label class="form-control w-full">
        <div class="label"><span class="label-text font-medium">Nama Tenant</span></div>
        <input type="text" name="namaTenant" placeholder="mis. Klinik Sehat Makmur" bind:value={formState.namaTenant} class="input input-bordered w-full" required />
      </label>

      <label class="form-control w-full">
        <div class="label"><span class="label-text font-medium">Alamat</span></div>
        <textarea name="alamat" placeholder="Jl. Raya No. 45..." bind:value={formState.alamat} class="textarea textarea-bordered h-20 w-full"></textarea>
      </label>

      <div class="grid grid-cols-2 gap-3">
        <label class="form-control w-full">
          <div class="label"><span class="label-text font-medium text-xs">Harga Default (Rp)</span></div>
          <input type="number" name="hargaDefault" bind:value={formState.hargaDefault} class="input input-bordered w-full text-sm" required />
        </label>
        <label class="form-control w-full">
          <div class="label"><span class="label-text font-medium text-xs">Durasi Sesi (Menit)</span></div>
          <input type="number" name="durasiMenit" bind:value={formState.durasiMenit} class="input input-bordered w-full text-sm" required />
        </label>
      </div>

      <div class="modal-action">
        <button type="button" class="btn btn-ghost" onclick={closeModal}>Batal</button>
        <button type="submit" class="btn btn-primary">Simpan</button>
      </div>
    </form>
  </div>
  <form method="dialog" class="modal-backdrop"><button>close</button></form>
</dialog>

<!-- MODAL DETAIL TENANT & RELASI 1-N -->
<dialog bind:this={modalDetailEl} class="modal" onClose={closeDetailModal}>
  <div class="modal-box max-w-4xl w-11/12 p-6">
    {#if selected}
      <!-- Header Detail -->
      <div class="flex justify-between items-start border-b border-base-200 pb-4 mb-4">
        <div>
          <div class="flex items-center gap-2">
            <h3 class="font-bold text-xl text-primary">{selected.namaTenant}</h3>
            <span class="badge badge-outline text-xs">ID #{selected.tenantId}</span>
          </div>
          <p class="text-xs text-base-content/70 flex items-center gap-1 mt-1">
            <MapPin class="w-3.5 h-3.5" /> {selected.alamat || 'Alamat belum diatur'}
          </p>
        </div>
        <button onclick={closeDetailModal} class="btn btn-sm btn-circle btn-ghost"><X class="w-5 h-5" /></button>
      </div>

      <!-- Tab Navigasi Relasi -->
      <div class="tabs tabs-boxed bg-base-200 p-1 mb-4">
        <button 
          class="tab text-xs gap-1.5 {activeTab === 'outlets' ? 'tab-active' : ''}" 
          onclick={() => activeTab = 'outlets'}
        >
          <Store class="w-3.5 h-3.5" /> Outlets ({selected.outlets.length})
        </button>
        <button 
          class="tab text-xs gap-1.5 {activeTab === 'devices' ? 'tab-active' : ''}" 
          onclick={() => activeTab = 'devices'}
        >
          <Cpu class="w-3.5 h-3.5" /> Devices ({selected.devices.length})
        </button>
        <button 
          class="tab text-xs gap-1.5 {activeTab === 'invoices' ? 'tab-active' : ''}" 
          onclick={() => activeTab = 'invoices'}
        >
          <FileText class="w-3.5 h-3.5" /> Invoices ({selected.invoices.length})
        </button>
        <button 
          class="tab text-xs gap-1.5 {activeTab === 'sessions' ? 'tab-active' : ''}" 
          onclick={() => activeTab = 'sessions'}
        >
          <Activity class="w-3.5 h-3.5" /> Sesi Terapi ({selected.therapySessions.length})
        </button>
      </div>

      <!-- Konten Tab Outlets -->
      {#if activeTab === 'outlets'}
        <div class="overflow-x-auto max-h-80">
          <table class="table table-xs w-full">
            <thead>
              <tr><th>Nama Outlet</th><th>Hash</th><th>Alamat</th></tr>
            </thead>
            <tbody>
              {#each selected.outlets as o}
                <tr>
                  <td class="font-semibold">{o.namaOutlet}</td>
                  <td class="font-mono text-[11px]">{o.outletHash}</td>
                  <td class="text-base-content/70">{o.alamat || '-'}</td>
                </tr>
              {:else}
                <tr><td colspan="3" class="text-center py-4 text-base-content/40">Tidak ada outlet terhubung.</td></tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}

      <!-- Konten Tab Devices -->
      {#if activeTab === 'devices'}
        <div class="overflow-x-auto max-h-80">
          <table class="table table-xs w-full">
            <thead>
              <tr><th>Device ID</th><th>Hash</th><th>MAC Address</th><th>Harga Kustom</th><th>Status</th></tr>
            </thead>
            <tbody>
              {#each selected.devices as d}
                <tr>
                  <td class="font-mono font-bold text-primary">{d.deviceId}</td>
                  <td class="font-mono text-[11px]">{d.deviceHash}</td>
                  <td class="font-mono text-[11px]">{d.macAddress || '-'}</td>
                  <td>{d.hargaKustom ? `Rp ${d.hargaKustom.toLocaleString('id-ID')}` : 'Standar'}</td>
                  <td>
                    <span class="badge badge-xs {d.statusAktif ? 'badge-success' : 'badge-error'}">
                      {d.statusAktif ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                </tr>
              {:else}
                <tr><td colspan="5" class="text-center py-4 text-base-content/40">Tidak ada device terhubung.</td></tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}

      <!-- Konten Tab Invoices -->
      {#if activeTab === 'invoices'}
        <div class="overflow-x-auto max-h-80">
          <table class="table table-xs w-full">
            <thead>
              <tr><th>Invoice ID</th><th>Bulan/Tahun</th><th>Total Tagihan</th><th>Status</th></tr>
            </thead>
            <tbody>
              {#each selected.invoices as inv}
                <tr>
                  <td class="font-mono font-bold">{inv.invoiceId}</td>
                  <td>{inv.bulanTahun}</td>
                  <td class="font-semibold">Rp {inv.totalTagihan.toLocaleString('id-ID')}</td>
                  <td>
                    <span class="badge badge-xs {inv.statusBayar === 'PAID' ? 'badge-success' : 'badge-warning'}">
                      {inv.statusBayar}
                    </span>
                  </td>
                </tr>
              {:else}
                <tr><td colspan="4" class="text-center py-4 text-base-content/40">Belum ada tagihan invoice.</td></tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}

      <!-- Konten Tab Sesi Terapi -->
      {#if activeTab === 'sessions'}
        <div class="overflow-x-auto max-h-80">
          <table class="table table-xs w-full">
            <thead>
              <tr><th>Session ID</th><th>Device</th><th>Pelanggan</th><th>Nominal</th><th>Status</th></tr>
            </thead>
            <tbody>
              {#each selected.therapySessions as s}
                <tr>
                  <td class="font-mono font-bold text-[11px]">{s.sessionId}</td>
                  <td class="font-mono">{s.deviceId}</td>
                  <td>{s.namaPelanggan || 'Anonim'}</td>
                  <td>Rp {s.nominalBayar.toLocaleString('id-ID')}</td>
                  <td><span class="badge badge-xs badge-ghost">{s.statusPembayaran}</span></td>
                </tr>
              {:else}
                <tr><td colspan="5" class="text-center py-4 text-base-content/40">Belum ada riwayat sesi terapi.</td></tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    {/if}
  </div>
  <form method="dialog" class="modal-backdrop"><button onclick={closeDetailModal}>close</button></form>
</dialog>