<script setup lang="ts">
import { computed, ref } from 'vue'
import AppAlert from '@/components/base/AppAlert.vue'
import AppBackLink from '@/components/base/AppBackLink.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppErrorState from '@/components/base/AppErrorState.vue'
import AppImage from '@/components/base/AppImage.vue'
import AppSkeleton from '@/components/base/AppSkeleton.vue'
import DocumentList from '@/components/dashboard/DocumentList.vue'
import StatusBadge from '@/components/dashboard/StatusBadge.vue'
import GalleryModal from '@/components/properties/GalleryModal.vue'
import { LISTING_TYPE_OPTIONS, PROPERTY_TYPE_OPTIONS } from '@/constants/options'
import { useAsync } from '@/composables/useAsync'
import { listingService } from '@/services/api'
import { formatDate, formatNaira, humanize } from '@/utils/format'

const props = defineProps<{ id: number }>()
const { data: listing, loading, error, execute } = useAsync(() => listingService.get(props.id), { watch: [() => props.id] })
const galleryOpen = ref(false)
const galleryStart = ref(0)

const STATUS_LABEL: Record<string, string> = { published: 'Verified ✓', pending_verification: 'Pending Verification', awaiting_payment: 'Awaiting Payment' }

const details = computed(() => {
  const l = listing.value
  if (!l) return []
  return [
    { label: 'Listing Type', value: LISTING_TYPE_OPTIONS.find((o) => o.value === l.listing_type)?.label.replace('For ', '') ?? '' },
    { label: 'Property Type', value: PROPERTY_TYPE_OPTIONS.find((o) => o.value === l.property_type)?.label ?? '' },
    { label: 'Asking price', value: formatNaira(l.asking_price) },
    { label: 'Property Size', value: l.size_sqm ? `${l.size_sqm} SQM` : '—' },
    { label: 'Number of Bedrooms', value: String(l.bedrooms ?? '—') },
    { label: 'Number of Bathrooms', value: String(l.bathrooms ?? '—') },
  ]
})

function open(i: number) {
  galleryStart.value = i
  galleryOpen.value = true
}
</script>

