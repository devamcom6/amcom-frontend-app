<script setup lang="ts">
import { computed, reactive } from 'vue'
import BarChart from '@/components/admin/BarChart.vue'
import StatTile from '@/components/admin/StatTile.vue'
import AppErrorState from '@/components/base/AppErrorState.vue'
import AppSkeleton from '@/components/base/AppSkeleton.vue'
import StatusBadge from '@/components/dashboard/StatusBadge.vue'
import { useAsync } from '@/composables/useAsync'
import { adminService } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { formatCompactNaira, formatNaira, formatNumber, formatRelativeTime, toISODate } from '@/utils/format'

const auth = useAuthStore()
const PRESETS = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
]
const range = reactive({ from: toISODate(new Date(Date.now() - 29 * 86_400_000)), to: toISODate(new Date()) })
const activePreset = computed(() => PRESETS.find((p) => range.from === toISODate(new Date(Date.now() - (p.days - 1) * 86_400_000)) && range.to === toISODate(new Date()))?.days)

function preset(days: number) {
  range.from = toISODate(new Date(Date.now() - (days - 1) * 86_400_000))
  range.to = toISODate(new Date())
}

const { data, loading, error, execute } = useAsync(() => adminService.dashboard({ ...range }), { watch: [() => range.from, () => range.to] })

const distMax = computed(() => Math.max(1, ...(data.value?.status_distribution.map((d) => d.value) ?? [1])))
</script>

<template>
  <div class="dash">
    <div class="dash__filters">
      <p class="dash__hello">Welcome back, {{ auth.displayName.split(' ')[0] }}</p>
      <div class="dash__range" role="group" aria-label="Date range">
        <button v-for="p in PRESETS" :key="p.days" type="button" class="dash__preset" :class="{ 'is-active': activePreset === p.days }" :aria-pressed="activePreset === p.days" @click="preset(p.days)">
          {{ p.label }}
        </button>
        <label class="dash__date"><span class="sr-only">From</span><input v-model="range.from" type="date" :max="range.to" /></label>
        <span aria-hidden="true">–</span>
        <label class="dash__date"><span class="sr-only">To</span><input v-model="range.to" type="date" :min="range.from" /></label>
      </div>
    </div>

    <AppErrorState v-if="error && !data" :error="error" @retry="execute" />
    <template v-else>
      <section class="dash__tiles" aria-label="Key figures" :class="{ 'is-loading': loading && data }">
        <template v-if="!data"><AppSkeleton v-for="i in 4" :key="i" height="118px" radius="12px" /></template>
        <template v-else>
          <StatTile label="Total users" :value="formatNumber(data.summary.total_users)" :trend="data.trends.users" icon="users" />
          <StatTile label="Revenue (period)" :value="formatCompactNaira(data.summary.total_revenue)" :trend="data.trends.revenue" icon="wallet" />
          <StatTile label="Transactions" :value="formatNumber(data.summary.total_transactions)" :trend="data.trends.transactions" icon="credit-card" />
          <StatTile label="Assets under management" :value="formatCompactNaira(data.summary.assets_under_management)" :trend="data.trends.assets_under_management" icon="landmark" />
        </template>
      </section>

      <div class="dash__grid">
        <section class="panel panel--wide" aria-labelledby="rev-title">
          <header class="panel__head">
            <h2 id="rev-title" class="panel__title">Revenue</h2>
            <span class="panel__meta">Verified Paystack payments</span>
          </header>
          <AppSkeleton v-if="!data" height="220px" />
          <BarChart v-else :data="data.revenue_series" title="Revenue by period" :format="formatNaira" />
        </section>

        <section class="panel" aria-labelledby="queue-title">
          <h2 id="queue-title" class="panel__title">Needs attention</h2>
          <ul v-if="data" class="queue" role="list">
            <li>
              <RouterLink v-if="auth.can('listings.view')" to="/admin/listings?status=pending_verification" class="queue__item">
                <span>Listings pending verification</span><strong>{{ data.summary.pending_listings }}</strong>
              </RouterLink>
            </li>
            <li>
              <RouterLink v-if="auth.can('requests.view')" to="/admin/requests?status=new" class="queue__item">
                <span>Open requests</span><strong>{{ data.summary.open_requests }}</strong>
              </RouterLink>
            </li>
            <li>
              <div class="queue__item"><span>Active users</span><strong>{{ formatNumber(data.summary.active_users) }}</strong></div>
            </li>
          </ul>
        </section>

        <section class="panel panel--wide" aria-labelledby="sign-title">
          <header class="panel__head">
            <h2 id="sign-title" class="panel__title">New sign-ups</h2>
          </header>
          <AppSkeleton v-if="!data" height="220px" />
          <BarChart v-else :data="data.signups_series" title="New sign-ups by period" />
        </section>

        <section class="panel" aria-labelledby="dist-title">
          <h2 id="dist-title" class="panel__title">Investment status</h2>
          <ul v-if="data" class="dist" role="list">
            <li v-for="d in data.status_distribution" :key="d.key" class="dist__row">
              <span class="dist__label">{{ d.label }}</span>
              <span class="dist__track" aria-hidden="true"><span class="dist__bar" :style="{ width: `${(d.value / distMax) * 100}%` }" /></span>
              <span class="dist__value">{{ d.value }}</span>
            </li>
          </ul>
        </section>

        <section class="panel panel--wide" aria-labelledby="tx-title">
          <header class="panel__head">
            <h2 id="tx-title" class="panel__title">Transaction summary</h2>
            <RouterLink v-if="auth.can('transactions.view')" to="/admin/transactions" class="panel__link">View all</RouterLink>
          </header>
          <table v-if="data" class="summary">
            <thead><tr><th scope="col">Status</th><th scope="col" class="num">Count</th><th scope="col" class="num">Amount</th></tr></thead>
            <tbody>
              <tr v-for="t in data.transaction_summary" :key="t.status">
                <td><StatusBadge :status="t.status" size="sm" /></td>
                <td class="num">{{ formatNumber(t.count) }}</td>
                <td class="num">{{ formatNaira(t.amount) }}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section class="panel" aria-labelledby="act-title">
          <h2 id="act-title" class="panel__title">Recent activity</h2>
          <ol v-if="data" class="activity" role="list">
            <li v-for="a in data.recent_activity" :key="a.id">
              <p><strong>{{ a.actor }}</strong> {{ a.action }} <span class="activity__subject">{{ a.subject }}</span></p>
              <time :datetime="a.created_at">{{ formatRelativeTime(a.created_at) }}</time>
            </li>
          </ol>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped>
