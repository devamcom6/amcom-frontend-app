<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/components/base/AppIcon.vue'
import AppImage from '@/components/base/AppImage.vue'
import { LISTING_TYPE_OPTIONS, PROPERTY_TYPE_OPTIONS } from '@/constants/options'
import type { Listing } from '@/types'
import { formatDate, formatNaira } from '@/utils/format'
import StatusBadge from './StatusBadge.vue'

const props = defineProps<{ listing: Listing }>()
const to = computed(() => ({ name: 'dashboard-listing', params: { id: props.listing.id } }))
const typeLabel = computed(() => LISTING_TYPE_OPTIONS.find((o) => o.value === props.listing.listing_type)?.label.replace('For ', '') ?? '')
const propertyLabel = computed(() => PROPERTY_TYPE_OPTIONS.find((o) => o.value === props.listing.property_type)?.label ?? '')
const STATUS_LABEL: Record<string, string> = { published: 'Verified ✓', pending_verification: 'Pending Verification', awaiting_payment: 'Awaiting Payment' }
</script>

<template>
  <article class="lcard">
    <AppImage :media="listing.photos[0]" ratio="160/140" sizes="160px" class="lcard__img" rounded="8px" />
    <div class="lcard__body">
      <header class="lcard__head">
        <div>
          <h3 class="lcard__title"><RouterLink :to="to">{{ listing.title }}</RouterLink></h3>
          <p class="lcard__addr">{{ listing.city }}, {{ listing.state }}</p>
        </div>
        <StatusBadge :status="listing.status" :label="STATUS_LABEL[listing.status]" />
      </header>
      <dl class="lcard__facts">
        <div><dt>Asking Price</dt><dd>{{ formatNaira(listing.asking_price) }}</dd></div>
        <div><dt>Listing Type</dt><dd>{{ typeLabel }} · {{ propertyLabel }}</dd></div>
        <div><dt>Size</dt><dd>{{ listing.size_sqm ? `${listing.size_sqm} SQM` : '—' }}</dd></div>
        <div><dt>Listed</dt><dd>{{ formatDate(listing.listed_at) }}</dd></div>
      </dl>
      <footer class="lcard__foot">
        <div class="lcard__actions">
          <RouterLink :to="to" class="lcard__action"><AppIcon name="file-text" :size="18" /> View details</RouterLink>
          <RouterLink
            v-if="listing.status === 'draft' || listing.status === 'awaiting_payment'"
            :to="{ name: 'list-property', query: { step: 'photos', listing: listing.id } }"
            class="lcard__action"
          >
            <AppIcon name="credit-card" :size="18" /> Complete listing
          </RouterLink>
          <RouterLink v-else :to="{ name: 'listing-edit', params: { id: listing.id } }" class="lcard__action"><AppIcon name="edit" :size="18" /> Edit listing</RouterLink>
        </div>
        <RouterLink :to="to" class="lcard__more" :aria-label="`Open ${listing.title}`"><AppIcon name="chevron-right" :size="18" /></RouterLink>
      </footer>
    </div>
  </article>
</template>

<style scoped>
.lcard {
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  gap: 24px;
  padding: 24px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
}

.lcard__head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.lcard__title {
  font-size: var(--text-lg);
  font-weight: 500;
}

.lcard__title a:hover {
  color: var(--color-primary);
}

.lcard__addr {
  margin-top: 4px;
  font-size: var(--text-sm);
  color: var(--color-body);
}

.lcard__facts {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin: 24px 0 0;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--color-border);
}

.lcard__facts dt {
  font-size: var(--text-xs);
  color: var(--color-body);
}

.lcard__facts dd {
  margin: 6px 0 0;
  font-size: var(--text-sm);
  font-weight: 500;
}

.lcard__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 14px;
}

.lcard__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 32px;
}

.lcard__action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-primary);
}

.lcard__action:hover {
  text-decoration: underline;
}

.lcard__more {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #ededf2;
}

@media (max-width: 899px) {
  .lcard {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 16px;
  }

  .lcard__head {
    flex-direction: column-reverse;
    align-items: flex-start;
    gap: 8px;
  }

  .lcard__facts {
    grid-template-columns: 1fr 1fr;
  }

  .lcard__more {
    display: none;
  }
}
</style>
