<script setup lang="ts">
import { computed, ref, useId, useAttrs } from 'vue'
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

const props = withDefaults(
  defineProps<{
    label?: string
    hint?: string
    error?: string | null
    type?: 'text' | 'email' | 'password' | 'tel' | 'number' | 'search' | 'url' | 'date'
    placeholder?: string
    autocomplete?: string
    inputmode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'email' | 'search'
    required?: boolean
    optional?: boolean
    disabled?: boolean
    /** Read-only value verified from an ID — shows a lock icon. */
    locked?: boolean
    prefix?: string
    size?: 'md' | 'lg'
    id?: string
    hideLabel?: boolean
  }>(),
  { type: 'text', size: 'md' },
)

const model = defineModel<string | number | null>({ default: '' })
const emit = defineEmits<{ blur: [FocusEvent] }>()

const autoId = useId()
const inputId = computed(() => props.id ?? `in-${autoId}`)
const reveal = ref(false)
const actualType = computed(() => (props.type === 'password' && reveal.value ? 'text' : props.type))
const describedBy = computed(() =>
  props.error ? `${inputId.value}-error` : props.hint ? `${inputId.value}-hint` : undefined,
)
</script>

<template>
  <AppField
    v-bind="rootAttrs"
    :id="inputId"
    :label="label"
    :hint="hint"
    :error="error"
    :required="required"
    :optional-label="optional"
    :hide-label="hideLabel"
  >
    <template v-if="$slots['label-aside']" #label-aside><slot name="label-aside" /></template>
    <div
      class="control"
      :class="[`control--${size}`, { 'is-invalid': !!error, 'is-locked': locked, 'is-disabled': disabled, 'has-prefix': !!prefix }]"
    >
      <span v-if="prefix" class="control__prefix" aria-hidden="true">{{ prefix }}</span>
      <slot name="leading" />
      <input
        :id="inputId"
        v-model="model"
        class="control__input"
        v-bind="controlAttrs"
        :type="actualType"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :inputmode="inputmode"
        :required="required"
        :disabled="disabled"
        :readonly="locked"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="describedBy"
        @blur="emit('blur', $event)"
      />
      <button
        v-if="type === 'password'"
        type="button"
        class="control__action"
        :aria-label="reveal ? 'Hide password' : 'Show password'"
        :aria-pressed="reveal"
        @click="reveal = !reveal"
      >
        <AppIcon :name="reveal ? 'eye-off' : 'eye'" :size="18" />
      </button>
      <AppIcon v-if="locked" class="control__lock" name="lock" :size="18" label="Verified from your ID" />
      <slot name="trailing" />
    </div>
  </AppField>
</template>

<style scoped>
.control {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 16px;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-xs);
  background: var(--color-bg);
  transition:
    border-color var(--duration-fast) var(--ease),
    box-shadow var(--duration-fast) var(--ease);
}

.control--lg {
  min-height: 56px;
}

.control:focus-within {
  border-color: var(--color-primary);
  box-shadow: var(--focus-ring);
}

.control.is-invalid {
  border-color: var(--color-danger);
}

.control.is-invalid:focus-within {
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.18);
}

.control.is-locked,
.control.is-disabled {
  background: var(--color-neutral-bg);
}

.control__input {
  flex: 1;
  min-width: 0;
  height: 100%;
  min-height: inherit;
  border: 0;
  outline: 0;
  background: transparent;
  font-size: var(--text-sm);
  color: var(--color-ink);
}

.control__input::placeholder {
  color: var(--color-subtle);
}

.control__input:disabled {
  cursor: not-allowed;
  color: var(--color-muted);
}

.control__input[readonly] {
  color: var(--color-body);
}

.control__prefix {
  font-weight: 600;
  color: var(--color-ink);
}

.control__action {
  display: inline-flex;
  padding: 4px;
  border-radius: var(--radius-xs);
  color: var(--color-muted);
}

.control__action:hover {
  color: var(--color-ink);
}

.control__lock {
  color: var(--color-muted);
}

/* Hide number spinners */
.control__input::-webkit-outer-spin-button,
.control__input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.control__input[type='number'] {
  -moz-appearance: textfield;
  appearance: textfield;
}
</style>
