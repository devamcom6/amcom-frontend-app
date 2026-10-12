<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from '@/components/base/AppIcon.vue'

/**
 * Embedded map for a property/estate location. Uses the keyless Google Maps embed
 * (no API key in the frontend). Zoom buttons re-centre the embed; "expand" opens Google Maps.
 */
const props = withDefaults(
  defineProps<{ title: string; label: string; latitude: number | null; longitude: number | null; height?: number }>(),
  { height: 540 },
)

const zoom = ref(14)
const query = computed(() =>
  props.latitude !== null && props.longitude !== null ? `${props.latitude},${props.longitude}` : encodeURIComponent(props.label),
)
const src = computed(() => `https://maps.google.com/maps?q=${query.value}&z=${zoom.value}&output=embed`)
const external = computed(() => `https://www.google.com/maps/search/?api=1&query=${query.value}`)
const active = ref(false)
</script>

<template>
  <section class="map" :aria-labelledby="`map-title`">
    <h2 id="map-title" class="map__title">{{ title }}</h2>
    <p class="map__label">{{ label }}</p>
    <div class="map__frame" :style="{ '--map-h': `${height}px` }">
      <iframe
        v-if="active"
        :src="src"
        :title="`Map showing ${label}`"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        allowfullscreen
      />
      <button v-else type="button" class="map__placeholder" @click="active = true">
        <AppIcon name="map-pin" :size="28" />
        <span>Load interactive map</span>
        <small>{{ label }}</small>
      </button>
      <a :href="external" target="_blank" rel="noopener noreferrer" class="map__ctrl map__ctrl--search" aria-label="Search this area on Google Maps">
        <AppIcon name="search" :size="22" />
      </a>
      <a :href="external" target="_blank" rel="noopener noreferrer" class="map__ctrl map__ctrl--expand" aria-label="Open in Google Maps">
        <AppIcon name="maximize" :size="22" />
      </a>
      <div v-if="active" class="map__zoom">
        <button type="button" aria-label="Zoom in" @click="zoom = Math.min(zoom + 1, 20)"><AppIcon name="plus" :size="22" /></button>
        <button type="button" aria-label="Zoom out" @click="zoom = Math.max(zoom - 1, 3)"><AppIcon name="minus" :size="22" /></button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.map__title {
  font-size: var(--text-xl);
  font-weight: 400;
  color: var(--color-ink);
}

.map__label {
  margin-top: 6px;
  color: var(--color-body);
}

.map__frame {
  position: relative;
  height: var(--map-h);
  margin-top: 24px;
  border-radius: var(--radius-xl);
  overflow: hidden;
  background: #e8eae6 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cpath d='M0 60h120M60 0v120' stroke='%23d9dcd6' stroke-width='6'/%3E%3Cpath d='M0 20h120M0 100h120M20 0v120M100 0v120' stroke='%23f4f4f0' stroke-width='3'/%3E%3C/svg%3E");
}

.map__frame iframe {
  width: 100%;
  height: 100%;
  border: 0;
}

.map__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 100%;
  color: var(--color-primary);
  font-weight: 500;
}

.map__placeholder small {
  color: var(--color-muted);
  font-weight: 400;
}

.map__ctrl {
  position: absolute;
  top: 18px;
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-bg);
  box-shadow: var(--shadow-sm);
  color: var(--color-ink);
}

.map__ctrl--search {
  left: 18px;
}

.map__ctrl--expand {
  right: 18px;
}

.map__zoom {
  position: absolute;
  right: 18px;
  top: 100px;
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-pill);
  background: var(--color-bg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.map__zoom button {
  display: grid;
  place-items: center;
  width: 56px;
  height: 64px;
  color: var(--color-ink);
}

@media (max-width: 767px) {
  .map__frame {
    height: 240px;
    margin-top: 16px;
  }

  .map__ctrl {
    width: 44px;
    height: 44px;
    top: 12px;
  }

  .map__ctrl--search {
    left: 12px;
  }

  .map__ctrl--expand {
    right: 12px;
  }

  .map__zoom {
    top: 64px;
    right: 12px;
  }

  .map__zoom button {
    width: 44px;
    height: 48px;
  }
}
</style>
