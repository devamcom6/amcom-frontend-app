<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import AppField from './AppField.vue'

/** Naira amount input with live thousands separators. v-model is a number (whole Naira). */
const props = withDefaults(
  defineProps<{
    label?: string
    hint?: string
    error?: string | null
    placeholder?: string
    size?: 'md' | 'lg'
    tone?: 'default' | 'muted'
    id?: string
    hideLabel?: boolean
  }>(),
  { size: 'md', tone: 'default' },
)

const model = defineModel<number | null>({ default: null })
const emit = defineEmits<{ blur: [FocusEvent] }>()
const autoId = useId()
const inputId = computed(() => props.id ?? `amt-${autoId}`)
const fmt = new Intl.NumberFormat('en-NG')
const text = ref(model.value === null ? '' : fmt.format(model.value))

watch(model, (v) => {
  const current = Number(text.value.replace(/[^\d]/g, '')) || null
  if (v !== current) text.value = v === null ? '' : fmt.format(v)
})

function onInput(e: Event) {
  const el = e.target as HTMLInputElement
  const digits = el.value.replace(/[^\d]/g, '').slice(0, 13)
  const value = digits ? Number(digits) : null
  text.value = value === null ? '' : fmt.format(value)
  el.value = text.value
  model.value = value
}
</script>

<template>
  <AppField :id="inputId" :label="label" :hint="hint" :error="error" :hide-label="hideLabel">
    <div class="money" :class="[`money--${size}`, `money--${tone}`, { 'is-invalid': !!error }]">
      <span class="money__symbol" aria-hidden="true">₦</span>
      <input
        :id="inputId"
        :value="text"
        class="money__input"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        :placeholder="placeholder"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined"
        @input="onInput"
        @blur="emit('blur', $event)"
      />
    </div>
  </AppField>
</template>

<style scoped>
.money {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 44px;
  padding: 0 16px;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-xs);
  background: var(--color-bg);
  transition:
    border-color var(--duration-fast) var(--ease),
    box-shadow var(--duration-fast) var(--ease);
}

.money--lg {
  min-height: 56px;
}

.money--muted {
  background: #f8f8f4;
  border-color: #d7d9d6;
}

.money:focus-within {
  border-color: var(--color-primary);
  box-shadow: var(--focus-ring);
}

.money.is-invalid {
  border-color: var(--color-danger);
}

.money__symbol {
  font-weight: 700;
  font-size: var(--text-md);
  color: var(--color-body);
}

.money__input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  font-size: var(--text-md);
  color: var(--color-ink);
}
</style>
