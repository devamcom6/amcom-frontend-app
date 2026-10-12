<script setup lang="ts">
import { useRouter, type RouteLocationRaw } from 'vue-router'
import AppIcon from './AppIcon.vue'

/** "← Back" link. Uses history when available, otherwise the `fallback` route. */
const props = withDefaults(defineProps<{ fallback?: RouteLocationRaw; label?: string; icon?: 'arrow' | 'chevron' }>(), {
  label: 'Back',
  icon: 'arrow',
})
const emit = defineEmits<{ click: [MouseEvent] }>()
const router = useRouter()

function back(e: MouseEvent) {
  emit('click', e)
  if (e.defaultPrevented) return
  if (window.history.state?.back) router.back()
  else void router.push(props.fallback ?? '/')
}
</script>

<template>
  <button type="button" class="back" @click="back">
    <AppIcon :name="icon === 'arrow' ? 'arrow-left' : 'chevron-left'" :size="icon === 'arrow' ? 20 : 16" />
    <span>{{ label }}</span>
  </button>
</template>

<style scoped>
.back {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 6px 4px;
  font-size: var(--text-sm);
  color: var(--color-ink);
}

.back:hover {
  color: var(--color-primary);
}
</style>
