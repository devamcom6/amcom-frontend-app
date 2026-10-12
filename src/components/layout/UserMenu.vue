<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppAvatar from '@/components/base/AppAvatar.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import { useAuthStore } from '@/stores/auth'
import { useDismiss } from './useDismiss'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const open = ref(false)
const root = ref<HTMLElement | null>(null)
useDismiss(root, open)
watch(() => route.fullPath, () => (open.value = false))

async function logout() {
  open.value = false
  await auth.logout()
  void router.push({ name: 'home' })
}
</script>

<template>
  <div ref="root" class="user-menu">
    <button
      type="button"
      class="user-menu__trigger"
      :aria-expanded="open"
      aria-haspopup="menu"
      :aria-label="`Account menu for ${auth.displayName}`"
      @click="open = !open"
    >
      <AppAvatar :name="auth.displayName" :media="auth.user?.avatar" :size="56" />
    </button>
    <Transition name="slide-up">
      <div v-if="open" class="user-menu__panel" role="menu">
        <div class="user-menu__head">
          <AppAvatar :name="auth.displayName" :media="auth.user?.avatar" :size="80" />
          <p class="user-menu__name">{{ auth.displayName }}</p>
          <p class="user-menu__email">{{ auth.user?.email }}</p>
        </div>
        <RouterLink v-if="auth.isAdmin" to="/admin" class="user-menu__item" role="menuitem">
          <AppIcon name="dashboard" /> Admin console
        </RouterLink>
        <RouterLink v-else to="/dashboard" class="user-menu__item" role="menuitem">
          <AppIcon name="dashboard" /> Dashboard
        </RouterLink>
        <RouterLink v-if="!auth.isAdmin" to="/dashboard/settings/profile" class="user-menu__item" role="menuitem">
          <AppIcon name="settings" /> Settings
        </RouterLink>
        <RouterLink v-if="!auth.isAdmin" to="/dashboard/transactions" class="user-menu__item" role="menuitem">
          <AppIcon name="receipt" /> Payment history
        </RouterLink>
        <button type="button" class="user-menu__item user-menu__item--danger" role="menuitem" @click="logout">
          <AppIcon name="logout" /> Logout
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.user-menu {
  position: relative;
}

.user-menu__trigger {
  display: inline-flex;
  border-radius: 50%;
}

.user-menu__trigger:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.user-menu__panel {
  position: absolute;
  right: 0;
  top: calc(100% + 12px);
  z-index: var(--z-dropdown);
  width: 244px;
  padding: 18px 12px 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  box-shadow: var(--shadow-md);
}

.user-menu__head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding-bottom: 14px;
  text-align: center;
}

.user-menu__name {
  margin-top: 8px;
  font-weight: 500;
  color: var(--color-ink);
}

.user-menu__email {
  max-width: 100%;
  font-size: var(--text-xs);
  color: var(--color-muted);
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-menu__item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 12px;
  border-top: 1px solid var(--color-border-subtle);
  font-size: var(--text-sm);
  color: var(--color-ink);
  text-align: left;
}

.user-menu__item:hover {
  background: var(--color-page);
}

.user-menu__item--danger {
  color: #8b1d1d;
}
</style>
