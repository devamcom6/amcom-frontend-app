<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import AppIcon from '@/components/base/AppIcon.vue'
import AppProgressBar from '@/components/base/AppProgressBar.vue'
import { useDocumentDownload } from '@/composables/useDocumentDownload'
import type { BuybackPosition, CapitalPosition } from '@/types'
import { formatDate, formatNaira } from '@/utils/format'
import StatusBadge from './StatusBadge.vue'

/** Investment position summary (capital plan or buyback plot) with progress and document links. */
const props = defineProps<{ position: CapitalPosition | BuybackPosition; to: RouteLocationRaw }>()
const { download } = useDocumentDownload()

const title = computed(() =>
  'plan_name' in props.position ? props.position.plan_name : `${props.position.estate.name} — Plot ${props.position.plot_codes.join(', ')}`,
)
const subtitle = computed(() =>
  'plan_name' in props.position
    ? `Fixed return · started ${formatDate(props.position.started_at)}`
    : `${props.position.estate.location.address ?? props.position.estate.location.city} · started ${formatDate(props.position.started_at)}`,
)
const docs = computed(() => props.position.documents.filter((d) => d.status === 'available'))
</script>

<template>
  <article class="position">
    <header class="position__head">
      <div>
        <h3 class="position__title">
          <RouterLink :to="to" class="position__link">{{ title }}</RouterLink>
        </h3>
        <p class="position__subtitle">{{ subtitle }}</p>
      </div>
      <StatusBadge :status="position.status" />
    </header>

    <div class="position__progress">
      <div class="position__progress-labels">
        <span>{{ position.months_elapsed }} of {{ position.tenure_months }} months elapsed</span>
        <strong class="hide-mobile">{{ position.days_to_maturity }} days to maturity</strong>
      </div>
      <AppProgressBar :value="position.months_elapsed" :max="position.tenure_months" :label="`${position.months_elapsed} of ${position.tenure_months} months elapsed`" />
      <span class="position__days hide-desktop">{{ position.days_to_maturity }} days to maturity</span>
    </div>

    <dl class="position__facts">
      <div>
        <dt>Principal</dt>
        <dd>{{ formatNaira(position.principal) }}</dd>
      </div>
      <div>
        <dt><span class="hide-mobile">Fixed Interest Rate (ROI)</span><span class="hide-desktop">Fixed rate (ROI)</span></dt>
        <dd>{{ position.roi_percent }}%</dd>
      </div>
      <div>
        <dt><span class="hide-mobile">Total Payout</span><span class="hide-desktop">Total payout</span></dt>
        <dd>{{ formatNaira(position.total_payout) }}</dd>
      </div>
      <div class="position__fact-end">
        <dt>Maturity date</dt>
        <dd>{{ formatDate(position.maturity_date) }}</dd>
      </div>
    </dl>

    <footer class="position__foot">
      <div class="position__docs">
        <button v-for="d in docs" :key="d.id" type="button" class="position__doc" @click="download(d)">
          <AppIcon :name="d.type === 'payment_receipt' ? 'receipt' : 'file-text'" :size="18" class="hide-mobile" />
          {{ d.name }}
        </button>
      </div>
      <RouterLink :to="to" class="position__more hide-mobile" :aria-label="`View details for ${title}`">
        <AppIcon name="chevron-right" :size="18" />
      </RouterLink>
    </footer>
  </article>
</template>

<style scoped>
.position {
  position: relative;
  padding: 20px 20px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
}

.position__head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.position__title {
  font-size: var(--text-lg);
  font-weight: 500;
}

.position__link:hover {
  color: var(--color-primary);
}

.position__subtitle {
  margin-top: 2px;
  font-size: var(--text-sm);
  color: var(--color-body);
}

.position__progress {
  display: grid;
  gap: 8px;
  margin-top: 22px;
}

.position__progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: var(--text-xs);
  color: var(--color-ink);
}

.position__progress-labels strong {
  font-weight: 600;
}

.position__days {
  font-size: var(--text-xs);
}

.position__facts {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin: 20px 0 0;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--color-border);
}

.position__facts dt {
  font-size: var(--text-sm);
  color: var(--color-body);
}

.position__facts dd {
  margin: 4px 0 0;
  font-weight: 500;
  color: var(--color-ink);
  font-variant-numeric: tabular-nums;
}

.position__fact-end {
  text-align: right;
}

.position__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 12px;
}

.position__docs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 28px;
}

.position__doc {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: var(--text-sm);
  color: #1d4ed8;
}

.position__doc:hover {
  text-decoration: underline;
}

.position__more {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: var(--color-body);
}

.position__more:hover {
  background: var(--color-page);
}

@media (max-width: 767px) {
  .position {
    padding: 16px;
  }

  .position__title {
    font-size: var(--text-base);
    font-weight: 600;
  }

  .position__subtitle {
    font-size: var(--text-xs);
  }

  .position__progress {
    margin-top: 16px;
  }

  .position__facts {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    padding-bottom: 0;
    border-bottom: 0;
  }

  .position__facts dt {
    font-size: var(--text-xs);
  }

  .position__facts dd {
    font-size: var(--text-sm);
    font-weight: 600;
  }

  .position__fact-end {
    text-align: left;
  }

  .position__docs {
    flex-direction: column;
    gap: 8px;
  }

  .position__doc {
    font-size: var(--text-xs);
    color: var(--color-primary);
  }
}
</style>
