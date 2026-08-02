<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  // Format angka ke Rupiah
  function formatRupiah(val: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  }

  // Format tanggal teks
  function formatDate(dateStr: string) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
</script>

<div class="p-6 max-w-5xl mx-auto">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold tracking-tight">Daftar Voucher</h1>
  </div>

  <div class="overflow-x-auto border border-base-300 rounded-lg shadow-sm">
    <table class="table w-full">
      <thead>
        <tr class="bg-base-200">
          <th>Kode Voucher</th>
          <th>Potongan</th>
          <th>Masa Kadaluwarsa</th>
          <th>Status</th>
          <th>Tenant ID</th>
          <th class="text-right">Aksi</th>
        </tr>
      </thead>
      <tbody>
        {#if data.voucherList.length === 0}
          <tr>
            <td colspan="6" class="text-center py-8 text-base-content/60">
              Belum ada data voucher.
            </td>
          </tr>
        {:else}
          {#each data.voucherList as voucher (voucher.voucherCode)}
            <tr class="hover">
              <td class="font-mono font-bold">{voucher.voucherCode}</td>
              <td>
                {#if voucher.tipePotongan === 'PERSEN'}
                  <span class="badge badge-secondary">{voucher.nilaiPotongan}%</span>
                {:else}
                  <span class="badge badge-accent">{formatRupiah(voucher.nilaiPotongan)}</span>
                {/if}
              </td>
              <td>{formatDate(voucher.kadaluwarsa)}</td>
              <td>
                {#if voucher.isUsed === 1}
                  <span class="badge badge-ghost text-xs">Terpakai</span>
                {:else}
                  <span class="badge badge-success badge-outline text-xs">Aktif</span>
                {/if}
              </td>
              <td>{voucher.tenantId}</td>
              <td class="text-right">
                <form
                  method="POST"
                  action="?/delete"
                  use:enhance={() => {
                    return async ({ update }) => {
                      await update();
                    };
                  }}
                >
                  <input type="hidden" name="voucherCode" value={voucher.voucherCode} />
                  <button
                    type="submit"
                    class="btn btn-error btn-xs btn-outline"
                    onclick={(e) => {
                      if (!confirm(`Hapus voucher ${voucher.voucherCode}?`)) {
                        e.preventDefault();
                      }
                    }}
                  >
                    Hapus
                  </button>
                </form>
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>