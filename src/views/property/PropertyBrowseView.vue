<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/base/AppButton.vue'
import AppEmptyState from '@/components/base/AppEmptyState.vue'
import AppErrorState from '@/components/base/AppErrorState.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import AppPagination from '@/components/base/AppPagination.vue'
import AppSkeleton from '@/components/base/AppSkeleton.vue'
import PropertyCard from '@/components/properties/PropertyCard.vue'
import PropertyFilterSheet, { type FilterState } from '@/components/properties/PropertyFilterSheet.vue'
import { useAsync } from '@/composables/useAsync'
import { useResourceList } from '@/composables/useResourceList'
import { propertyService } from '@/services/api'
import type { PropertySummary } from '@/types'
import { formatNumber } from '@/utils/format'

const { data: facets } = useAsync(() => propertyService.facets())

const list = useResourceList<PropertySummary, { location: string[]; listing_type: string[]; property_type: string[]; min_price: string | null; max_price: string | null }>({
  fetcher: (q) => propertyService.list(q),
  perPage: 12,
  filters: { location: [], listing_type: [], property_type: [], min_price: null, max_price: null },
})

const filterOpen = ref(false)
const currentPrice = computed(
  () =>
    facets.value?.price_ranges.find(
      (r) => String(r.min ?? '') === (list.filters.min_price ?? '') && String(r.max ?? '') === (list.filters.max_price ?? ''),
    )?.label ?? null,
)
const filterValue = computed<FilterState>(() => ({
  location: list.filters.location,
  listing_type: list.filters.listing_type,
  property_type: list.filters.property_type,
  price: currentPrice.value,
}))
const activeCount = computed(
  () => list.filters.location.length + list.filters.listing_type.length + list.filters.property_type.length + (currentPrice.value ? 1 : 0),
)

function applyFilters(f: FilterState) {
  const range = facets.value?.price_ranges.find((r) => r.label === f.price)
  Object.assign(list.filters, {
    location: f.location,
    listing_type: f.listing_type,
    property_type: f.property_type,
    min_price: range?.min !== undefined && range?.min !== null ? String(range.min) : null,
    max_price: range?.max !== undefined && range?.max !== null ? String(range.max) : null,
  })
}
</script>

<template>
  <section class="browse">
    <div class="container">
      <header class="browse__head">
        <h1 class="browse__title">Find Your Perfect Property</h1>
        <p class="browse__lead">Discover premier listings curated and managed by Amcom.</p>
      </header>

      <div class="browse__toolbar">
        <p class="browse__count" aria-live="polite">
          <template v-if="list.loaded.value">
            Showing <strong>{{ list.items.value.length }}</strong> of {{ formatNumber(list.meta.value.total) }} properties
          </template>
        </p>
        <div class="browse__controls">
          <label class="browse__search hide-mobile">
            <AppIcon name="search" :size="18" />
            <span class="sr-only">Search properties</span>
            <input v-model="list.search.value" type="search" placeholder="Search by title or area" />
          </label>
          <label class="browse__sort hide-mobile">
            <span class="sr-only">Sort by</span>
            <select v-model="list.sort.value">
              <option value="">Newest</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
            </select>
          </label>
          <button type="button" class="browse__filter" :aria-label="`Filters${activeCount ? `, ${activeCount} active` : ''}`" @click="filterOpen = true">
            <AppIcon name="sliders" :size="22" />
            <span v-if="activeCount" class="browse__filter-count">{{ activeCount }}</span>
          </button>
        </div>
      </div>

      <AppErrorState v-if="list.error.value" :error="list.error.value" @retry="list.refresh" />

      <ul v-else-if="list.loading.value && !list.items.value.length" class="browse__grid" role="list">
        <li v-for="i in 6" :key="i" class="browse__skeleton"><AppSkeleton height="180px" radius="12px" /><AppSkeleton :lines="3" /></li>
      </ul>

      <AppEmptyState
        v-else-if="!list.items.value.length"
        icon="search"
        title="No properties match your filters"
        description="Try widening your search area or clearing a few filters."
      >
        <AppButton variant="outline" @click="list.resetFilters">Clear filters</AppButton>
      </AppEmptyState>

      <template v-else>
        <ul class="browse__grid" :class="{ 'is-refreshing': list.loading.value }" role="list">
          <li v-for="p in list.items.value" :key="p.id"><PropertyCard :property="p" /></li>
        </ul>
        <AppPagination v-model:page="list.page.value" :meta="list.meta.value" label="properties" class="browse__pagination" />
      </template>
    </div>

    <PropertyFilterSheet v-model:open="filterOpen" :facets="facets" :value="filterValue" @apply="applyFilters" />
  </section>
</template>

<style scoped>
.browse {
  flex: 1;
  padding: 48px 0 96px;
}

.browse__title {
  font-size: 2rem;
  font-weight: 600;
}

.browse__lead {
  margin-top: 8px;
  font-size: var(--text-md);
  color: var(--color-body);
}

.browse__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 40px 0 24px;
}

.browse__count {
  font-size: var(--text-sm);
}

.browse__count strong {
  color: var(--color-success-strong);
  font-weight: 500;
}

.browse__controls {
  display: flex;
  gap: 12px;
}

.browse__search {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 280px;
  height: 48px;
  padding: 0 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-muted);
}

.browse__search input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  font-size: var(--text-sm);
  background: transparent;
}

.browse__search:focus-within {
  border-color: var(--color-primary);
  box-shadow: var(--focus-ring);
}

.browse__sort select {
  height: 48px;
  padding: 0 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  font-size: var(--text-sm);
}

.browse__filter {
  position: relative;
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: #f3f3ee;
  color: var(--color-ink);
}

.browse__filter-count {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 10px;
  background: var(--color-primary);
  color: #fff;
  font-size: 11px;
  line-height: 20px;
}

.browse__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  transition: opacity var(--duration) var(--ease);
}

.browse__grid.is-refreshing {
  opacity: 0.55;
}

.browse__skeleton {
  display: grid;
  gap: 12px;
}

.browse__pagination {
  margin-top: 24px;
}

@media (max-width: 1023px) {
  .browse__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 767px) {
  .browse {
    padding-top: 24px;
  }

  .browse__title {
    font-size: 1.6rem;
  }

  .browse__lead {
    font-size: var(--text-base);
  }

  .browse__toolbar {
    margin: 24px 0 16px;
  }

  .browse__grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>
