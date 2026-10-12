<script setup lang="ts">
import { computed } from 'vue'
import AppBadge, { type BadgeTone } from '@/components/base/AppBadge.vue'
import { humanize } from '@/utils/format'

/** Maps any API status enum to a consistently coloured badge. */
const props = defineProps<{ status: string; label?: string | null; size?: 'sm' | 'md' }>()

const TONES: Record<string, BadgeTone> = {
  active: 'success-solid',
  published: 'success-solid',
  verified: 'success-solid',
  success: 'success',
  paid: 'success',
  resolved: 'success',
  completed: 'success',
  current: 'success',
  available: 'success',
  matured: 'info',
  paid_out: 'info',
  approved: 'success',
  transferred: 'success-solid',
  pending: 'warning',
  pending_verification: 'warning',
  pending_payment: 'warning',
  pending_signature: 'warning',
  pending_review: 'warning',
  awaiting_payment: 'warning',
  interest_submitted: 'warning',
  processing: 'warning',
  in_progress: 'warning',
  new: 'warning',
  invited: 'warning',
  expiring: 'warning',
  pending_sale: 'warning',
  failed: 'danger',
  rejected: 'danger',
  suspended: 'danger',
  cancelled: 'neutral',
  abandoned: 'neutral',
  expired: 'neutral',
  closed: 'neutral',
  draft: 'neutral',
  signed_out: 'neutral',
  unverified: 'neutral',
  reversed: 'neutral',
}

const tone = computed(() => TONES[props.status] ?? 'neutral')
const text = computed(() => props.label ?? humanize(props.status))
</script>

<template>
  <AppBadge :tone="tone" :size="size">{{ text }}</AppBadge>
</template>
