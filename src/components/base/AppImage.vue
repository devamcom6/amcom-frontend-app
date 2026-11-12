<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Media } from '@/types'
import AppIcon from './AppIcon.vue'

/**
 * Responsive, lazy image for backend (Cloudinary) media.
 * - builds `srcset` from the width-keyed `variants` Laravel returns
 * - reserves space with `aspect-ratio` / width / height to avoid layout shift
 * - shows the dominant colour as a placeholder, then fades the image in
 */
const props = withDefaults(
  defineProps<{
    media: Media | null | undefined
    /** Rendered-size hint, e.g. "(max-width: 767px) 100vw, 33vw". */
    sizes?: string
    /** Override aspect ratio (e.g. "16/9"). Defaults to the media's intrinsic ratio. */
    ratio?: string
    alt?: string
    eager?: boolean
    fit?: 'cover' | 'contain'
    rounded?: string
  }>(),
  { sizes: '100vw', fit: 'cover' },
)

const loaded = ref(false)
const failed = ref(false)

const srcset = computed(() => {
  const v = props.media?.variants
  if (!v) return undefined
  return Object.entries(v)
    .map(([w, url]) => `${url} ${w}w`)
    .join(', ')
})

const aspect = computed(() => props.ratio ?? (props.media?.width && props.media.height ? `${props.media.width}/${props.media.height}` : undefined))
const altText = computed(() => props.alt ?? props.media?.alt_text ?? '')
</script>

<template>
  <span
    class="img"
    :class="{ 'is-loaded': loaded, 'is-failed': failed }"
    :style="{ aspectRatio: aspect, backgroundColor: media?.dominant_color ?? undefined, borderRadius: rounded }"
  >
    <img
      v-if="media && !failed"
      :src="media.url"
      :srcset="srcset"
      :sizes="srcset ? sizes : undefined"
      :alt="altText"
      :width="media.width || undefined"
      :height="media.height || undefined"
      :loading="eager ? 'eager' : 'lazy'"
      :fetchpriority="eager ? 'high' : undefined"
      decoding="async"
      :style="{ objectFit: fit }"
      @load="loaded = true"
      @error="failed = true"
    />
    <span v-if="!media || failed" class="img__fallback" role="img" :aria-label="altText ? `${altText} (photo coming soon)` : 'Photo coming soon'">
      <AppIcon name="image" :size="28" :stroke-width="1.5" />
      <span class="img__fallback-text" aria-hidden="true">Photo coming soon</span>
    </span>
  </span>
</template>

<style scoped>
.img {
  position: relative;
  display: block;
  width: 100%;
  overflow: hidden;
  background-color: #e7ece9;
}

.img img {
  display: block;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity var(--duration-slow) var(--ease);
}

.img.is-loaded img {
  opacity: 1;
}

.img__fallback {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--color-primary);
  background:
    radial-gradient(120% 90% at 20% 0%, rgba(255, 255, 255, 0.55), transparent 60%),
    linear-gradient(135deg, #dbe9e3, #c3dbd1);
}

.img__fallback :deep(svg) {
  opacity: 0.7;
}

.img__fallback-text {
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.02em;
  opacity: 0.75;
}
</style>
