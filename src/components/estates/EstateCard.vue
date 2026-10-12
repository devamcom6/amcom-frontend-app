<script setup lang="ts">
import AppIcon from '@/components/base/AppIcon.vue'
import AppImage from '@/components/base/AppImage.vue'
import type { EstateSummary } from '@/types'
import { formatNaira } from '@/utils/format'

defineProps<{ estate: EstateSummary }>()
</script>

<template>
  <article class="estate-card">
    <AppImage
      :media="estate.cover_image"
      ratio="415/320"
      sizes="(max-width: 767px) 100vw, (max-width: 1199px) 50vw, 420px"
      class="estate-card__image"
    />
    <div class="estate-card__body">
      <h3 class="estate-card__title">
        <RouterLink :to="{ name: 'estate-detail', params: { slug: estate.slug } }" class="estate-card__link">
          {{ estate.name }}
        </RouterLink>
      </h3>
      <p class="estate-card__meta"><AppIcon name="map-pin" :size="16" /> {{ estate.location.city }}, {{ estate.location.state }}</p>
      <p class="estate-card__meta"><AppIcon name="area" :size="16" /> {{ estate.size_sqm }} sqm</p>
      <dl class="estate-card__terms">
        <div>
          <dt>Tenure</dt>
          <dd>{{ estate.tenure_min_months }}-{{ estate.tenure_max_months }} months</dd>
        </div>
        <div>
          <dt>ROI</dt>
          <dd>Up to {{ estate.roi_max_percent }}%</dd>
        </div>
      </dl>
      <div class="estate-card__foot">
        <p class="estate-card__price">{{ formatNaira(estate.price_from) }}</p>
        <span class="estate-card__cta" aria-hidden="true">View details <AppIcon name="arrow-right" :size="18" /></span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.estate-card {
  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  overflow: hidden;
  transition:
    box-shadow var(--duration) var(--ease),
    transform var(--duration) var(--ease);
}

.estate-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.estate-card:focus-within {
  box-shadow: var(--focus-ring);
}

.estate-card__body {
  padding: 20px 20px 18px;
}

.estate-card__title {
  font-size: var(--text-lg);
  font-weight: 400;
}

/* Whole card is clickable via the heading link. */
.estate-card__link::after {
  content: '';
  position: absolute;
  inset: 0;
}

.estate-card__link:focus-visible {
  outline: none;
}

.estate-card__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  font-size: var(--text-sm);
  color: var(--color-body);
}

.estate-card__terms {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin: 14px 0 0;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border-subtle);
}

.estate-card__terms dt {
  font-size: var(--text-xs);
  color: var(--color-body);
}

.estate-card__terms dd {
  margin: 2px 0 0;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-ink);
}

.estate-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
}

.estate-card__price {
  font-size: var(--text-xl);
  font-weight: 500;
  color: #1f4f45;
}

.estate-card__cta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: var(--text-sm);
  color: var(--color-primary);
  padding-right: 12px;
}

@media (max-width: 767px) {
  .estate-card__price {
    color: var(--color-maroon);
  }
}
</style>
