<script setup lang="ts">
import AppSelect from '@/components/base/AppSelect.vue'
import { reactive, ref } from 'vue'
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
import type { ReportQuery } from '@/types'
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

const columnsFor = (cols: { key: string; label: string; format?: string }[]): Column[] =>
  cols.map((c, i) => ({ key: c.key, label: c.label, align: c.format === 'currency' || c.format === 'number' ? 'right' : 'left', primary: i === 0 }))
</script>

<template>
  <div>
    <div class="controls">
      <AppSelect v-model="query.type" variant="filter" label="Report" class="ctl" :options="[{ value: 'revenue', label: 'Revenue' }, { value: 'investments', label: 'Investments' }, { value: 'users', label: 'Users' }, { value: 'listings', label: 'Listings' }]" />
      <AppSelect v-model="query.group_by" variant="filter" label="Group by" class="ctl" :options="[{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }]" />
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
      <section class="panel" aria-labelledby="rep-chart">
        <h2 id="rep-chart" class="panel__title">Trend</h2>
        <BarChart :data="report.series" :title="`${query.type} by ${query.group_by}`" :format="(v) => fmt(v, report?.type === 'revenue' ? 'currency' : 'number')" />
      </section>
      <AppDataTable :columns="columnsFor(report.columns)" :rows="report.rows" row-key="period" caption="Report data" class="table">
        <template #cell-value="{ row }">{{ fmt(Number(row.value), report.type === 'revenue' ? 'currency' : 'number') }}</template>
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
