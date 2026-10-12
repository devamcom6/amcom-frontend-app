<script setup lang="ts">
import AppIcon from './AppIcon.vue'

/**
 * Horizontal pill stepper used in checkout / listing flows:
 *   (✓ Select plot) —— (2 Review and sign) —— (3 Payment)
 * On narrow screens `compact` renders numbered circles only (listing mobile design).
 */
withDefaults(defineProps<{ steps: string[]; current: number; compact?: boolean; align?: 'start' | 'center' }>(), {
  align: 'start',
})
</script>

<template>
  <nav class="stepper" :class="[{ 'stepper--compact': compact }, `stepper--${align}`]" aria-label="Progress">
    <ol class="stepper__list" role="list">
      <li
        v-for="(step, i) in steps"
        :key="step"
        class="stepper__item"
        :class="{ 'is-done': i < current, 'is-current': i === current }"
        :aria-current="i === current ? 'step' : undefined"
      >
        <span v-if="i > 0" class="stepper__line" aria-hidden="true" />
        <span class="stepper__pill">
          <AppIcon v-if="i < current" name="check" :size="16" :stroke-width="2.5" />
          <span v-else class="stepper__num">{{ i + 1 }}</span>
          <span class="stepper__label">{{ step }}</span>
        </span>
        <span class="sr-only">{{ i < current ? '(completed)' : i === current ? '(current step)' : '' }}</span>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.stepper__list {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 0;
}

.stepper--center .stepper__list {
  justify-content: center;
}

.stepper__item {
  display: flex;
  align-items: center;
  min-width: 0;
}

.stepper__line {
  width: 32px;
  height: 1.5px;
  margin: 0 16px;
  background: #cfd3d8;
  flex-shrink: 0;
}

.stepper__item.is-done + .stepper__item .stepper__line,
.stepper__item.is-current .stepper__line {
  background: var(--color-primary);
}

.stepper__pill {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 9px 18px;
  border: 1px solid #c6cbd1;
  border-radius: var(--radius-pill);
  font-size: var(--text-base);
  color: var(--color-muted);
  white-space: nowrap;
}

.stepper__num {
  font-size: var(--text-sm);
}

.is-done .stepper__pill {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.is-current .stepper__pill {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: var(--color-inverse);
}

@media (max-width: 767px) {
  .stepper__line {
    width: 16px;
    margin: 0 8px;
  }

  .stepper__pill {
    padding: 5px 12px;
    gap: 6px;
    font-size: 11px;
  }

  .stepper__num {
    font-size: 11px;
  }

  /* Compact variant: numbered circles connected by lines (listing / onboarding mobile). */
  .stepper--compact .stepper__list {
    width: 100%;
  }

  .stepper--compact .stepper__item {
    flex: 1;
  }

  .stepper--compact .stepper__item:first-child {
    flex: 0;
  }

  .stepper--compact .stepper__line {
    flex: 1;
    width: auto;
    margin: 0 10px;
  }

  .stepper--compact .stepper__pill {
    width: 28px;
    height: 28px;
    padding: 0;
    justify-content: center;
    border-radius: 50%;
    background: var(--color-page);
  }

  .stepper--compact .is-current .stepper__pill,
  .stepper--compact .is-done .stepper__pill {
    background: var(--color-primary);
    color: var(--color-inverse);
  }

  .stepper--compact .stepper__label {
    display: none;
  }
}
</style>