<template>
  <div class="ld">
    <AppBackLink fallback="/dashboard/property-management" icon="chevron" />

    <div v-if="loading && !listing" class="ld__stack"><AppSkeleton height="300px" radius="12px" /><AppSkeleton :lines="6" /></div>
    <AppErrorState v-else-if="error" :error="error" class="ld__stack" @retry="execute" />

    <template v-else-if="listing">
      <section class="ld__hero">
        <div class="ld__photos">
          <button type="button" class="ld__photo-main" aria-label="Open photo gallery" @click="open(0)">
            <AppImage :media="listing.photos[0]" ratio="368/280" sizes="(max-width: 767px) 100vw, 370px" rounded="8px" />
          </button>
          <div class="ld__thumbs">
            <button v-for="i in [1, 2]" :key="i" type="button" class="ld__thumb" :aria-label="`Open photo ${i + 1}`" @click="open(i)">
              <AppImage :media="listing.photos[i]" ratio="120/85" sizes="120px" rounded="6px" />
            </button>
            <button type="button" class="ld__thumb ld__thumb--more" @click="open(3)">
              <AppImage :media="listing.photos[3]" ratio="120/85" sizes="120px" rounded="6px" />
              <span v-if="listing.photos.length > 3">+{{ listing.photos.length - 3 }} Photos</span>
            </button>
          </div>
        </div>
        <div class="ld__summary">
          <StatusBadge :status="listing.status" :label="STATUS_LABEL[listing.status]" />
          <h1 class="ld__title">{{ listing.title }}</h1>
          <p class="ld__loc">{{ listing.city }}, {{ listing.state }}</p>
          <dl class="ld__keyfacts">
            <div><dt>Asking price</dt><dd>{{ formatNaira(listing.asking_price) }}</dd></div>
            <div><dt>Listed</dt><dd>{{ formatDate(listing.listed_at) }}</dd></div>
            <div><dt>Size</dt><dd>{{ listing.size_sqm ? `${listing.size_sqm} SQM` : '—' }}</dd></div>
          </dl>
        </div>
      </section>

      <AppAlert v-if="listing.status === 'rejected' && listing.rejection_reason" tone="danger" title="Listing not approved" class="ld__alert">
        {{ listing.rejection_reason }}
      </AppAlert>
      <AppAlert v-else-if="listing.status === 'awaiting_payment'" tone="warning" title="Payment pending" class="ld__alert">
        Pay the one-time listing fee to send this property for inspection.
        <AppButton variant="link" :to="{ name: 'list-property', query: { step: 'photos', listing: listing.id } }">Complete listing</AppButton>
      </AppAlert>

      <div class="ld__grid">
        <div class="ld__main">
          <section aria-labelledby="pd-title">
            <h2 id="pd-title" class="ld__h2">Property details</h2>
            <dl class="ld__details">
              <div v-for="d in details" :key="d.label" class="ld__detail"><dt>{{ d.label }}</dt><dd>{{ d.value }}</dd></div>
              <div class="ld__detail ld__detail--half"><dt>State</dt><dd>{{ listing.state }}</dd></div>
              <div class="ld__detail ld__detail--half"><dt>Property Address</dt><dd>{{ listing.address }}</dd></div>
              <div v-if="listing.description" class="ld__detail ld__detail--full"><dt>Description</dt><dd>{{ listing.description }}</dd></div>
            </dl>
          </section>

          <DocumentList :documents="listing.documents" description="View and download proof of agreement, receipts, and titles." />

          <section v-if="listing.financial_summary" class="ld__panel" aria-labelledby="fin-title">
            <h2 id="fin-title" class="ld__h3">Financial Summary</h2>
            <p class="ld__panel-desc">Estimated payout breakdown for this property sale.</p>
            <dl class="ld__rows">
              <div><dt>Expected Sale Price</dt><dd>{{ formatNaira(listing.financial_summary.expected_sale_price) }}</dd></div>
              <div><dt>Amcom Service Fee ({{ listing.financial_summary.service_fee_percent }}%)</dt><dd>{{ formatNaira(listing.financial_summary.service_fee) }}</dd></div>
              <div><dt>Net Proceeds (Estimated)</dt><dd class="positive">{{ formatNaira(listing.financial_summary.net_proceeds) }}</dd></div>
              <div><dt>Payment Status</dt><dd><StatusBadge :status="listing.financial_summary.payment_status" size="sm" /></dd></div>
            </dl>
          </section>

          <section v-if="listing.activity" class="ld__panel" aria-labelledby="act-title">
            <h2 id="act-title" class="ld__h3">Transaction Status</h2>
            <p class="ld__panel-desc">Overview of the current listing lifecycle and activity.</p>
            <dl class="ld__rows">
              <div><dt>Status</dt><dd><StatusBadge status="available" :label="listing.activity.status_label" size="sm" /></dd></div>
              <div><dt>Listed Since</dt><dd>{{ formatDate(listing.activity.listed_since) }}</dd></div>
              <div><dt>Interested Parties</dt><dd>{{ listing.activity.interested_parties }}</dd></div>
              <div><dt>Property Viewings</dt><dd>{{ listing.activity.completed_viewings }} completed</dd></div>
            </dl>
          </section>
        </div>

        <aside class="ld__aside">
          <div class="ld__actions">
            <AppButton v-if="listing.status !== 'sold'" size="lg" block :to="{ name: 'listing-edit', params: { id: listing.id } }">Edit Listing</AppButton>
            <AppButton size="lg" block variant="secondary" to="/contact?subject=Listing%20support">Contact Support</AppButton>
            <AppButton v-if="listing.financial_summary" size="lg" block variant="secondary" to="/dashboard/transactions">View Revenue Report</AppButton>
          </div>
          <p class="ld__ref">Reference {{ listing.reference }} · {{ humanize(listing.status) }}</p>
        </aside>
      </div>

      <GalleryModal v-model:open="galleryOpen" :images="listing.photos" :start-index="galleryStart" :title="listing.title" />
    </template>
  </div>
</template>

<style scoped>
.ld {
  padding-top: 40px;
}

.ld__stack {
  display: grid;
  gap: 16px;
  margin-top: 32px;
}

.ld__hero {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 24px;
  margin-top: 32px;
  padding: 24px;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xs);
}

