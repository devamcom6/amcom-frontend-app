<script setup lang="ts">
import heroImg from '@/assets/images/hero-home.webp'
import heroMobileImg from '@/assets/images/hero-home-mobile.webp'
import productBuyback from '@/assets/images/product-buyback.webp'
import productCapital from '@/assets/images/product-capital.webp'
import productProperty from '@/assets/images/product-property.webp'
import AppButton from '@/components/base/AppButton.vue'
import AppSkeleton from '@/components/base/AppSkeleton.vue'
import AboutSection from '@/components/marketing/AboutSection.vue'
import CtaBanner from '@/components/marketing/CtaBanner.vue'
import ProductShowcase, { type ShowcaseItem } from '@/components/marketing/ProductShowcase.vue'
import TestimonialCarousel from '@/components/marketing/TestimonialCarousel.vue'
import { useAsync } from '@/composables/useAsync'
import { contentService } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const { data: content, loading } = useAsync(() => contentService.home())

const products: ShowcaseItem[] = [
  {
    title: 'Buyback',
    text: 'Purchase a plot with an agreed repurchase window and a fixed return stated up front. Terms are set at signing and are non-negotiable — your capital is protected from day one.',
    image: productBuyback,
    imageAlt: 'Naira notes being planted into a square of farmland',
    actions: [{ label: 'How Buyback works', to: '/buyback#how-it-works', variant: 'outline' }],
  },
  {
    title: 'Capital Investment',
    text: 'Invest capital for a fixed term and receive interest derived from land appreciation. Two durations available, both with the return percentage locked in at the point of entry.',
    image: productCapital,
    imageAlt: 'Seedlings growing from stacks of coins',
    actions: [{ label: 'Start Investing', to: '/capital-investment', variant: 'outline' }],
  },
  {
    title: 'Property Management',
    text: "Register a property, whether you're selling, renting, or leasing — Amcom takes it from there. Or browse Amcom-verified listings to find your next home or investment.",
    image: productProperty,
    imageAlt: 'Modern stone-clad villa with landscaped garden',
    actions: [
      { label: 'Register your property', to: '/list-property', variant: 'outline' },
      { label: 'Browse Listings', to: '/properties', variant: 'link' },
    ],
  },
]
</script>

<template>
  <div>
    <section class="hero" aria-labelledby="hero-title">
      <picture class="hero__bg hide-desktop" aria-hidden="true">
        <img :src="heroMobileImg" alt="" width="600" height="560" fetchpriority="high" decoding="async" />
      </picture>
      <div class="hero__inner container">
        <div class="hero__copy">
          <p class="hero__eyebrow eyebrow">Your trusted real estate partner</p>
          <h1 id="hero-title" class="hero__title display">
            <span class="hide-mobile">Invest. Earn.<br />Own Property.</span>
            <span class="hide-desktop">Invest, Earn,<br />Own Property.</span>
          </h1>
          <p class="hero__text">
            Invest in vetted real estate with guaranteed buyback terms and up to 30% annual returns. We handle everything — you earn.
          </p>
          <div class="hero__actions">
            <AppButton :to="auth.isAuthenticated ? '/buyback' : '/register'" class="hero__primary">Start Investing</AppButton>
            <AppButton variant="ghost" to="#products" class="hero__secondary hide-mobile">Explore Products</AppButton>
          </div>
        </div>
        <div class="hero__visual hide-mobile">
          <img
            :src="heroImg"
            alt="Terraced concrete residences overflowing with tropical plants. Live returns: ₦10M grows to ₦12M — annual yield up to 30%, 12-month holding time."
            width="672"
            height="806"
            fetchpriority="high"
            decoding="async"
          />
        </div>
      </div>
    </section>

    <div id="products">
      <ProductShowcase :items="products" />
    </div>

    <AboutSection :stats="content?.stats" :loading="loading" />

    <section class="testimonials section section--grey" aria-labelledby="testimonials-title">
      <div class="container">
        <h2 id="testimonials-title" class="section-title testimonials__title">Our happy investors</h2>
        <div class="testimonials__body">
          <div v-if="loading && !content" class="testimonials__loading">
            <AppSkeleton v-for="i in 3" :key="i" height="210px" radius="var(--radius-md)" />
          </div>
          <TestimonialCarousel v-else-if="content?.testimonials.length" :items="content.testimonials" />
        </div>
      </div>
    </section>

    <CtaBanner
      title="Start Building Your Real Estate Portfolio Today"
      :primary="{ label: 'Get Started', to: auth.isAuthenticated ? '/dashboard' : '/register' }"
      :secondary="{ label: 'Contact Us', to: '/contact' }"
    />
  </div>
