<script setup lang="ts" generic="V extends string | number">
import { computed, useId } from 'vue'
import type { Option } from '@/types'

/**
 * Pill-shaped single/multi choice group ("For Sale / For Rent / For Lease", amenities, filters).
 * Renders as a radiogroup or a group of toggle buttons for assistive technology.
 */
const props = withDefaults(
  defineProps<{
    options: Option<V>[]
    label?: string
    multiple?: boolean
    error?: string | null
    size?: 'sm' | 'md'
    /** Equal-width chips that stretch to fill the row (mobile bottom sheets). */
    stretch?: boolean
    tone?: 'primary' | 'solid'
  }>(),
  { size: 'md', tone: 'primary' },
)

const model = defineModel<V | V[] | null>({ default: null })
const groupId = useId()

const selected = computed(() => (Array.isArray(model.value) ? model.value : model.value === null ? [] : [model.value]))

function toggle(value: V) {
  if (props.multiple) {
    const current = Array.isArray(model.value) ? model.value : []
    model.value = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
  } else {
    model.value = value
  }
}

function onKeydown(e: KeyboardEvent, index: number) {
  if (props.multiple) return
  const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp']
  if (!keys.includes(e.key)) return
  e.preventDefault()
  const delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1
  const next = props.options[(index + delta + props.options.length) % props.options.length]
  if (!next) return
  model.value = next.value
  const target = (e.currentTarget as HTMLElement).parentElement?.children[(index + delta + props.options.length) % props.options.length]
  ;(target as HTMLElement | undefined)?.focus()
}
</script>

<template>
  <fieldset class="chips-field">
    <legend v-if="label" :id="`${groupId}-label`" class="chips-field__legend">{{ label }}</legend>
    <div
      class="chips"
      :class="{ 'chips--stretch': stretch }"
      :role="multiple ? 'group' : 'radiogroup'"
      :aria-labelledby="label ? `${groupId}-label` : undefined"
      :aria-invalid="error ? 'true' : undefined"
    >
      <button
        v-for="(opt, i) in options"
        :key="opt.value"
        type="button"
        class="chip"
        :class="[`chip--${size}`, `chip--${tone}`, { 'is-selected': selected.includes(opt.value) }]"
        :role="multiple ? undefined : 'radio'"
        :aria-checked="multiple ? undefined : selected.includes(opt.value)"
        :aria-pressed="multiple ? selected.includes(opt.value) : undefined"
        :tabindex="multiple || selected.includes(opt.value) || (!selected.length && i === 0) ? 0 : -1"
        @click="toggle(opt.value)"
        @keydown="onKeydown($event, i)"
      >
        {{ opt.label }}
      </button>
    </div>
    <p v-if="error" class="chips-field__error" role="alert">{{ error }}</p>
  </fieldset>
</template>

<style scoped>
.chips-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chips-field__legend {
  margin-bottom: 8px;
  font-size: var(--text-sm);
  color: var(--color-ink);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 10px;
}

.chips--stretch .chip {
  flex: 1 1 0;
}

.chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 22px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: var(--color-bg);
  font-size: var(--text-sm);
  color: var(--color-muted);
  transition:
    background-color var(--duration-fast) var(--ease),
    border-color var(--duration-fast) var(--ease),
    color var(--duration-fast) var(--ease);
}

.chip--sm {
  min-height: 34px;
  padding: 6px 16px;
}

.chip:hover {
  border-color: var(--color-border-strong);
  color: var(--color-ink);
}

.chip:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.chip--primary.is-selected {
  border: 2px solid var(--color-primary);
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-weight: 500;
}

.chip--solid.is-selected {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: var(--color-inverse);
}

.chips-field__error {
  font-size: var(--text-xs);
  color: var(--color-danger);
}

@media (max-width: 767px) {
  .chip {
    padding: 8px 16px;
    min-height: 40px;
  }
}
</style>