.dash__filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
}

.dash__hello {
  font-size: var(--text-lg);
  font-weight: 500;
}

.dash__range {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.dash__preset {
  height: 36px;
  padding: 0 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: var(--color-bg);
  font-size: var(--text-sm);
}

.dash__preset.is-active {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: #fff;
}

.dash__date input {
  height: 36px;
  padding: 0 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  font-size: var(--text-sm);
}

.dash__tiles {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  transition: opacity var(--duration) var(--ease);
}

.dash__tiles.is-loading {
  opacity: 0.6;
}

.dash__grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 16px;
  margin-top: 16px;
}

.panel {
  padding: 20px;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
}

.panel__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 16px;
}

.panel__title {
  font-size: var(--text-base);
  font-weight: 600;
}

.panel > .panel__title {
  margin-bottom: 16px;
}

.panel__meta {
  font-size: var(--text-xs);
  color: var(--color-muted);
}

.panel__link {
  font-size: var(--text-sm);
  color: var(--color-primary);
  font-weight: 500;
}

.queue {
  display: grid;
  gap: 8px;
}

.queue__item {
  display: flex;
  justify-content: space-between;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  background: var(--color-page);
  font-size: var(--text-sm);
}

a.queue__item:hover {
  background: var(--color-primary-soft);
}

.queue__item strong {
  font-size: var(--text-md);
}

.dist {
  display: grid;
  gap: 14px;
}

.dist__row {
  display: grid;
  grid-template-columns: 80px 1fr 40px;
  align-items: center;
  gap: 10px;
  font-size: var(--text-sm);
}

.dist__track {
  height: 10px;
  border-radius: 4px;
  background: #f0f2f1;
}

.dist__bar {
  display: block;
  height: 100%;
  border-radius: 4px;
  background: var(--color-primary);
}

.dist__value {
  text-align: right;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.summary th {
  padding: 8px 0;
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  color: var(--color-muted);
  text-align: left;
  border-bottom: 1px solid var(--color-border-subtle);
}

.summary td {
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border-subtle);
  font-size: var(--text-sm);
}

.num {
  text-align: right !important;
  font-variant-numeric: tabular-nums;
}

.activity {
  display: grid;
  gap: 14px;
}

.activity li {
  display: grid;
  gap: 2px;
  font-size: var(--text-sm);
}

.activity__subject {
  color: var(--color-body);
}

.activity time {
  font-size: var(--text-xs);
  color: var(--color-muted);
}

@media (max-width: 1199px) {
  .dash__tiles {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .dash__grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 599px) {
  .dash__tiles {
    grid-template-columns: 1fr;
  }
}
</style>
