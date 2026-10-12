<script setup lang="ts">
import AppIcon from './AppIcon.vue'
import type { IconName } from './icons'

withDefaults(defineProps<{ icon?: IconName; title: string; description?: string; bordered?: boolean }>(), {
  icon: 'home',
  bordered: true,
})
</script>

<template>
  <div class="empty" :class="{ 'empty--bordered': bordered }">
    <div class="empty__icon" aria-hidden="true">
      <AppIcon :name="icon" :size="30" />
    </div>
    <h3 class="empty__title">{{ title }}</h3>
    <p v-if="description" class="empty__desc">{{ description }}</p>
    <div v-if="$slots.default" class="empty__actions"><slot /></div>
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 64px 24px 72px;
}

.empty--bordered {
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
}

.empty__icon {
  display: grid;
  place-items: center;
  width: 80px;
  height: 80px;
  margin-bottom: 20px;
  border-radius: 50%;
  background: #dcf6dd;
  color: #6b7280;
}

.empty__title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-ink);
}

.empty__desc {
  max-width: 400px;
  margin-top: 10px;
  font-size: var(--text-sm);
  line-height: 1.6;
  color: var(--color-muted);
}

.empty__actions {
  margin-top: 20px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}
</style>
