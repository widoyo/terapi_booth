<script lang="ts">
  let { data, children } = $props();

  // Evaluasi status user dari data server secara reaktif
  let user = $derived(data?.user ?? null);
</script>

<div class="drawer md:drawer-open min-h-screen bg-base-100">
  <!-- Toggle untuk kontrol drawer mobile -->
  <input id="admin-drawer" type="checkbox" class="drawer-toggle" />

  <!-- Konten Utama -->
  <div class="drawer-content flex flex-col min-h-screen">
    <!-- Navbar Atas (Hanya muncul di Layar HP/Mobile) -->
    <div class="w-full navbar bg-base-200 border-b border-base-300 md:hidden flex justify-between px-4">
      <span class="text-lg font-bold">Terapi Booth</span>
      <label for="admin-drawer" aria-label="open sidebar" class="btn btn-square btn-ghost">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-6 h-6 stroke-current">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
      </label>
    </div>

    <!-- Area Halaman Admin -->
    <main class="flex-1 p-4 overflow-y-auto">
      {@render children()}
    </main>
  </div>

  <!-- Sidebar (Drawer Side) -->
  <div class="drawer-side z-40">
    <!-- Overlay untuk menutup drawer saat klik di luar menu di mobile -->
    <label for="admin-drawer" aria-label="close sidebar" class="drawer-overlay"></label>

    <aside class="w-64 min-h-full border-r border-base-300 bg-base-200 p-4 flex flex-col gap-2 font-medium">
      <!-- Header Sidebar (Desktop) -->
      <div class="flex items-center justify-between px-2 py-3 border-b border-base-300 mb-2">
        <span class="text-lg font-bold">Terapi Booth</span>
      </div>

      {#if user?.role === undefined}
        <div class="text-sm text-base-content/70 px-2 py-3">
          <p>Role user tidak dikenali.</p>
        </div>
      {/if}

      <!-- Menu Navigasi Admin -->
      {#if user}
        {#if user.role === 'SUPER_ADMIN'}
          <!-- Menu Khusus SUPER_ADMIN -->
          <a href="/admin/tenant" class="btn btn-ghost justify-start">Kelola Tenant</a>
          <a href="/admin/outlet" class="btn btn-ghost justify-start">Kelola Outlet</a>
          <a href="/admin/therapist" class="btn btn-ghost justify-start">Kelola Terapi</a>
          <a href="/admin/device" class="btn btn-ghost justify-start">Kelola Device</a>
          <a href="/admin/users" class="btn btn-ghost justify-start">Kelola User</a>
          <a href="/admin/voucher" class="btn btn-ghost justify-start">Voucher</a>
          <a href="/admin/setting" class="btn btn-ghost justify-start">Pengaturan System</a>
        {:else if user.role === 'TENANT_ADMIN'}
          <!-- Menu Khusus TENANT_ADMIN -->
          <a href="/admin/therapist" class="btn btn-ghost justify-start">Terapi</a>
          <a href="/admin/voucher" class="btn btn-ghost justify-start">Voucher</a>
          <a href="/admin/device" class="btn btn-ghost justify-start">Kelola Device</a>
          <a href="/admin/setting" class="btn btn-ghost justify-start">Pengaturan Booth</a>
        {/if}

        <div class="mt-auto border-t border-base-300 pt-3">
          <div class="flex items-center justify-between px-2 gap-2">
            <span class="text-sm font-semibold truncate" title={user?.username}>
              {user?.username}
            </span>

            <form action="/admin/logout" method="POST" class="shrink-0">
              <button type="submit" class="btn btn-ghost btn-xs text-error">
                Logout
              </button>
            </form>
          </div>
        </div>
      {:else}
        <div class="mt-auto border-t border-base-300 pt-2">
          <a href="/admin/login" class="btn btn-ghost justify-start text-primary w-full">
            Login Admin
          </a>
        </div>
      {/if}
    </aside>
  </div>
</div>