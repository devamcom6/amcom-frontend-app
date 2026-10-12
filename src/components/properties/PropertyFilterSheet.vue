<script setup lang="ts">
import { clone } from '@/utils/clone'
import { computed, ref, watch } from 'vue'
import AppButton from '@/components/base/AppButton.vue'
import AppCheckbox from '@/components/base/AppCheckbox.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import AppModal from '@/components/base/AppModal.vue'
import { LISTING_TYPE_OPTIONS, PROPERTY_TYPE_OPTIONS } from '@/constants/options'
import { propertyService } from '@/services/api'
import type { PropertyFacets } from '@/types'
import { formatNumber } from '@/utils/format'

export interface FilterState {
  location: string[]
  listing_type: string[]
  property_type: string[]
  price: string | null
}

/**
 * Filters bottom sheet (mobile) / dialog (desktop). Changes are staged locally and only
 * applied on "Show N results"; N comes from a lightweight count request to the API.
 */
const props = defineProps<{ facets: PropertyFacets | undefined; value: FilterState }>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ apply: [FilterState] }>()

type Tab = 'location' | 'listing_type' | 'property_type' | 'price'
const tabs: { value: Tab; label: string }[] = [
  { value: 'location', label: 'Location' },
  { value: 'listing_type', label: 'Listing Type' },
  { value: 'property_type', label: 'Property Type' },
  { value: 'price', label: 'Price' },
]
const tab = ref<Tab>('location')
const staged = ref<FilterState>(clone(props.value))
const locationSearch = ref('')
const count = ref<number | null>(null)
const counting = ref(false)

watch(open, (v) => {
  if (v) {
    staged.value = clone({ ...props.value })
    void refreshCount()
  }
})

const priceRanges = computed(() => props.facets?.price_ranges ?? [])

function toQuery(f: FilterState) {
  const range = priceRanges.value.find((r) => r.label === f.price)
  return {
    location: f.location,
    listing_type: f.listing_type,
    property_type: f.property_type,
    min_price: range?.min ?? undefined,
    max_price: range?.max ?? undefined,
  }
}

let timer: ReturnType<typeof setTimeout> | undefined
watch(
  staged,
  () => {
    clearTimeout(timer)
    timer = setTimeout(refreshCount, 300)
  },
  { deep: true },
)

async function refreshCount() {
  if (!open.value) return
  counting.value = true
  try {
    count.value = (await propertyService.list({ ...toQuery(staged.value), per_page: 1 })).meta.total
  } catch {
    count.value = null
  } finally {
    counting.value = false
  }
}

const locations = computed(() =>
  (props.facets?.locations ?? []).filter((l) => l.toLowerCase().includes(locationSearch.value.toLowerCase())),
)

const listOptions = computed(() => {
  if (tab.value === 'listing_type') return LISTING_TYPE_OPTIONS.filter((o) => !props.facets || props.facets.listing_types.includes(o.value))
  if (tab.value === 'property_type') return PROPERTY_TYPE_OPTIONS.filter((o) => !props.facets || props.facets.property_types.includes(o.value))
  return []
})

function toggle(key: 'location' | 'listing_type' | 'property_type', value: string, checked: boolean) {
  const list = staged.value[key]
  staged.value[key] = checked ? [...list, value] : list.filter((v) => v !== value)
}

function reset() {
  staged.value = { location: [], listing_type: [], property_type: [], price: null }
}

function apply() {
  emit('apply', clone({ ...staged.value }))
  open.value = false
}
</script>

