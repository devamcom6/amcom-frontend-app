<script setup lang="ts">
import { ref } from 'vue'
import AdminToolbar from '@/components/admin/AdminToolbar.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppConfirmDialog from '@/components/base/AppConfirmDialog.vue'
import AppDataTable, { type Column } from '@/components/base/AppDataTable.vue'
import AppErrorState from '@/components/base/AppErrorState.vue'
import AppInput from '@/components/base/AppInput.vue'
import AppModal from '@/components/base/AppModal.vue'
import AppPagination from '@/components/base/AppPagination.vue'
import AppSelect from '@/components/base/AppSelect.vue'
import StatusBadge from '@/components/dashboard/StatusBadge.vue'
import { ROLE_LABELS } from '@/constants/access'
import { useForm } from '@/composables/useForm'
import { useResourceList } from '@/composables/useResourceList'
import { adminService } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { AdminAccount } from '@/types'
import { formatDate, formatRelativeTime } from '@/utils/format'
import { email, required } from '@/utils/validators'

/** Super-admin only: invite, re-role and revoke administrators. Invitations are emailed via ZeptoMail. */
const auth = useAuthStore()
const ui = useUiStore()
const list = useResourceList<AdminAccount>({ fetcher: (q) => adminService.admins(q) })
const ROLE_OPTIONS = [
  { value: 'admin', label: ROLE_LABELS.admin },
  { value: 'super_admin', label: ROLE_LABELS.super_admin },
]

const columns: Column[] = [
  { key: 'name', label: 'Administrator', primary: true },
  { key: 'role', label: 'Role' },
  { key: 'status', label: 'Status' },
  { key: 'last_login_at', label: 'Last login' },
  { key: 'created_at', label: 'Added', hideOnMobile: true },
]

const inviteOpen = ref(false)
const form = useForm(
  { name: '', email: '', role: 'admin' as AdminAccount['role'] },
  { rules: { name: [required('Enter a name.')], email: [required('Enter an email.'), email()] } },
)

async function invite() {
  try {
    const created = await form.submit(() => adminService.inviteAdmin(form.values))
    if (created) {
      inviteOpen.value = false
      form.reset()
      ui.success('Invitation sent', `${created.email} will receive an email to set their password.`)
      await list.refresh()
    }
  } catch (e) {
    ui.apiError(e)
  }
}

async function changeRole(a: AdminAccount, role: string) {
  if (role === a.role) return
  try {
    await adminService.changeAdminRole(a.id, role as AdminAccount['role'])
    ui.success(`${a.name} is now ${ROLE_LABELS[role as AdminAccount['role']]}`)
    await list.refresh()
  } catch (e) {
    ui.apiError(e)
    await list.refresh()
  }
}

const revoking = ref<AdminAccount | null>(null)
const busy = ref(false)
async function revoke() {
  if (!revoking.value) return
  busy.value = true
  try {
    await adminService.revokeAdmin(revoking.value.id)
    ui.success('Access revoked')
    revoking.value = null
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
    <AdminToolbar v-model:search="list.search.value" placeholder="Search administrators">
      <AppButton size="sm" icon-left="plus" @click="inviteOpen = true">Invite administrator</AppButton>
    </AdminToolbar>
    <AppErrorState v-if="list.error.value" :error="list.error.value" @retry="list.refresh" />
    <template v-else>
      <AppDataTable :columns="columns" :rows="list.items.value" :loading="list.loading.value" caption="Administrators">
        <template #cell-name="{ row }"><span class="cell"><strong>{{ row.name }}<template v-if="row.id === auth.user?.id"> (you)</template></strong><small>{{ row.email }}</small></span></template>
        <template #cell-role="{ row }">
          <AppSelect v-if="row.id !== auth.user?.id" :model-value="row.role" variant="filter" size="sm" :label="`Role for ${row.name}`" hide-label :options="ROLE_OPTIONS" @change="(v) => changeRole(row, String(v))" />
          <span v-else>{{ ROLE_LABELS[row.role] }}</span>
        </template>
        <template #cell-status="{ row }"><StatusBadge :status="row.status" size="sm" /></template>
        <template #cell-last_login_at="{ row }">{{ row.last_login_at ? formatRelativeTime(row.last_login_at) : 'Never' }}</template>
        <template #cell-created_at="{ row }">{{ formatDate(row.created_at) }}</template>
        <template #actions="{ row }">
          <AppButton v-if="row.id !== auth.user?.id" size="sm" variant="danger-soft" @click="revoking = row">Revoke</AppButton>
        </template>
      </AppDataTable>
      <AppPagination v-model:page="list.page.value" :meta="list.meta.value" label="administrators" />
    </template>

    <AppModal v-model:open="inviteOpen" title="Invite administrator" size="sm" :persistent="form.submitting">
      <form id="invite-form" class="stack" novalidate @submit.prevent="invite">
        <AppInput v-model="form.values.name" label="Full name" :error="form.errors.name" @blur="form.touch('name')" />
        <AppInput v-model="form.values.email" label="Work email" type="email" :error="form.errors.email" @blur="form.touch('email')" />
        <AppSelect v-model="form.values.role" label="Role" :options="ROLE_OPTIONS" />
      </form>
      <template #footer><AppButton type="submit" form="invite-form" block :loading="form.submitting">Send invitation</AppButton></template>
    </AppModal>

    <AppConfirmDialog
      :open="!!revoking"
      :title="`Revoke access for ${revoking?.name}?`"
      message="They will be signed out of the admin console immediately. Their customer account (if any) is not affected."
      tone="danger"
      confirm-label="Revoke access"
      :loading="busy"
      @update:open="(v) => !v && (revoking = null)"
      @confirm="revoke"
    />
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


.stack {
  display: grid;
  gap: 16px;
}
</style>
