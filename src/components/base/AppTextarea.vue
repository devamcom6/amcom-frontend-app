<script setup lang="ts">
import { computed, useId, useAttrs } from 'vue'
import AppField from './AppField.vue'

defineOptions({ inheritAttrs: false })

// `class`/`style` style the field wrapper (so grid utilities work); everything else goes to the native control.
const attrs = useAttrs()
const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }))
const controlAttrs = computed(() => {
  const { class: _c, style: _s, ...rest } = attrs
  return rest
})

const props = withDefaults(
  defineProps<{
    label?: string
    hint?: string
    error?: string | null
    placeholder?: string
    rows?: number
    maxlength?: number
    required?: boolean
    optional?: boolean
    disabled?: boolean
    id?: string
  }>(),
  { rows: 4 },
)

const model = defineModel<string | null>({ default: '' })
const emit = defineEmits<{ blur: [FocusEvent] }>()
const autoId = useId()
const inputId = computed(() => props.id ?? `ta-${autoId}`)
const count = computed(() => (model.value ?? '').length)
</script>

<template>
  <AppField
    v-bind="rootAttrs" :id="inputId" :label="label" :hint="hint" :error="error" :required="required" :optional-label="optional">
    <textarea
      :id="inputId"
      v-model="model"
      class="textarea"
      :class="{ 'is-invalid': !!error }"
      v-bind="controlAttrs"
      :rows="rows"
      :placeholder="placeholder"
      :maxlength="maxlength"
      :required="required"
      :disabled="disabled"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined"
      @blur="emit('blur', $event)"
    />
    <span v-if="maxlength" class="textarea__count" aria-live="polite">{{ count }}/{{ maxlength }}</span>
  </AppField>
</template>

<style scoped>
.textarea {
  width: 100%;
  min-height: 120px;
  padding: 14px 16px;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-xs);
  background: var(--color-bg);
  font-size: var(--text-sm);
  line-height: 1.5;
  color: var(--color-ink);
  resize: vertical;
  transition:
    border-color var(--duration-fast) var(--ease),
    box-shadow var(--duration-fast) var(--ease);
}

.textarea::placeholder {
  color: var(--color-subtle);
}

.textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--focus-ring);
}

.textarea.is-invalid {
  border-color: var(--color-danger);
}

.textarea__count {
  align-self: flex-end;
  font-size: var(--text-xs);
  color: var(--color-muted);
}
</style>
