<script setup lang="ts">
import illustration from '@/assets/images/success-illustration.png'

/** Illustration + heading + body used on every confirmation screen and modal. */
withDefaults(
  defineProps<{ title: string; tone?: 'ink' | 'maroon'; align?: 'center' | 'start'; size?: 'md' | 'lg'; headingLevel?: 'h1' | 'h2' }>(),
  { tone: 'ink', align: 'center', size: 'md', headingLevel: 'h1' },
)
</script>

<template>
  <div class="success" :class="[`success--${align}`, `success--${size}`]">
    <img :src="illustration" alt="" width="145" height="115" class="success__illus" aria-hidden="true" />
    <component :is="headingLevel" class="success__title" :class="`success__title--${tone}`">{{ title }}</component>
    <div class="success__body"><slot /></div>
    <div v-if="$slots.actions" class="success__actions"><slot name="actions" /></div>
    <div v-if="$slots.note" class="success__note"><slot name="note" /></div>
  </div>
</template>

<style scoped>
.success {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.success--center {
  align-items: center;
  text-align: center;
}

.success--start {
  align-items: flex-start;
  text-align: left;
}

.success__illus {
  width: 145px;
  height: auto;
  margin-bottom: 48px;
  mix-blend-mode: multiply;
}

.success__title {
  font-size: var(--text-2xl);
  font-weight: 400;
}

.success__title--maroon {
  font-weight: 600;
  color: var(--color-maroon);
}

.success--lg .success__title {
  font-size: 1.85rem;
}

.success__body {
  margin-top: 10px;
  max-width: 520px;
  font-size: var(--text-base);
  line-height: 1.55;
  color: var(--color-body);
}

.success__body :deep(p + p) {
  margin-top: 12px;
}

.success__actions {
  display: grid;
  gap: 16px;
  width: 100%;
  margin-top: 24px;
}

.success__note {
  width: 100%;
  margin-top: 20px;
  padding: 14px 16px;
  border-radius: var(--radius-md);
  background: var(--color-info-bg);
  font-size: var(--text-sm);
  line-height: 1.5;
  color: var(--color-body);
  text-align: left;
}

@media (max-width: 767px) {
  .success__illus {
    margin-bottom: 32px;
  }
  .success__title {
    font-size: 1.6rem;
  }
}
</style>
