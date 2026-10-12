<script setup lang="ts">
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
import type { AdminRequest } from '@/types'
import { formatDateTime, formatRelativeTime, humanize } from '@/utils/format'

/** Leads & service requests: buyback/capital interests, property applications, inspections, contact & support. */
const auth = useAuthStore()
const ui = useUiStore()
const list = useResourceList<AdminRequest, { kind: string; status: string }>({
  fetcher: (q) => adminService.requests(q),
  filters: { kind: '', status: '' },
  sort: '-created_at',
})

const columns: Column[] = [
  { key: 'subject', label: 'Request', primary: true },
  { key: 'kind', label: 'Type' },
  { key: 'name', label: 'Contact' },
  { key: 'assigned_to', label: 'Assignee', hideOnMobile: true },
  { key: 'status', label: 'Status' },
  { key: 'created_at', label: 'Received', sortable: true },
]

async function update(row: AdminRequest, payload: { status?: AdminRequest['status']; assigned_to_me?: boolean }) {
  try {
    await adminService.updateRequest(row.id, payload)
    ui.success('Request updated')
    await list.refresh()
  } catch (e) {
    ui.apiError(e)
  }
}
</script>

<template>
  <div>
    <AdminToolbar v-model:search="list.search.value" placeholder="Search reference, name, subject">
      <label><span class="sr-only">Type</span>
        <select v-model="list.filters.kind">
          <option value="">All types</option>
          <option v-for="k in ['interest', 'application', 'inspection', 'contact', 'support']" :key="k" :value="k">{{ humanize(k) }}</option>
        </select>
      </label>
      <label><span class="sr-only">Status</span>
        <select v-model="list.filters.status"><option value="">All statuses</option><option value="new">New</option><option value="in_progress">In progress</option><option value="closed">Closed</option></select>
      </label>
    </AdminToolbar>
    <AppErrorState v-if="list.error.value" :error="list.error.value" @retry="list.refresh" />
    <template v-else>
      <AppDataTable :columns="columns" :rows="list.items.value" :loading="list.loading.value" :sort="list.sort.value" caption="Requests" @sort="list.toggleSort">
        <template #cell-subject="{ row }">
          <span class="cell"><strong>{{ row.subject }}</strong><small>{{ row.reference }}<template v-if="row.scheduled_for"> · scheduled {{ formatDateTime(row.scheduled_for) }}</template></small></span>
        </template>
        <template #cell-kind="{ row }">{{ humanize(row.kind) }}</template>
        <template #cell-name="{ row }"><span class="cell"><span>{{ row.name }}</span><small><a :href="`mailto:${row.email}`">{{ row.email }}</a></small></span></template>
        <template #cell-assigned_to="{ row }">{{ row.assigned_to ?? 'Unassigned' }}</template>
        <template #cell-status="{ row }"><StatusBadge :status="row.status" size="sm" /></template>
        <template #cell-created_at="{ row }">{{ formatRelativeTime(row.created_at) }}</template>
        <template v-if="auth.can('requests.manage')" #actions="{ row }">
          <AppButton v-if="!row.assigned_to" size="sm" variant="secondary" @click="update(row, { assigned_to_me: true, status: 'in_progress' })">Assign to me</AppButton>
          <AppButton v-else-if="row.status !== 'closed'" size="sm" variant="secondary" @click="update(row, { status: 'closed' })">Close</AppButton>
        </template>
      </AppDataTable>
      <AppPagination v-model:page="list.page.value" v-model:per-page="list.perPage.value" :meta="list.meta.value" label="requests" show-page-size />
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
</style>