</template>

<style scoped>
.hero {
  position: relative;
  background: linear-gradient(110deg, #eaf4ff 0%, #f5faff 35%, #ffffff 65%);
  overflow: hidden;
}

.hero__inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 600px);
  align-items: center;
  min-height: 830px;
  padding-right: 0;
}

.hero__copy {
  padding: 64px 0 64px 16px;
}

.hero__eyebrow {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: var(--text-sm);
  letter-spacing: 0.12em;
}

.hero__eyebrow::after {
  content: '';
  width: 40px;
  height: 1px;
  background: #c3cbd1;
}

.hero__title {
  margin-top: 16px;
  font-size: clamp(2.5rem, 1.4rem + 3.6vw, 4.6rem);
  line-height: 1.08;
  letter-spacing: -0.02em;
}

.hero__text {
  max-width: 560px;
  margin-top: 28px;
  font-size: var(--text-md);
  line-height: 1.55;
  color: var(--color-body);
}

.hero__actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 44px;
  padding: 6px;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
}

.hero__primary {
  font-weight: 600;
}

.hero__secondary {
  font-weight: 400;
}

.hero__visual {
  align-self: stretch;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-right: calc(var(--gutter) * -1);
}

.hero__visual img {
  width: 100%;
  max-width: 672px;
  height: auto;
}

@media (max-width: 1279px) {
  .hero__visual {
    margin-right: 0;
  }
}

@media (max-width: 767px) {
  .hero {
    min-height: 500px;
    background: #2b3a2e;
  }

  .hero__bg img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .hero__inner {
    position: relative;
    grid-template-columns: 1fr;
    min-height: 500px;
    padding-right: var(--gutter);
  }

  .hero__copy {
    padding: 0;
    color: var(--color-inverse);
  }

  .hero__eyebrow {
    position: relative;
    padding: 12px 16px 0;
    font-size: 11px;
    letter-spacing: 0.08em;
    color: rgba(255, 255, 255, 0.4);
  }

  .hero__title,
  .hero__text {
    position: relative;
  }

  .hero__copy::before {
    content: '';
    position: absolute;
    inset: 120px var(--gutter) auto;
    height: 215px;
    border-radius: var(--radius-lg);
    background: rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(2px);
  }

  .hero__title {
    margin-top: 12px;
    padding: 0 16px;
    font-family: var(--font-sans);
    font-weight: 600;
    font-size: 2rem;
    line-height: 1.15;
    color: var(--color-inverse);
    letter-spacing: 0;
  }

  .hero__text {
    margin-top: 12px;
    padding: 0 16px;
    font-size: var(--text-base);
    color: var(--color-inverse);
  }

  .hero__actions {
    margin: 40px 16px 0;
    padding: 0;
    background: transparent;
    box-shadow: none;
  }

  .hero__primary {
    min-height: 56px;
    padding: 0 24px;
    border-radius: var(--radius-md);
  }
}

.testimonials__title {
  color: var(--color-ink);
}

.testimonials__body {
  margin-top: 48px;
}

.testimonials__loading {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

@media (max-width: 767px) {
  .testimonials__title {
    color: var(--color-maroon);
    font-size: var(--text-xl);
  }

  .testimonials__body {
    margin-top: 32px;
  }

  .testimonials__loading {
    grid-template-columns: 1fr;
  }
}
</style>
