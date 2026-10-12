<script setup lang="ts">
import { computed, ref } from 'vue'
import AppBackLink from '@/components/base/AppBackLink.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppErrorState from '@/components/base/AppErrorState.vue'
import AppInput from '@/components/base/AppInput.vue'
import AppModal from '@/components/base/AppModal.vue'
import AppSkeleton from '@/components/base/AppSkeleton.vue'
import AppTextarea from '@/components/base/AppTextarea.vue'
import DocumentList from '@/components/dashboard/DocumentList.vue'
import StatusBadge from '@/components/dashboard/StatusBadge.vue'
import { useAsync } from '@/composables/useAsync'
import { useForm } from '@/composables/useForm'
import { usePayment } from '@/composables/usePayment'
import { holdingService } from '@/services/api'
import { useUiStore } from '@/stores/ui'
import { formatDate, formatNaira } from '@/utils/format'
import { minLength, required } from '@/utils/validators'

const props = defineProps<{ id: number }>()
const ui = useUiStore()
const { pay, processing } = usePayment()
const { data: holding, loading, error, execute } = useAsync(() => holdingService.get(props.id), { watch: [() => props.id] })

const isPurchase = computed(() => holding.value?.holding_type === 'outright_purchase')

const keyFacts = computed(() => {
  const h = holding.value
  if (!h) return []
  if (h.holding_type === 'outright_purchase') {
    return [
      { label: 'Purchase price', value: formatNaira(h.purchase_price) },
      { label: 'Purchase date', value: formatDate(h.acquired_on), accent: true },
      { label: 'Size', value: h.property.size_sqm ? `${h.property.size_sqm} SQM` : '—' },
    ]
  }
  return [
    { label: h.holding_type === 'rent' ? 'Rent value' : 'Rent value', value: `${formatNaira(h.rate)}/${h.rate_period === 'month' ? 'mo' : 'yr'}` },
    { label: 'Size', value: h.property.size_sqm ? `${h.property.size_sqm} SQM` : '—' },
    { label: 'Next payment', value: formatDate(h.next_payment_date), accent: true },
  ]
})

/* Maintenance request */
const maintenanceOpen = ref(false)
const form = useForm(
  { title: '', description: '' },
  { rules: { title: [required('Summarise the issue.')], description: [required('Describe the issue.'), minLength(10, 'Add a little more detail.')] } },
)

async function logMaintenance() {
  if (!holding.value) return
  try {
    const req = await form.submit(() => holdingService.logMaintenance(props.id, form.values))
    if (req && holding.value) {
      holding.value = { ...holding.value, maintenance_requests: [req, ...holding.value.maintenance_requests] }
      maintenanceOpen.value = false
      form.reset()
      ui.success('Request logged', 'The facility manager has been notified.')
    }
  } catch (e) {
    ui.apiError(e)
  }
}
</script>

<template>
  <div class="hd">
    <AppBackLink fallback="/dashboard/property-management?tab=holdings" icon="chevron" />

    <div v-if="loading && !holding" class="hd__stack"><AppSkeleton height="160px" radius="12px" /><AppSkeleton height="200px" radius="12px" /></div>
    <AppErrorState v-else-if="error" :error="error" class="hd__stack" @retry="execute" />

    <template v-else-if="holding">
      <section class="hd__header">
        <div class="hd__head-row">
          <div>
            <h1 class="hd__title">{{ holding.property.title }}</h1>
            <p class="hd__addr">{{ holding.property.address }}</p>
          </div>
          <StatusBadge :status="holding.status" :label="holding.status_label" />
        </div>
        <dl class="hd__facts">
          <div v-for="f in keyFacts" :key="f.label">
            <dt>{{ f.label }}</dt>
            <dd :class="{ 'hd__accent': f.accent }">{{ f.value }}</dd>
          </div>
        </dl>
      </section>

      <div class="hd__grid">
        <div class="hd__main">
          <DocumentList :documents="holding.documents" description="View and download proof of agreement, receipts, and titles." />

          <section class="hd__card" aria-labelledby="pay-title">
            <h2 id="pay-title" class="hd__h2">Payment History</h2>
            <p v-if="!holding.payments.length" class="hd__empty">No payments yet.</p>
            <div v-else class="hd__table-wrap">
              <table class="hd__table">
                <thead>
                  <tr><th scope="col">Date</th><th scope="col">Description</th><th scope="col" class="num">Amount</th><th scope="col">Status</th></tr>
                </thead>
                <tbody>
                  <tr v-for="p in holding.payments" :key="p.id">
                    <td data-label="Date">{{ formatDate(p.date) }}</td>
                    <td data-label="Description">{{ p.description }}</td>
                    <td data-label="Amount" class="num">{{ formatNaira(p.amount) }}</td>
                    <td data-label="Status"><StatusBadge :status="p.status" size="sm" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section v-if="!isPurchase" class="hd__card" aria-labelledby="mr-title">
            <h2 id="mr-title" class="hd__h2">Maintenance requests log</h2>
            <p v-if="!holding.maintenance_requests.length" class="hd__empty">No maintenance requests logged.</p>
            <ul v-else class="hd__log" role="list">
              <li v-for="m in holding.maintenance_requests" :key="m.id">
                <div>
                  <span class="hd__log-date">{{ formatDate(m.created_at) }}</span>
                  <span class="hd__log-title">{{ m.title }}</span>
                </div>
                <StatusBadge :status="m.status" size="sm" />
              </li>
            </ul>
          </section>
        </div>

        <aside class="hd__aside">
          <section class="hd__card hd__quick" aria-labelledby="qa-title">
            <h2 id="qa-title" class="hd__h2 hide-mobile">Quick Actions</h2>
            <template v-if="isPurchase">
              <AppButton variant="secondary" size="lg" block to="/list-property">List with Amcom</AppButton>
            </template>
            <template v-else>
              <AppButton size="lg" block :loading="processing" @click="pay('holding_payment', holding.id, 'card')">
                {{ holding.holding_type === 'rent' ? 'Pay Rent' : 'Pay / Renew Lease' }}
              </AppButton>
              <AppButton variant="secondary" size="lg" block @click="maintenanceOpen = true">Log Maintenance Request</AppButton>
              <AppButton variant="secondary" size="lg" block to="/contact?subject=Facility%20manager">Contact Facility Manager</AppButton>
            </template>
          </section>
        </aside>
      </div>

      <AppModal v-model:open="maintenanceOpen" title="Log maintenance request" size="sm" :persistent="form.submitting">
        <form id="mr-form" class="hd__form" novalidate @submit.prevent="logMaintenance">
          <AppInput v-model="form.values.title" label="Issue" placeholder="e.g. AC not cooling in master bedroom" :error="form.errors.title" @blur="form.touch('title')" />
          <AppTextarea v-model="form.values.description" label="Details" placeholder="When did it start? Which room?" :maxlength="1000" :error="form.errors.description" @blur="form.touch('description')" />
        </form>
        <template #footer>
          <AppButton type="submit" form="mr-form" block size="lg" :loading="form.submitting">Submit request</AppButton>
        </template>
      </AppModal>
    </template>
  </div>
