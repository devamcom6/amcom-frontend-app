<script setup lang="ts">
import logoUrl from '@/assets/images/logo.png'

withDefaults(defineProps<{ size?: number; link?: boolean }>(), { size: 52, link: true })
</script>

<template>
  <component :is="link ? 'RouterLink' : 'span'" :to="link ? '/' : undefined" class="logo" :aria-label="link ? 'Amcom home' : undefined">
    <img :src="logoUrl" :width="size" :height="size" alt="Amcom" decoding="async" />
  </component>
</template>

<style scoped>
.logo {
  display: inline-flex;
  flex-shrink: 0;
}
</style>
