<script setup lang="ts">
import AppIcon from '@/components/base/AppIcon.vue'

/** Search + filter row above admin tables (filters go in the default slot). */
defineProps<{ placeholder?: string; selectedCount?: number }>()
const search = defineModel<string>('search', { default: '' })
</script>

<template>
  <div class="toolbar">
    <label class="toolbar__search">
      <AppIcon name="search" :size="18" />
      <span class="sr-only">Search</span>
      <input v-model="search" type="search" :placeholder="placeholder ?? 'Search…'" />
    </label>
    <div class="toolbar__filters"><slot /></div>
    <div v-if="selectedCount" class="toolbar__bulk" role="region" aria-label="Bulk actions">
      <span>{{ selectedCount }} selected</span>
      <slot name="bulk" />
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.toolbar__search {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1 1 260px;
  max-width: 360px;
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  color: var(--color-muted);
}

.toolbar__search:focus-within {
  border-color: var(--color-primary);
  box-shadow: var(--focus-ring);
}

.toolbar__search input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  font-size: var(--text-sm);
}

.toolbar__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}


.toolbar__bulk {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  background: var(--color-primary-soft);
  font-size: var(--text-sm);
  font-weight: 500;
}

@media (max-width: 767px) {
  .toolbar__search {
    max-width: none;
  }
  .toolbar__filters {
    width: 100%;
  }
  .toolbar__filters > * {
    flex: 1;
  }
}
</style>
