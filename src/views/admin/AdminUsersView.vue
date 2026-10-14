<script setup lang="ts">
import AppSelect from '@/components/base/AppSelect.vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AdminToolbar from '@/components/admin/AdminToolbar.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppConfirmDialog from '@/components/base/AppConfirmDialog.vue'
import AppDataTable, { type Column } from '@/components/base/AppDataTable.vue'
import AppErrorState from '@/components/base/AppErrorState.vue'
import AppPagination from '@/components/base/AppPagination.vue'
import StatusBadge from '@/components/dashboard/StatusBadge.vue'
import { useResourceList } from '@/composables/useResourceList'
import { adminService } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { AdminUser, UserBulkAction } from '@/types'
import { formatDate, formatNaira } from '@/utils/format'

const auth = useAuthStore()
const ui = useUiStore()
const router = useRouter()

const list = useResourceList<AdminUser, { status: string; kyc_status: string }>({
  fetcher: (q) => adminService.users(q),
  filters: { status: '', kyc_status: '' },
  sort: '-created_at',
})

const columns: Column[] = [
  { key: 'name', label: 'User', sortable: true, primary: true },
  { key: 'kyc_status', label: 'KYC' },
  { key: 'status', label: 'Status' },
  { key: 'investments_count', label: 'Positions', align: 'right', hideOnMobile: true },
  { key: 'total_invested', label: 'Invested', align: 'right', sortable: true },
  { key: 'created_at', label: 'Joined', sortable: true, hideOnMobile: true },
]

const selected = ref<number[]>([])
const pending = ref<{ action: UserBulkAction; ids: number[]; label: string } | null>(null)
const busy = ref(false)

function ask(action: UserBulkAction, ids: number[]) {
  const label = action === 'suspend' ? 'Suspend' : action === 'activate' ? 'Reactivate' : 'Resend verification to'
  pending.value = { action, ids, label }
}

async function run() {
  if (!pending.value) return
  busy.value = true
  try {
    const res = await adminService.bulkUsers({ action: pending.value.action, ids: pending.value.ids })
    ui.success(`${res.processed} user(s) updated`, res.failed ? `${res.failed} could not be updated.` : undefined)
    selected.value = []
    pending.value = null
    await list.refresh()
  } catch (e) {
    ui.apiError(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div>
    <AdminToolbar v-model:search="list.search.value" placeholder="Search name, email or phone" :selected-count="auth.can('users.manage') ? selected.length : 0">
      <AppSelect v-model="list.filters.status" variant="filter" label="Status" hide-label empty-label="All statuses" :options="[{ value: 'active', label: 'Active' }, { value: 'suspended', label: 'Suspended' }]" />
      <AppSelect v-model="list.filters.kyc_status" variant="filter" label="KYC status" hide-label empty-label="All KYC" :options="[{ value: 'verified', label: 'Verified' }, { value: 'pending', label: 'Pending' }, { value: 'unverified', label: 'Unverified' }]" />
      <template #bulk>
        <AppButton size="sm" variant="secondary" @click="ask('activate', selected)">Activate</AppButton>
        <AppButton size="sm" variant="danger-soft" @click="ask('suspend', selected)">Suspend</AppButton>
        <AppButton size="sm" variant="ghost" @click="ask('resend_verification', selected)">Resend verification</AppButton>
      </template>
    </AdminToolbar>

    <AppErrorState v-if="list.error.value" :error="list.error.value" @retry="list.refresh" />
    <template v-else>
      <AppDataTable
        v-model:selected="selected"
        :columns="columns"
        :rows="list.items.value"
        :loading="list.loading.value"
        :sort="list.sort.value"
        :selectable="auth.can('users.manage')"
        caption="Users"
        @sort="list.toggleSort"
        @row-click="(u) => router.push({ name: 'admin-user', params: { id: u.id } })"
      >
        <template #cell-name="{ row }">
          <span class="user"><strong>{{ row.name }}</strong><small>{{ row.email }}</small></span>
        </template>
        <template #cell-kyc_status="{ row }"><StatusBadge :status="row.kyc_status" size="sm" /></template>
        <template #cell-status="{ row }"><StatusBadge :status="row.status" size="sm" /></template>
        <template #cell-total_invested="{ row }">{{ formatNaira(row.total_invested) }}</template>
        <template #cell-created_at="{ row }">{{ formatDate(row.created_at) }}</template>
        <template v-if="auth.can('users.manage')" #actions="{ row }">
          <AppButton v-if="row.status === 'active'" size="sm" variant="danger-soft" @click="ask('suspend', [row.id])">Suspend</AppButton>
          <AppButton v-else size="sm" variant="secondary" @click="ask('activate', [row.id])">Activate</AppButton>
        </template>
      </AppDataTable>
      <AppPagination v-model:page="list.page.value" v-model:per-page="list.perPage.value" :meta="list.meta.value" label="users" show-page-size />
    </template>

    <AppConfirmDialog
      :open="!!pending"
      :title="`${pending?.label} ${pending?.ids.length} user(s)?`"
      :message="pending?.action === 'suspend' ? 'Suspended users are signed out immediately and cannot log in until reactivated. They will be notified by email.' : 'Affected users will be notified by email.'"
      :tone="pending?.action === 'suspend' ? 'danger' : 'primary'"
      :confirm-label="pending?.label ?? 'Confirm'"
      :loading="busy"
      @update:open="(v) => !v && (pending = null)"
      @confirm="run"
    />
  </div>
</template>

<style scoped>
.user {
  display: flex;
  flex-direction: column;
}

.user small {
  font-size: var(--text-xs);
  color: var(--color-muted);
  font-weight: 400;
}

:deep(tbody tr) {
  cursor: pointer;
}
</style>
