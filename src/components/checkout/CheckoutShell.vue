<script setup lang="ts">
import AppBackLink from '@/components/base/AppBackLink.vue'
import AppStepper from '@/components/base/AppStepper.vue'
import type { RouteLocationRaw } from 'vue-router'

/**
 * Shared frame for multi-step checkouts: Back link, pill stepper, heading,
 * two-column body (form + sticky aside) and a sticky mobile action bar.
 */
defineProps<{
  steps: string[]
  current: number
  title: string
  subtitle?: string
  fallback: RouteLocationRaw
  /** Narrow left column like the payment screen. */
  wideAside?: boolean
}>()
const emit = defineEmits<{ back: [MouseEvent] }>()
</script>

<template>
  <div class="checkout">
    <div class="container container--form checkout__inner">
      <AppBackLink :fallback="fallback" @click="emit('back', $event)" />
      <AppStepper :steps="steps" :current="current" class="checkout__stepper" />
      <div class="checkout__grid" :class="{ 'checkout__grid--wide-aside': wideAside }">
        <div class="checkout__main">
          <header class="checkout__head">
            <h1 class="checkout__title">{{ title }}</h1>
            <p v-if="subtitle" class="checkout__subtitle">{{ subtitle }}</p>
          </header>
          <slot />
        </div>
        <aside v-if="$slots.aside" class="checkout__aside">
          <slot name="aside" />
        </aside>
      </div>
    </div>
    <div v-if="$slots['mobile-actions']" class="checkout__mobile-bar hide-desktop">
      <slot name="mobile-actions" />
    </div>
  </div>
</template>

<style scoped>
.checkout {
  flex: 1;
  padding: 14px 0 96px;
}

.checkout__inner {
  padding-left: calc(var(--gutter) + 48px);
}

.checkout__stepper {
  margin-top: 32px;
}

.checkout__grid {
  display: grid;
  grid-template-columns: minmax(0, 668px) minmax(0, 500px);
  justify-content: space-between;
  gap: 48px;
  margin-top: 40px;
}

.checkout__grid--wide-aside {
  grid-template-columns: minmax(0, 760px) minmax(0, 424px);
}

.checkout__head {
  margin-bottom: 28px;
}

.checkout__title {
  font-size: 1.75rem;
  font-weight: 500;
  color: var(--color-ink);
}

.checkout__subtitle {
  margin-top: 8px;
  font-size: var(--text-md);
  color: var(--color-body);
}

.checkout__aside {
  position: sticky;
  top: calc(var(--header-height) + 24px);
  align-self: start;
}

@media (max-width: 1199px) {
  .checkout__inner {
    padding-left: var(--gutter);
  }
}

@media (max-width: 1023px) {
  .checkout__grid,
  .checkout__grid--wide-aside {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .checkout__aside {
    position: static;
  }
}

@media (max-width: 767px) {
  .checkout {
    padding-bottom: 120px;
  }

  .checkout__stepper {
    margin-top: 20px;
  }

  .checkout__grid {
    margin-top: 20px;
  }

  .checkout__title {
    font-size: 1.6rem;
    font-weight: 400;
  }

  .checkout__subtitle {
    font-size: var(--text-base);
  }

  .checkout__mobile-bar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 20;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    padding: 16px var(--gutter) calc(16px + env(safe-area-inset-bottom));
    background: var(--color-bg);
    border-top: 1px solid var(--color-border-subtle);
  }

  .checkout__mobile-bar :deep(.btn) {
    min-height: 50px;
    font-size: var(--text-base);
  }
}
</style>
