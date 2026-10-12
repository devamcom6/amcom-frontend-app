<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import AppBackLink from '@/components/base/AppBackLink.vue'
import AppIcon from '@/components/base/AppIcon.vue'

/** Centred white card on the grey auth canvas (full-bleed on mobile, per designs). */
withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    back?: RouteLocationRaw | false
    backPlacement?: 'top' | 'bottom'
    /** Show the mobile "×" close button in the header. */
    closable?: boolean
    width?: number
  }>(),
  { back: false, backPlacement: 'top', closable: false, width: 560 },
)
const emit = defineEmits<{ back: [MouseEvent] }>()
</script>

<template>
  <Teleport v-if="closable" to="#auth-header-actions" defer>
    <RouterLink to="/" class="auth-close hide-desktop" aria-label="Close and return home">
      <AppIcon name="close" :size="22" />
    </RouterLink>
  </Teleport>
  <section class="auth-card" :style="{ maxWidth: `${width}px` }">
    <AppBackLink v-if="back && backPlacement === 'top'" :fallback="back" icon="chevron" class="auth-card__back hide-mobile" @click="emit('back', $event)" />
    <header v-if="title" class="auth-card__head">
      <h1 class="auth-card__title">{{ title }}</h1>
      <p v-if="subtitle" class="auth-card__subtitle">{{ subtitle }}</p>
    </header>
    <slot />
    <div v-if="back" class="auth-card__back-bottom" :class="{ 'hide-desktop': backPlacement === 'top' }">
      <AppBackLink :fallback="back" icon="chevron" @click="emit('back', $event)" />
    </div>
  </section>
</template>

<style scoped>
.auth-card {
  width: 100%;
  margin: 32px auto 0;
  padding: 48px;
  border-radius: var(--radius-md);
  background: var(--color-bg);
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.04);
}

.auth-card__back {
  margin-bottom: 36px;
}

.auth-card__head {
  margin-bottom: 24px;
}

.auth-card__title {
  font-size: 1.75rem;
  font-weight: 400;
  color: var(--color-ink);
}

.auth-card__subtitle {
  margin-top: 8px;
  font-size: var(--text-base);
  line-height: 1.5;
  color: var(--color-body);
}

.auth-card__back-bottom {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.auth-close {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  margin-right: -8px;
  color: var(--color-muted);
}

@media (max-width: 767px) {
  .auth-card {
    margin-top: 40px;
    padding: 0;
    box-shadow: none;
    background: transparent;
  }

  .auth-card__title {
    font-size: 1.75rem;
  }

  .auth-card__subtitle {
    font-size: var(--text-base);
  }
}
</style>
