<script setup lang="ts">
import { computed } from 'vue'
import heroImg from '@/assets/images/hero-capital.webp'
import AppButton from '@/components/base/AppButton.vue'
import AppErrorState from '@/components/base/AppErrorState.vue'
import AppSkeleton from '@/components/base/AppSkeleton.vue'
import FaqSection from '@/components/marketing/FaqSection.vue'
import HowItWorks from '@/components/marketing/HowItWorks.vue'
import ProductHero from '@/components/marketing/ProductHero.vue'
import WhySection from '@/components/marketing/WhySection.vue'
import { useAsync } from '@/composables/useAsync'
import { capitalService } from '@/services/api'
import { formatNaira } from '@/utils/format'

const { data: plan, loading, error, execute } = useAsync(() => capitalService.plan())

const tenures = computed(() => plan.value?.tenures ?? [])
const rows = computed(() =>
  (plan.value?.pricing_examples ?? []).map((amount) => ({
    amount,
    returns: tenures.value.map((t) => Math.round(amount * (1 + t.roi_percent / 100))),
  })),
)

const steps = computed(() => {
  const min = plan.value ? formatNaira(plan.value.min_amount) : '₦1,000,000'
  const tenureText = tenures.value.length
    ? tenures.value.map((t) => `${t.months} months at ${t.roi_percent}%`).join(', or ')
    : '6 months at 18% return, or 12 months at 27%'
  return [
    { title: 'Choose Your Amount', text: `Decide how much you'd like to invest. The minimum is ${min} - no upper limit. The more you invest, the more you earn.` },
    { title: 'Pick Your Tenure', text: `${tenureText} return. Short-term gains or longer-term growth - you decide.` },
    { title: 'Sign & Pay', text: 'Review your investment summary, sign your agreement digitally, and make your one-time payment. Done in minutes.' },
    { title: 'Collect Your Returns', text: 'At maturity, receive your full capital plus your guaranteed return. Paid directly to your designated bank account.' },
  ]
})

const reasons = [
  { icon: 'percent' as const, title: 'Guaranteed Returns', text: 'Your return is locked the moment you sign. 18% at 6 months or 27% at 12 months - no market fluctuations, no uncertainty.' },
  { icon: 'landmark' as const, title: 'Land-Backed Security', text: 'Every Naira you invest is backed by appreciating land assets. Your capital is protected by real, tangible value.' },
  { icon: 'check-circle' as const, title: 'Zero Hassle', text: 'No property to manage, no tenants, no maintenance. Just invest and earn. We handle everything else.' },
]
</script>

<template>
  <div>
    <ProductHero
      title="Grow Your Wealth with Real Estate-Backed Returns."
      description="Invest from ₦500,000 and earn between 15%–30% annual returns on real estate-backed funds. Your capital is secured, liquid, and backed by titled property documents."
      :image="heroImg"
      image-alt="Seedlings growing from stacks of gold coins"
      :image-width="560"
      :image-height="524"
      :card="{
        eyebrow: 'Active investment',
        headline: '₦5M → ₦6.5M',
        stats: [
          { label: 'Annual return', value: '15%–30%' },
          { label: 'Min. entry', value: plan ? formatNaira(plan.min_amount) : '₦500,000' },
        ],
      }"
    >
      <template #actions>
        <AppButton to="/capital-investment/invest" size="lg">Start Investing</AppButton>
        <AppButton to="#how-it-works" variant="link" class="link-strong">See How It Works</AppButton>
      </template>
    </ProductHero>

    <HowItWorks :steps="steps" title-tone="maroon" />

    <section class="pricing section" aria-labelledby="pricing-title">
      <div class="container">
        <h2 id="pricing-title" class="section-title section-title--maroon">Pricing Plan</h2>
        <p class="pricing__lead">See exactly what you'll earn. No hidden fees, no surprises.</p>

        <div v-if="loading && !plan" class="pricing__table-wrap"><AppSkeleton :lines="6" height="40px" /></div>
        <AppErrorState v-else-if="error" :error="error" class="pricing__table-wrap" @retry="execute" />
        <div v-else-if="plan" class="pricing__table-wrap" role="region" aria-label="Pricing plan" tabindex="0">
          <table class="pricing__table">
            <caption class="sr-only">Projected payout by investment amount and tenure</caption>
            <thead>
              <tr>
                <th scope="col">Investment Amount</th>
                <th v-for="t in tenures" :key="t.months" scope="col">{{ t.months }} Months ({{ t.roi_percent }}%)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row.amount">
                <th scope="row">{{ formatNaira(row.amount) }}</th>
                <td v-for="(value, i) in row.returns" :key="i">{{ formatNaira(value) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="plan" class="pricing__note">
          Minimum investment: {{ formatNaira(plan.min_amount) }}. For investments above {{ formatNaira(plan.max_self_serve_amount) }}, contact our
          investment team directly.
        </p>
        <div class="pricing__cta">
          <AppButton to="/capital-investment/invest" size="lg" class="pricing__btn">Start Investing</AppButton>
        </div>
      </div>
    </section>

    <WhySection title="Why Capital Investment" :items="reasons" tone="maroon" />
    <FaqSection product="capital_investment" />
  </div>
</template>

<style scoped>
.link-strong {
  font-weight: 600;
}

.pricing__lead {
  margin-top: 18px;
  text-align: center;
  color: var(--color-body);
}

.pricing__table-wrap {
  max-width: 996px;
  margin: 48px auto 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow-x: auto;
}

.pricing__table {
  min-width: 360px;
  font-variant-numeric: tabular-nums;
}

.pricing__table th,
.pricing__table td {
  padding: 20px 24px;
  text-align: left;
  font-size: var(--text-base);
}

.pricing__table thead th {
  padding: 16px 24px;
  background: var(--color-quote);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-body);
}

.pricing__table tbody th,
.pricing__table tbody td {
  font-weight: 500;
  color: var(--color-ink);
  border-top: 1px solid var(--color-border);
}

.pricing__table tbody tr:nth-child(even) {
  background: var(--color-section);
}

.pricing__note {
  margin-top: 40px;
  font-size: var(--text-sm);
  text-align: center;
  color: var(--color-body);
}

.pricing__cta {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

@media (max-width: 767px) {
  .pricing :deep(.section-title) {
    font-family: var(--font-sans);
    font-size: var(--text-xl);
    font-weight: 400;
  }

  .pricing__lead {
    font-size: var(--text-sm);
  }

  .pricing__table-wrap {
    margin-top: 32px;
  }

  .pricing__table th,
  .pricing__table td,
  .pricing__table thead th {
    padding: 14px 10px;
    font-size: var(--text-sm);
  }

  .pricing__table tbody td {
    font-weight: 400;
  }

  .pricing__table tbody th {
    font-weight: 700;
  }

  .pricing__note {
    margin-top: 20px;
  }

  .pricing__btn {
    width: 100%;
    min-height: 56px;
  }
}
</style>
