<script setup lang="ts">
import AppIcon from '@/components/base/AppIcon.vue'

/** Vertical stepper (desktop) / numbered progress line (mobile) for profile setup. */
defineProps<{ steps: string[]; current: number }>()
</script>

<template>
  <nav class="osteps" aria-label="Profile setup progress">
    <ol role="list">
      <li
        v-for="(step, i) in steps"
        :key="step"
        class="osteps__item"
        :class="{ 'is-done': i < current, 'is-current': i === current }"
        :aria-current="i === current ? 'step' : undefined"
      >
        <span class="osteps__dot">
          <AppIcon v-if="i < current" name="check" :size="16" :stroke-width="2.5" />
          <template v-else>{{ i + 1 }}</template>
        </span>
        <span class="osteps__label">{{ step }}</span>
        <span class="sr-only">{{ i < current ? '(completed)' : i === current ? '(current)' : '' }}</span>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.osteps ol {
  display: flex;
  flex-direction: column;
  gap: 32px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.osteps__item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.osteps__item + .osteps__item::before {
  content: '';
  position: absolute;
  left: 17px;
  bottom: 36px;
  width: 2px;
  height: 32px;
  background: #e5e7eb;
}

.osteps__item.is-done + .osteps__item::before,
.osteps__item.is-current::before {
  background: var(--color-success-strong);
}

.osteps__dot {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 2px solid #e5e7eb;
  border-radius: 50%;
  background: var(--color-bg);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-muted);
  flex-shrink: 0;
}

.is-done .osteps__dot,
.is-current .osteps__dot {
  border-color: var(--color-success-strong);
  background: var(--color-success-strong);
  color: #fff;
}

.osteps__label {
  max-width: 110px;
  padding-top: 0;
  font-size: var(--text-sm);
  line-height: 1.2;
  color: var(--color-muted);
}

.is-done .osteps__label {
  color: var(--color-ink);
}

.is-current .osteps__label {
  font-weight: 600;
  color: var(--color-success-strong);
}

@media (max-width: 899px) {
  .osteps ol {
    flex-direction: row;
    gap: 0;
  }

  .osteps__item {
    flex: 1;
    align-items: center;
  }

  .osteps__item:first-child {
    flex: 0 0 auto;
  }

  .osteps__item + .osteps__item::before {
    position: static;
    order: -1;
    flex: 1;
    width: auto;
    height: 2px;
    margin: 0 12px;
  }

  .osteps__dot {
    width: 28px;
    height: 28px;
    border-width: 1px;
    background: #f5f5f0;
    font-weight: 500;
  }

  .is-done .osteps__dot,
  .is-current .osteps__dot {
    background: var(--color-primary);
    border-color: var(--color-primary);
  }

  .osteps__item.is-done + .osteps__item::before,
  .osteps__item.is-current::before {
    background: var(--color-primary);
  }

  .osteps__label {
    display: none;
  }
}
</style>
