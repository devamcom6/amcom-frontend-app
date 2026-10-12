<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppBackLink from '@/components/base/AppBackLink.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppErrorState from '@/components/base/AppErrorState.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import AppImage from '@/components/base/AppImage.vue'
import AppSkeleton from '@/components/base/AppSkeleton.vue'
import ApplicationModal from '@/components/properties/ApplicationModal.vue'
import GalleryModal from '@/components/properties/GalleryModal.vue'
import InspectionModal from '@/components/properties/InspectionModal.vue'
import ListingTypeBadge from '@/components/properties/ListingTypeBadge.vue'
import LocationMap from '@/components/properties/LocationMap.vue'
import PropertyCard from '@/components/properties/PropertyCard.vue'
import { config } from '@/config/env'
import { useAsync } from '@/composables/useAsync'
import { propertyService } from '@/services/api'
import { formatPrice } from '@/utils/format'

const props = defineProps<{ slug: string }>()

const { data: property, loading, error, execute } = useAsync(() => propertyService.detail(props.slug), { watch: [() => props.slug] })
const { data: similar } = useAsync(() => propertyService.similar(props.slug), { watch: [() => props.slug] })

const galleryOpen = ref(false)
const galleryStart = ref(0)
const applyOpen = ref(false)
const inspectOpen = ref(false)
const showFullDescription = ref(false)
const showAllFeatures = ref(false)
const rail = ref<HTMLElement | null>(null)

const features = computed(() => (showAllFeatures.value ? property.value?.features : property.value?.features.slice(0, 13)) ?? [])

watch(property, (p) => {
  if (!p) return
  document.title = `${p.title} | ${config.appName}`
  showFullDescription.value = false
  showAllFeatures.value = false
})

function openGallery(i = 0) {
  galleryStart.value = i
  galleryOpen.value = true
}

function scrollRail(dir: 1 | -1) {
  const el = rail.value
  if (!el) return
  el.scrollBy({ left: dir * Math.min(el.clientWidth, 420), behavior: 'smooth' })
}
</script>

