<script setup lang="ts">
import { ref } from 'vue'
import AppBackLink from '@/components/base/AppBackLink.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppConfirmDialog from '@/components/base/AppConfirmDialog.vue'
import AppErrorState from '@/components/base/AppErrorState.vue'
import AppSkeleton from '@/components/base/AppSkeleton.vue'
import StatusBadge from '@/components/dashboard/StatusBadge.vue'
import { useAsync } from '@/composables/useAsync'
import { adminService } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { formatDate, formatDateTime, formatNaira, humanize } from '@/utils/format'

const props = defineProps<{ id: number }>()
const auth = useAuthStore()
const ui = useUiStore()
const { data: user, loading, error, execute } = useAsync(() => adminService.user(props.id), { watch: [() => props.id] })

const confirm = ref(false)
const busy = ref(false)
async function toggle() {
  if (!user.value) return
  busy.value = true
  try {
    const next = user.value.status === 'active' ? 'suspended' : 'active'
    const updated = await adminService.setUserStatus(user.value.id, next)
    user.value = { ...user.value, status: updated.status }
    ui.success(next === 'suspended' ? 'User suspended' : 'User reactivated')
    confirm.value = false
  } catch (e) {
    ui.apiError(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div>
    <AppBackLink fallback="/admin/users" icon="chevron" label="All users" />
    <AppSkeleton v-if="loading && !user" height="240px" radius="12px" class="mt" />
    <AppErrorState v-else-if="error" :error="error" class="mt" @retry="execute" />
    <template v-else-if="user">
      <header class="head">
        <div>
          <h2 class="head__name">{{ user.name }}</h2>
          <p class="head__meta">{{ user.email }} · {{ user.phone ?? 'No phone' }}</p>
          <div class="head__badges">
            <StatusBadge :status="user.status" />
            <StatusBadge :status="user.kyc_status" :label="`KYC: ${humanize(user.kyc_status)}`" />
          </div>
        </div>
        <AppButton v-if="auth.can('users.manage')" :variant="user.status === 'active' ? 'danger-soft' : 'primary'" @click="confirm = true">
          {{ user.status === 'active' ? 'Suspend user' : 'Reactivate user' }}
        </AppButton>
      </header>

      <div class="grid">
        <section class="panel">
          <h3 class="panel__title">Profile</h3>
          <dl class="facts">
            <div><dt>Joined</dt><dd>{{ formatDate(user.created_at) }}</dd></div>
            <div><dt>Last login</dt><dd>{{ formatDateTime(user.last_login_at) }}</dd></div>
            <div><dt>Address</dt><dd>{{ user.address ?? '—' }}</dd></div>
            <div><dt>Next of kin</dt><dd>{{ user.next_of_kin ? `${user.next_of_kin.full_name} (${user.next_of_kin.relationship}) · ${user.next_of_kin.phone}` : '—' }}</dd></div>
            <div><dt>Total invested</dt><dd>{{ formatNaira(user.total_invested) }}</dd></div>
          </dl>
        </section>
        <section class="panel">
          <h3 class="panel__title">Positions</h3>
          <p v-if="!user.positions.length" class="muted">No investments.</p>
          <ul v-else class="rows" role="list">
            <li v-for="p in user.positions" :key="p.reference"><span><code>{{ p.reference }}</code> {{ humanize(p.product) }}</span><span>{{ formatNaira(p.principal) }} <StatusBadge :status="p.status" size="sm" /></span></li>
          </ul>
        </section>
        <section class="panel">
          <h3 class="panel__title">Recent transactions</h3>
          <p v-if="!user.recent_transactions.length" class="muted">No transactions.</p>
          <ul v-else class="rows" role="list">
            <li v-for="t in user.recent_transactions" :key="t.reference"><span><code>{{ t.reference }}</code> {{ formatDate(t.date) }}</span><span>{{ formatNaira(t.amount) }} <StatusBadge :status="t.status" size="sm" /></span></li>
          </ul>
        </section>
      </div>

      <AppConfirmDialog
        v-model:open="confirm"
        :title="user.status === 'active' ? 'Suspend this user?' : 'Reactivate this user?'"
        :message="user.status === 'active' ? 'They will be signed out immediately and notified by email.' : 'They will be able to log in again and will be notified by email.'"
        :tone="user.status === 'active' ? 'danger' : 'primary'"
        :confirm-label="user.status === 'active' ? 'Suspend' : 'Reactivate'"
        :loading="busy"
        @confirm="toggle"
      />
    </template>
  </div>
</template>

<style scoped>
.mt {
  margin-top: 20px;
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin: 20px 0;
  padding: 20px;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
}

.head__name {
  font-size: var(--text-xl);
  font-weight: 600;
}

.head__meta {
  margin-top: 4px;
  font-size: var(--text-sm);
  color: var(--color-muted);
}

.head__badges {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.panel {
  padding: 20px;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
}

.panel__title {
  margin-bottom: 14px;
  font-size: var(--text-base);
  font-weight: 600;
}

.facts {
  display: grid;
  gap: 12px;
  margin: 0;
}

.facts dt {
  font-size: var(--text-xs);
  color: var(--color-muted);
}

.facts dd {
  margin: 2px 0 0;
  font-size: var(--text-sm);
}

.rows {
  display: grid;
  gap: 10px;
}

.rows li {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: var(--text-sm);
}

.rows code {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
}

.muted {
  font-size: var(--text-sm);
  color: var(--color-muted);
}

@media (max-width: 1023px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .head {
    flex-direction: column;
  }
}
</style>
