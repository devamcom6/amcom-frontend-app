<script setup lang="ts" generic="V extends string | number">
import { computed, useId, useAttrs } from 'vue'
import type { Option } from '@/types'
import AppField from './AppField.vue'
import AppIcon from './AppIcon.vue'

defineOptions({ inheritAttrs: false })

// `class`/`style` style the field wrapper (so grid utilities work); everything else goes to the native control.
const attrs = useAttrs()
const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }))
const controlAttrs = computed(() => {
  const { class: _c, style: _s, ...rest } = attrs
  return rest
})

/**
 * Native <select> styled to the design. Native keeps keyboard, screen-reader and
 * mobile picker behaviour correct for free.
 */
const props = withDefaults(
  defineProps<{
    options: Option<V>[]
    label?: string
    hint?: string
    error?: string | null
    placeholder?: string
    required?: boolean
    disabled?: boolean
    locked?: boolean
    loading?: boolean
    size?: 'md' | 'lg'
    id?: string
    hideLabel?: boolean
  }>(),
  { size: 'md' },
)

const model = defineModel<V | null | ''>({ default: '' })
const emit = defineEmits<{ blur: [FocusEvent] }>()
const autoId = useId()
const selectId = computed(() => props.id ?? `sel-${autoId}`)
</script>

<template>
  <AppField
    v-bind="rootAttrs" :id="selectId" :label="label" :hint="hint" :error="error" :required="required" :hide-label="hideLabel">
    <div class="select" :class="[`select--${size}`, { 'is-invalid': !!error, 'is-locked': locked, 'is-empty': model === '' || model === null }]">
      <select
        :id="selectId"
        v-model="model"
        class="select__native"
        v-bind="controlAttrs"
        :required="required"
        :disabled="disabled || locked || loading"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined"
        :aria-busy="loading || undefined"
        @blur="emit('blur', $event)"
      >
        <option value="" disabled>{{ loading ? 'Loading…' : (placeholder ?? 'Select') }}</option>
        <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <AppIcon class="select__icon" :name="locked ? 'lock' : 'chevron-down'" :size="18" />
    </div>
  </AppField>
</template>

<style scoped>
.select {
  position: relative;
}

.select__native {
  width: 100%;
  min-height: 44px;
  padding: 0 44px 0 16px;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-xs);
  background: var(--color-bg);
  font-size: var(--text-sm);
  color: var(--color-ink);
  appearance: none;
  cursor: pointer;
  transition:
    border-color var(--duration-fast) var(--ease),
    box-shadow var(--duration-fast) var(--ease);
}

.select--lg .select__native {
  min-height: 56px;
}

.select.is-empty .select__native {
  color: var(--color-subtle);
}

.select__native:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--focus-ring);
}

.select__native:disabled {
  cursor: not-allowed;
  background: var(--color-neutral-bg);
}

.select.is-locked .select__native {
  color: var(--color-body);
}

.select.is-invalid .select__native {
  border-color: var(--color-danger);
}

.select__icon {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--color-muted);
}

option {
  color: var(--color-ink);
}
</style>