</template>

<style scoped>
.hd {
  padding-top: 40px;
}

.hd__stack {
  display: grid;
  gap: 16px;
  margin-top: 32px;
}

.hd__header {
  margin-top: 32px;
  padding: 24px;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xs);
}

.hd__head-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--color-border-subtle);
}

.hd__title {
  font-size: 1.75rem;
  font-weight: 500;
}

.hd__addr {
  margin-top: 4px;
  font-size: var(--text-sm);
  color: var(--color-muted);
}

.hd__facts {
  display: flex;
  flex-wrap: wrap;
  gap: 48px;
  margin: 20px 0 0;
}

.hd__facts dt {
  font-size: var(--text-xs);
  text-transform: uppercase;
  color: var(--color-muted);
}

.hd__facts dd {
  margin: 4px 0 0;
  font-size: var(--text-lg);
  font-weight: 500;
}

.hd__accent {
  color: var(--color-primary);
}

.hd__grid {
  display: grid;
  grid-template-columns: minmax(0, 700px) minmax(0, 428px);
  justify-content: space-between;
  gap: 24px;
  margin-top: 24px;
}

.hd__main {
  display: grid;
  gap: 24px;
  align-content: start;
}

.hd__card {
  padding: 24px;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
}

.hd__h2 {
  font-size: var(--text-lg);
  font-weight: 600;
}

.hd__empty {
  margin-top: 12px;
  font-size: var(--text-sm);
  color: var(--color-muted);
}

.hd__table-wrap {
  margin-top: 16px;
  overflow-x: auto;
}

.hd__table th {
  padding: 12px 16px;
  background: #f5f6f7;
  font-size: var(--text-xs);
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  text-align: left;
  color: var(--color-muted);
}

.hd__table td {
  padding: 16px;
  border-bottom: 1px solid var(--color-border-subtle);
  font-size: var(--text-sm);
}

.num {
  text-align: right !important;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

.hd__log {
  display: grid;
  margin-top: 8px;
}

.hd__log li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border-subtle);
}

.hd__log li > div {
  display: flex;
  flex-direction: column;
}

.hd__log-date {
  font-size: var(--text-xs);
  color: var(--color-muted);
}

.hd__log-title {
  font-size: var(--text-sm);
  font-weight: 600;
}

.hd__aside {
  align-self: start;
}

.hd__quick {
  display: grid;
  gap: 12px;
}

.hd__form {
  display: grid;
  gap: 16px;
}

@media (max-width: 1023px) {
  .hd__grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 767px) {
  .hd {
    padding-top: 16px;
    padding-bottom: 200px;
  }

  .hd__header {
    margin-top: 16px;
    padding: 16px;
  }

  .hd__head-row {
    flex-direction: column-reverse;
    align-items: flex-start;
    padding-bottom: 12px;
    border-bottom: 0;
  }

  .hd__title {
    font-size: var(--text-lg);
  }

  .hd__facts {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 0;
  }

  .hd__facts dd {
    font-size: var(--text-sm);
    font-weight: 600;
  }

  .hd__card {
    padding: 16px;
  }

  .hd__table thead {
    display: none;
  }

  .hd__table tr {
    display: grid;
    grid-template-columns: 1fr auto;
    padding: 10px 0;
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .hd__table td {
    padding: 2px 0;
    border: 0;
  }

  .hd__table td[data-label='Description'] {
    display: none;
  }

  .hd__aside {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 20;
  }

  .hd__quick {
    gap: 8px;
    padding: 16px var(--gutter) calc(16px + env(safe-area-inset-bottom));
    border: 0;
    border-top: 1px solid var(--color-border-subtle);
    border-radius: 0;
  }
}
</style>
