<script setup lang="ts">
import heroImg from '@/assets/images/hero-property.webp'
import pathFind from '@/assets/images/path-find.webp'
import pathList from '@/assets/images/path-list.webp'
import AppButton from '@/components/base/AppButton.vue'
import AppErrorState from '@/components/base/AppErrorState.vue'
import AppSkeleton from '@/components/base/AppSkeleton.vue'
import CtaBanner from '@/components/marketing/CtaBanner.vue'
import FaqSection from '@/components/marketing/FaqSection.vue'
import HowItWorks from '@/components/marketing/HowItWorks.vue'
import ProductHero from '@/components/marketing/ProductHero.vue'
import WhySection from '@/components/marketing/WhySection.vue'
import PropertyCard from '@/components/properties/PropertyCard.vue'
import { useAsync } from '@/composables/useAsync'
import { propertyService } from '@/services/api'

const { data: featured, loading, error, execute } = useAsync(() => propertyService.featured())

const paths = [
  {
    title: 'Looking for a Property?',
    text: 'Browse verified listings across Nigeria. Whether you want to rent, lease, or buy filter by location, budget, and type to find your perfect match.',
    cta: 'Browse Properties',
    to: '/properties',
    image: pathFind,
    alt: 'Apartment blocks at sunset',
  },
  {
    title: 'Have a Property to List?',
    text: 'Register your property in minutes, pay a one-time listing fee, and let our team handle the rest - from inspection to finding qualified buyers or tenants.',
    cta: 'List Your Property',
    to: '/list-property',
    image: pathList,
    alt: 'Modern two-storey house with palm trees',
  },
]

const steps = [
  { title: 'Register Your Property', text: 'Fill in your property details - location, type, size, asking price or rent. Upload photos to attract the right buyers or tenants.' },
  { title: 'Pay Registration Fee', text: 'A one-time flat fee covers inspection, verification, and marketing. No hidden charges, no commission on sale.' },
  { title: 'We Inspect & Verify', text: "Our team visits the property, verifies the details, and prepares it for listing. You'll receive the outcome via email." },
  { title: 'We Find Your Match', text: 'Once approved, your property goes live. Our agents actively market it and connect you with serious buyers or tenants.' },
]

const reasons = [
  { icon: 'shield' as const, title: 'Verified Listings', text: 'Every property is physically inspected and verified by our team before it goes live. No surprises, no fake listings.' },
  { icon: 'building' as const, title: 'End-to-End Support', text: 'From listing to closing, our agents handle inspections, negotiations, paperwork, and handover. You focus on the decision.' },
  { icon: 'refresh' as const, title: 'Transparent Pricing', text: 'One flat registration fee for sellers. Clear pricing for buyers and renters. No hidden commissions eating into your value.' },
]
</script>

<template>
  <div>
    <ProductHero
      title="Buy, Rent, Sell or Lease - All in One Place"
      description="Whether you're looking for your next home or listing a property for the market, we make it seamless, secure, and stress-free."
      :image="heroImg"
      image-alt="Modern stone-clad villa with landscaped garden"
      :image-width="560"
      :image-height="524"
      :card="{
        eyebrow: 'Property management stats',
        headline: '500+ Properties',
        stats: [
          { label: 'Active listings', value: '500+' },
          { label: 'Locations', value: 'Lagos & Abuja' },
          { label: 'Response time', value: '24 Hours' },
        ],
      }"
    >
      <template #actions>
        <AppButton to="/properties" size="lg" class="olive-btn">Find a Property</AppButton>
        <AppButton to="/list-property" variant="link" class="olive-link">List Your Property</AppButton>
      </template>
    </ProductHero>

    <section class="paths section" aria-labelledby="paths-title">
      <div class="container">
        <h2 id="paths-title" class="section-title section-title--forest">One Platform. Two Paths.</h2>
        <div class="paths__grid">
          <article v-for="p in paths" :key="p.title" class="path">
            <img :src="p.image" :alt="p.alt" width="640" height="336" loading="lazy" decoding="async" class="path__image" />
            <div class="path__body">
              <h3 class="path__title">{{ p.title }}</h3>
              <p class="path__text">{{ p.text }}</p>
              <AppButton :to="p.to" variant="outline" class="path__btn">{{ p.cta }}</AppButton>
            </div>
          </article>
        </div>
      </div>
    </section>

    <HowItWorks title="How listing works" :steps="steps" title-tone="maroon" />

    <section class="featured section" aria-labelledby="featured-title">
      <div class="container">
        <h2 id="featured-title" class="featured__title">Featured Properties</h2>
        <p class="featured__lead">Hand-picked listings available now</p>
        <div v-if="loading && !featured" class="featured__grid">
          <AppSkeleton v-for="i in 3" :key="i" height="360px" radius="12px" />
        </div>
        <AppErrorState v-else-if="error" :error="error" class="featured__state" @retry="execute" />
        <ul v-else class="featured__grid" role="list">
          <li v-for="p in featured?.slice(0, 3)" :key="p.id"><PropertyCard :property="p" /></li>
        </ul>
        <div class="featured__more">
          <AppButton to="/properties" variant="secondary" icon-right="arrow-right" class="featured__more-btn">View all properties</AppButton>
        </div>
      </div>
    </section>

    <WhySection title="Why Amcom Property Management" :items="reasons" tone="maroon" />
    <FaqSection product="property_management" />
    <CtaBanner
      title="Ready to Get Started?"
      text="Explore thousands of premium property listings, or list your asset today for instant marketplace visibility."
      tone="forest"
      :primary="{ label: 'Find a Property', to: '/properties' }"
      :secondary="{ label: 'List Your Property', to: '/list-property' }"
    />
  </div>
</template>

<style scoped>
.olive-btn {
  --btn-bg: var(--color-olive);
  --btn-border: var(--color-olive);
  --btn-bg-hover: #3f5622;
}

.olive-link {
  --btn-fg: var(--color-olive);
  font-weight: 600;
}

.paths__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 32px;
  margin-top: 48px;
}

.path {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.path__image {
  width: 100%;
  aspect-ratio: 640 / 336;
  object-fit: cover;
}

.path__body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
  padding: 28px 24px 24px;
}

.path__title {
  font-size: var(--text-xl);
  font-weight: 500;
}

.path__text {
  line-height: 1.6;
  color: var(--color-body);
}

.path__btn {
  --btn-fg: var(--color-olive);
  --btn-border: var(--color-olive);
  margin-top: 10px;
}

.featured__title {
  text-align: center;
  font-size: var(--text-2xl);
  font-weight: 400;
  color: #1c2a0c;
}

.featured__lead {
  margin-top: 12px;
  text-align: center;
  font-size: var(--text-xl);
  color: var(--color-body);
}

.featured__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  margin-top: 40px;
}

.featured__state {
  margin-top: 40px;
}

.featured__more {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}

.featured__more-btn {
  --btn-border: var(--color-maroon);
  --btn-fg: var(--color-maroon);
  min-width: 200px;
}

@media (max-width: 1023px) {
  .featured__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 767px) {
  .paths__grid,
  .featured__grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .path__body {
    padding: 20px 24px 24px;
  }

  .featured__lead {
    font-size: var(--text-lg);
  }

  :deep(.phero__actions--mobile .olive-btn) {
    min-height: 56px;
  }
}
</style>
