<script setup lang="ts">
import AppSkeleton from '@/components/base/AppSkeleton.vue'
import { COMPANY } from '@/constants/site'

defineProps<{ stats?: { value: string; label: string }[]; loading?: boolean; headingLevel?: 'h1' | 'h2' }>()
</script>

<template>
  <section class="about section" aria-labelledby="about-title">
    <div class="container about__inner">
      <div class="about__copy">
        <component :is="headingLevel ?? 'h2'" id="about-title" class="about__title display">About Amcom</component>
        <p class="about__text">
          As a proud member of the prestigious {{ COMPANY.parentGroup }}, Amcom brings decades of collective heritage, institutional
          strength, and unmatched expertise to the modern real estate landscape. Our specialized focus spans premier property
          development, strategic real estate investment, and world-class management designed to secure legacy wealth for our clients.
        </p>
        <slot />
      </div>
      <dl class="about__stats">
        <template v-if="loading && !stats">
          <div v-for="i in 4" :key="i" class="about__stat"><AppSkeleton height="40px" width="60%" /><AppSkeleton width="70%" /></div>
        </template>
        <div v-for="s in stats" :key="s.label" class="about__stat">
          <dt class="sr-only">{{ s.label }}</dt>
          <dd class="about__value">{{ s.value }}</dd>
          <dd class="about__label">{{ s.label }}</dd>
        </div>
      </dl>
    </div>
  </section>
</template>

<style scoped>
.about {
  padding-block: 80px;
}

.about__inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 506px);
  align-items: center;
  gap: 96px;
  padding-inline: calc(var(--gutter) + 16px);
}

.about__title {
  font-size: clamp(1.6rem, 1rem + 2vw, 2.75rem);
}

.about__text {
  margin-top: 28px;
  font-size: var(--text-base);
  line-height: 1.65;
  letter-spacing: 0.01em;
  color: var(--color-body);
}

.about__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px 26px;
  margin: 0;
}

.about__stat {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 26px 22px 24px;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-lg);
}

.about__value {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 2.75rem;
  line-height: 1;
  color: var(--color-maroon);
}

.about__label {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-ink);
}

@media (max-width: 899px) {
  .about {
    padding-block: 32px 48px;
  }

  .about__inner {
    grid-template-columns: 1fr;
    gap: 32px;
    padding-inline: var(--gutter);
  }

  .about__title {
    font-family: var(--font-sans);
    font-weight: 600;
    font-size: var(--text-xl);
    color: #1c2a0c;
  }

  .about__text {
    margin-top: 16px;
    line-height: 1.7;
  }

  .about__stats {
    gap: 22px 26px;
  }

  .about__stat {
    padding: 28px 22px 24px;
    gap: 14px;
  }
}
</style>
