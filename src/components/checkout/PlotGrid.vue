<script setup lang="ts">
import { computed, ref } from 'vue'
import AppChoiceChips from '@/components/base/AppChoiceChips.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import type { Plot, PlotStatus } from '@/types'
import { formatNaira } from '@/utils/format'

/**
 * Plot inventory grid with status filters. Only `available` plots are selectable;
 * reserved/sold tiles are shown for context but disabled.
 */
const props = withDefaults(defineProps<{ plots: Plot[]; max?: number; columns?: number }>(), { max: 1, columns: 6 })
const selected = defineModel<number[]>({ default: () => [] })
const emit = defineEmits<{ limit: [] }>()

type Filter = 'all' | PlotStatus
const filter = ref<Filter>('all')
const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'available', label: 'Available' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'sold', label: 'Sold' },
]

const visible = computed(() => (filter.value === 'all' ? props.plots : props.plots.filter((p) => p.status === filter.value)))
const STATUS_LABEL: Record<PlotStatus, string> = { available: 'Available', reserved: 'Reserved', sold: 'Sold' }

function toggle(plot: Plot) {
  if (plot.status !== 'available') return
  if (selected.value.includes(plot.id)) {
    selected.value = selected.value.filter((id) => id !== plot.id)
  } else if (props.max === 1) {
    selected.value = [plot.id]
  } else if (selected.value.length < props.max) {
    selected.value = [...selected.value, plot.id]
  } else {
    emit('limit')
  }
}
</script>

<template>
  <div class="plots">
    <AppChoiceChips v-model="filter" :options="filters" size="sm" tone="solid" class="plots__filters" />
    <p class="sr-only" aria-live="polite">{{ selected.length }} plot{{ selected.length === 1 ? '' : 's' }} selected</p>
    <ul class="plots__grid" role="list" :style="{ '--cols': columns }">
      <li v-for="plot in visible" :key="plot.id">
        <button
          type="button"
          class="plot"
          :class="[`plot--${plot.status}`, { 'is-selected': selected.includes(plot.id) }]"
          :disabled="plot.status !== 'available'"
          :aria-pressed="selected.includes(plot.id)"
          :aria-label="`Plot ${plot.code}, ${plot.size_sqm} square metres, ${formatNaira(plot.price)}, ${STATUS_LABEL[plot.status]}`"
          @click="toggle(plot)"
        >
          <span class="plot__code">{{ plot.code }}</span>
          <span class="plot__size">{{ plot.size_sqm }} sqm</span>
          <span class="plot__status">{{ STATUS_LABEL[plot.status] }}</span>
          <span v-if="selected.includes(plot.id)" class="plot__check" aria-hidden="true">
            <AppIcon name="check" :size="12" :stroke-width="3" />
          </span>
        </button>
      </li>
      <li v-if="!visible.length" class="plots__empty">No {{ filter }} plots.</li>
    </ul>
  </div>
</template>

<style scoped>
.plots__filters {
  margin-bottom: 24px;
}

.plots__filters :deep(.chip) {
  min-height: 32px;
  padding: 6px 16px;
  color: var(--color-ink);
}

.plots__filters :deep(.chip.is-selected) {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-inverse);
}

.plots__grid {
  display: grid;
  grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
  gap: 16px 12px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.plot {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  width: 100%;
  padding: 12px 12px 10px;
  border: 1px solid;
  border-radius: var(--radius-xs);
  text-align: left;
  transition:
    transform var(--duration-fast) var(--ease),
    box-shadow var(--duration-fast) var(--ease);
}

.plot:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.plot:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.plot--available {
  border-color: var(--color-success-border);
  background: var(--color-success-bg);
}

.plot--available .plot__code,
.plot--available .plot__status {
  color: var(--color-success-strong);
}

.plot--reserved {
  border-color: var(--color-warning-border);
  background: var(--color-warning-bg);
  cursor: not-allowed;
}

.plot--reserved .plot__code,
.plot--reserved .plot__status {
  color: var(--color-warning);
}

.plot--sold {
  border-color: #e5e7eb;
  background: #f9fafb;
  cursor: not-allowed;
}

.plot--sold .plot__code,
.plot--sold .plot__size,
.plot--sold .plot__status {
  color: var(--color-neutral-text);
}

.plot.is-selected {
  border: 2px solid var(--color-success-strong);
  padding: 11px 11px 9px;
}

.plot__code {
  font-size: var(--text-sm);
  font-weight: 700;
}

.plot__size {
  font-size: var(--text-xs);
  color: var(--color-body);
}

.plot__status {
  font-size: 11px;
}

.plot__check {
  position: absolute;
  top: -8px;
  right: -8px;
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-success-strong);
  color: #fff;
}

.plots__empty {
  grid-column: 1 / -1;
  padding: 24px;
  text-align: center;
  color: var(--color-muted);
}

@media (max-width: 1100px) {
  .plots__grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 767px) {
  .plots__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .plots__filters {
    margin-bottom: 16px;
  }
  .plots__filters :deep(.chip) {
    min-height: 32px;
    padding: 6px 14px;
  }
}
</style>
