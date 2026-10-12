<script setup lang="ts">
import { computed, useId } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps<{
  label?: string
  error?: string | null
  disabled?: boolean
  id?: string
  size?: 'sm' | 'md'
}>()

const model = defineModel<boolean>({ default: false })
const autoId = useId()
const boxId = computed(() => props.id ?? `cb-${autoId}`)
</script>

<template>
  <div class="checkbox-wrap">
    <label class="checkbox" :class="[{ 'is-disabled': disabled }, `checkbox--${size ?? 'md'}`]" :for="boxId">
      <input
        :id="boxId"
        v-model="model"
        type="checkbox"
        class="checkbox__native"
        :disabled="disabled"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="error ? `${boxId}-error` : undefined"
      />
      <span class="checkbox__box" aria-hidden="true">
        <AppIcon name="check" :size="14" :stroke-width="3" />
      </span>
      <span class="checkbox__label"><slot>{{ label }}</slot></span>
    </label>
    <p v-if="error" :id="`${boxId}-error`" class="checkbox__error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.checkbox {
  display: inline-flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
  font-size: var(--text-sm);
  color: var(--color-ink);
  line-height: 1.45;
}

.checkbox.is-disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.checkbox__native {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
}

.checkbox__box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-top: 1px;
  border: 1.5px solid var(--color-ink);
  border-radius: 3px;
  background: var(--color-bg);
  color: transparent;
  flex-shrink: 0;
  transition:
    background-color var(--duration-fast) var(--ease),
    border-color var(--duration-fast) var(--ease);
}

.checkbox__native:checked + .checkbox__box {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-inverse);
}

.checkbox__native:focus-visible + .checkbox__box {
  box-shadow: var(--focus-ring);
}

.checkbox__native[aria-invalid='true'] + .checkbox__box {
  border-color: var(--color-danger);
}

.checkbox__error {
  margin-top: 6px;
  margin-left: 32px;
  font-size: var(--text-xs);
  color: var(--color-danger);
}
</style>