<template>
  <div class="pd">
    <div class="container">
      <AppBackLink fallback="/properties" class="pd__back hide-mobile" />

      <div v-if="loading && !property" class="pd__loading">
        <AppSkeleton height="504px" radius="8px" />
        <AppSkeleton height="32px" width="50%" />
        <AppSkeleton :lines="5" />
      </div>
      <AppErrorState v-else-if="error" :error="error" class="pd__error" @retry="execute">
        <AppButton variant="link" to="/properties">Browse all properties</AppButton>
      </AppErrorState>
    </div>

    <template v-if="property">
      <!-- Gallery -->
      <div class="container pd__gallery-wrap">
        <div class="pd__gallery">
          <button type="button" class="pd__main" aria-label="Open photo gallery" @click="openGallery(0)">
            <AppImage :media="property.gallery[0] ?? property.cover_image" ratio="830/504" sizes="(max-width: 767px) 100vw, 830px" eager />
            <span class="pd__expand hide-mobile" aria-hidden="true"><AppIcon name="expand" :size="20" /></span>
          </button>
          <button v-for="i in [1, 2]" :key="i" type="button" class="pd__side hide-mobile" :aria-label="`Open photo ${i + 1}`" @click="openGallery(i)">
            <AppImage :media="property.gallery[i]" ratio="470/246" sizes="470px" />
          </button>
          <AppBackLink fallback="/properties" label="" class="pd__back-mobile hide-desktop" />
          <button type="button" class="pd__all" @click="openGallery(0)">
            Show all photos<span class="hide-mobile"> and videos</span>
          </button>
        </div>
      </div>

      <div class="container pd__layout">
        <div class="pd__main-col">
          <header class="pd__head">
            <div class="pd__title-row">
              <h1 class="pd__title">{{ property.title }}</h1>
              <ListingTypeBadge :type="property.listing_type" />
            </div>
            <p class="pd__loc"><AppIcon name="map-pin" :size="18" /> {{ property.location_label }}</p>
            <p class="pd__price pd__price--mobile hide-desktop">{{ formatPrice(property.price, property.price_period) }}</p>
          </header>

          <section class="pd__section" aria-labelledby="about-title">
            <h2 id="about-title" class="pd__h2">About this property</h2>
            <p id="pd-desc" class="pd__desc" :class="{ 'is-clamped': !showFullDescription }">{{ property.description }}</p>
            <button type="button" class="pd__toggle" aria-controls="pd-desc" :aria-expanded="showFullDescription" @click="showFullDescription = !showFullDescription">
              {{ showFullDescription ? 'Show less' : 'Show more' }}
            </button>
          </section>

          <section class="pd__section" aria-labelledby="features-title">
            <h2 id="features-title" class="pd__h2">Property features</h2>
            <ul class="pd__features" role="list">
              <li v-for="f in features" :key="f">{{ f }}</li>
            </ul>
            <button
              v-if="property.features.length > 13"
              type="button"
              class="pd__toggle"
              :aria-expanded="showAllFeatures"
              @click="showAllFeatures = !showAllFeatures"
            >
              {{ showAllFeatures ? 'Show fewer features' : 'Show all features' }}
            </button>
          </section>

          <LocationMap
            class="pd__section"
            title="Location"
            :label="property.location_label"
            :latitude="property.latitude"
            :longitude="property.longitude"
            :height="348"
          />
        </div>

        <aside class="pd__aside hide-mobile">
          <div class="pd__card">
            <p class="pd__price">{{ formatPrice(property.price, property.price_period) }}</p>
            <div class="pd__interest">
              <p class="pd__interest-title">Interested in this property?</p>
              <p class="pd__interest-text">Click below to get started or contact us for more details</p>
            </div>
            <AppButton size="lg" block class="pd__cta" @click="applyOpen = true">Start application</AppButton>
            <AppButton size="lg" block variant="outline" icon-left="calendar" class="pd__cta" @click="inspectOpen = true">Book inspection</AppButton>
            <p class="pd__terms">By continuing you agree to the Property Terms, Platform Terms of Use, and Privacy Policy.</p>
          </div>
          <RouterLink to="/contact" class="pd__contact"><AppIcon name="message" :size="20" /> Contact us</RouterLink>
        </aside>
      </div>

      <section v-if="similar?.length" class="container pd__similar" aria-labelledby="similar-title">
        <div class="pd__similar-head">
          <h2 id="similar-title" class="pd__similar-title">Similar properties</h2>
          <div class="pd__rail-nav">
            <button type="button" aria-label="Scroll left" @click="scrollRail(-1)"><AppIcon name="chevron-left" /></button>
            <button type="button" aria-label="Scroll right" @click="scrollRail(1)"><AppIcon name="chevron-right" /></button>
          </div>
        </div>
        <ul ref="rail" class="pd__rail" role="list">
          <li v-for="p in similar" :key="p.id"><PropertyCard :property="p" /></li>
        </ul>
      </section>

      <div class="pd__mobile-bar hide-desktop">
        <AppButton size="lg" block @click="applyOpen = true">Start application</AppButton>
        <AppButton size="lg" block variant="outline" icon-left="calendar" @click="inspectOpen = true">Book inspection</AppButton>
        <p class="pd__terms">By continuing you agree to the Property Terms, Platform Terms of Use, and Privacy Policy.</p>
      </div>

      <GalleryModal v-model:open="galleryOpen" :images="property.gallery" :start-index="galleryStart" />
      <ApplicationModal v-model:open="applyOpen" :property="property" />
      <InspectionModal v-model:open="inspectOpen" :property="property" />
    </template>
  </div>
</template>

<style scoped>
.pd {
  padding: 22px 0 80px;
}

.pd__back {
  margin-left: 16px;
}

.pd__loading {
  display: grid;
  gap: 16px;
  margin-top: 32px;
}

.pd__error {
  margin-top: 32px;
}

.pd__gallery-wrap {
  margin-top: 30px;
}

.pd__gallery {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 830fr) minmax(0, 470fr);
  grid-template-rows: auto auto;
  gap: 10px 12px;
}

.pd__main {
  position: relative;
  grid-row: 1 / span 2;
  border-radius: var(--radius-md);
  overflow: hidden;
}

.pd__main :deep(.img) {
  height: 100%;
}

.pd__side {
  border-radius: var(--radius-md);
  overflow: hidden;
}

.pd__expand {
  position: absolute;
  top: 12px;
  right: 18px;
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  color: var(--color-ink);
}

.pd__all {
  position: absolute;
  right: 8px;
  bottom: 8px;
  padding: 12px 24px;
  border-radius: var(--radius-sm);
  background: #f1f1f4;
  font-size: var(--text-sm);
  color: var(--color-ink);
}

.pd__all:hover {
  background: #fff;
}

.pd__layout {
  display: grid;
  grid-template-columns: minmax(0, 764px) minmax(0, 500px);
  justify-content: space-between;
  gap: 48px;
  margin-top: 44px;
}

.pd__head {
  padding-bottom: 40px;
  border-bottom: 1px solid var(--color-border);
}

.pd__title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.pd__title {
  font-size: var(--text-xl);
  font-weight: 400;
}

.pd__loc {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  color: var(--color-body);
}

.pd__section {
  padding: 40px 0;
  border-bottom: 1px solid var(--color-border);
}

.pd__section:last-child {
  border-bottom: 0;
}

