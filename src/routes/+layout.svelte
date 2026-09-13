<script lang="ts">
  import './layout.css';
  import { ShieldCheck } from '@lucide/svelte';
  import { page } from '$app/state';
  let { children } = $props();

  // Memeriksa apakah URL diawali dengan /admin atau /d
  const hideTerms = $derived(
    page.url.pathname.startsWith('/admin') || page.url.pathname.startsWith('/d')
  );
</script>

<div class="min-h-screen bg-base-100 text-base-content font-sans antialiased">
  <!-- Slot Konten Utama Publik -->
  {@render children()}
</div>
{#if !hideTerms}
  <a
    href="/t&s"
    class="fixed bottom-4 left-4 z-50 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-base-100/90 text-base-content/70 hover:text-primary border border-base-300 shadow-md backdrop-blur-sm transition-all hover:scale-105"
    title="Syarat & Ketentuan"
  >
    <ShieldCheck class="w-3.5 h-3.5" />
    <span>Ketentuan Layanan</span>
  </a>
{/if}