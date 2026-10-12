<script setup lang="ts">
import FloatingStatCard from './FloatingStatCard.vue'

/**
 * Split hero used on Buyback, Capital Investment and Property Management pages:
 * headline + copy + CTAs on the left, rounded image with a floating stat card on the right.
 * On mobile the image sits between copy and full-width CTAs (per mobile designs).
 */
defineProps<{
  title: string
  description: string
  image: string
  imageAlt: string
  imageWidth: number
  imageHeight: number
  card: { eyebrow: string; headline: string; stats: { label: string; value: string }[] }
}>()
</script>

<template>
  <section class="phero">
    <div class="phero__inner container">
      <div class="phero__copy">
        <h1 class="phero__title display">{{ title }}</h1>
        <p class="phero__text">{{ description }}</p>
        <div class="phero__actions hide-mobile"><slot name="actions" /></div>
      </div>
      <div class="phero__visual">
        <img
          class="phero__image"
          :src="image"
          :alt="imageAlt"
          :width="imageWidth"
          :height="imageHeight"
          fetchpriority="high"
          decoding="async"
        />
        <FloatingStatCard class="phero__card" v-bind="card" />
      </div>
      <div class="phero__actions phero__actions--mobile hide-desktop"><slot name="actions" /></div>
    </div>
  </section>
</template>

<style scoped>
.phero {
  padding: 80px 0;
}

.phero__inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 560px);
  align-items: center;
  gap: 64px;
}

.phero__copy {
  padding-left: 16px;
}

.phero__title {
  font-size: clamp(2.25rem, 1.4rem + 2.8vw, 3.6rem);
  line-height: 1.12;
  color: var(--color-ink);
}

.phero__text {
  margin-top: 24px;
  max-width: 620px;
  font-size: var(--text-md);
  line-height: 1.55;
  color: var(--color-body);
}

.phero__actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px 40px;
  margin-top: 36px;
}

.phero__visual {
  position: relative;
}

.phero__image {
  width: 100%;
  height: auto;
  aspect-ratio: 560 / 524;
  object-fit: cover;
  border-radius: 40px 40px 40px 40px;
  border-top-right-radius: 40px;
  border-bottom-left-radius: 40px;
}

.phero__card {
  position: absolute;
  right: -40px;
  bottom: -16px;
}

@media (max-width: 1100px) {
  .phero__card {
    right: 16px;
  }
}

@media (max-width: 899px) {
  .phero {
    padding: 48px 0 40px;
  }

  .phero__inner {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .phero__copy {
    padding-left: 0;
  }

  .phero__title {
    font-size: 1.85rem;
    line-height: 1.2;
  }

  .phero__text {
    margin-top: 12px;
    font-size: var(--text-sm);
  }

  .phero__image {
    border-radius: 32px;
    aspect-ratio: 370 / 320;
  }

  .phero__card {
    left: 100px;
    right: 10px;
    bottom: 10px;
  }

  .phero__actions--mobile {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
    margin-top: 0;
  }

  .phero__actions--mobile :deep(.btn--primary) {
    min-height: 56px;
  }
}
</style>
