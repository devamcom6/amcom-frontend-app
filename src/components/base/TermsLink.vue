<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import DocumentModal from './DocumentModal.vue'
import { cloudinaryDownloadUrl } from '@/constants/site'
import { useLookupStore } from '@/stores/lookups'

/**
 * "Terms of Service" link that opens the document in a dialog on the same screen.
 * The URL is versioned by the backend (GET /lookups → legal.buyer_terms_url, with a built-in fallback).
 * Ctrl/Cmd/Shift/middle-click keep the browser default: open the PDF version in a new tab.
 */
withDefaults(defineProps<{ title?: string }>(), { title: 'Terms of Service' })
const lookups = useLookupStore()
const open = ref(false)
const downloadUrl = computed(() => cloudinaryDownloadUrl(lookups.buyerTermsPdfUrl, 'Amcom-Terms-of-Service'))
onMounted(() => void lookups.ensure())

function onClick(e: MouseEvent) {
  // Inside a <label> (e.g. the "I accept" checkbox) a click must not toggle the box.
  e.stopPropagation()
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  e.preventDefault()
  open.value = true
}
</script>

<template>
  <a :href="lookups.buyerTermsPdfUrl" target="_blank" rel="noopener noreferrer" aria-haspopup="dialog" @click="onClick"><slot>{{ title }}</slot></a>
  <DocumentModal v-model:open="open" :url="lookups.buyerTermsUrl" :pdf-url="lookups.buyerTermsPdfUrl" :download-url="downloadUrl" :title="title" />
</template>