.ld__photos {
  display: grid;
  grid-template-columns: 368px 120px;
  gap: 12px;
}

.ld__thumbs {
  display: grid;
  gap: 12px;
}

.ld__thumb--more {
  position: relative;
}

.ld__thumb--more span {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  border-radius: 6px;
  background: rgba(17, 20, 24, 0.55);
  color: #fff;
  font-size: var(--text-sm);
  font-weight: 500;
}

.ld__summary {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.ld__title {
  margin-top: 8px;
  font-size: 1.75rem;
  font-weight: 500;
}

.ld__loc {
  font-size: var(--text-sm);
  color: var(--color-muted);
}

.ld__keyfacts {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  width: 100%;
  margin: 12px 0 0;
  padding-top: 18px;
  border-top: 1px solid var(--color-border-subtle);
}

.ld__keyfacts dt,
.ld__details dt {
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-muted);
}

.ld__keyfacts dd {
  margin: 4px 0 0;
  font-size: var(--text-md);
  color: var(--color-ink);
}

.ld__alert {
  margin-top: 24px;
}

.ld__grid {
  display: grid;
  grid-template-columns: minmax(0, 700px) minmax(0, 428px);
  justify-content: space-between;
  gap: 24px;
  margin-top: 24px;
}

.ld__main {
  display: grid;
  gap: 32px;
  align-content: start;
}

.ld__h2 {
  font-size: var(--text-lg);
  font-weight: 500;
}

.ld__details {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  margin: 12px 0 0;
}

.ld__detail {
  grid-column: span 2;
  padding: 16px;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-sm);
}

.ld__detail--half {
  grid-column: span 3;
}

.ld__detail--full {
  grid-column: 1 / -1;
}

.ld__details dt {
  text-transform: none;
  letter-spacing: 0;
}

.ld__details dd {
  margin: 6px 0 0;
  color: var(--color-ink);
  line-height: 1.5;
}

.ld__panel {
  padding: 16px;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
}

.ld__h3 {
  font-size: var(--text-base);
  font-weight: 600;
}

.ld__panel-desc {
  margin-top: 4px;
  font-size: var(--text-xs);
  color: var(--color-body);
}

.ld__rows {
  display: grid;
  gap: 8px;
  margin: 14px 0 0;
}

.ld__rows > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 10px;
  border-radius: var(--radius-sm);
  background: #f0f0f2;
  font-size: var(--text-sm);
}

.ld__rows dd {
  margin: 0;
  font-weight: 600;
}

.positive {
  color: var(--color-lime);
}

.ld__aside {
  align-self: start;
  position: sticky;
  top: calc(var(--header-height) + 24px);
}

.ld__actions {
  display: grid;
  gap: 12px;
  padding: 24px;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
}

.ld__ref {
  margin-top: 12px;
  font-size: var(--text-xs);
  color: var(--color-muted);
  text-align: center;
}

@media (max-width: 1023px) {
  .ld__hero {
    grid-template-columns: 1fr;
  }

  .ld__grid {
    grid-template-columns: 1fr;
  }

  .ld__aside {
    position: static;
  }
}

@media (max-width: 767px) {
  .ld {
    padding-top: 16px;
    padding-bottom: 140px;
  }

  .ld__hero {
    margin-top: 16px;
    padding: 0;
    border: 0;
    box-shadow: none;
  }

  .ld__photos {
    grid-template-columns: 1fr;
  }

  .ld__thumbs {
    grid-template-columns: repeat(3, 1fr);
  }

  .ld__title {
    font-size: var(--text-xl);
  }

  .ld__details {
    grid-template-columns: 1fr 1fr;
  }

  .ld__detail,
  .ld__detail--half {
    grid-column: span 1;
    padding: 0;
    border: 0;
  }

  .ld__detail--full {
    grid-column: 1 / -1;
  }

  .ld__aside {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 20;
    background: var(--color-bg);
    border-top: 1px solid var(--color-border-subtle);
  }

  .ld__actions {
    padding: 16px var(--gutter) calc(16px + env(safe-area-inset-bottom));
    border: 0;
    border-radius: 0;
    gap: 8px;
  }

  .ld__ref {
    display: none;
  }
}
</style>