.pd__h2 {
  font-size: var(--text-xl);
  font-weight: 400;
}

.pd__desc {
  margin-top: 28px;
  font-size: var(--text-md);
  line-height: 1.6;
  color: var(--color-body);
}

.pd__desc.is-clamped {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.pd__toggle {
  margin-top: 24px;
  padding: 12px 24px;
  border-radius: var(--radius-sm);
  background: #ededf2;
  font-size: var(--text-sm);
  color: var(--color-ink);
}

.pd__features {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
}

.pd__features li {
  padding: 5px 11px;
  border: 1px solid #c7cbd1;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--color-ink);
}

.pd__aside {
  position: sticky;
  top: calc(var(--header-height) + 24px);
  align-self: start;
}

.pd__card {
  display: grid;
  gap: 14px;
  padding: 24px 24px 22px;
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  box-shadow: 0 0 0 1px rgba(16, 24, 40, 0.03), 0 8px 28px rgba(16, 24, 40, 0.08);
}

.pd__price {
  font-size: 2rem;
  font-weight: 700;
  color: #2a6a59;
}

.pd__interest {
  margin-bottom: 10px;
  padding: 10px 12px;
  border: 1px solid #cdd1d6;
  border-radius: var(--radius-sm);
}

.pd__interest-title {
  font-size: var(--text-base);
}

.pd__interest-text {
  margin-top: 4px;
  font-size: var(--text-xs);
  color: var(--color-body);
}

.pd__cta {
  font-weight: 600;
  border-radius: var(--radius-sm);
}

.pd__terms {
  margin-top: 12px;
  font-size: 10px;
  text-align: center;
  color: var(--color-muted);
}

.pd__contact {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 64px;
  font-weight: 500;
  color: var(--color-primary);
}

.pd__similar {
  padding-top: 32px;
  margin-top: 32px;
  border-top: 1px solid var(--color-border);
}

.pd__similar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pd__similar-title {
  font-size: var(--text-xl);
  font-weight: 500;
}

.pd__rail-nav {
  display: flex;
  gap: 12px;
}

.pd__rail-nav button {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #f3f3ee;
  color: var(--color-ink);
}

.pd__rail {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(300px, 389px);
  gap: 24px;
  margin: 36px calc(var(--gutter) * -1) 0 0;
  padding-bottom: 8px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}

.pd__rail::-webkit-scrollbar {
  display: none;
}

.pd__rail > li {
  scroll-snap-align: start;
}

.pd__mobile-bar {
  display: none;
}

@media (max-width: 1023px) {
  .pd__layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 767px) {
  .pd {
    padding-top: 0;
    padding-bottom: 0;
  }

  .pd__gallery-wrap {
    margin-top: 0;
    padding: 0;
  }

  .pd__gallery {
    grid-template-columns: 1fr;
  }

  .pd__main {
    border-radius: 0;
  }

  .pd__main :deep(.img) {
    aspect-ratio: 402 / 260 !important;
  }

  .pd__back-mobile {
    position: absolute;
    top: 20px;
    left: 20px;
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    padding: 0;
    border-radius: var(--radius-sm);
    background: rgba(255, 255, 255, 0.92);
  }

  .pd__all {
    right: 10px;
    bottom: 10px;
    border-radius: var(--radius-sm);
  }

  .pd__layout {
    margin-top: 16px;
    gap: 0;
  }

  .pd__head {
    padding-bottom: 0;
    border-bottom: 0;
  }

  .pd__title-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .pd__title {
    font-size: 1.4rem;
  }

  .pd__loc {
    margin-top: 16px;
    font-size: var(--text-sm);
  }

  .pd__price--mobile {
    margin-top: 12px;
    font-size: 1.75rem;
  }

  .pd__section {
    padding: 16px 0;
    border-bottom: 0;
  }

  .pd__h2 {
    font-size: var(--text-xl);
  }

  .pd__desc {
    margin-top: 16px;
    font-size: var(--text-sm);
  }

  .pd__toggle {
    display: block;
    width: 100%;
    margin-top: 16px;
  }

  .pd__features {
    gap: 8px;
    margin-top: 12px;
  }

  .pd__similar {
    border-top: 0;
    margin-top: 0;
    padding-bottom: 32px;
  }

  .pd__rail {
    grid-auto-columns: 80%;
    gap: 16px;
    margin-top: 24px;
  }

  .pd__mobile-bar {
    position: sticky;
    bottom: 0;
    z-index: 15;
    display: grid;
    gap: 12px;
    padding: 16px var(--gutter) calc(12px + env(safe-area-inset-bottom));
    background: var(--color-bg);
    border-top: 1px solid var(--color-border-subtle);
  }
}
</style>
