<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import AppButton from '@/components/base/AppButton.vue'

export interface ShowcaseItem {
  title: string
  text: string
  image: string
  imageAlt: string
  actions: { label: string; to: RouteLocationRaw; variant: 'outline' | 'link' }[]
}

/** "Explore Our Products" — alternating image/text cards; stacked image-on-top cards on mobile. */
defineProps<{ items: ShowcaseItem[] }>()
</script>

<template>
  <section class="showcase section section--grey" aria-labelledby="showcase-title">
    <div class="container">
      <h2 id="showcase-title" class="section-title showcase__title">
        <span class="hide-mobile">Explore Our Products</span>
        <span class="hide-desktop">Explore Our Services</span>
      </h2>
      <ul class="showcase__list" role="list">
        <li v-for="(item, i) in items" :key="item.title" class="showcase__card" :class="{ 'is-reversed': i % 2 === 1 }">
          <div class="showcase__copy">
            <h3 class="showcase__card-title">{{ item.title }}</h3>
            <p class="showcase__text">{{ item.text }}</p>
            <div class="showcase__actions">
              <AppButton
                v-for="a in item.actions"
                :key="a.label"
                :to="a.to"
                :variant="a.variant"
                size="sm"
                :class="{ 'showcase__link': a.variant === 'link' }"
              >
                {{ a.label }}
              </AppButton>
            </div>
          </div>
          <img class="showcase__image" :src="item.image" :alt="item.imageAlt" width="607" height="368" loading="lazy" decoding="async" />
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.showcase__list {
  display: grid;
  gap: 32px;
  margin-top: 44px;
}

.showcase__card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 607px);
  align-items: stretch;
  min-height: 368px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  overflow: hidden;
}

.showcase__card.is-reversed {
  grid-template-columns: minmax(0, 607px) minmax(0, 1fr);
}

.showcase__card.is-reversed .showcase__image {
  order: -1;
}

.showcase__copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 48px 64px;
}

.showcase__card-title {
  font-family: var(--font-serif);
  font-size: 1.75rem;
  font-weight: 400;
  color: var(--color-ink);
}

.showcase__text {
  margin-top: 28px;
  font-size: var(--text-md);
  line-height: 1.35;
  letter-spacing: 0.02em;
  color: var(--color-ink);
}

.showcase__actions {
  display: flex;
  align-items: center;
  gap: 28px;
  margin-top: 32px;
}

.showcase__actions :deep(.btn--outline) {
  font-weight: 600;
}

.showcase__link {
  text-decoration: underline;
  text-underline-offset: 3px;
  font-weight: 600;
}

.showcase__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 1023px) {
  .showcase__copy {
    padding: 32px;
  }
}

@media (max-width: 767px) {
  .showcase {
    border-radius: 0 0 24px 24px;
    padding-top: 48px;
  }

  .showcase__title {
    font-family: var(--font-sans);
    font-weight: 600;
    font-size: var(--text-xl);
    color: var(--color-maroon);
  }

  .showcase__list {
    gap: 24px;
    margin-top: 32px;
  }

  .showcase__card,
  .showcase__card.is-reversed {
    grid-template-columns: 1fr;
    min-height: 0;
  }

  .showcase__card .showcase__image,
  .showcase__card.is-reversed .showcase__image {
    order: -1;
    aspect-ratio: 370 / 220;
    height: auto;
  }

  .showcase__copy {
    padding: 20px 16px 16px;
  }

  .showcase__card-title {
    font-family: var(--font-sans);
    font-size: var(--text-lg);
    font-weight: 500;
  }

  .showcase__text {
    margin-top: 12px;
    font-size: var(--text-base);
    line-height: 1.5;
    letter-spacing: 0;
    color: var(--color-body);
  }

  .showcase__actions {
    margin-top: 20px;
    justify-content: space-between;
  }
}
</style>
