<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import AppField from './AppField.vue'
import AppSelect from './AppSelect.vue'

/**
 * Phone input with a +234 country prefix (design: "Phone Number (Preferably Whatsapp)").
 * Emits a normalised E.164-like string, e.g. "+2348123456789".
 */
const props = withDefaults(
  defineProps<{ label?: string; hint?: string; error?: string | null; placeholder?: string; required?: boolean; id?: string }>(),
  { placeholder: 'Enter your phone number' },
)

const COUNTRIES = [
  { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+233', flag: '🇬🇭', name: 'Ghana' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+1', flag: '🇺🇸', name: 'United States' },
]

const model = defineModel<string>({ default: '' })
const emit = defineEmits<{ blur: [FocusEvent] }>()
const autoId = useId()
const inputId = computed(() => props.id ?? `ph-${autoId}`)

function split(value: string) {
  const match = COUNTRIES.find((c) => value.startsWith(c.code))
  return match ? { code: match.code, local: value.slice(match.code.length) } : { code: '+234', local: value.replace(/^0/, '') }
}

const initial = split(model.value ?? '')
const code = ref(initial.code)
const local = ref(initial.local)
const current = computed(() => COUNTRIES.find((c) => c.code === code.value) ?? COUNTRIES[0]!)

watch([code, local], () => {
  const digits = local.value.replace(/[^\d]/g, '').replace(/^0/, '')
  model.value = digits ? `${code.value}${digits}` : ''
})

watch(model, (v) => {
  const s = split(v ?? '')
  if (`${code.value}${local.value.replace(/[^\d]/g, '').replace(/^0/, '')}` !== (v ?? '')) {
    code.value = s.code
    local.value = s.local
  }
})
</script>

<template>
  <AppField :id="inputId" :label="label" :hint="hint" :error="error" :required="required">
    <div class="phone" :class="{ 'is-invalid': !!error }">
      <AppSelect
        v-model="code"
        class="phone__country"
        variant="filter"
        size="sm"
        label="Country code"
        hide-label
        search-placeholder="Search country"
        :trigger-label="`${current.flag} ${current.code}`"
        :options="COUNTRIES.map((c) => ({ value: c.code, label: `${c.flag} ${c.name} (${c.code})` }))"
      />
      <input
        :id="inputId"
        v-model="local"
        class="phone__input"
        type="tel"
        inputmode="tel"
        autocomplete="tel-national"
        :placeholder="placeholder"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="error ? `${inputId}-error` : undefined"
        @blur="emit('blur', $event)"
      />
    </div>
  </AppField>
</template>

<style scoped>
.phone {
  display: flex;
  min-height: 44px;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-xs);
  background: var(--color-bg);
  overflow: hidden;
  transition:
    border-color var(--duration-fast) var(--ease),
    box-shadow var(--duration-fast) var(--ease);
}

.phone:focus-within {
  border-color: var(--color-primary);
  box-shadow: var(--focus-ring);
}

.phone.is-invalid {
  border-color: var(--color-danger);
}

.phone__country {
  flex-shrink: 0;
  background: var(--color-page);
  border-right: 1px solid var(--color-border-subtle);
}

.phone__country :deep(.select__trigger) {
  height: 100%;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.phone__input {
  flex: 1;
  min-width: 0;
  padding: 0 14px;
  border: 0;
  outline: 0;
  font-size: var(--text-sm);
  background: transparent;
}

.phone__input::placeholder {
  color: var(--color-subtle);
}
</style>
