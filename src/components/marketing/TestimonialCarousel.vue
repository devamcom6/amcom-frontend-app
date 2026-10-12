<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AppAvatar from '@/components/base/AppAvatar.vue'
import { useIsMobile } from '@/composables/useMediaQuery'
import type { Testimonial } from '@/types'

const props = defineProps<{ items: Testimonial[] }>()
const isMobile = useIsMobile()
const perView = computed(() => (isMobile.value ? 1 : 3))
const pages = computed(() => Math.max(1, Math.ceil(props.items.length / perView.value)))
const page = ref(0)
const visible = computed(() => props.items.slice(page.value * perView.value, page.value * perView.value + perView.value))

let timer: ReturnType<typeof setInterval> | undefined
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
function start() {
  if (reduced) return
  stop()
  timer = setInterval(() => (page.value = (page.value + 1) % pages.value), 7000)
}
function stop() {
  clearInterval(timer)
}
onMounted(start)
onBeforeUnmount(stop)
</script>

<template>
  <div class="carousel" aria-roledescription="carousel" @mouseenter="stop" @mouseleave="start" @focusin="stop">
    <Transition name="fade" mode="out-in">
      <ul :key="`${page}-${perView}`" class="carousel__track" role="list" aria-live="polite">
        <li v-for="t in visible" :key="t.id" class="carousel__card">
          <blockquote class="carousel__quote">“{{ t.quote }}”</blockquote>
          <figure class="carousel__author">
            <AppAvatar :name="t.author_name" :media="t.avatar" :size="64" />
            <figcaption>
              <span class="carousel__name">{{ t.author_name }}</span>
              <span class="carousel__role">{{ t.author_title }}</span>
            </figcaption>
          </figure>
        </li>
      </ul>
    </Transition>
    <div class="carousel__dots" role="tablist" aria-label="Choose testimonials">
      <button
        v-for="i in pages"
        :key="i"
        type="button"
        role="tab"
        class="carousel__dot"
        :class="{ 'is-active': page === i - 1 }"
        :aria-selected="page === i - 1"
        :aria-label="`Show testimonials ${i} of ${pages}`"
        @click="page = i - 1"
      />
    </div>
  </div>
</template>

<style scoped>
.carousel__track {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.carousel__card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 24px;
  padding: 16px 16px 16px;
  border-radius: var(--radius-md);
  background: var(--color-bg);
}

.carousel__quote {
  margin: 0;
  font-size: var(--text-base);
  line-height: 1.5;
  text-align: justify;
  letter-spacing: 0.01em;
  color: var(--color-body);
}

.carousel__author {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
}

.carousel__author figcaption {
  display: flex;
  flex-direction: column;
}

.carousel__name {
  font-size: var(--text-base);
  color: var(--color-maroon);
}

.carousel__role {
  font-size: var(--text-xs);
  color: var(--color-body);
}

.carousel__dots {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 24px;
}

.carousel__dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #c7c9c9;
  transition: background-color var(--duration) var(--ease);
}

.carousel__dot.is-active {
  background: #6bb613;
}

@media (max-width: 767px) {
  .carousel__track {
    grid-template-columns: 1fr;
  }
  .carousel__card {
    padding: 24px;
    border-radius: var(--radius-lg);
  }
  .carousel__quote {
    text-align: left;
  }
}
</style>
