<script setup lang="ts">
import { onMounted } from 'vue'
import { useLookupStore } from '@/stores/lookups'

/**
 * "Terms of Service" link. The document is versioned by the backend (GET /lookups →
 * legal.buyer_terms_url); the store falls back to the current URL if lookups fail.
 * It's a Word file, so it opens in a new tab (most browsers download it).
 */
const lookups = useLookupStore()
onMounted(() => void lookups.ensure())
</script>

<template>
  <a :href="lookups.buyerTermsUrl" target="_blank" rel="noopener noreferrer"><slot>Terms of Service</slot></a>
</template>
