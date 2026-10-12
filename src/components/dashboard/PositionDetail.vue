<script setup lang="ts">
import { computed, ref } from 'vue'
import AppBackLink from '@/components/base/AppBackLink.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppConfirmDialog from '@/components/base/AppConfirmDialog.vue'
import AppErrorState from '@/components/base/AppErrorState.vue'
import AppProgressBar from '@/components/base/AppProgressBar.vue'
import AppSkeleton from '@/components/base/AppSkeleton.vue'
import type { ApiError } from '@/services/http/errors'
import type { BuybackPosition, CapitalPosition } from '@/types'
import { formatDate, formatNaira } from '@/utils/format'
import DocumentList from './DocumentList.vue'
import StatusBadge from './StatusBadge.vue'

/** Shared detail page for capital and buyback positions (timeline, position, actions, documents). */
const props = defineProps<{
  position: CapitalPosition | BuybackPosition | undefined
  loading: boolean
  error: ApiError | null
  fallback: string
  onPayout?: () => Promise<void>
}>()
const emit = defineEmits<{ retry: [] }>()

const isBuyback = computed(() => !!props.position && 'estate' in props.position)
const title = computed(() => {
  const p = props.position
  if (!p) return ''
  return 'plan_name' in p ? p.plan_name : `${p.estate.name} — Plot ${p.plot_codes.join(', ')}`
})
const subtitle = computed(() => {
  const p = props.position
  if (!p) return ''
  return 'plan_name' in p
    ? `Fixed return · started ${formatDate(p.started_at)}`
    : `${p.estate.location.address ?? p.estate.location.city}, ${p.estate.location.state.replace(' State', '')} State · ${p.size_sqm} sqm`
})

const confirmPayout = ref(false)
const requesting = ref(false)
async function payout() {
  if (!props.onPayout) return
  requesting.value = true
  try {
    await props.onPayout()
    confirmPayout.value = false
  } finally {
    requesting.value = false
  }
}
</script>

<template>
  <div class="detail">
    <AppBackLink :fallback="fallback" icon="chevron" />

    <div v-if="loading && !position" class="detail__stack">
      <AppSkeleton height="48px" width="40%" />
      <AppSkeleton height="140px" radius="12px" />
      <AppSkeleton height="140px" radius="12px" />
    </div>
    <AppErrorState v-else-if="error" :error="error" class="detail__stack" @retry="emit('retry')" />

    <template v-else-if="position">
      <header class="detail__head">
        <div>
          <h1 class="detail__title">{{ title }}</h1>
          <p class="detail__subtitle">{{ subtitle }}</p>
        </div>
        <StatusBadge :status="position.status" />
      </header>

      <div class="detail__stack">
        <section class="detail__card" aria-labelledby="timeline-title">
          <div class="detail__card-head">
            <h2 id="timeline-title" class="detail__card-title">Timeline</h2>
            <span class="detail__countdown hide-mobile">{{ position.days_to_maturity }} days to maturity</span>
          </div>
          <AppProgressBar :value="position.months_elapsed" :max="position.tenure_months" label="Investment timeline progress" />
          <dl class="detail__timeline">
            <div>
              <dt>{{ isBuyback ? 'Purchased' : 'Started' }}</dt>
              <dd>{{ formatDate(position.started_at) }}</dd>
            </div>
            <div class="detail__elapsed hide-mobile">
              <dt>Elapsed status</dt>
              <dd>{{ position.months_elapsed }} of {{ position.tenure_months }} months elapsed</dd>
            </div>
            <div class="detail__end">
              <dt>Maturity date</dt>
              <dd>{{ formatDate(position.maturity_date) }}</dd>
            </div>
          </dl>
          <p class="detail__elapsed-mobile hide-desktop">{{ position.months_elapsed }} of {{ position.tenure_months }} months elapsed</p>
        </section>

        <section class="detail__card" aria-labelledby="position-title">
          <h2 id="position-title" class="detail__card-title">Position details</h2>
          <dl class="detail__facts">
            <div>
              <dt>Principal</dt>
              <dd>{{ formatNaira(position.principal) }}</dd>
            </div>
            <div>
              <dt>{{ isBuyback ? 'Locked ROI' : 'Fixed Interest Rate (ROI)' }}</dt>
              <dd class="detail__roi">{{ position.roi_percent }}%</dd>
            </div>
            <div>
              <dt>{{ isBuyback ? 'Projected return' : 'Total Payout' }}</dt>
              <dd>{{ formatNaira(position.total_payout) }}</dd>
            </div>
            <div>
              <dt>Maturity date</dt>
              <dd :class="{ 'detail__maturity': isBuyback }">{{ formatDate(position.maturity_date) }}</dd>
            </div>
          </dl>
        </section>

        <section v-if="!isBuyback || position.can_request_payout" class="detail__card detail__actions" aria-label="Actions">
          <AppButton :disabled="!position.can_reinvest" :title="position.can_reinvest ? undefined : 'Available at maturity'" to="/capital-investment/invest">
            Reinvest Capital
          </AppButton>
          <AppButton :disabled="!position.can_request_payout" :title="position.can_request_payout ? undefined : 'Available at maturity'" @click="confirmPayout = true">
            Request Payout
          </AppButton>
          <p v-if="!position.can_request_payout" class="detail__hint">Payout and reinvestment unlock on {{ formatDate(position.maturity_date) }}.</p>
        </section>

        <DocumentList :documents="position.documents" :variant="isBuyback ? 'compact' : 'table'" />
      </div>

      <AppConfirmDialog
        v-model:open="confirmPayout"
        title="Request payout"
        :message="`We'll pay ${formatNaira(position.total_payout)} into your default payout account within 5 business days. You'll receive an email confirmation.`"
        confirm-label="Request payout"
        :loading="requesting"
        @confirm="payout"
      />
    </template>
  </div>
