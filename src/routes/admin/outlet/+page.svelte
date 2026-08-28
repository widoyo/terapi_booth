<script lang="ts">
  import { Store, Plus, Edit2, Trash2, MapPin, Hash, Search } from '@lucide/svelte';
  import { onMount, tick } from 'svelte';

  let { data, form } = $props();
  let outletList = $derived(data.outlets ?? []);
  let isSuperAdmin = $derived(data.userRole === 'SUPER_ADMIN');

  let modalEl: HTMLDialogElement;
  let mapContainer: HTMLDivElement;
  let isEdit = $state(false);

  // Form State
  let formState = $state({
    outletId: 0,
    tenantId: data.userTenantId ?? 0,
    namaOutlet: '',
    alamat: '',
    latitude: null as number | null,
    longitude: null as number | null
  });

  // Geolocation Search State
  let searchQuery = $state('');
  let isSearching = $state(false);

  // Leaflet references
  let L: any = null;
  let map: any = null;
  let marker: any = null;

  onMount(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      L = (window as any).L;
    };
    document.head.appendChild(script);
  });

  async function initMap(lat = -7.5666, lng = 110.8166) {
    await tick();
    if (!L || !mapContainer) return;

    if (map) {
      map.remove();
      map = null;
    }

    const defaultLat = formState.latitude ?? lat;
    const defaultLng = formState.longitude ?? lng;

    map = L.map(mapContainer).setView([defaultLat, defaultLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    if (formState.latitude && formState.longitude) {
      marker = L.marker([formState.latitude, formState.longitude]).addTo(map);
    }

    map.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      formState.latitude = Number(lat.toFixed(6));
      formState.longitude = Number(lng.toFixed(6));

      if (marker) {
        marker.setLatLng([lat, lng]);
      } else {
        marker = L.marker([lat, lng]).addTo(map);
      }
    });

    setTimeout(() => map.invalidateSize(), 300);
  }

  async function cariWilayah() {
    if (!searchQuery.trim()) return;
    isSearching = true;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const results = await res.json();

      if (results && results.length > 0) {
        const top = results[0];
        const lat = parseFloat(top.lat);
        const lon = parseFloat(top.lon);

        formState.latitude = Number(lat.toFixed(6));
        formState.longitude = Number(lon.toFixed(6));

        if (map) {
          map.setView([lat, lon], 16);
          if (marker) {
            marker.setLatLng([lat, lon]);
          } else {
            marker = L.marker([lat, lon]).addTo(map);
          }
        }
      } else {
        alert('Lokasi tidak ditemukan. Coba ketik nama daerah lebih spesifik.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      isSearching = false;
    }
  }

  function openCreateModal() {
    isEdit = false;
    searchQuery = '';
    marker = null;
    formState = {
      outletId: 0,
      tenantId: data.userTenantId ?? 0,
      namaOutlet: '',
      alamat: '',
      latitude: null,
      longitude: null
    };
    modalEl?.showModal();
    initMap();
  }

  function openEditModal(item: any) {
    isEdit = true;
    searchQuery = '';
    marker = null;
    formState = {
      outletId: item.outletId,
      tenantId: item.tenantId,
      namaOutlet: item.namaOutlet,
      alamat: item.alamat ?? '',
      latitude: item.latitude ?? null,
      longitude: item.longitude ?? null
    };
    modalEl?.showModal();
    initMap(item.latitude ?? -7.5666, item.longitude ?? 110.8166);
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
        <Store class="w-6 h-6 text-primary" /> Kelola Outlet
      </h1>
      <p class="text-sm text-base-content/70">
        {isSuperAdmin ? 'Daftar seluruh lokasi outlet dari semua tenant.' : 'Daftar lokasi outlet terdaftar untuk tenant Anda.'}
      </p>
    </div>

    <button onclick={openCreateModal} class="btn btn-primary btn-sm gap-2">
      <Plus class="w-4 h-4" /> Tambah Outlet
    </button>
  </div>

  {#if form?.message}
    <div class="alert alert-error text-sm py-2 rounded-lg">
      <span>{form.message}</span>
    </div>
  {/if}

  <!-- Tabel Daftar Outlet -->
  <div class="card bg-base-100 border border-base-300 shadow-sm overflow-hidden">
    <div class="overflow-x-auto">
      <table class="table table-zebra w-full">
        <thead>
          <tr>
            <th>Nama Outlet</th>
            <th>Hash ID</th>
            {#if isSuperAdmin}
              <th>Tenant</th>
            {/if}
            <th>Alamat</th>
            <th>Koordinat</th>
            <th>Terdaftar</th>
            <th class="text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {#each outletList as item}
            <tr>
              <td class="font-bold text-base-content">{item.namaOutlet}</td>

              <td>
                <span class="badge badge-ghost font-mono text-xs gap-1">
                  <Hash class="w-3 h-3 text-base-content/50" /> {item.outletHash}
                </span>
              </td>

              {#if isSuperAdmin}
                <td class="font-medium text-xs">
                  {item.namaTenant ?? `Tenant #${item.tenantId}`}
                </td>
              {/if}

              <td class="text-xs text-base-content/80 max-w-xs truncate">
                {#if item.alamat}
                  <span class="flex items-center gap-1">
                    <MapPin class="w-3 h-3 shrink-0 text-base-content/50" /> {item.alamat}
                  </span>
                {:else}
                  <span class="italic text-base-content/40">-</span>
                {/if}
              </td>

              <td class="font-mono text-xs">
                {#if item.latitude && item.longitude}
                  <a
                    href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                    target="_blank"
                    class="link link-hover text-primary flex items-center gap-1"
                  >
                    <MapPin class="w-3 h-3" />
                    {item.latitude}, {item.longitude}
                  </a>
                {:else}
                  <span class="text-base-content/40 italic">-</span>
                {/if}
              </td>

              <td class="text-xs text-base-content/60">
                {item.createdAt ?? '-'}
              </td>

              <td class="text-right">
                <div class="flex items-center justify-end gap-1">
                  <button
                    onclick={() => openEditModal(item)}
                    class="btn btn-ghost btn-xs text-info"
                    title="Edit Outlet"
                  >
                    <Edit2 class="w-4 h-4" />
                  </button>

                  <form action="?/delete" method="POST" onsubmit={() => confirm('Hapus outlet ini?')}>
                    <input type="hidden" name="outletId" value={item.outletId} />
                    <button type="submit" class="btn btn-ghost btn-xs text-error" title="Hapus Outlet">
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan={isSuperAdmin ? 7 : 6} class="text-center py-8 text-base-content/50">
                Belum ada outlet terdaftar.
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- Modal Tambah / Edit Outlet -->
<dialog bind:this={modalEl} class="modal">
  <div class="modal-box max-w-2xl">
    <h3 class="font-bold text-lg mb-4">
      {isEdit ? 'Edit Outlet' : 'Tambah Outlet Baru'}
    </h3>

    <form method="POST" action={isEdit ? '?/update' : '?/create'} class="space-y-4" onsubmit={closeModal}>
      {#if isEdit}
        <input type="hidden" name="outletId" value={formState.outletId} />
      {/if}

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#if isSuperAdmin}
          <label class="form-control w-full">
            <div class="label">
              <span class="label-text font-medium">Pilih Tenant</span>
            </div>
            <select name="tenantId" bind:value={formState.tenantId} class="select select-bordered w-full" required>
              <option value={0} disabled>-- Pilih Tenant --</option>
              {#each data.tenantOptions as t}
                <option value={t.tenantId}>{t.namaTenant}</option>
              {/each}
            </select>
          </label>
        {/if}

        <label class="form-control w-full {isSuperAdmin ? '' : 'col-span-2'}">
          <div class="label">
            <span class="label-text font-medium">Nama Outlet</span>
          </div>
          <input 
            type="text" 
            name="namaOutlet" 
            placeholder="mis. Outlet Cabang Solo Baru" 
            bind:value={formState.namaOutlet}
            class="input input-bordered w-full" 
            required 
          />
        </label>
      </div>

      <label class="form-control w-full">
        <div class="label">
          <span class="label-text font-medium">Alamat</span>
        </div>
        <textarea 
          name="alamat" 
          placeholder="Jl. Raya No. 123..." 
          bind:value={formState.alamat}
          class="textarea textarea-bordered h-20 w-full"
        ></textarea>
      </label>

      <!-- Geolocation Search -->
      <div class="form-control w-full">
        <div class="label">
          <span class="label-text font-medium">Cari Lokasi / Wilayah (Prov/Kab/Kec/Desa)</span>
        </div>
        <div class="flex gap-2">
          <input
            type="text"
            placeholder="mis. Jebres, Surakarta, Jawa Tengah"
            bind:value={searchQuery}
            onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), cariWilayah())}
            class="input input-bordered flex-1 text-sm"
          />
          <button type="button" class="btn btn-square btn-primary" onclick={cariWilayah} disabled={isSearching}>
            {#if isSearching}
              <span class="loading loading-spinner loading-xs"></span>
            {:else}
              <Search class="w-4 h-4" />
            {/if}
          </button>
        </div>
      </div>

      <!-- Leaflet Map Container -->
      <div class="form-control w-full">
        <div class="label">
          <span class="label-text font-medium text-xs text-base-content/70">
            Klik pada peta untuk menetapkan titik lokasi:
          </span>
        </div>
        <div bind:this={mapContainer} class="w-full h-52 rounded-lg border border-base-300 z-0"></div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <label class="form-control w-full">
          <div class="label"><span class="label-text font-medium text-xs">Latitude</span></div>
          <input
            type="number"
            step="any"
            name="latitude"
            bind:value={formState.latitude}
            placeholder="-7.5666"
            class="input input-bordered w-full font-mono text-sm"
          />
        </label>

        <label class="form-control w-full">
          <div class="label"><span class="label-text font-medium text-xs">Longitude</span></div>
          <input
            type="number"
            step="any"
            name="longitude"
            bind:value={formState.longitude}
            placeholder="110.8166"
            class="input input-bordered w-full font-mono text-sm"
          />
        </label>
      </div>

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