<script setup lang="ts">
import AppSelect from '@/components/base/AppSelect.vue'
import { computed, reactive, ref } from 'vue'
import BarChart from '@/components/admin/BarChart.vue'
import StatTile from '@/components/admin/StatTile.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppDataTable, { type Column } from '@/components/base/AppDataTable.vue'
import AppErrorState from '@/components/base/AppErrorState.vue'
import AppSkeleton from '@/components/base/AppSkeleton.vue'
import { useAsync } from '@/composables/useAsync'
import { adminService } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { Report, ReportQuery } from '@/types'
import { triggerDownload } from '@/utils/files'
import { formatNaira, formatNumber, toISODate } from '@/utils/format'

const auth = useAuthStore()
const ui = useUiStore()
const query = reactive<ReportQuery>({
  type: 'revenue',
  group_by: 'month',
  from: toISODate(new Date(Date.now() - 180 * 86_400_000)),
  to: toISODate(new Date()),
})

const { data: report, loading, error, execute } = useAsync(() => adminService.report({ ...query }), {
  watch: [() => JSON.stringify(query)],
})

const fmt = (v: number, f: 'currency' | 'number' | 'percent' | 'date' | undefined) =>
  f === 'currency' ? formatNaira(v) : f === 'percent' ? `${v}%` : formatNumber(v)

const exporting = ref(false)
async function exportCsv() {
  exporting.value = true
  try {
    const blob = await adminService.exportReport({ ...query })
    triggerDownload(blob, `amcom-${query.type}-${query.from}-to-${query.to}.csv`)
  } catch (e) {
    ui.apiError(e)
  } finally {
    exporting.value = false
  }
}

const columnsFor = (cols: Report['columns']): Column[] =>
  cols.map((c, i) => ({ key: c.key, label: c.label, align: c.format === 'currency' || c.format === 'number' ? 'right' : 'left', primary: i === 0 }))

/** Referrals is a ranking (one row per referrer), not a time series: no grouping, no trend chart. */
const isReferrals = computed(() => query.type === 'referrals')

/** Format every cell by its column's declared format so new report types need no view changes. */
const tableRows = computed(() => {
  const r = report.value
  if (!r) return []
  return r.rows.map((row, i) => {
    const out: Record<string, string | number | null> = { ...row, _key: i }
    for (const c of r.columns) {
      const v = row[c.key]
      if (v === null || v === undefined || v === '') out[c.key] = null
      else if (c.format === 'currency') out[c.key] = formatNaira(Number(v))
      else if (c.format === 'number') out[c.key] = formatNumber(Number(v))
    }
    return out
  })
})
</script>

<template>
  <div>
    <div class="controls">
      <AppSelect v-model="query.type" variant="filter" label="Report" class="ctl" :options="[{ value: 'revenue', label: 'Revenue' }, { value: 'investments', label: 'Investments' }, { value: 'users', label: 'Users' }, { value: 'listings', label: 'Listings' }, { value: 'referrals', label: 'Referrals' }]" />
      <AppSelect v-if="!isReferrals" v-model="query.group_by" variant="filter" label="Group by" class="ctl" :options="[{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }]" />
      <label class="ctl"><span>From</span><input v-model="query.from" type="date" :max="query.to" /></label>
      <label class="ctl"><span>To</span><input v-model="query.to" type="date" :min="query.from" /></label>
      <AppButton v-if="auth.can('reports.export')" variant="outline" icon-left="download" :loading="exporting" class="export" @click="exportCsv">Export CSV</AppButton>
    </div>

    <AppErrorState v-if="error && !report" :error="error" @retry="execute" />
    <AppSkeleton v-else-if="!report" height="360px" radius="12px" />
    <template v-else>
      <div class="tiles" :class="{ 'is-loading': loading }">
        <StatTile v-for="t in report.totals" :key="t.label" :label="t.label" :value="fmt(t.value, t.format)" icon="bar-chart" />
      </div>
      <section v-if="report.series.length" class="panel" aria-labelledby="rep-chart">
        <h2 id="rep-chart" class="panel__title">Trend</h2>
        <BarChart :data="report.series" :title="`${query.type} by ${query.group_by}`" :format="(v) => fmt(v, report?.type === 'revenue' ? 'currency' : 'number')" />
      </section>
      <AppDataTable :columns="columnsFor(report.columns)" :rows="tableRows" row-key="_key" :caption="isReferrals ? 'Referrals by referrer' : 'Report data'" class="table">
        <!-- Referrals: link the matched account when the API returns its id. -->
        <template #cell-referrer_user="{ row }">
          <RouterLink v-if="row.referrer_user_id && auth.can('users.view')" :to="{ name: 'admin-user', params: { id: row.referrer_user_id } }" class="link">{{ row.referrer_user }}</RouterLink>
          <template v-else>{{ row.referrer_user ?? '—' }}</template>
        </template>
      </AppDataTable>
    </template>
  </div>
</template>

<style scoped>
.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px;
  margin-bottom: 20px;
}

.ctl {
  display: grid;
  gap: 4px;
  font-size: var(--text-xs);
  color: var(--color-muted);
}

.ctl input {
  height: 40px;
  padding: 0 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  font-size: var(--text-sm);
  color: var(--color-ink);
}

.export {
  margin-left: auto;
}

.table {
  margin-top: 16px;
}

.link {
  color: var(--color-primary);
  text-decoration: underline;
}

.tiles {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  transition: opacity var(--duration) var(--ease);
}

.tiles.is-loading {
  opacity: 0.6;
}

.panel {
  margin: 16px 0;
  padding: 20px;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
}

.panel__title {
  margin-bottom: 16px;
  font-size: var(--text-base);
  font-weight: 600;
}

@media (max-width: 767px) {
  .tiles {
    grid-template-columns: 1fr;
  }
  .export {
    margin-left: 0;
    width: 100%;
  }
}
</style>
