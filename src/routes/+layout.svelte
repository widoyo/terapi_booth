<script lang="ts">
  import './layout.css';
  let { children } = $props();
</script>

<div class="min-h-screen bg-base-100 text-base-content font-sans antialiased">
  <!-- Slot Konten Utama Publik -->
  {@render children()}
</div>