<template>
  <AppModal v-model:open="open" title="Filters" size="sm" :divided="false" class="filter-sheet">
    <div class="filters__tabs" role="tablist" aria-label="Filter categories">
      <button
        v-for="t in tabs"
        :key="t.value"
        type="button"
        role="tab"
        class="filters__tab"
        :class="{ 'is-active': tab === t.value }"
        :aria-selected="tab === t.value"
        @click="tab = t.value"
      >
        {{ t.label }}
        <span v-if="t.value !== 'price' && staged[t.value].length" class="filters__count">{{ staged[t.value].length }}</span>
      </button>
    </div>

    <div class="filters__panel" role="tabpanel">
      <template v-if="tab === 'location'">
        <label class="filters__search">
          <AppIcon name="search" :size="18" />
          <span class="sr-only">Search location</span>
          <input v-model="locationSearch" type="search" placeholder="Search location..." />
        </label>
        <ul class="filters__list" role="list">
          <li v-for="loc in locations" :key="loc" :class="{ 'is-checked': staged.location.includes(loc) }">
            <AppCheckbox :model-value="staged.location.includes(loc)" :label="loc" @update:model-value="toggle('location', loc, $event)" />
          </li>
          <li v-if="!locations.length" class="filters__empty">No matching locations</li>
        </ul>
      </template>

      <ul v-else-if="tab === 'listing_type' || tab === 'property_type'" class="filters__list" role="list">
        <li v-for="opt in listOptions" :key="opt.value" :class="{ 'is-checked': staged[tab].includes(opt.value) }">
          <AppCheckbox :model-value="staged[tab].includes(opt.value)" :label="opt.label" @update:model-value="toggle(tab as 'listing_type', opt.value, $event)" />
        </li>
      </ul>

      <ul v-else class="filters__list" role="radiogroup" aria-label="Price range">
        <li v-for="r in priceRanges" :key="r.label" :class="{ 'is-checked': staged.price === r.label }">
          <label class="filters__radio">
            <input v-model="staged.price" type="radio" name="price" :value="r.label" />
            {{ r.label }}
          </label>
        </li>
      </ul>
    </div>

    <template #footer>
      <div class="filters__actions">
        <AppButton variant="secondary" size="lg" class="filters__reset" @click="reset">Reset</AppButton>
        <AppButton size="lg" class="filters__apply" :loading="counting && count === null" @click="apply">
          Show {{ count === null ? '' : formatNumber(count) }} results
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>

<style scoped>



.filters__tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
  margin: 0 -32px;
  padding: 0 32px 4px;
}

.filters__tabs::-webkit-scrollbar {
  display: none;
}

.filters__tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding: 8px 16px;
  border-radius: var(--radius-pill);
  border: 1px solid transparent;
  background: #f3f4f6;
  font-size: var(--text-sm);
  color: var(--color-muted);
}

.filters__tab.is-active {
  border-color: #1f2d10;
  background: #eaf4dc;
  color: #1f2d10;
  font-weight: 600;
}

.filters__count {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: var(--color-primary);
  color: #fff;
  font-size: 11px;
  line-height: 18px;
}

.filters__panel {
  min-height: 300px;
  padding-top: 20px;
}

.filters__search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  padding: 0 12px;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  background: var(--color-page);
  color: var(--color-muted);
}

.filters__search input {
  flex: 1;
  border: 0;
  background: transparent;
  outline: 0;
  font-size: var(--text-sm);
}

.filters__list {
  display: grid;
  gap: 4px;
  margin-top: 12px;
}

.filters__list li {
  padding: 10px 12px;
  border-radius: var(--radius-md);
}

.filters__list li.is-checked {
  background: #eef6e6;
}

.filters__radio {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: var(--text-sm);
  cursor: pointer;
}

.filters__radio input {
  accent-color: var(--color-primary);
  width: 18px;
  height: 18px;
}

.filters__empty {
  color: var(--color-muted);
  font-size: var(--text-sm);
}

.filters__actions {
  display: grid;
  grid-template-columns: 1fr 1.3fr;
  gap: 12px;
}

.filters__reset {
  --btn-border: #1f2d10;
  font-weight: 700;
}

.filters__apply {
  --btn-bg: #14200a;
  --btn-border: #14200a;
  --btn-bg-hover: #253914;
  font-weight: 700;
}

@media (max-width: 767px) {
  .filters__tabs {
    margin: 0 -16px;
    padding: 0 16px 4px;
  }
}
</style>

<style>
/* Unscoped: these target AppModal internals, which render in a Teleport. */
.filter-sheet .modal__panel {
  max-width: 440px;
}
.filter-sheet .modal__title {
  font-size: var(--text-xl);
  font-weight: 400;
}
.filter-sheet .modal__close {
  background: #f3f3f3;
}
</style>
