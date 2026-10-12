<script setup lang="ts">
withDefaults(defineProps<{ size?: number; label?: string }>(), { size: 18, label: 'Loading' })
</script>

<template>
  <span class="spinner" role="status" :style="{ width: `${size}px`, height: `${size}px` }">
    <span class="sr-only">{{ label }}</span>
  </span>
</template>

<style scoped>
.spinner {
  display: inline-block;
  border-radius: 50%;
  border: 2px solid currentColor;
  border-right-color: transparent;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
