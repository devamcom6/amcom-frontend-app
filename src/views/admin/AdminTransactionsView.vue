<script setup lang="ts">
import AppSelect from '@/components/base/AppSelect.vue'
import { ref } from 'vue'
import AdminToolbar from '@/components/admin/AdminToolbar.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppDataTable, { type Column } from '@/components/base/AppDataTable.vue'
import AppErrorState from '@/components/base/AppErrorState.vue'
import AppPagination from '@/components/base/AppPagination.vue'
import StatusBadge from '@/components/dashboard/StatusBadge.vue'
import { useResourceList } from '@/composables/useResourceList'
import { adminService } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { Transaction } from '@/types'
import { formatDateTime, formatNaira, humanize } from '@/utils/format'

const auth = useAuthStore()
const ui = useUiStore()
const list = useResourceList<Transaction, { status: string; payable_type: string; from: string; to: string }>({
  fetcher: (q) => adminService.transactions(q),
  filters: { status: '', payable_type: '', from: '', to: '' },
  sort: '-created_at',
})

const columns: Column[] = [
  { key: 'reference', label: 'Reference', primary: true },
  { key: 'user', label: 'Customer' },
  { key: 'payable_type', label: 'For', hideOnMobile: true },
  { key: 'amount', label: 'Amount', align: 'right', sortable: true },
  { key: 'method', label: 'Channel', hideOnMobile: true },
  { key: 'status', label: 'Status' },
  { key: 'created_at', label: 'Date', sortable: true },
]

const requerying = ref<string | null>(null)
async function requery(t: Transaction) {
  requerying.value = t.reference
  try {
    await adminService.requeryTransaction(t.reference)
    ui.success('Re-queried with Paystack', `${t.reference} status refreshed.`)
    await list.refresh()
  } catch (e) {
    ui.apiError(e)
  } finally {
    requerying.value = null
  }
}
</script>

<template>
  <div>
    <AdminToolbar v-model:search="list.search.value" placeholder="Search reference, customer">
      <AppSelect v-model="list.filters.status" variant="filter" label="Status" hide-label empty-label="All statuses" :options="['success', 'pending', 'failed', 'abandoned', 'reversed'].map((v) => ({ value: v, label: humanize(v) }))" />
      <AppSelect v-model="list.filters.payable_type" variant="filter" label="Type" hide-label empty-label="All types" :options="['buyback_order', 'capital_investment', 'listing_fee', 'holding_payment'].map((v) => ({ value: v, label: humanize(v) }))" />
      <label><span class="sr-only">From</span><input v-model="list.filters.from" type="date" class="date" /></label>
      <label><span class="sr-only">To</span><input v-model="list.filters.to" type="date" class="date" /></label>
    </AdminToolbar>
    <AppErrorState v-if="list.error.value" :error="list.error.value" @retry="list.refresh" />
    <template v-else>
      <AppDataTable :columns="columns" :rows="list.items.value" :loading="list.loading.value" :sort="list.sort.value" caption="Transactions" @sort="list.toggleSort">
        <template #cell-reference="{ row }"><code class="ref">{{ row.reference }}</code></template>
        <template #cell-user="{ row }"><span class="cell"><span>{{ row.user?.name ?? '—' }}</span><small>{{ row.user?.email }}</small></span></template>
        <template #cell-payable_type="{ row }">{{ row.description }}</template>
        <template #cell-amount="{ row }"><span class="cell cell--right"><strong>{{ formatNaira(row.amount) }}</strong><small>fee {{ formatNaira(row.fee) }}</small></span></template>
        <template #cell-method="{ row }">{{ humanize(row.channel) }}</template>
        <template #cell-status="{ row }"><StatusBadge :status="row.status" size="sm" /></template>
        <template #cell-created_at="{ row }">{{ formatDateTime(row.created_at) }}</template>
        <template v-if="auth.can('transactions.manage')" #actions="{ row }">
          <AppButton v-if="row.status === 'pending'" size="sm" variant="secondary" :loading="requerying === row.reference" @click="requery(row)">Re-query</AppButton>
        </template>
      </AppDataTable>
      <AppPagination v-model:page="list.page.value" v-model:per-page="list.perPage.value" :meta="list.meta.value" label="transactions" show-page-size />
    </template>
  </div>
</template>

<style scoped>
.ref {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
}

.cell {
  display: flex;
  flex-direction: column;
}

.cell--right {
  align-items: flex-end;
}

.cell small {
  font-size: var(--text-xs);
  color: var(--color-muted);
}

.date {
  height: 40px;
  padding: 0 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
}
</style>
