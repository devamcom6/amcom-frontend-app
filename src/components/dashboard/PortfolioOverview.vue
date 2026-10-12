<script setup lang="ts">
import { computed } from 'vue'
import AppButton from '@/components/base/AppButton.vue'
import AppEmptyState from '@/components/base/AppEmptyState.vue'
import AppErrorState from '@/components/base/AppErrorState.vue'
import AppSkeleton from '@/components/base/AppSkeleton.vue'
import type { ApiError } from '@/services/http/errors'
import type { BuybackPosition, CapitalPosition, PortfolioOverview } from '@/types'
import { formatDate, formatNaira, pluralize } from '@/utils/format'
import MetricCard from './MetricCard.vue'
import PositionCard from './PositionCard.vue'

const props = defineProps<{
  data: PortfolioOverview<CapitalPosition | BuybackPosition> | undefined
  loading: boolean
  error: ApiError | null
  product: 'capital' | 'buyback'
}>()
const emit = defineEmits<{ retry: [] }>()

const s = computed(() => props.data?.summary)
const metrics = computed(() => {
  const sum = s.value
  return [
    { label: 'Total INVESTED', value: formatNaira(sum?.total_invested ?? 0), caption: pluralize(sum?.active_positions ?? 0, 'Active Position'), icon: 'wallet' as const, accent: true },
    {
      label: 'Projected Profit',
      value: formatNaira(sum?.projected_profit ?? 0),
      caption: `${sum?.active_positions ? '+' : ''}${sum?.average_roi_percent ?? 0}% Fixed ${props.product === 'capital' ? 'Annual Yield' : 'Buyback Yield'}`,
    },
    { label: 'Total expected payout', value: formatNaira(sum?.total_expected_payout ?? 0), caption: sum?.active_positions ? 'Principal + Interest Payout' : 'No Payout Yet' },
    {
      label: 'Next Maturity DATE',
      value: sum?.next_maturity_date ? formatDate(sum.next_maturity_date) : '—',
      caption: sum?.days_to_next_maturity ? `in ${sum.days_to_next_maturity} days` : 'No upcoming payouts',
    },
  ]
})

const routeName = computed(() => (props.product === 'capital' ? 'dashboard-capital-position' : 'dashboard-buyback-position'))
</script>

<template>
  <div class="portfolio">
    <AppErrorState v-if="error && !data" :error="error" @retry="emit('retry')" />
    <template v-else>
      <section class="portfolio__metrics" aria-label="Portfolio summary">
        <template v-if="loading && !data">
          <AppSkeleton v-for="i in 4" :key="i" height="132px" radius="12px" />
        </template>
        <MetricCard v-for="m in metrics" v-else :key="m.label" v-bind="m" />
      </section>

      <section aria-labelledby="positions-title">
        <h2 id="positions-title" class="portfolio__title">My investments</h2>
        <div v-if="loading && !data" class="portfolio__list">
          <AppSkeleton height="240px" radius="12px" />
        </div>
        <AppEmptyState
          v-else-if="!data?.positions.length"
          icon="chart-plus"
          title="No investments yet"
          :description="
            product === 'capital'
              ? 'Browse available high-yield investment plans to get started on your real estate investment journey.'
              : 'Secure a plot in one of our estates with a guaranteed buyback to start earning.'
          "
        >
          <AppButton :to="product === 'capital' ? '/capital-investment' : '/buyback#estates'">
            {{ product === 'capital' ? 'View Plans' : 'Explore Estates' }}
          </AppButton>
        </AppEmptyState>
        <ul v-else class="portfolio__list" role="list">
          <li v-for="p in data.positions" :key="p.id">
            <PositionCard :position="p" :to="{ name: routeName, params: { id: p.id } }" />
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

<style scoped>
.portfolio__metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.portfolio__title {
  margin: 44px 0 14px;
  font-size: var(--text-lg);
  font-weight: 500;
}

.portfolio__list {
  display: grid;
  gap: 16px;
}

@media (max-width: 1023px) {
  .portfolio__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 767px) {
  .portfolio__metrics {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .portfolio__title {
    margin: 24px 0 12px;
    font-size: var(--text-base);
  }
}
</style>