</template>

<style scoped>
.detail {
  padding-top: 40px;
}

.detail__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-top: 36px;
}

.detail__title {
  font-size: 2rem;
  font-weight: 600;
}

.detail__subtitle {
  margin-top: 8px;
  font-size: var(--text-md);
  color: var(--color-body);
}

.detail__stack {
  display: grid;
  gap: 24px;
  margin-top: 28px;
}

.detail__card {
  padding: 24px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
}

.detail__card-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 18px;
}

.detail__card-title {
  font-size: var(--text-lg);
  font-weight: 600;
}

.detail__countdown {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-progress);
}

.detail__timeline {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin: 14px 0 0;
}

.detail__timeline dt,
.detail__facts dt {
  font-size: var(--text-sm);
  color: var(--color-body);
}

.detail__timeline dd {
  margin: 4px 0 0;
  font-size: var(--text-sm);
  font-weight: 600;
}

.detail__elapsed {
  text-align: center;
}

.detail__elapsed dd {
  color: var(--color-progress);
}

.detail__end {
  text-align: right;
}

.detail__elapsed-mobile {
  margin-top: 12px;
  font-size: var(--text-xs);
  color: var(--color-progress);
}

.detail__facts {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin: 16px 0 0;
}

.detail__facts dd {
  margin: 6px 0 0;
  font-size: var(--text-lg);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.detail__roi {
  color: var(--color-lime);
}

.detail__maturity {
  color: var(--color-lime);
}

.detail__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
}

.detail__hint {
  font-size: var(--text-xs);
  color: var(--color-muted);
}

@media (max-width: 767px) {
  .detail {
    padding-top: 16px;
  }

  .detail__head {
    margin-top: 20px;
  }

  .detail__title {
    font-size: var(--text-lg);
  }

  .detail__subtitle {
    font-size: var(--text-xs);
  }

  .detail__stack {
    gap: 16px;
    margin-top: 16px;
  }

  .detail__card {
    padding: 16px;
  }

  .detail__card-title {
    font-size: var(--text-base);
  }

  .detail__timeline {
    justify-content: flex-start;
  }

  .detail__timeline > div {
    flex: 1;
  }

  .detail__end {
    text-align: left;
  }

  .detail__facts {
    grid-template-columns: 1fr 1fr;
  }

  .detail__facts dt {
    font-size: var(--text-xs);
  }

  .detail__facts dd {
    font-size: var(--text-sm);
  }
}
</style>
