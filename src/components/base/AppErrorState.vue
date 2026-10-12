<script setup lang="ts">
import { computed } from 'vue'
import type { ApiError } from '@/services/http/errors'
import AppButton from './AppButton.vue'
import AppIcon from './AppIcon.vue'

const props = defineProps<{ error: ApiError | null; title?: string; compact?: boolean }>()
const emit = defineEmits<{ retry: [] }>()

const heading = computed(() => {
  if (props.title) return props.title
  switch (props.error?.kind) {
    case 'not_found':
      return 'Not found'
    case 'network':
      return "You're offline"
    case 'forbidden':
      return 'Access denied'
    default:
      return "We couldn't load this"
  }
})
const retryable = computed(() => props.error?.kind !== 'not_found' && props.error?.kind !== 'forbidden')
</script>

<template>
  <div class="error-state" :class="{ 'error-state--compact': compact }" role="alert">
    <AppIcon name="alert" :size="compact ? 22 : 32" class="error-state__icon" />
    <div>
      <p class="error-state__title">{{ heading }}</p>
      <p class="error-state__message">{{ error?.message ?? 'Something went wrong. Please try again.' }}</p>
    </div>
    <AppButton v-if="retryable" variant="outline" size="sm" icon-left="refresh" @click="emit('retry')">Try again</AppButton>
    <slot />
  </div>
</template>

<style scoped>
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 56px 24px;
  text-align: center;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
}

.error-state--compact {
  flex-direction: row;
  justify-content: space-between;
  text-align: left;
  padding: 16px;
}

.error-state__icon {
  color: var(--color-warning);
}

.error-state__title {
  font-weight: 600;
  color: var(--color-ink);
}

.error-state__message {
  margin-top: 4px;
  font-size: var(--text-sm);
  color: var(--color-muted);
}
</style>
