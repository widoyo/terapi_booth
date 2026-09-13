<script>
  // Svelte 5: Menggunakan $props() untuk menggantikan 'export let data'
  let { data } = $props();

  const statusColors = {
    boot: 'bg-blue-100 text-blue-800 border-blue-300',
    restart: 'bg-purple-100 text-purple-800 border-purple-300',
    startup: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    idle: 'bg-gray-100 text-gray-800 border-gray-300',
    preparation: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    running: 'bg-green-100 text-green-800 border-green-300'
  };

  function getBadgeClass(status) {
    return statusColors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  }
</script>

<div class="p-6 max-w-6xl mx-auto">
  <div class="flex justify-between items-center mb-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-800">Device Logs</h1>
      <p class="text-sm text-gray-500">Riwayat perubahan status IoT device</p>
    </div>
    <!-- Svelte 5: Menggunakan attribute standard `onclick` -->
    <button 
      onclick={() => location.reload()} 
      class="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md border cursor-pointer"
    >
      Refresh
    </button>
  </div>

  <div class="bg-white border rounded-lg shadow-sm overflow-hidden">
    <table class="w-full text-left text-sm">
      <thead class="bg-gray-50 border-b text-gray-600 uppercase text-xs">
        <tr>
          <th class="px-4 py-3">ID</th>
          <th class="px-4 py-3">Device ID</th>
          <th class="px-4 py-3">Status</th>
          <th class="px-4 py-3">Waktu</th>
        </tr>
      </thead>
      <tbody class="divide-y">
        {#if data.logs.length === 0}
          <tr>
            <td colspan="4" class="px-4 py-6 text-center text-gray-400">
              Belum ada log tercatat.
            </td>
          </tr>
        {:else}
          {#each data.logs as log (log.id)}
            <tr class="hover:bg-gray-50">
              <td class="px-4 py-3 font-mono text-xs text-gray-400">#{log.id}</td>
              <td class="px-4 py-3 font-medium text-gray-900">{log.deviceId}</td>
              <td class="px-4 py-3">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold border {getBadgeClass(log.status)}">
                  {log.status}
                </span>
              </td>
              <td class="px-4 py-3 text-gray-500 text-xs">
                {new Date(log.timestamp).toLocaleString('id-ID')}
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>