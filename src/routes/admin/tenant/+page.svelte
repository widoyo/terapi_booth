<script lang="ts">
  let { data } = $props();
  let search = $state('');

  let filteredTenants = $derived(
    data.tenants.filter((t) =>
      t.namaTenant.toLowerCase().includes(search.toLowerCase())
    )
  );
</script>

<div class="flex flex-col gap-4">
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold">Daftar Tenant</h1>
    <a href="/admin/tenants/new" class="btn btn-primary btn-sm">+ Tenant Baru</a>
  </div>

  <input
    type="text"
    placeholder="Cari tenant..."
    bind:value={search}
    class="input input-bordered w-full max-w-xs input-sm"
  />

  <div class="overflow-x-auto border border-base-300 rounded-lg">
    <table class="table table-zebra w-full">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nama Tenant</th>
          <th>Alamat</th>
          <th>Outlet</th>
          <th>Device</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        {#each filteredTenants as t (t.tenantId)}
          <tr>
            <td>#{t.tenantId}</td>
            <td class="font-semibold">{t.namaTenant}</td>
            <td>{t.alamat || '-'}</td>
            <td><span class="badge badge-ghost">{t.totalOutlets}</span></td>
            <td><span class="badge badge-ghost">{t.totalDevices}</span></td>
            <td>
              <a href="/admin/tenants/{t.tenantId}" class="btn btn-xs btn-outline">
                Detail
              </a>
            </td>
          </tr>
        {:else}
          <tr>
            <td colspan="6" class="text-center py-4 text-base-content/60">
              Tidak ada data tenant.
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>