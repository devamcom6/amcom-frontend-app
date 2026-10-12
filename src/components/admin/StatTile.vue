<script setup lang="ts">
import AppIcon from '@/components/base/AppIcon.vue'
import type { IconName } from '@/components/base/icons'

/** Headline KPI with a period-over-period trend (icon + sign, never colour alone). */
defineProps<{ label: string; value: string; trend?: number | null; icon: IconName; hint?: string }>()
</script>

<template>
  <article class="tile">
    <div class="tile__top">
      <p class="tile__label">{{ label }}</p>
      <span class="tile__icon" aria-hidden="true"><AppIcon :name="icon" :size="18" /></span>
    </div>
    <p class="tile__value">{{ value }}</p>
    <p v-if="trend !== undefined && trend !== null" class="tile__trend" :class="trend >= 0 ? 'is-up' : 'is-down'">
      <AppIcon :name="trend >= 0 ? 'trend-up' : 'trend-down'" :size="14" />
      {{ trend >= 0 ? '+' : '' }}{{ trend }}% <span class="tile__vs">vs previous period</span>
    </p>
    <p v-else-if="hint" class="tile__hint">{{ hint }}</p>
  </article>
</template>

<style scoped>
.tile {
  padding: 18px 20px;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
}

.tile__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tile__label {
  font-size: var(--text-sm);
  color: var(--color-muted);
}

.tile__icon {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  background: var(--color-success-bg);
  color: var(--color-primary);
}

.tile__value {
  margin-top: 10px;
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--color-ink);
  font-variant-numeric: tabular-nums;
}

.tile__trend,
.tile__hint {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  font-size: var(--text-xs);
  color: var(--color-muted);
}

.tile__trend.is-up {
  color: #2f6f1b;
}

.tile__trend.is-down {
  color: var(--color-danger-strong);
}

.tile__vs {
  color: var(--color-muted);
}
</style>
