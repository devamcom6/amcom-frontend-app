<script setup lang="ts">
defineProps<{ label: string; description?: string; disabled?: boolean; id?: string }>()
const model = defineModel<boolean>({ default: false })
</script>

<template>
  <div class="toggle-row">
    <div class="toggle-row__text">
      <span :id="id ? `${id}-label` : undefined" class="toggle-row__label">{{ label }}</span>
      <span v-if="description" class="toggle-row__desc">{{ description }}</span>
    </div>
    <button
      :id="id"
      type="button"
      role="switch"
      class="toggle"
      :class="{ 'is-on': model }"
      :aria-checked="model"
      :aria-labelledby="id ? `${id}-label` : undefined"
      :aria-label="id ? undefined : label"
      :disabled="disabled"
      @click="model = !model"
    >
      <span class="toggle__thumb" />
    </button>
  </div>
</template>

<style scoped>
.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.toggle-row__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toggle-row__label {
  font-size: var(--text-base);
  color: var(--color-ink);
}

.toggle-row__desc {
  font-size: var(--text-sm);
  color: var(--color-muted);
}

.toggle {
  position: relative;
  width: 44px;
  height: 24px;
  border-radius: var(--radius-pill);
  background: #d4d7dc;
  flex-shrink: 0;
  transition: background-color var(--duration) var(--ease);
}

.toggle.is-on {
  background: var(--color-primary);
}

.toggle:disabled {
  opacity: 0.5;
}

.toggle:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.toggle__thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  transition: transform var(--duration) var(--ease);
}

.toggle.is-on .toggle__thumb {
  transform: translateX(20px);
}
</style>
