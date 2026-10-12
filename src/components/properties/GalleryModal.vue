<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import AppIcon from '@/components/base/AppIcon.vue'
import AppImage from '@/components/base/AppImage.vue'
import AppModal from '@/components/base/AppModal.vue'
import type { Media } from '@/types'

/** Full gallery: large image with prev/next + thumbnail rail (right on desktop, below on mobile). */
const props = defineProps<{ images: Media[]; startIndex?: number; title?: string }>()
const open = defineModel<boolean>('open', { default: false })
const index = ref(0)
const thumbs = ref<HTMLElement | null>(null)

watch(open, (v) => {
  if (v) index.value = props.startIndex ?? 0
})

const current = computed(() => props.images[index.value])

function go(delta: number) {
  index.value = (index.value + delta + props.images.length) % props.images.length
  void nextTick(() => thumbs.value?.querySelector('.is-active')?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' }))
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowRight') go(1)
  if (e.key === 'ArrowLeft') go(-1)
}
</script>

<template>
  <AppModal v-model:open="open" size="xl" :title="title ?? 'Gallery'" :description="`${index + 1}/${images.length}`" class="gallery-modal">
    <div class="gallery" tabindex="0" aria-roledescription="carousel" @keydown="onKey">
      <div class="gallery__stage">
        <AppImage v-if="current" :key="current.id" :media="current" ratio="1080/764" sizes="(max-width: 767px) 100vw, 1080px" eager rounded="8px" />
        <template v-if="images.length > 1">
          <button type="button" class="gallery__nav gallery__nav--prev" aria-label="Previous image" @click="go(-1)">
            <AppIcon name="arrow-left" :size="26" />
          </button>
          <button type="button" class="gallery__nav gallery__nav--next" aria-label="Next image" @click="go(1)">
            <AppIcon name="arrow-right" :size="26" />
          </button>
        </template>
        <p class="sr-only" aria-live="polite">Image {{ index + 1 }} of {{ images.length }}: {{ current?.alt_text }}</p>
      </div>
      <ul ref="thumbs" class="gallery__thumbs" role="list">
        <li v-for="(img, i) in images" :key="img.id">
          <button
            type="button"
            class="gallery__thumb"
            :class="{ 'is-active': i === index }"
            :aria-label="`Show image ${i + 1}`"
            :aria-current="i === index || undefined"
            @click="index = i"
          >
            <img :src="img.thumbnail_url" :alt="''" loading="lazy" decoding="async" width="253" height="184" />
          </button>
        </li>
      </ul>
    </div>
  </AppModal>
</template>

<style scoped>


.gallery {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 253px;
  gap: 12px;
  outline: none;
}

.gallery__stage {
  position: relative;
}

.gallery__nav {
  position: absolute;
  top: 50%;
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: var(--shadow-sm);
  color: var(--color-ink);
}

.gallery__nav--prev {
  left: 24px;
}

.gallery__nav--next {
  right: 24px;
}

.gallery__thumbs {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 764px;
  overflow-y: auto;
  scrollbar-width: thin;
}

.gallery__thumb {
  display: block;
  width: 100%;
  border-radius: 6px;
  overflow: hidden;
  opacity: 0.7;
  outline: 2px solid transparent;
  outline-offset: -2px;
  transition: opacity var(--duration-fast) var(--ease);
}

.gallery__thumb:hover,
.gallery__thumb.is-active {
  opacity: 1;
}

.gallery__thumb.is-active {
  outline-color: var(--color-primary);
}

.gallery__thumb img {
  width: 100%;
  aspect-ratio: 253 / 184;
  object-fit: cover;
}

@media (max-width: 767px) {


  .gallery {
    grid-template-columns: 1fr;
  }

  .gallery__nav {
    width: 56px;
    height: 56px;
  }

  .gallery__nav--prev {
    left: 12px;
  }

  .gallery__nav--next {
    right: 12px;
  }

  .gallery__thumbs {
    flex-direction: row;
    max-height: none;
    overflow-x: auto;
  }

  .gallery__thumb {
    width: 80px;
  }

  .gallery__thumb img {
    aspect-ratio: 80 / 80;
  }
}
</style>

<style>
/* Unscoped: these target AppModal internals, which render in a Teleport. */
.gallery-modal .modal__header {
  justify-content: center;
  text-align: center;
  position: relative;
}
.gallery-modal .modal__header .modal__close {
  position: absolute;
  right: 32px;
  top: 28px;
  background: #ededf2;
}
@media (max-width: 767px) {
  .gallery-modal .modal__header {
    justify-content: space-between;
    text-align: left;
  }
  .gallery-modal .modal__header .modal__close {
    position: static;
    width: 48px;
    height: 48px;
  }
}
</style>
