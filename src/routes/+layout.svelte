<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="drawer md:drawer-open min-h-screen bg-base-100 text-base-content">
  <input id="main-drawer" type="checkbox" class="drawer-toggle" />
  
  <div class="drawer-content flex flex-col">
    
    <header class="navbar bg-base-100 border-b border-base-300 px-4 md:px-6">
      <div class="flex-none md:hidden">
        <label for="main-drawer" aria-label="open sidebar" class="btn btn-square btn-ghost">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-6 h-6 stroke-current">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </label>
      </div>
      
      <div class="flex-1 px-2 mx-2">
        <span class="text-sm breadcrumbs text-base-content/60">Terapi Sehat</span>
      </div>
    </header>

    <main class="p-4 md:p-6 flex-1">
      {@render children()}
    </main>
	<footer class="footer p-4 bg-base-200 text-base-content border-t border-base-300">
		<p>&copy; 2026 Terapi Sehat. All rights reserved.</p>
	</footer>
  </div>

 <div class="drawer-side">
  <label for="main-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
  
  <aside class="bg-base-200 w-64 min-h-full p-4 border-r border-base-300 flex flex-col gap-2 font-medium">
    <!-- Header dengan Judul dan Tombol X -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-base-300 mb-2">
      <span class="text-lg font-bold">Terapi Booth</span>
      
      <!-- Tombol X Close -->
      <label for="main-drawer" aria-label="close sidebar" class="btn btn-sm btn-circle btn-ghost">
        ✕
      </label>
    </div>
    
    <a href="/" class="btn btn-ghost justify-start">Dashboard</a>
    <a href="/setting" class="btn btn-ghost justify-start">Pengaturan</a>
  </aside>
</div>

</div>