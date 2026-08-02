<script lang="ts">
  import { enhance } from "$app/forms";

  let { data, form } = $props();

  // State modal & edit
  let showModal = $state(false);
  let isEditMode = $state(false);

  // State form
  let activeDeviceId = $state("");
  let activeDeviceHash = $state("");
  let activeTenantId = $state("");
  let activeMacAddress = $state("");
  let activeHargaKustom = $state("");
  let activeStatusAktif = $state(1);

  function openCreateModal() {
    isEditMode = false;
    activeDeviceId = "";
    activeDeviceHash = "";
    activeTenantId = data.tenantList[0]?.tenantId?.toString() || "";
    activeMacAddress = "";
    activeHargaKustom = "";
    activeStatusAktif = 1;
    showModal = true;
  }

  function openEditModal(device: any) {
    isEditMode = true;
    activeDeviceId = device.deviceId;
    activeDeviceHash = device.deviceHash;
    activeTenantId = device.tenantId?.toString();
    activeMacAddress = device.macAddress || "";
    activeHargaKustom = device.hargaKustom ? device.hargaKustom.toString() : "";
    activeStatusAktif = device.statusAktif;
    showModal = true;
  }

  function closeModal() {
    showModal = false;
  }
</script>

<div class="p-6 max-w-6xl mx-auto space-y-6">
  <!-- Header & Action -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold">Manajemen Device (pidiBox)</h1>
      <p class="text-xs opacity-60">Kelola daftar perangkat fisik dan tautan tenant.</p>
    </div>
    <button class="btn btn-primary font-bold" onclick={openCreateModal}>
      + Tambah Device
    </button>
  </div>

  <!-- Feedback Alert -->
  {#if form?.message}
    <div class="alert {form.success ? 'alert-success' : 'alert-error'} text-sm py-2">
      <span>{form.message}</span>
    </div>
  {/if}

  <!-- Tabel Data Device -->
  <div class="overflow-x-auto bg-base-100 rounded-xl border border-base-200 shadow-sm">
    <table class="table w-full">
      <thead>
        <tr class="bg-base-200/50">
          <th>Device ID</th>
          <th>Tenant</th>
          <th>MAC Address</th>
          <th>Harga Kustom</th>
          <th>Status</th>
          <th class="text-right">Aksi</th>
        </tr>
      </thead>
      <tbody>
        {#each data.deviceList as item}
          <tr class="hover">
            <td class="font-mono font-bold text-primary">{item.deviceId}</td>
            <td>{item.tenantName || "Tanpa Tenant"}</td>
            <td class="font-mono text-xs">{item.macAddress || "-"}</td>
            <td>
              {#if item.hargaKustom}
                <span class="badge badge-outline">Rp {item.hargaKustom.toLocaleString("id-ID")}</span>
              {:else}
                <span class="text-xs opacity-40">Default Tenant</span>
              {/if}
            </td>
            <td>
              {#if item.statusAktif === 1}
                <span class="badge badge-success text-white badge-sm font-semibold">Aktif</span>
              {:else}
                <span class="badge badge-error text-white badge-sm font-semibold">Suspend</span>
              {/if}
            </td>
            <td class="text-right space-x-1">
              <button
                class="btn btn-xs btn-ghost text-info"
                onclick={() => openEditModal(item)}
              >
                Edit
              </button>
              
              <form method="POST" action="?/delete" use:enhance class="inline">
                <input type="hidden" name="deviceId" value={item.deviceId} />
                <button
                  type="submit"
                  class="btn btn-xs btn-ghost text-error"
                  onclick={(e) => !confirm(`Hapus device ${item.deviceId}?`) && e.preventDefault()}
                >
                  Hapus
                </button>
              </form>
            </td>
          </tr>
        {:else}
          <tr>
            <td colspan="6" class="text-center py-8 opacity-50">
              Belum ada perangkat terdaftar.
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<!-- Modal Form (Create / Update) -->
{#if showModal}
  <div class="modal modal-open">
    <div class="modal-box max-w-md">
      <h3 class="font-bold text-lg mb-4">
        {isEditMode ? "Edit Device" : "Tambah Device Baru"}
      </h3>

      <form
        method="POST"
        action={isEditMode ? "?/update" : "?/create"}
        use:enhance={() => {
          return async ({ update }) => {
            await update();
            closeModal();
          };
        }}
        class="space-y-4"
      >
        <div class="form-control">
          <label class="label text-xs font-bold" for="deviceId">Device ID (Hardcoded ESP32)</label>
          <input
            id="deviceId"
            type="text"
            name="deviceId"
            bind:value={activeDeviceId}
            placeholder="Misal: 2606-1"
            class="input input-bordered font-mono"
            readonly={isEditMode}
            required
          />
        </div>

        {#if !isEditMode}
          <div class="form-control">
            <label class="label text-xs font-bold" for="deviceHash">Device Hash (Secret Validasi)</label>
            <input
              id="deviceHash"
              type="text"
              name="deviceHash"
              bind:value={activeDeviceHash}
              placeholder="Hash unik alat"
              class="input input-bordered font-mono text-xs"
              required
            />
          </div>
        {/if}

        <div class="form-control">
          <label class="label text-xs font-bold" for="tenantId">Pilih Tenant Pengelola</label>
          <select id="tenantId" name="tenantId" bind:value={activeTenantId} class="select select-bordered" required>
            <option value="" disabled>-- Pilih Tenant --</option>
            {#each data.tenantList as tenant}
              <option value={tenant.tenantId.toString()}>{tenant.namaTenant}</option>
            {/each}
          </select>
        </div>

        <div class="form-control">
          <label class="label text-xs font-bold" for="macAddress">MAC Address (Opsional)</label>
          <input
            id="macAddress"
            type="text"
            name="macAddress"
            bind:value={activeMacAddress}
            placeholder="AA:BB:CC:DD:EE:FF"
            class="input input-bordered font-mono text-xs"
          />
        </div>

        <div class="form-control">
          <label class="label text-xs font-bold" for="hargaKustom">Harga Kustom Sesi (Kosongi jika default)</label>
          <input
            id="hargaKustom"
            type="number"
            name="hargaKustom"
            bind:value={activeHargaKustom}
            placeholder="60000"
            class="input input-bordered"
          />
        </div>

        {#if isEditMode}
          <div class="form-control">
            <label class="label text-xs font-bold" for="statusAktif">Status Perangkat</label>
            <select id="statusAktif" name="statusAktif" bind:value={activeStatusAktif} class="select select-bordered">
              <option value={1}>Aktif Operasional</option>
              <option value={0}>Suspend / Mati</option>
            </select>
          </div>
        {/if}

        <div class="modal-action">
          <button type="button" class="btn btn-ghost" onclick={closeModal}>Batal</button>
          <button type="submit" class="btn btn-primary">Simpan</button>
        </div>
      </form>
    </div>
  </div>
{/if}