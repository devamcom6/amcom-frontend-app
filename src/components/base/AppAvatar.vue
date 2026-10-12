<script setup lang="ts">
import { computed } from 'vue'
import type { Media } from '@/types'
import { initials } from '@/utils/format'

const props = withDefaults(defineProps<{ name: string; media?: Media | null; size?: number }>(), { size: 56 })
const text = computed(() => initials(props.name))
</script>

<template>
  <span class="avatar" :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${Math.round(size * 0.3)}px` }">
    <img
      v-if="media"
      :src="media.thumbnail_url || media.url"
      :alt="name"
      :width="size"
      :height="size"
      loading="lazy"
      decoding="async"
    />
    <span v-else aria-hidden="true">{{ text }}</span>
  </span>
</template>

<style scoped>
.avatar {
  display: inline-grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid #d6d6de;
  background: #ededf2;
  color: var(--color-muted);
  overflow: hidden;
  flex-shrink: 0;
  font-weight: 400;
  letter-spacing: 0.02em;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
