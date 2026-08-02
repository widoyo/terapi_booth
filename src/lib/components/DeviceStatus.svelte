<!-- DeviceStatus.svelte -->
<script lang="ts">
  let { deviceId, deviceState } = $props<{
    deviceId: string;
    deviceState: string;
  }>();
</script>

<div>
  <h1 class="text-xs font-bold tracking-widest text-base-content/40 uppercase">
    Akses Layanan pidi
  </h1>
  <h2 class="text-3xl font-black text-primary mt-1">
    ID: {deviceId}
  </h2>

  <div class="mt-2 flex justify-center gap-2 items-center text-xs">
    <span class="opacity-60">Kondisi Alat:</span>
    <span
      class="badge font-bold px-2.5 py-0.5 uppercase
      {deviceState === 'idle' ? 'badge-success text-white' : ''}
      {deviceState === 'running' ? 'badge-error text-white' : ''}
      {deviceState === 'offline' ? 'badge-neutral' : ''}
      {deviceState === 'loading' ? 'badge-ghost' : ''}"
    >
      {deviceState}
    </span>
  </div>
</div>