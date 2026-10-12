<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppToaster from '@/components/base/AppToaster.vue'
import { sessionEvents } from '@/services/http/events'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import { useUiStore } from '@/stores/ui'

const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()
const notifications = useNotificationStore()

const off = [
  // Token expired / revoked → clear local state and send the user to log in again.
  sessionEvents.on('session:expired', ({ message }) => {
    auth.clearSession()
    ui.warning(message)
    const current = router.currentRoute.value
    if (current.matched.some((r) => r.meta.requiresAuth)) {
      void router.replace({ name: 'login', query: { redirect: current.fullPath } })
    }
  }),
  // Permission denied → refresh the user's permissions (they may have been revoked) and inform.
  sessionEvents.on('session:forbidden', async ({ message }) => {
    ui.error(message)
    await auth.refreshUser()
    const current = router.currentRoute.value
    const required = current.matched.flatMap((r) => r.meta.permissions ?? [])
    if (required.length && !auth.can(required)) void router.replace({ name: 'forbidden' })
  }),
  sessionEvents.on('session:suspended', ({ message }) => {
    auth.clearSession()
    ui.error('Account suspended', message)
    void router.replace({ name: 'login' })
  }),
  sessionEvents.on('app:maintenance', ({ message }) => {
    ui.maintenanceMessage = message
  }),
]

onBeforeUnmount(() => off.forEach((fn) => fn()))

watch(
  () => auth.isAuthenticated,
  (authed) => (authed ? notifications.startPolling() : notifications.reset()),
)
</script>

<template>
  <a href="#main" class="skip-link">Skip to main content</a>
  <div v-if="ui.maintenanceMessage" class="maintenance" role="status">{{ ui.maintenanceMessage }}</div>
  <RouterView />
  <AppToaster />
</template>

<style scoped>
.maintenance {
  padding: 10px var(--gutter);
  background: var(--color-warning-soft);
  color: var(--color-warning);
  font-size: var(--text-sm);
  text-align: center;
}
</style>
