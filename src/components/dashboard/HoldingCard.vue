<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/components/base/AppIcon.vue'
import AppImage from '@/components/base/AppImage.vue'
import type { IconName } from '@/components/base/icons'
import type { PropertyHolding } from '@/types'
import { formatDate, formatMonthYear, formatNaira } from '@/utils/format'
import StatusBadge from './StatusBadge.vue'

const props = defineProps<{ holding: PropertyHolding }>()
const emit = defineEmits<{ pay: [PropertyHolding] }>()

const facts = computed(() => {
  const h = props.holding
  if (h.holding_type === 'outright_purchase') {
    return [
      { label: 'Purchase Price', value: formatNaira(h.purchase_price) },
      { label: 'Acquisition Date', value: formatMonthYear(h.acquired_on) },
      { label: 'Title Document', value: h.title_document ?? '—' },
      { label: 'Ownership Status', value: h.ownership_status ?? '—' },
    ]
  }
  const rate = `${formatNaira(h.rate)} / ${h.rate_period}`
  const period = `${formatDate(h.period_start)} - ${formatDate(h.period_end)}`
  if (h.holding_type === 'lease') {
    return [
      { label: 'Lease Rate', value: rate },
      { label: 'Lease Period', value: period },
      { label: 'Renewal Date', value: formatDate(h.renewal_date) },
      { label: 'Lease Terms', value: h.term_label ?? '—' },
    ]
  }
  return [
    { label: h.rate_period === 'month' ? 'Monthly Rent' : 'Annual Rent', value: rate },
    { label: 'Tenancy Period', value: period },
    { label: 'Renewal Date', value: formatDate(h.renewal_date) },
  ]
})

const actions = computed<{ label: string; icon: IconName; kind: 'detail' | 'pay' }[]>(() => {
  switch (props.holding.holding_type) {
    case 'outright_purchase':
      return [
        { label: 'View Proof of Ownership', icon: 'file-text', kind: 'detail' },
        { label: 'Deed of Conveyance', icon: 'home', kind: 'detail' },
      ]
    case 'lease':
      return [
        { label: 'View Lease Agreement', icon: 'file-text', kind: 'detail' },
        { label: 'Pay / Renew Lease', icon: 'credit-card', kind: 'pay' },
      ]
    default:
      return [
        { label: 'Download Tenancy Agreement', icon: 'file-text', kind: 'detail' },
        { label: 'Pay Rent', icon: 'credit-card', kind: 'pay' },
      ]
  }
})

const to = computed(() => ({ name: 'dashboard-holding', params: { id: props.holding.id } }))
</script>

<template>
  <article class="holding">
    <AppImage :media="holding.property.cover_image" ratio="160/140" sizes="160px" class="holding__img" rounded="8px" />
    <div class="holding__body">
      <header class="holding__head">
        <div>
          <h3 class="holding__title"><RouterLink :to="to">{{ holding.property.title }}</RouterLink></h3>
          <p class="holding__addr">{{ holding.property.address }}</p>
        </div>
        <StatusBadge :status="holding.status" :label="holding.status_label" />
      </header>
      <dl class="holding__facts" :class="{ 'holding__facts--3': facts.length === 3 }">
        <div v-for="f in facts" :key="f.label">
          <dt>{{ f.label }}</dt>
          <dd>{{ f.value }}</dd>
        </div>
      </dl>
      <footer class="holding__foot">
        <div class="holding__actions">
          <template v-for="a in actions" :key="a.label">
            <RouterLink v-if="a.kind === 'detail'" :to="to" class="holding__action"><AppIcon :name="a.icon" :size="18" /> {{ a.label }}</RouterLink>
            <button v-else type="button" class="holding__action" @click="emit('pay', holding)"><AppIcon :name="a.icon" :size="18" /> {{ a.label }}</button>
          </template>
        </div>
        <RouterLink :to="to" class="holding__more" :aria-label="`Open ${holding.property.title}`"><AppIcon name="chevron-right" :size="18" /></RouterLink>
      </footer>
    </div>
  </article>
</template>

<style scoped>
.holding {
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  gap: 24px;
  padding: 24px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
}

.holding__head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.holding__title {
  font-size: var(--text-lg);
  font-weight: 500;
}

.holding__title a:hover {
  color: var(--color-primary);
}

.holding__addr {
  margin-top: 4px;
  font-size: var(--text-sm);
  color: var(--color-body);
}

.holding__facts {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin: 24px 0 0;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--color-border);
}

.holding__facts--3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.holding__facts dt {
  font-size: var(--text-xs);
  color: var(--color-body);
}

.holding__facts dd {
  margin: 6px 0 0;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-ink);
}

.holding__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 14px;
}

.holding__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 32px;
}

.holding__action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-primary);
}

.holding__action:hover {
  text-decoration: underline;
}

.holding__more {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #ededf2;
  color: var(--color-ink);
}

@media (max-width: 899px) {
  .holding {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 16px;
  }

  .holding__img {
    max-height: 180px;
  }

  .holding__head {
    flex-direction: column-reverse;
    align-items: flex-start;
    gap: 8px;
  }

  .holding__facts,
  .holding__facts--3 {
    grid-template-columns: 1fr 1fr;
  }

  .holding__more {
    display: none;
  }
}
</style>
