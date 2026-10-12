<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import heroImg from '@/assets/images/hero-buyback.webp'
import AppButton from '@/components/base/AppButton.vue'
import AppEmptyState from '@/components/base/AppEmptyState.vue'
import AppErrorState from '@/components/base/AppErrorState.vue'
import AppSkeleton from '@/components/base/AppSkeleton.vue'
import EstateCard from '@/components/estates/EstateCard.vue'
import FaqSection from '@/components/marketing/FaqSection.vue'
import HowItWorks from '@/components/marketing/HowItWorks.vue'
import ProductHero from '@/components/marketing/ProductHero.vue'
import WhySection from '@/components/marketing/WhySection.vue'
import { buybackService } from '@/services/api'
import { toApiError, type ApiError } from '@/services/http/errors'
import type { EstateSummary, PaginationMeta } from '@/types'

const steps = [
  { title: 'Secure Your Asset', text: 'Select your plot and tenure from one of our estates. Upon completing payment, you will receive your certified Deed of Purchase alongside a legally binding Corporate Buyback Guarantee.' },
  { title: 'Hold & Grow', text: 'Maintain your position across a fixed 12, 24, or 36-month timeline. Your future yield is fully locked from day one, entirely insulated from market volatility with zero ongoing management costs.' },
  { title: 'Collect Your Returns', text: 'At maturity, AMCOM repurchases the land at the pre-agreed price. Capital and accrued yields are paid directly into your designated bank account.' },
  { title: 'Earn & Review', text: 'Receive periodic portfolio updates throughout your tenure. At completion, collect your full capital plus accrued ROI, and share your experience by rating our service.' },
]

const reasons = [
  { icon: 'building' as const, title: 'Start Small, Earn Big', text: 'No need to buy an entire property. Invest in fractions of premium Nigerian estates and earn returns typically reserved for large-scale developers.' },
  { icon: 'shield' as const, title: 'Guaranteed Returns', text: 'Your returns are locked in from day one. No market surprises - just a clear, fixed yield you can count on throughout your investment period.' },
  { icon: 'refresh' as const, title: 'Flexible Exit Options', text: 'Cash out when your term matures, or roll your capital into the next opportunity. You stay in control of your money at every stage.' },
]

/* Estates load page by page ("Show more") — never the full catalogue at once. */
const estates = shallowRef<EstateSummary[]>([])
const meta = ref<PaginationMeta | null>(null)
const loading = ref(false)
const error = ref<ApiError | null>(null)

async function load(page = 1) {
  loading.value = true
  error.value = null
  try {
    const res = await buybackService.estates({ page, per_page: 3 })
    estates.value = page === 1 ? res.data : [...estates.value, ...res.data]
    meta.value = res.meta
  } catch (e) {
    error.value = toApiError(e)
  } finally {
    loading.value = false
  }
}
void load()
</script>

<template>
  <div>
    <ProductHero
      title="Invest in Land. Earn Up to 200% Returns."
      description="Secure your wealth with contract-backed, land-asset investments. Choose flexible holding periods of 12, 24, or 36 months — with guaranteed buyback terms and legally documented returns."
      :image="heroImg"
      image-alt="Naira notes being planted into a square of farmland"
      :image-width="560"
      :image-height="524"
      :card="{
        eyebrow: 'Guaranteed buyback',
        headline: '₦10M → ₦12M',
        stats: [
          { label: 'ROI yield', value: '20% Locked' },
          { label: 'Holding time', value: '12 Months' },
        ],
      }"
    >
      <template #actions>
        <AppButton to="#estates" size="lg" class="olive-btn">Explore Estates</AppButton>
        <AppButton to="#how-it-works" variant="link" class="olive-link">How Buyback works</AppButton>
      </template>
    </ProductHero>

    <HowItWorks :steps="steps" title-tone="ink" class="buyback-how" />

    <section id="estates" class="estates section" aria-labelledby="estates-title">
      <div class="container">
        <h2 id="estates-title" class="section-title estates__title">Available Estates</h2>

        <AppErrorState v-if="error && !estates.length" :error="error" class="estates__state" @retry="load(1)" />
        <AppEmptyState
          v-else-if="!loading && !estates.length"
          class="estates__state"
          icon="map-pin"
          title="No estates available right now"
          description="New estates are released regularly. Check back soon or contact us to join the waitlist."
        >
          <AppButton to="/contact" variant="outline">Join the waitlist</AppButton>
        </AppEmptyState>

        <ul v-else class="estates__grid" role="list">
          <li v-for="estate in estates" :key="estate.id"><EstateCard :estate="estate" /></li>
          <template v-if="loading">
            <li v-for="i in 3" :key="`s${i}`" class="estates__skeleton">
              <AppSkeleton height="240px" radius="12px" />
              <AppSkeleton :lines="3" />
            </li>
          </template>
        </ul>

        <div v-if="meta && meta.current_page < meta.last_page" class="estates__more">
          <AppButton variant="outline" :loading="loading" class="estates__more-btn" @click="load(meta.current_page + 1)">Show more</AppButton>
        </div>
      </div>
    </section>

    <WhySection title="Why Buy Back" :items="reasons" />
    <FaqSection product="buyback" />
  </div>
</template>

<style scoped>
.olive-btn {
  --btn-bg: var(--color-olive);
  --btn-border: var(--color-olive);
  --btn-bg-hover: #3f5622;
  border-radius: var(--radius-sm);
}

.olive-link {
  --btn-fg: var(--color-olive);
  font-weight: 600;
}

.estates__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 32px;
  margin-top: 44px;
}

.estates__skeleton {
  display: grid;
  gap: 12px;
}

.estates__state {
  margin-top: 44px;
}

.estates__more {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}

.estates__more-btn {
  min-width: 148px;
  min-height: 56px;
}

@media (max-width: 1023px) {
  .estates__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 767px) {
  .estates__title,
  .buyback-how :deep(.section-title) {
    font-family: var(--font-sans);
    font-weight: 500;
    font-size: var(--text-xl);
    color: var(--color-maroon);
  }

  .estates__grid {
    grid-template-columns: 1fr;
    gap: 16px;
    margin-top: 28px;
  }

  :deep(.phero__actions--mobile .olive-btn) {
    --btn-bg: var(--color-primary);
    --btn-border: var(--color-primary);
    --btn-bg-hover: var(--color-primary-hover);
  }
}
</style>
