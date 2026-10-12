<script setup lang="ts">
import AdminToolbar from '@/components/admin/AdminToolbar.vue'
import AppDataTable, { type Column } from '@/components/base/AppDataTable.vue'
import AppErrorState from '@/components/base/AppErrorState.vue'
import AppPagination from '@/components/base/AppPagination.vue'
import AppToggle from '@/components/base/AppToggle.vue'
import { useResourceList } from '@/composables/useResourceList'
import { adminService } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { AdminEstate } from '@/types'
import { humanize } from '@/utils/format'

const auth = useAuthStore()
const ui = useUiStore()
const list = useResourceList<AdminEstate>({ fetcher: (q) => adminService.estates(q) })

const columns: Column[] = [
  { key: 'name', label: 'Estate', primary: true },
  { key: 'inventory', label: 'Plots (avail / reserved / sold)' },
  { key: 'checkout_mode', label: 'Checkout' },
  { key: 'is_published', label: 'Published' },
]

async function setPublished(e: AdminEstate, value: boolean) {
  try {
    await adminService.setEstatePublished(e.id, value)
    e.is_published = value
    ui.success(value ? `${e.name} published` : `${e.name} hidden from the website`)
  } catch (err) {
    ui.apiError(err)
  }
}
</script>

<template>
  <div>
    <AdminToolbar v-model:search="list.search.value" placeholder="Search estates" />
    <AppErrorState v-if="list.error.value" :error="list.error.value" @retry="list.refresh" />
    <template v-else>
      <AppDataTable :columns="columns" :rows="list.items.value" :loading="list.loading.value" caption="Estates">
        <template #cell-name="{ row }">
          <span class="cell"><RouterLink :to="{ name: 'estate-detail', params: { slug: row.slug } }" target="_blank" class="link-plain">{{ row.name }}</RouterLink><small>{{ row.city }}, {{ row.state }}</small></span>
        </template>
        <template #cell-inventory="{ row }">
          <span class="inv"><b>{{ row.available_plots }}</b> / {{ row.reserved_plots }} / {{ row.sold_plots }} <small>of {{ row.total_plots }}</small></span>
        </template>
        <template #cell-checkout_mode="{ row }">{{ row.checkout_mode === 'direct' ? 'Sign & pay online' : humanize('interest_only') }}</template>
        <template #cell-is_published="{ row }">
          <AppToggle
            v-if="auth.can('estates.manage')"
            :model-value="row.is_published"
            :label="row.is_published ? 'Live' : 'Hidden'"
            @update:model-value="setPublished(row, $event)"
          />
          <span v-else>{{ row.is_published ? 'Live' : 'Hidden' }}</span>
        </template>
      </AppDataTable>
      <AppPagination v-model:page="list.page.value" :meta="list.meta.value" label="estates" />
    </template>
  </div>
</template>

<style scoped>
.cell {
  display: flex;
  flex-direction: column;
}

.cell small,
.inv small {
  font-size: var(--text-xs);
  color: var(--color-muted);
}

.link-plain {
  font-weight: 600;
}

.link-plain:hover {
  color: var(--color-primary);
}

.inv b {
  color: var(--color-success-strong);
}
</style>
