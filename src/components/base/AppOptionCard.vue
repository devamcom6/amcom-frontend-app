<script setup lang="ts">
/**
 * Selectable card used for tenure options ("12 months · 18% ROI") and payment methods.
 * Rendered as a native radio for keyboard + screen-reader support.
 */
withDefaults(
  defineProps<{
    name: string
    value: string | number
    title: string
    subtitle?: string
    /** `radio` shows a radio dot on the right (payment method design). */
    indicator?: 'none' | 'radio'
    subtitleTone?: 'success' | 'muted'
    disabled?: boolean
  }>(),
  { indicator: 'none', subtitleTone: 'success' },
)

const model = defineModel<string | number | null>({ default: null })
</script>

<template>
  <label class="option" :class="{ 'is-selected': model === value, 'is-disabled': disabled, 'option--radio': indicator === 'radio' }">
    <input v-model="model" class="option__native" type="radio" :name="name" :value="value" :disabled="disabled" />
    <span class="option__text">
      <span class="option__title">{{ title }}</span>
      <span v-if="subtitle" class="option__subtitle" :class="`option__subtitle--${subtitleTone}`">{{ subtitle }}</span>
    </span>
    <span v-if="indicator === 'radio'" class="option__radio" aria-hidden="true" />
  </label>
</template>

<style scoped>
.option {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 70px;
  padding: 14px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xs);
  background: var(--color-bg);
  cursor: pointer;
  transition:
    border-color var(--duration-fast) var(--ease),
    background-color var(--duration-fast) var(--ease),
    box-shadow var(--duration-fast) var(--ease);
}

.option:hover:not(.is-disabled) {
  border-color: var(--color-border-strong);
}

.option.is-selected {
  border: 2px solid var(--color-success);
  padding: 13px 15px;
  background: #f1f8f1;
}

.option--radio.is-selected {
  border-color: var(--color-success);
  background: var(--color-bg);
}

.option.is-disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.option__native {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.option:has(.option__native:focus-visible) {
  box-shadow: var(--focus-ring);
}

.option__text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.option__title {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-ink);
}

.option--radio .option__title {
  font-size: var(--text-base);
  font-weight: 400;
}

.option__subtitle {
  font-size: var(--text-xs);
}

.option__subtitle--success {
  color: var(--color-success);
}

.option__subtitle--muted {
  color: var(--color-muted);
}

.option__radio {
  width: 20px;
  height: 20px;
  border: 1.5px solid var(--color-muted);
  border-radius: 50%;
  flex-shrink: 0;
}

.is-selected .option__radio {
  border-color: var(--color-success);
  background: radial-gradient(circle, var(--color-success) 0 5px, transparent 5.5px);
}
</style>
