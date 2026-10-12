<script setup lang="ts" generic="V extends string">
import { ref } from 'vue'

/** Underlined tabs ("My listings / My purchases and leases"). WAI-ARIA tabs pattern. */
const props = defineProps<{ tabs: { value: V; label: string }[]; label: string; idPrefix?: string }>()
const model = defineModel<V>({ required: true })
const refs = ref<HTMLButtonElement[]>([])

function onKeydown(e: KeyboardEvent, index: number) {
  const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
  if (!delta) return
  e.preventDefault()
  const next = (index + delta + props.tabs.length) % props.tabs.length
  const tab = props.tabs[next]
  if (!tab) return
  model.value = tab.value
  refs.value[next]?.focus()
}
</script>

<template>
  <div class="tabs" role="tablist" :aria-label="label">
    <button
      v-for="(tab, i) in tabs"
      :id="`${idPrefix ?? 'tab'}-${tab.value}`"
      :key="tab.value"
      ref="refs"
      type="button"
      role="tab"
      class="tabs__tab"
      :class="{ 'is-active': model === tab.value }"
      :aria-selected="model === tab.value"
      :aria-controls="`${idPrefix ?? 'tab'}-${tab.value}-panel`"
      :tabindex="model === tab.value ? 0 : -1"
      @click="model = tab.value"
      @keydown="onKeydown($event, i)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<style scoped>
.tabs {
  display: inline-flex;
  border-bottom: 1px solid var(--color-border);
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
}

.tabs::-webkit-scrollbar {
  display: none;
}

.tabs__tab {
  position: relative;
  padding: 12px 32px 14px;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-ink);
  white-space: nowrap;
}

.tabs__tab.is-active {
  color: var(--color-primary);
}

.tabs__tab.is-active::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -1px;
  width: calc(100% - 40px);
  height: 3px;
  transform: translateX(-50%);
  border-radius: 3px 3px 0 0;
  background: var(--color-primary);
}

.tabs__tab:focus-visible {
  outline: none;
  box-shadow: inset var(--focus-ring);
}

@media (max-width: 767px) {
  .tabs {
    display: flex;
    width: 100%;
  }
  .tabs__tab {
    flex: 1;
    padding: 12px 12px 14px;
  }
}
</style>
