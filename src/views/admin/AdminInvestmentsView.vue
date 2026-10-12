<script setup lang="ts">
import AdminToolbar from '@/components/admin/AdminToolbar.vue'
import AppDataTable, { type Column } from '@/components/base/AppDataTable.vue'
import AppErrorState from '@/components/base/AppErrorState.vue'
import AppPagination from '@/components/base/AppPagination.vue'
import StatusBadge from '@/components/dashboard/StatusBadge.vue'
import { useResourceList } from '@/composables/useResourceList'
import { adminService } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { AdminInvestment } from '@/types'
import { formatDate, formatNaira, humanize } from '@/utils/format'

const auth = useAuthStore()
const ui = useUiStore()
const list = useResourceList<AdminInvestment, { product: string; status: string }>({
  fetcher: (q) => adminService.investments(q),
  filters: { product: '', status: '' },
  sort: '-created_at',
})

const STATUSES = ['interest_submitted', 'pending_signature', 'pending_payment', 'active', 'matured', 'paid_out', 'cancelled']
/** Transitions an operator may apply; the API validates every transition. */
const NEXT: Record<string, string[]> = {
  interest_submitted: ['cancelled'],
  pending_signature: ['cancelled'],
  pending_payment: ['cancelled'],
  matured: ['paid_out'],
}

const columns: Column[] = [
  { key: 'reference', label: 'Reference', primary: true },
  { key: 'customer', label: 'Customer' },
  { key: 'description', label: 'Product', hideOnMobile: true },
  { key: 'principal', label: 'Principal', align: 'right', sortable: true },
  { key: 'roi_percent', label: 'ROI', align: 'right' },
  { key: 'maturity_date', label: 'Maturity', sortable: true },
  { key: 'status', label: 'Status' },
]

async function update(row: AdminInvestment, status: string) {
  if (!status) return
  try {
    await adminService.updateInvestmentStatus(row.id, status)
    ui.success(`${row.reference} marked ${humanize(status).toLowerCase()}`)
    await list.refresh()
  } catch (e) {
    ui.apiError(e)
  }
}
</script>

<template>
  <div>
    <AdminToolbar v-model:search="list.search.value" placeholder="Search reference or customer">
      <label><span class="sr-only">Product</span>
        <select v-model="list.filters.product"><option value="">All products</option><option value="buyback">Buyback</option><option value="capital_investment">Capital investment</option></select>
      </label>
      <label><span class="sr-only">Status</span>
        <select v-model="list.filters.status"><option value="">All statuses</option><option v-for="s in STATUSES" :key="s" :value="s">{{ humanize(s) }}</option></select>
      </label>
    </AdminToolbar>
    <AppErrorState v-if="list.error.value" :error="list.error.value" @retry="list.refresh" />
    <template v-else>
      <AppDataTable :columns="columns" :rows="list.items.value" :loading="list.loading.value" :sort="list.sort.value" caption="Investments" @sort="list.toggleSort">
        <template #cell-reference="{ row }"><span class="cell"><strong>{{ row.reference }}</strong><small>{{ humanize(row.product) }} · {{ formatDate(row.created_at) }}</small></span></template>
        <template #cell-customer="{ row }"><span class="cell"><span>{{ row.customer.name }}</span><small>{{ row.customer.email }}</small></span></template>
        <template #cell-principal="{ row }">{{ formatNaira(row.principal) }}</template>
        <template #cell-roi_percent="{ row }">{{ row.roi_percent }}% / {{ row.tenure_months }}m</template>
        <template #cell-maturity_date="{ row }">{{ formatDate(row.maturity_date) }}</template>
        <template #cell-status="{ row }"><StatusBadge :status="row.status" size="sm" /></template>
        <template v-if="auth.can('investments.manage')" #actions="{ row }">
          <label v-if="NEXT[row.status]" class="action-select">
            <span class="sr-only">Change status of {{ row.reference }}</span>
            <select @change="update(row, ($event.target as HTMLSelectElement).value); ($event.target as HTMLSelectElement).value = ''">
              <option value="">Update…</option>
              <option v-for="s in NEXT[row.status]" :key="s" :value="s">Mark {{ humanize(s).toLowerCase() }}</option>
            </select>
          </label>
        </template>
      </AppDataTable>
      <AppPagination v-model:page="list.page.value" v-model:per-page="list.perPage.value" :meta="list.meta.value" label="investments" show-page-size />
    </template>
  </div>
</template>

<style scoped>
.cell {
  display: flex;
  flex-direction: column;
}

.cell small {
  font-size: var(--text-xs);
  color: var(--color-muted);
}

.action-select select {
  height: 32px;
  padding: 0 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  font-size: var(--text-xs);
}
</style>
