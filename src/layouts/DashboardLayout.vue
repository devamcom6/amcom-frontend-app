<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SiteHeader from '@/components/layout/SiteHeader.vue'

const route = useRoute()

const tabs = [
  { to: '/dashboard/buyback', label: 'Buyback', name: 'dashboard-buyback' },
  { to: '/dashboard/capital-investment', label: 'Capital Investment', name: 'dashboard-capital' },
  { to: '/dashboard/property-management', label: 'Property Management', name: 'dashboard-property' },
  { to: '/dashboard/settings/profile', label: 'Settings', name: 'dashboard-settings' },
]

/** Overview pages show the "Your Dashboard" header + pill tabs; detail pages use a Back link instead. */
const showOverviewHeader = computed(() => tabs.some((t) => t.name === route.name))
</script>

<template>
  <SiteHeader />
  <main id="main" class="dash" tabindex="-1">
    <section v-if="showOverviewHeader" class="dash__hero">
      <div class="container container--narrow">
        <h1 class="dash__title">Your Dashboard</h1>
        <p class="dash__subtitle">Your investments and properties, side by side.</p>
        <nav class="dash__tabs" aria-label="Dashboard sections">
          <RouterLink
            v-for="tab in tabs"
            :key="tab.to"
            :to="tab.to"
            class="dash__tab"
            :class="{ 'is-active': route.name === tab.name }"
            :aria-current="route.name === tab.name ? 'page' : undefined"
          >
            {{ tab.label }}
          </RouterLink>
        </nav>
      </div>
    </section>
    <div class="dash__body container container--narrow">
      <RouterView />
    </div>
  </main>
</template>

<style scoped>
.dash {
  flex: 1;
  padding-bottom: 80px;
}

.dash:focus {
  outline: none;
}

.dash__hero {
  padding-top: 32px;
  border-bottom: 1px solid var(--color-border);
}

.dash__title {
  font-size: var(--text-xl);
  font-weight: 600;
  color: #111827;
}

.dash__subtitle {
  margin-top: 6px;
  font-size: var(--text-sm);
  color: var(--color-muted);
}

.dash__tabs {
  display: flex;
  gap: 16px;
  padding: 28px 0 24px;
  overflow-x: auto;
  scrollbar-width: none;
}

.dash__tabs::-webkit-scrollbar {
  display: none;
}

.dash__tab {
  flex-shrink: 0;
  padding: 6px 15px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  font-size: var(--text-sm);
  color: var(--color-ink);
  transition:
    background-color var(--duration-fast) var(--ease),
    color var(--duration-fast) var(--ease);
}

.dash__tab:hover {
  border-color: var(--color-terracotta);
}

.dash__tab.is-active {
  border-color: var(--color-terracotta);
  background: var(--color-terracotta);
  color: var(--color-inverse);
  font-weight: 500;
}

.dash__body {
  padding-top: 40px;
}

@media (max-width: 767px) {
  .dash__hero {
    padding-top: 24px;
    border-bottom: 0;
  }

  .dash__title {
    font-size: var(--text-lg);
  }

  .dash__subtitle {
    font-size: var(--text-xs);
  }

  .dash__tabs {
    gap: 8px;
    padding: 16px 0 8px;
    margin-right: calc(var(--gutter) * -1);
  }

  .dash__tab {
    padding: 8px 14px;
    font-size: var(--text-sm);
  }

  .dash__body {
    padding-top: 16px;
  }
}
</style>
