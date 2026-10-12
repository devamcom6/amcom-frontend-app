<script setup lang="ts">
import type { ListingType } from '@/types'

defineProps<{ type: ListingType }>()
const LABEL: Record<ListingType, string> = { sale: 'For Sale', rent: 'For Rent', lease: 'For Lease' }
</script>

<template>
  <span class="ltype" :class="`ltype--${type}`">{{ LABEL[type] }}</span>
</template>

<style scoped>
.ltype {
  display: inline-flex;
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  border: 1px solid;
  background: #fbfff6;
  font-size: var(--text-xs);
  font-weight: 600;
}

.ltype--sale {
  color: #4caf1a;
  border-color: #82c341;
  background: #f4fbec;
}

.ltype--rent {
  color: #1d4ed8;
  border-color: #93b4f5;
  background: #f1f6ff;
}

.ltype--lease {
  color: #d97706;
  border-color: #fbbf24;
  background: #fffbeb;
}
</style>
