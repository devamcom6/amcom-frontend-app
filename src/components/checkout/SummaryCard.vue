<script setup lang="ts">
import type { PaymentSummaryLine } from '@/types'

/** Lavender "Summary" panel. Sections are separated by hairlines. */
withDefaults(defineProps<{ title?: string; sections: PaymentSummaryLine[][] }>(), { title: 'Summary' })
</script>

<template>
  <section class="summary" :aria-label="title">
    <h2 class="summary__title">{{ title }}</h2>
    <dl v-for="(section, i) in sections" :key="i" class="summary__section">
      <div v-for="line in section" :key="line.label" class="summary__row" :class="line.emphasis && `summary__row--${line.emphasis}`">
        <dt>{{ line.label }}</dt>
        <dd>
          <span v-for="(part, j) in line.value.split('\n')" :key="j" class="summary__value-line">{{ part }}</span>
        </dd>
      </div>
    </dl>
    <div v-if="$slots.default" class="summary__actions"><slot /></div>
  </section>
</template>

<style scoped>
.summary {
  padding: 24px 24px 24px;
  border: 1px solid var(--color-summary-border);
  border-radius: var(--radius-sm);
  background: var(--color-summary);
}

.summary__title {
  margin-bottom: 14px;
  font-size: var(--text-md);
  font-weight: 600;
  color: var(--color-ink);
}

.summary__section {
  display: grid;
  gap: 14px;
  margin: 0;
  padding: 16px 0;
}

.summary__section:first-of-type {
  padding-top: 0;
}

.summary__section + .summary__section {
  border-top: 1px solid #c9c4d2;
}

.summary__row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  font-size: var(--text-sm);
}

.summary__row dt {
  color: var(--color-body);
}

.summary__row dd {
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
  color: var(--color-ink);
  font-variant-numeric: tabular-nums;
}

.summary__row--strong dt,
.summary__row--strong dd {
  font-weight: 600;
  color: var(--color-ink);
}

.summary__row--positive dd {
  color: var(--color-lime);
  font-weight: 600;
}

.summary__actions {
  display: grid;
  gap: 12px;
  margin-top: 8px;
}

@media (max-width: 767px) {
  .summary {
    padding: 16px;
  }
  .summary__row dd {
    font-weight: 600;
  }
  .summary__row dt {
    font-size: var(--text-sm);
  }
}
</style>
