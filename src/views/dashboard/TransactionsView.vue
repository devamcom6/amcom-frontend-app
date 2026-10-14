<script setup lang="ts">
import AppSelect from '@/components/base/AppSelect.vue'
import AppBackLink from '@/components/base/AppBackLink.vue'
import AppDataTable, { type Column } from '@/components/base/AppDataTable.vue'
import AppEmptyState from '@/components/base/AppEmptyState.vue'
import AppErrorState from '@/components/base/AppErrorState.vue'
import AppPagination from '@/components/base/AppPagination.vue'
import StatusBadge from '@/components/dashboard/StatusBadge.vue'
import { useResourceList } from '@/composables/useResourceList'
import { paymentService } from '@/services/api'
import type { Transaction } from '@/types'
import { formatDateTime, formatNaira, humanize } from '@/utils/format'

const list = useResourceList<Transaction, { status: string }>({
  fetcher: (q) => paymentService.history(q),
  perPage: 10,
  filters: { status: '' },
})

const columns: Column[] = [
  { key: 'description', label: 'Description', primary: true },
  { key: 'reference', label: 'Reference' },
  { key: 'created_at', label: 'Date' },
  { key: 'method', label: 'Method', hideOnMobile: true },
  { key: 'amount', label: 'Amount', align: 'right' },
  { key: 'status', label: 'Status' },
]
</script>

<template>
  <div class="tx">
    <AppBackLink fallback="/dashboard" icon="chevron" />
    <header class="tx__head">
      <div>
        <h1 class="tx__title">Payment history</h1>
        <p class="tx__lead">Every Paystack payment on your account, as verified by Amcom.</p>
      </div>
      <AppSelect v-model="list.filters.status" variant="filter" label="Filter by status" hide-label empty-label="All statuses" class="tx__filter" :options="[{ value: 'success', label: 'Successful' }, { value: 'pending', label: 'Pending' }, { value: 'failed', label: 'Failed' }, { value: 'abandoned', label: 'Abandoned' }]" />
    </header>

    <AppErrorState v-if="list.error.value" :error="list.error.value" @retry="list.refresh" />
    <AppEmptyState
      v-else-if="list.loaded.value && !list.items.value.length && !list.hasActiveFilters.value"
      icon="receipt"
      title="No payments yet"
      description="When you pay for an investment, listing fee or lease, the receipt will appear here."
    />
    <template v-else>
      <AppDataTable :columns="columns" :rows="list.items.value" :loading="list.loading.value" caption="Payment history">
        <template #cell-description="{ row }">{{ row.description }}</template>
        <template #cell-reference="{ row }"><code class="tx__ref">{{ row.reference }}</code></template>
        <template #cell-created_at="{ row }">{{ formatDateTime(row.created_at) }}</template>
        <template #cell-method="{ row }">{{ humanize(row.method) }}</template>
        <template #cell-amount="{ row }"><strong class="tabular">{{ formatNaira(row.amount) }}</strong></template>
        <template #cell-status="{ row }"><StatusBadge :status="row.status" size="sm" /></template>
        <template #empty><p>No payments match this filter.</p></template>
      </AppDataTable>
      <AppPagination v-model:page="list.page.value" :meta="list.meta.value" label="payments" />
    </template>
  </div>
</template>

<style scoped>
.tx {
  padding-top: 40px;
}

.tx__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  margin: 28px 0 24px;
}

.tx__title {
  font-size: var(--text-2xl);
  font-weight: 600;
}

.tx__lead {
  margin-top: 6px;
  font-size: var(--text-sm);
  color: var(--color-muted);
}


.tx__ref {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-body);
}

@media (max-width: 767px) {
  .tx {
    padding-top: 16px;
  }
  .tx__head {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
