<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
import type { IconName } from './icons'

const props = withDefaults(
  defineProps<{ tone?: 'info' | 'success' | 'warning' | 'danger' | 'neutral'; title?: string; dismissible?: boolean }>(),
  { tone: 'info' },
)
const emit = defineEmits<{ dismiss: [] }>()

const icon = computed<IconName>(
  () => ({ info: 'info', success: 'check-circle', warning: 'alert', danger: 'x-circle', neutral: 'info' })[props.tone] as IconName,
)
</script>

<template>
  <div class="alert" :class="`alert--${tone}`" :role="tone === 'danger' ? 'alert' : 'status'">
    <AppIcon :name="icon" :size="20" class="alert__icon" />
    <div class="alert__body">
      <p v-if="title" class="alert__title">{{ title }}</p>
      <div class="alert__text"><slot /></div>
    </div>
    <button v-if="dismissible" type="button" class="alert__close" aria-label="Dismiss" @click="emit('dismiss')">
      <AppIcon name="close" :size="16" />
    </button>
  </div>
</template>

<style scoped>
.alert {
  display: flex;
  gap: 12px;
  padding: 14px 16px;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  font-size: var(--text-sm);
}

.alert__body {
  flex: 1;
  min-width: 0;
}

.alert__title {
  font-weight: 600;
  margin-bottom: 2px;
}

.alert__text :deep(ul) {
  margin: 6px 0 0;
  padding-left: 18px;
}

.alert__close {
  align-self: flex-start;
  color: inherit;
  opacity: 0.7;
}

.alert--info {
  background: #eef4ff;
  color: #1e3a8a;
  border-color: #c7d7fe;
}

.alert--success {
  background: var(--color-success-bg);
  color: #2f5d15;
  border-color: #cfe8b4;
}

.alert--warning {
  background: #fffbea;
  color: #92400e;
  border-color: var(--color-warning-border);
}

.alert--warning .alert__title {
  color: var(--color-warning);
}

.alert--danger {
  background: var(--color-danger-bg);
  color: #991b1b;
  border-color: #f8c4c4;
}

.alert--neutral {
  background: var(--color-info-bg);
  color: var(--color-body);
}
</style>
