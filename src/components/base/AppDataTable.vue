<script setup lang="ts" generic="T extends Record<string, any>">
import { computed } from 'vue'
import AppCheckbox from './AppCheckbox.vue'
import AppIcon from './AppIcon.vue'
import AppSkeleton from './AppSkeleton.vue'

export interface Column {
  key: string
  label: string
  sortable?: boolean
  align?: 'left' | 'right' | 'center'
  width?: string
  /** Hide in the stacked mobile card view. */
  hideOnMobile?: boolean
  /** Use as the card title in the mobile view. */
  primary?: boolean
}

/**
 * Server-driven table: sorting, selection and pagination are owned by the caller
 * (see `useResourceList`). Below 768px rows render as stacked cards for readability.
 */
const props = withDefaults(
  defineProps<{
    columns: Column[]
    rows: T[]
    rowKey?: keyof T
    loading?: boolean
    sort?: string
    selectable?: boolean
    caption: string
    skeletonRows?: number
  }>(),
  { rowKey: 'id', loading: false, sort: '', selectable: false, skeletonRows: 6 },
)

const selected = defineModel<Array<T[keyof T]>>('selected', { default: () => [] })
const emit = defineEmits<{ sort: [string]; rowClick: [T] }>()

const keyOf = (row: T) => row[props.rowKey]
const allSelected = computed(() => props.rows.length > 0 && props.rows.every((r) => selected.value.includes(keyOf(r))))
const someSelected = computed(() => selected.value.length > 0 && !allSelected.value)

function toggleAll(v: boolean) {
  selected.value = v ? props.rows.map(keyOf) : []
}

function toggleRow(row: T, v: boolean) {
  const k = keyOf(row)
  selected.value = v ? [...selected.value, k] : selected.value.filter((x) => x !== k)
}

function sortState(col: Column): 'ascending' | 'descending' | 'none' {
  if (props.sort === col.key) return 'ascending'
  if (props.sort === `-${col.key}`) return 'descending'
  return 'none'
}

const primary = computed(() => props.columns.find((c) => c.primary) ?? props.columns[0])
</script>

<template>
  <div class="table-wrap" :class="{ 'is-loading': loading && rows.length }">
    <table class="table">
      <caption class="sr-only">{{ caption }}</caption>
      <thead>
        <tr>
          <th v-if="selectable" scope="col" class="table__check">
            <AppCheckbox
              :model-value="allSelected"
              :aria-checked="someSelected ? 'mixed' : allSelected"
              size="sm"
              @update:model-value="toggleAll"
            >
              <span class="sr-only">Select all rows on this page</span>
            </AppCheckbox>
          </th>
          <th
            v-for="col in columns"
            :key="col.key"
            scope="col"
            :style="{ width: col.width, textAlign: col.align ?? 'left' }"
            :aria-sort="col.sortable ? sortState(col) : undefined"
          >
            <button v-if="col.sortable" type="button" class="table__sort" @click="emit('sort', col.key)">
              {{ col.label }}
              <AppIcon :name="sortState(col) === 'ascending' ? 'sort-asc' : sortState(col) === 'descending' ? 'sort-desc' : 'sort'" :size="14" />
            </button>
            <template v-else>{{ col.label }}</template>
          </th>
          <th v-if="$slots.actions" scope="col" class="table__actions-col"><span class="sr-only">Actions</span></th>
        </tr>
      </thead>
      <tbody>
        <template v-if="loading && !rows.length">
          <tr v-for="i in skeletonRows" :key="`s${i}`" class="table__skeleton">
            <td :colspan="columns.length + (selectable ? 1 : 0) + ($slots.actions ? 1 : 0)"><AppSkeleton height="20px" /></td>
          </tr>
        </template>
        <tr
          v-for="row in rows"
          v-else
          :key="String(keyOf(row))"
          :class="{ 'is-selected': selected.includes(keyOf(row)) }"
          @click="emit('rowClick', row)"
        >
          <td v-if="selectable" class="table__check" @click.stop>
            <AppCheckbox :model-value="selected.includes(keyOf(row))" size="sm" @update:model-value="toggleRow(row, $event)">
              <span class="sr-only">Select row</span>
            </AppCheckbox>
          </td>
          <td
            v-for="col in columns"
            :key="col.key"
            :data-label="col.label"
            :class="{ 'is-primary': col.key === primary?.key, 'hide-on-mobile': col.hideOnMobile }"
            :style="{ textAlign: col.align ?? 'left' }"
          >
            <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">{{ row[col.key] ?? '—' }}</slot>
          </td>
          <td v-if="$slots.actions" class="table__actions" @click.stop>
            <slot name="actions" :row="row" />
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="!loading && !rows.length" class="table__empty">
      <slot name="empty"><p>No records found.</p></slot>
    </div>
  </div>
</template>

<style scoped>
.table-wrap {
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  overflow-x: auto;
  transition: opacity var(--duration) var(--ease);
}

.table-wrap.is-loading {
  opacity: 0.6;
}

.table {
  min-width: 720px;
}

.table th {
  position: sticky;
  top: 0;
  padding: 12px 16px;
  background: #f7f8f9;
  border-bottom: 1px solid var(--color-border-subtle);
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-muted);
  white-space: nowrap;
}

.table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border-subtle);
  font-size: var(--text-sm);
  color: var(--color-ink);
  vertical-align: middle;
}

.table tbody tr:last-child td {
  border-bottom: 0;
}

.table tbody tr:hover {
  background: #fafbfa;
}

.table tbody tr.is-selected {
  background: var(--color-primary-soft);
}

.table__check {
  width: 44px;
}

.table__sort {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  color: inherit;
}

.table__sort:hover {
  color: var(--color-ink);
}

.table__actions-col,
.table__actions {
  width: 1%;
  white-space: nowrap;
  text-align: right;
}

.table__empty {
  padding: 48px 24px;
  text-align: center;
  color: var(--color-muted);
}

@media (max-width: 767px) {
  .table-wrap {
    border: 0;
    background: transparent;
    overflow: visible;
  }

  .table {
    min-width: 0;
  }

  .table thead {
    display: none;
  }

  .table,
  .table tbody,
  .table tr,
  .table td {
    display: block;
    width: 100%;
  }

  .table tbody {
    display: grid;
    gap: 12px;
  }

  .table tbody tr {
    position: relative;
    padding: 14px 16px;
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-lg);
    background: var(--color-bg);
  }

  .table td {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 4px 0;
    border: 0;
    text-align: right !important;
  }

  .table td::before {
    content: attr(data-label);
    flex-shrink: 0;
    font-size: var(--text-xs);
    color: var(--color-muted);
    text-align: left;
  }

  .table td.is-primary {
    padding-bottom: 8px;
    font-weight: 600;
    text-align: left !important;
  }

  .table td.is-primary::before,
  .table td.table__check::before,
  .table td.table__actions::before {
    content: none;
  }

  .table td.hide-on-mobile {
    display: none;
  }

  .table td.table__check {
    position: absolute;
    top: 12px;
    right: 12px;
    width: auto;
  }

  .table td.table__actions {
    justify-content: flex-end;
    padding-top: 10px;
    border-top: 1px solid var(--color-border-subtle);
    margin-top: 8px;
  }

  .table__skeleton td {
    padding: 0;
  }
}
</style>
