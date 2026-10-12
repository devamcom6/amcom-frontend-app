<script setup lang="ts">
import AboutSection from '@/components/marketing/AboutSection.vue'
import CtaBanner from '@/components/marketing/CtaBanner.vue'
import TestimonialCarousel from '@/components/marketing/TestimonialCarousel.vue'
import WhySection from '@/components/marketing/WhySection.vue'
import { useAsync } from '@/composables/useAsync'
import { contentService } from '@/services/api'

const { data: content, loading } = useAsync(() => contentService.home())

const pillars = [
  { icon: 'shield' as const, title: 'Institutional strength', text: 'Backed by the Houvincity Group, every product we offer is underwritten by real, titled land assets on our balance sheet.' },
  { icon: 'badge-check' as const, title: 'Verified, end to end', text: 'From estates to listings, our team inspects every property and reviews every title before it reaches you.' },
  { icon: 'users' as const, title: 'People first', text: 'Dedicated agents guide you from first enquiry to payout, with every document available in your dashboard.' },
]
</script>

<template>
  <div>
    <AboutSection heading-level="h1" :stats="content?.stats" :loading="loading" />
    <WhySection title="What we stand for" :items="pillars" tone="maroon" />
    <section id="insights" class="section" aria-labelledby="voices-title">
      <div class="container">
        <h2 id="voices-title" class="section-title">Our happy investors</h2>
        <div class="voices">
          <TestimonialCarousel v-if="content?.testimonials.length" :items="content.testimonials" />
        </div>
      </div>
    </section>
    <CtaBanner
      title="Start Building Your Real Estate Portfolio Today"
      :primary="{ label: 'Get Started', to: '/register' }"
      :secondary="{ label: 'Contact Us', to: '/contact' }"
    />
  </div>
</template>

<style scoped>
.voices {
  margin-top: 40px;
  padding: 24px;
  border-radius: var(--radius-lg);
  background: var(--color-section);
}
</style>
