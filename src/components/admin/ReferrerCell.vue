<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { ReferrerUser } from '@/types'

/** Referrer column for admin tables: name / phone, plus the account the API linked from the phone. */
const props = defineProps<{ name?: string | null; phone?: string | null; user?: ReferrerUser | null }>()
const auth = useAuthStore()
const empty = computed(() => !props.name && !props.phone && !props.user)
</script>

<template>
  <span v-if="empty" class="muted">—</span>
  <span v-else class="ref">
    <span>{{ name || user?.name || 'Unnamed referrer' }}</span>
    <small v-if="phone">{{ phone }}</small>
    <small v-if="user">
      Linked:
      <RouterLink v-if="auth.can('users.view')" :to="{ name: 'admin-user', params: { id: user.id } }" class="ref__link">{{ user.name }}</RouterLink>
      <template v-else>{{ user.name }}</template>
    </small>
  </span>
</template>

<style scoped>
.ref {
  display: flex;
  flex-direction: column;
}

.ref small,
.muted {
  font-size: var(--text-xs);
  color: var(--color-muted);
}

.ref__link {
  color: var(--color-primary);
  text-decoration: underline;
}
</style>
