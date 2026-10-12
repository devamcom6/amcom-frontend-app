<script setup lang="ts">
import AppIcon from '@/components/base/AppIcon.vue'
import AppImage from '@/components/base/AppImage.vue'
import ListingTypeBadge from './ListingTypeBadge.vue'
import type { PropertySummary } from '@/types'
import { formatPrice } from '@/utils/format'

defineProps<{ property: PropertySummary }>()
</script>

<template>
  <article class="pcard">
    <div class="pcard__media">
      <AppImage :media="property.cover_image" ratio="389/180" sizes="(max-width: 767px) 100vw, 400px" />
      <ListingTypeBadge :type="property.listing_type" class="pcard__badge" />
    </div>
    <div class="pcard__body">
      <h3 class="pcard__title">
        <RouterLink :to="{ name: 'property-detail', params: { slug: property.slug } }" class="pcard__link">{{ property.title }}</RouterLink>
      </h3>
      <p class="pcard__address"><AppIcon name="map-pin" :size="18" /> {{ property.address }}</p>
      <ul class="pcard__facts" role="list">
        <li v-if="property.bedrooms">{{ property.bedrooms }} Beds</li>
        <li v-if="property.bathrooms">{{ property.bathrooms }} Baths</li>
        <li v-if="property.size_sqm">{{ property.size_sqm }} sqm</li>
      </ul>
      <div class="pcard__foot">
        <p class="pcard__price">{{ formatPrice(property.price, property.price_period) }}</p>
        <span class="pcard__cta" aria-hidden="true">View details <AppIcon name="arrow-right" :size="18" /></span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.pcard {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  overflow: hidden;
  transition:
    box-shadow var(--duration) var(--ease),
    transform var(--duration) var(--ease);
}

.pcard:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.pcard:focus-within {
  box-shadow: var(--focus-ring);
}

.pcard__media {
  position: relative;
}

.pcard__badge {
  position: absolute;
  top: 16px;
  left: 16px;
}

.pcard__body {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 20px 20px 18px;
}

.pcard__title {
  font-size: var(--text-lg);
  font-weight: 400;
  color: var(--color-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pcard__link::after {
  content: '';
  position: absolute;
  inset: 0;
}

.pcard__link:focus-visible {
  outline: none;
}

.pcard__address {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  font-size: var(--text-sm);
  color: var(--color-body);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.pcard__facts {
  display: flex;
  gap: 0;
  margin-top: 10px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--color-border-subtle);
  font-size: var(--text-xs);
  color: var(--color-body);
}

.pcard__facts li + li::before {
  content: '•';
  margin: 0 16px;
}

.pcard__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: auto;
  padding-top: 16px;
}

.pcard__price {
  font-size: var(--text-xl);
  font-weight: 500;
  color: var(--color-maroon);
}

.pcard__cta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: var(--text-sm);
  color: var(--color-primary);
  white-space: nowrap;
}
</style>
