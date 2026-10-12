<script setup lang="ts">
import AppButton from '@/components/base/AppButton.vue'
import type { RouteLocationRaw } from 'vue-router'

withDefaults(
  defineProps<{
    title: string
    text?: string
    primary: { label: string; to: RouteLocationRaw }
    secondary?: { label: string; to: RouteLocationRaw }
    tone?: 'ink' | 'forest'
  }>(),
  { tone: 'ink' },
)
</script>

<template>
  <section class="cta section" aria-labelledby="cta-title">
    <div class="container cta__inner">
      <h2 id="cta-title" class="cta__title display" :class="{ 'cta__title--forest': tone === 'forest' }">{{ title }}</h2>
      <p v-if="text" class="cta__text">{{ text }}</p>
      <div class="cta__actions">
        <AppButton :to="primary.to" size="lg" class="cta__btn">{{ primary.label }}</AppButton>
        <AppButton v-if="secondary" :to="secondary.to" variant="outline" size="lg" class="cta__btn">{{ secondary.label }}</AppButton>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cta {
  background: var(--color-cta);
}

.cta__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.cta__title {
  max-width: 800px;
  font-size: clamp(1.6rem, 1rem + 2.4vw, 2.85rem);
  line-height: 1.2;
}

.cta__title--forest {
  color: #1c2a0c;
}

.cta__text {
  max-width: 640px;
  margin-top: 20px;
  font-size: var(--text-lg);
  color: var(--color-body);
}

.cta__actions {
  display: flex;
  gap: 16px;
  margin-top: 36px;
}

.cta__btn {
  min-width: 180px;
}

@media (max-width: 767px) {
  .cta__text {
    font-size: var(--text-xl);
    line-height: 1.3;
  }
  .cta__actions {
    width: 100%;
    margin-top: 28px;
  }
  .cta__btn {
    flex: 1;
    min-width: 0;
  }
}
</style>
