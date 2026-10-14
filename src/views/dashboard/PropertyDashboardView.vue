<script setup lang="ts">
import AppSelect from '@/components/base/AppSelect.vue'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/base/AppButton.vue'
import AppEmptyState from '@/components/base/AppEmptyState.vue'
import AppErrorState from '@/components/base/AppErrorState.vue'
import AppPagination from '@/components/base/AppPagination.vue'
import AppSkeleton from '@/components/base/AppSkeleton.vue'
import AppTabs from '@/components/base/AppTabs.vue'
import HoldingCard from '@/components/dashboard/HoldingCard.vue'
import ListingCard from '@/components/dashboard/ListingCard.vue'
import { LISTING_TYPE_OPTIONS, PROPERTY_TYPE_OPTIONS } from '@/constants/options'
import { usePayment } from '@/composables/usePayment'
import { useResourceList } from '@/composables/useResourceList'
import { holdingService, listingService } from '@/services/api'
import type { Listing, PropertyHolding } from '@/types'

type Tab = 'listings' | 'holdings'
const route = useRoute()
const router = useRouter()
const { pay } = usePayment()

const tab = computed<Tab>({
  get: () => (route.query.tab === 'holdings' ? 'holdings' : 'listings'),
  set: (v) => void router.replace({ query: { tab: v === 'listings' ? undefined : v } }),
})

const listings = useResourceList<Listing, { listing_type: string; property_type: string; status: string }>({
  fetcher: (q) => listingService.mine(q),
  perPage: 10,
  filters: { listing_type: '', property_type: '', status: '' },
  syncUrl: false,
})

const holdings = useResourceList<PropertyHolding, { holding_type: string; status: string }>({
  fetcher: (q) => holdingService.list(q),
  perPage: 10,
  filters: { holding_type: '', status: '' },
  syncUrl: false,
})

const LISTING_STATUSES = [
  { value: 'pending_verification', label: 'Pending verification' },
  { value: 'published', label: 'Verified' },
  { value: 'awaiting_payment', label: 'Awaiting payment' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'sold', label: 'Sold' },
]
const HOLDING_TYPES = [
  { value: 'outright_purchase', label: 'Outright purchase' },
  { value: 'lease', label: 'Lease' },
  { value: 'rent', label: 'Rent' },
]
const HOLDING_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'expiring', label: 'Expiring' },
  { value: 'transferred', label: 'Transferred' },
]

function payHolding(h: PropertyHolding) {
  void pay('holding_payment', h.id, 'card')
}
</script>

<template>
  <div class="pm">
    <div class="pm__bar">
      <AppTabs
        v-model="tab"
        label="Property management"
        id-prefix="pm"
        :tabs="[
          { value: 'listings', label: 'My listings' },
          { value: 'holdings', label: 'My purchases and leases' },
        ]"
      />
      <div v-if="tab === 'listings'" class="pm__filters">
        <AppSelect v-model="listings.filters.listing_type" variant="filter" label="Listing type" hide-label empty-label="All listing" :options="LISTING_TYPE_OPTIONS" />
        <AppSelect v-model="listings.filters.property_type" variant="filter" label="Property type" hide-label empty-label="Property type" :options="PROPERTY_TYPE_OPTIONS" />
        <AppSelect v-model="listings.filters.status" variant="filter" label="Status" hide-label empty-label="Status" :options="LISTING_STATUSES" />
      </div>
      <div v-else class="pm__filters">
        <AppSelect v-model="holdings.filters.holding_type" variant="filter" label="Holding type" hide-label empty-label="All listing" :options="HOLDING_TYPES" />
        <AppSelect v-model="holdings.filters.status" variant="filter" label="Status" hide-label empty-label="Status" :options="HOLDING_STATUSES" />
      </div>
    </div>

    <!-- My listings -->
    <section v-if="tab === 'listings'" id="pm-listings-panel" role="tabpanel" aria-labelledby="pm-listings" class="pm__panel">
      <AppErrorState v-if="listings.error.value" :error="listings.error.value" @retry="listings.refresh" />
      <div v-else-if="listings.loading.value && !listings.loaded.value" class="pm__list"><AppSkeleton v-for="i in 2" :key="i" height="210px" radius="12px" /></div>
      <AppEmptyState
        v-else-if="!listings.items.value.length"
        icon="building"
        :title="listings.hasActiveFilters.value ? 'No listings match these filters' : 'No listings yet'"
        :description="listings.hasActiveFilters.value ? 'Try a different listing type or status.' : 'List your first property to start receiving competitive rental and sales offers from vetted tenants and buyers.'"
      >
        <AppButton v-if="listings.hasActiveFilters.value" variant="outline" @click="listings.resetFilters">Clear filters</AppButton>
        <AppButton v-else to="/list-property">Create Listing</AppButton>
      </AppEmptyState>
      <template v-else>
        <div class="pm__new"><AppButton to="/list-property" variant="outline" size="sm" icon-left="plus">New listing</AppButton></div>
        <ul class="pm__list" role="list">
          <li v-for="l in listings.items.value" :key="l.id"><ListingCard :listing="l" /></li>
        </ul>
        <AppPagination v-if="listings.meta.value.last_page > 1" v-model:page="listings.page.value" :meta="listings.meta.value" label="listings" />
      </template>
    </section>

    <!-- Purchases & leases -->
    <section v-else id="pm-holdings-panel" role="tabpanel" aria-labelledby="pm-holdings" class="pm__panel">
      <AppErrorState v-if="holdings.error.value" :error="holdings.error.value" @retry="holdings.refresh" />
      <div v-else-if="holdings.loading.value && !holdings.loaded.value" class="pm__list"><AppSkeleton v-for="i in 3" :key="i" height="210px" radius="12px" /></div>
      <AppEmptyState
        v-else-if="!holdings.items.value.length"
        icon="home-hand"
        title="No purchases or leases yet"
        description="Browse our selection of commercial and residential properties available for outright purchase or long-term lease."
      >
        <AppButton to="/properties">Browse Properties</AppButton>
      </AppEmptyState>
      <template v-else>
        <ul class="pm__list" role="list">
          <li v-for="h in holdings.items.value" :key="h.id"><HoldingCard :holding="h" @pay="payHolding" /></li>
        </ul>
        <AppPagination v-if="holdings.meta.value.last_page > 1" v-model:page="holdings.page.value" :meta="holdings.meta.value" label="properties" />
      </template>
    </section>
  </div>
</template>

<style scoped>
.pm__bar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.pm__filters {
  display: flex;
  gap: 12px;
}



.pm__panel {
  margin-top: 32px;
}

.pm__new {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.pm__list {
  display: grid;
  gap: 24px;
}

@media (max-width: 767px) {
  .pm__filters {
    width: 100%;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .pm__panel {
    margin-top: 20px;
  }

  .pm__list {
    gap: 16px;
  }
}
</style>
