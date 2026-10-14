<script setup lang="ts">
import { computed } from 'vue'
import { PAGE_SIZE_OPTIONS } from '@/constants/options'
import type { PaginationMeta } from '@/types'
import { formatNumber } from '@/utils/format'
import AppIcon from './AppIcon.vue'
import AppSelect from './AppSelect.vue'

const props = withDefaults(defineProps<{ meta: PaginationMeta; showPageSize?: boolean; label?: string }>(), {
  label: 'results',
})
const page = defineModel<number>('page', { required: true })
const perPage = defineModel<number>('perPage')

const pages = computed<(number | '…')[]>(() => {
  const total = props.meta.last_page
  const current = props.meta.current_page
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const set = new Set([1, total, current, current - 1, current + 1])
  const sorted = [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const out: (number | '…')[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - (sorted[i - 1] as number) > 1) out.push('…')
    out.push(p)
  })
  return out
})

function onPerPage(v: number | '') {
  perPage.value = Number(v)
  page.value = 1
}

function go(p: number) {
  if (p < 1 || p > props.meta.last_page || p === page.value) return
  page.value = p
}
</script>

<template>
  <nav v-if="meta.total > 0" class="pagination" aria-label="Pagination">
    <p class="pagination__summary">
      Showing <strong>{{ formatNumber(meta.from) }}–{{ formatNumber(meta.to) }}</strong> of
      <strong>{{ formatNumber(meta.total) }}</strong> {{ label }}
    </p>
    <div class="pagination__controls">
      <AppSelect
        v-if="showPageSize && perPage !== undefined"
        class="pagination__size"
        :model-value="perPage"
        variant="filter"
        size="sm"
        label="Rows per page"
        hide-label
        :options="PAGE_SIZE_OPTIONS.map((n) => ({ value: n, label: `${n} / page` }))"
        @change="onPerPage"
      />
      <button type="button" class="pagination__btn" :disabled="meta.current_page <= 1" aria-label="Previous page" @click="go(meta.current_page - 1)">
        <AppIcon name="chevron-left" :size="18" />
      </button>
      <template v-for="(p, i) in pages" :key="`${p}-${i}`">
        <span v-if="p === '…'" class="pagination__gap" aria-hidden="true">…</span>
        <button
          v-else
          type="button"
          class="pagination__btn pagination__page"
          :class="{ 'is-active': p === meta.current_page }"
          :aria-current="p === meta.current_page ? 'page' : undefined"
          :aria-label="`Page ${p}`"
          @click="go(p)"
        >
          {{ p }}
        </button>
      </template>
      <button type="button" class="pagination__btn" :disabled="meta.current_page >= meta.last_page" aria-label="Next page" @click="go(meta.current_page + 1)">
        <AppIcon name="chevron-right" :size="18" />
      </button>
    </div>
  </nav>
</template>

<style scoped>
.pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 24px;
  padding-top: 16px;
  font-size: var(--text-sm);
  color: var(--color-muted);
}

.pagination__summary strong {
  color: var(--color-ink);
  font-weight: 600;
}

.pagination__controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pagination__btn {
  display: inline-grid;
  place-items: center;
  min-width: 36px;
  height: 36px;
  padding: 0 8px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-subtle);
  background: var(--color-bg);
  color: var(--color-ink);
}

.pagination__btn:hover:not(:disabled) {
  border-color: var(--color-border-strong);
}

.pagination__btn:disabled {
  opacity: 0.4;
}

.pagination__page.is-active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-inverse);
}

.pagination__gap {
  padding: 0 4px;
}

.pagination__size {
  margin-right: 8px;
}

@media (max-width: 640px) {
  .pagination__page:not(.is-active),
  .pagination__gap {
    display: none;
  }
}
</style>
