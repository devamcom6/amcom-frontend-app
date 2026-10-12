<script setup lang="ts">
/**
 * Label + control + hint/error wrapper shared by every form control.
 * Provides ids so the control can wire `aria-describedby` / `aria-invalid`.
 */
defineProps<{
  id: string
  label?: string
  hint?: string
  error?: string | null
  required?: boolean
  optionalLabel?: boolean
  hideLabel?: boolean
}>()
</script>

<template>
  <div class="field" :class="{ 'field--error': !!error }">
    <div v-if="label || $slots['label-aside']" class="field__head">
      <label v-if="label" :for="id" class="field__label" :class="{ 'sr-only': hideLabel }">
        {{ label }}<span v-if="optionalLabel" class="field__optional"> (Optional)</span>
        <span v-if="required" class="sr-only"> (required)</span>
      </label>
      <slot name="label-aside" />
    </div>
    <slot />
    <p v-if="error" :id="`${id}-error`" class="field__error" role="alert">{{ error }}</p>
    <p v-else-if="hint" :id="`${id}-hint`" class="field__hint">{{ hint }}</p>
  </div>
</template>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.field__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.field__label {
  font-size: var(--text-sm);
  font-weight: 400;
  color: var(--color-ink);
}

.field__optional {
  color: var(--color-ink);
}

.field__hint {
  font-size: var(--text-xs);
  color: var(--color-muted);
}

.field__error {
  font-size: var(--text-xs);
  color: var(--color-danger);
}
</style>
