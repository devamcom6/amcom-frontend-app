<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ value: number; max?: number; label: string; tone?: 'progress' | 'primary' }>(), {
  max: 100,
  tone: 'progress',
})
const percent = computed(() => Math.min(100, Math.max(0, (props.value / props.max) * 100)))
</script>

<template>
  <div
    class="progress"
    role="progressbar"
    :aria-valuenow="value"
    :aria-valuemin="0"
    :aria-valuemax="max"
    :aria-label="label"
  >
    <span class="progress__bar" :class="`progress__bar--${tone}`" :style="{ width: `${Math.max(percent, 4)}%` }" />
  </div>
</template>

<style scoped>
.progress {
  width: 100%;
  height: 8px;
  border-radius: var(--radius-pill);
  background: #eceef1;
  overflow: hidden;
}

.progress__bar {
  display: block;
  height: 100%;
  border-radius: inherit;
  transition: width var(--duration-slow) var(--ease);
}

.progress__bar--progress {
  background: var(--color-progress);
}

.progress__bar--primary {
  background: var(--color-primary);
}
</style>
