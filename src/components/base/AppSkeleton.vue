<script setup lang="ts">
withDefaults(
  defineProps<{ width?: string; height?: string; radius?: string; lines?: number; circle?: boolean }>(),
  { width: '100%', height: '14px', radius: 'var(--radius-xs)', lines: 1 },
)
</script>

<template>
  <span class="skeleton-group" aria-hidden="true">
    <span
      v-for="i in lines"
      :key="i"
      class="skeleton"
      :style="{
        width: circle ? height : i === lines && lines > 1 ? '60%' : width,
        height,
        borderRadius: circle ? '50%' : radius,
      }"
    />
  </span>
</template>

<style scoped>
.skeleton-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.skeleton {
  display: block;
  background: linear-gradient(90deg, #eef0f2 0%, #f6f7f8 40%, #eef0f2 80%);
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}

@keyframes shimmer {
  from {
    background-position: 100% 0;
  }
  to {
    background-position: -100% 0;
  }
}
</style>
