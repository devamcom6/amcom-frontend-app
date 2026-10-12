<script setup lang="ts">
import AppIcon from '@/components/base/AppIcon.vue'
import type { IconName } from '@/components/base/icons'

withDefaults(defineProps<{ label: string; value: string; caption?: string; icon?: IconName; accent?: boolean }>(), {
  icon: 'calendar-clock',
})
</script>

<template>
  <article class="metric">
    <div class="metric__top">
      <p class="metric__label">{{ label }}</p>
      <span class="metric__icon hide-mobile" :class="{ 'metric__icon--accent': accent }" aria-hidden="true">
        <AppIcon :name="icon" :size="18" />
      </span>
    </div>
    <p class="metric__value">{{ value }}</p>
    <p v-if="caption" class="metric__caption">{{ caption }}</p>
  </article>
</template>

<style scoped>
.metric {
  display: flex;
  flex-direction: column;
  padding: 20px 20px 18px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
}

.metric__top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.metric__label {
  padding-top: 6px;
  font-size: var(--text-xs);
  letter-spacing: 0.04em;
  color: #2b3442;
}

.metric__icon {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  background: #f3f4f6;
  color: var(--color-muted);
}

.metric__icon--accent {
  background: #dcfce7;
  color: #15803d;
}

.metric__value {
  margin-top: 22px;
  font-family: var(--font-mono);
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-ink);
  font-variant-numeric: tabular-nums;
}

.metric__caption {
  margin-top: 4px;
  font-size: var(--text-xs);
  color: var(--color-muted);
}

@media (max-width: 767px) {
  .metric {
    padding: 16px;
  }
  .metric__label {
    padding-top: 0;
    text-transform: uppercase;
  }
  .metric__value {
    margin-top: 12px;
  }
  .metric__caption {
    margin-top: 10px;
    color: var(--color-body);
  }
}
</style>
