<script setup lang="ts">
import { ref, watch } from 'vue'
import AppBackLink from '@/components/base/AppBackLink.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppErrorState from '@/components/base/AppErrorState.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import AppImage from '@/components/base/AppImage.vue'
import AppSkeleton from '@/components/base/AppSkeleton.vue'
import GalleryModal from '@/components/properties/GalleryModal.vue'
import LocationMap from '@/components/properties/LocationMap.vue'
import { config } from '@/config/env'
import { useAsync } from '@/composables/useAsync'
import { buybackService } from '@/services/api'

const props = defineProps<{ slug: string }>()
const { data: estate, loading, error, execute } = useAsync(() => buybackService.estate(props.slug), {
  watch: [() => props.slug],
})
const galleryOpen = ref(false)

watch(estate, (e) => e && (document.title = `${e.name} | ${config.appName}`))
</script>

<template>
  <div class="estate">
    <div class="container">
      <AppBackLink fallback="/buyback" class="estate__back" />

      <div v-if="loading && !estate" class="estate__grid">
        <div class="estate__info"><AppSkeleton height="40px" width="60%" /><AppSkeleton :lines="6" /></div>
        <AppSkeleton height="420px" radius="12px" />
      </div>

      <AppErrorState v-else-if="error" :error="error" class="estate__error" @retry="execute">
        <AppButton variant="link" to="/buyback">Browse all estates</AppButton>
      </AppErrorState>

      <template v-else-if="estate">
        <div class="estate__grid">
          <div class="estate__info">
            <h1 class="estate__title">{{ estate.name }}</h1>
            <p class="estate__meta">
              <span><AppIcon name="map-pin" :size="18" /> {{ estate.location.address }} {{ estate.location.city }}, {{ estate.location.state }}</span>
              <span><AppIcon name="area" :size="18" /> {{ estate.size_sqm }} sqm</span>
            </p>
            <p class="estate__desc">{{ estate.description }}</p>
            <dl class="estate__facts">
              <div>
                <dt>ROI Range</dt>
                <dd>{{ estate.roi_min_percent }}%-{{ estate.roi_max_percent }}%</dd>
              </div>
              <div>
                <dt>Available Plots</dt>
                <dd>{{ estate.available_plots }}</dd>
              </div>
            </dl>
            <AppButton
              class="estate__cta hide-mobile"
              :to="{ name: 'buyback-checkout', params: { slug: estate.slug } }"
              :disabled="!estate.available_plots"
              icon-right="arrow-right"
              size="lg"
            >
              {{ estate.available_plots ? 'Start Investing' : 'Sold out' }}
            </AppButton>
          </div>

          <div class="estate__media">
            <div class="estate__frame">
              <AppImage :media="estate.gallery[0] ?? estate.cover_image" ratio="608/408" sizes="(max-width: 767px) 100vw, 610px" eager rounded="8px" />
              <button type="button" class="estate__expand" aria-label="Open photo gallery" @click="galleryOpen = true">
                <AppIcon name="expand" :size="26" />
              </button>
            </div>
            <AppButton
              class="estate__select hide-desktop"
              variant="secondary"
              block
              size="lg"
              icon-right="arrow-right"
              :to="{ name: 'buyback-checkout', params: { slug: estate.slug } }"
              :disabled="!estate.available_plots"
            >
              Select plots
            </AppButton>
          </div>
        </div>

        <LocationMap
          class="estate__map"
          title="Location"
          :label="`${estate.location.address ?? ''}, ${estate.location.city} ${estate.location.state.replace(' State', '')}`.replace(/^, /, '')"
          :latitude="estate.location.latitude"
          :longitude="estate.location.longitude"
        />

        <GalleryModal v-model:open="galleryOpen" :images="estate.gallery" />
      </template>
    </div>
  </div>
</template>

<style scoped>
.estate {
  padding: 14px 0 96px;
}

.estate__back {
  margin-left: 16px;
}

.estate__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 624px);
  gap: 56px;
  align-items: start;
  margin-top: 64px;
}

.estate__info {
  display: grid;
  gap: 0;
  justify-items: start;
}

.estate__title {
  font-size: 2rem;
  font-weight: 700;
  color: #1c2a0c;
}

.estate__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
  margin-top: 18px;
  font-size: var(--text-md);
  text-transform: uppercase;
  color: var(--color-body);
}

.estate__meta span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.estate__desc {
  margin-top: 28px;
  font-size: var(--text-md);
  line-height: 1.35;
  color: var(--color-body);
}

.estate__facts {
  display: flex;
  margin: 28px 0 0;
}

.estate__facts > div {
  padding: 0 72px 0 16px;
}

.estate__facts > div + div {
  border-left: 1px solid var(--color-border);
  padding-left: 16px;
}

.estate__facts dt {
  font-size: var(--text-sm);
  color: var(--color-body);
}

.estate__facts dd {
  margin: 8px 0 0;
  font-size: var(--text-xl);
  font-weight: 700;
  color: #1c2a0c;
}

.estate__cta {
  margin-top: 28px;
  min-width: 169px;
}

.estate__frame {
  position: relative;
  padding: 8px;
  border: 1px solid #44542a;
  border-radius: var(--radius-md);
}

.estate__expand {
  position: absolute;
  top: 28px;
  right: 28px;
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(4px);
  color: var(--color-inverse);
}

.estate__expand:hover {
  background: rgba(255, 255, 255, 0.75);
  color: var(--color-ink);
}

.estate__map {
  margin-top: 140px;
}

.estate__error {
  margin-top: 48px;
}

@media (max-width: 1023px) {
  .estate__grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}

@media (max-width: 767px) {
  .estate {
    padding-bottom: 48px;
  }

  .estate__back {
    margin-left: 0;
  }

  .estate__grid {
    margin-top: 32px;
  }

  .estate__title {
    font-size: var(--text-2xl);
  }

  .estate__meta {
    margin-top: 12px;
    font-size: var(--text-base);
  }

  .estate__desc {
    margin-top: 16px;
    font-size: var(--text-base);
    line-height: 1.5;
  }

  .estate__facts {
    margin-top: 24px;
  }

  .estate__facts > div {
    padding-right: 72px;
  }

  .estate__facts > div + div {
    border-left: 0;
  }

  .estate__expand {
    top: 20px;
    right: 20px;
  }

  .estate__select {
    margin-top: 16px;
    font-weight: 400;
  }

  .estate__map {
    margin-top: 56px;
  }
}
</style>
