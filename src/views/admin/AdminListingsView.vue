<script setup lang="ts">
import { ref } from 'vue'
import AdminToolbar from '@/components/admin/AdminToolbar.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppDataTable, { type Column } from '@/components/base/AppDataTable.vue'
import AppErrorState from '@/components/base/AppErrorState.vue'
import AppModal from '@/components/base/AppModal.vue'
import AppPagination from '@/components/base/AppPagination.vue'
import AppTextarea from '@/components/base/AppTextarea.vue'
import StatusBadge from '@/components/dashboard/StatusBadge.vue'
import { LISTING_TYPE_OPTIONS } from '@/constants/options'
import { useResourceList } from '@/composables/useResourceList'
import { adminService } from '@/services/api'
import { toApiError } from '@/services/http/errors'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { AdminListing } from '@/types'
import { formatDate, formatNaira, humanize } from '@/utils/format'

const auth = useAuthStore()
const ui = useUiStore()
const list = useResourceList<AdminListing, { status: string; listing_type: string }>({
  fetcher: (q) => adminService.listings(q),
  filters: { status: '', listing_type: '' },
  sort: '-submitted_at',
})

const columns: Column[] = [
  { key: 'title', label: 'Listing', primary: true },
  { key: 'owner', label: 'Owner' },
  { key: 'listing_type', label: 'Type' },
  { key: 'asking_price', label: 'Asking price', align: 'right', sortable: true },
  { key: 'status', label: 'Status' },
  { key: 'submitted_at', label: 'Submitted', sortable: true, hideOnMobile: true },
]

const reviewing = ref<AdminListing | null>(null)
const decision = ref<'approve' | 'reject'>('approve')
const reason = ref('')
const reasonError = ref<string | null>(null)
const busy = ref(false)

function open(l: AdminListing, d: 'approve' | 'reject') {
  reviewing.value = l
  decision.value = d
  reason.value = ''
  reasonError.value = null
}

async function submit() {
  if (!reviewing.value) return
  if (decision.value === 'reject' && reason.value.trim().length < 5) {
    reasonError.value = 'Give the owner a reason so they can fix the listing.'
    return
  }
  busy.value = true
  try {
    await adminService.reviewListing(reviewing.value.id, { decision: decision.value, reason: reason.value || null })
    ui.success(decision.value === 'approve' ? 'Listing approved and published' : 'Listing rejected', 'The owner has been notified by email.')
    reviewing.value = null
    await list.refresh()
  } catch (e) {
    const err = toApiError(e)
    if (err.isValidation) reasonError.value = err.fieldError('reason') ?? err.message
    else ui.apiError(err)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div>
    <AdminToolbar v-model:search="list.search.value" placeholder="Search title, reference, owner">
      <label><span class="sr-only">Status</span>
        <select v-model="list.filters.status">
          <option value="">All statuses</option>
          <option value="pending_verification">Pending verification</option>
          <option value="published">Published</option>
          <option value="awaiting_payment">Awaiting payment</option>
          <option value="rejected">Rejected</option>
          <option value="sold">Sold</option>
        </select>
      </label>
      <label><span class="sr-only">Listing type</span>
        <select v-model="list.filters.listing_type"><option value="">All types</option><option v-for="o in LISTING_TYPE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option></select>
      </label>
    </AdminToolbar>

    <AppErrorState v-if="list.error.value" :error="list.error.value" @retry="list.refresh" />
    <template v-else>
      <AppDataTable :columns="columns" :rows="list.items.value" :loading="list.loading.value" :sort="list.sort.value" caption="Listings" @sort="list.toggleSort">
        <template #cell-title="{ row }"><span class="cell"><strong>{{ row.title }}</strong><small>{{ row.reference }} · {{ row.city }}, {{ row.state }} · {{ row.photos_count }} photos</small></span></template>
        <template #cell-owner="{ row }"><span class="cell"><span>{{ row.owner.name }}</span><small>{{ row.owner.email }}</small></span></template>
        <template #cell-listing_type="{ row }">{{ humanize(row.listing_type) }} · {{ humanize(row.property_type) }}</template>
        <template #cell-asking_price="{ row }">{{ formatNaira(row.asking_price) }}</template>
        <template #cell-status="{ row }"><StatusBadge :status="row.status" size="sm" /></template>
        <template #cell-submitted_at="{ row }">{{ formatDate(row.submitted_at) }}</template>
        <template v-if="auth.can('listings.review')" #actions="{ row }">
          <template v-if="row.status === 'pending_verification'">
            <AppButton size="sm" @click="open(row, 'approve')">Approve</AppButton>
            <AppButton size="sm" variant="danger-soft" class="ml" @click="open(row, 'reject')">Reject</AppButton>
          </template>
        </template>
      </AppDataTable>
      <AppPagination v-model:page="list.page.value" v-model:per-page="list.perPage.value" :meta="list.meta.value" label="listings" show-page-size />
    </template>

    <AppModal :open="!!reviewing" :title="decision === 'approve' ? 'Approve listing' : 'Reject listing'" size="sm" :persistent="busy" @update:open="(v) => !v && (reviewing = null)">
      <p class="review__lead">
        <strong>{{ reviewing?.title }}</strong> by {{ reviewing?.owner.name }}.
        {{ decision === 'approve' ? 'Confirm the inspection is complete and title documents are in order. The listing goes live immediately.' : 'The owner will receive your reason by email.' }}
      </p>
      <AppTextarea v-model="reason" :label="decision === 'approve' ? 'Internal note' : 'Reason for rejection'" :optional="decision === 'approve'" :error="reasonError" :maxlength="500" />
      <template #footer>
        <AppButton block :variant="decision === 'approve' ? 'primary' : 'danger'" :loading="busy" @click="submit">
          {{ decision === 'approve' ? 'Approve & publish' : 'Reject listing' }}
        </AppButton>
      </template>
    </AppModal>
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

.ml {
  margin-left: 8px;
}

.review__lead {
  margin-bottom: 16px;
  font-size: var(--text-sm);
  color: var(--color-body);
}
</style>
