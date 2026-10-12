<script setup lang="ts">
import AppButton from './AppButton.vue'
import AppModal from './AppModal.vue'

withDefaults(
  defineProps<{
    title: string
    message?: string
    confirmLabel?: string
    cancelLabel?: string
    tone?: 'primary' | 'danger'
    loading?: boolean
  }>(),
  { confirmLabel: 'Confirm', cancelLabel: 'Cancel', tone: 'primary' },
)

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ confirm: [] }>()
</script>

<template>
  <AppModal v-model:open="open" :title="title" size="sm" :persistent="loading" :title-tone="tone === 'danger' ? 'danger' : 'default'">
    <p v-if="message" class="confirm__message">{{ message }}</p>
    <slot />
    <template #footer>
      <div class="confirm__actions">
        <AppButton variant="secondary" :disabled="loading" @click="open = false">{{ cancelLabel }}</AppButton>
        <AppButton :variant="tone === 'danger' ? 'danger' : 'primary'" :loading="loading" @click="emit('confirm')">
          {{ confirmLabel }}
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>

<style scoped>
.confirm__message {
  color: var(--color-body);
  line-height: 1.6;
}

.confirm__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 767px) {
  .confirm__actions > * {
    flex: 1;
  }
}
</style>
