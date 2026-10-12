<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppIcon from '@/components/base/AppIcon.vue'
import type { IconName } from '@/components/base/icons'
import DeleteAccountFlow from '@/components/settings/DeleteAccountFlow.vue'

type Section = 'profile' | 'account' | 'payout' | 'notifications' | 'security' | 'support'

const route = useRoute()
const section = computed<Section>(() => (route.params.section as Section) || 'profile')

const NAV: { key: Section; label: string; icon: IconName }[] = [
  { key: 'profile', label: 'Profile', icon: 'user' },
  { key: 'account', label: 'Account', icon: 'settings' },
  { key: 'payout', label: 'Payout Details', icon: 'wallet' },
  { key: 'notifications', label: 'Notifications', icon: 'bell' },
  { key: 'security', label: 'Security', icon: 'lock' },
  { key: 'support', label: 'Help & Support', icon: 'help' },
]

const PANELS: Record<Section, ReturnType<typeof defineAsyncComponent>> = {
  profile: defineAsyncComponent(() => import('@/components/settings/ProfilePanel.vue')),
  account: defineAsyncComponent(() => import('@/components/settings/AccountPanel.vue')),
  payout: defineAsyncComponent(() => import('@/components/settings/PayoutPanel.vue')),
  notifications: defineAsyncComponent(() => import('@/components/settings/NotificationsPanel.vue')),
  security: defineAsyncComponent(() => import('@/components/settings/SecurityPanel.vue')),
  support: defineAsyncComponent(() => import('@/components/settings/SupportPanel.vue')),
}

const deleteOpen = ref(false)
</script>

<template>
  <div class="settings">
    <aside class="settings__aside">
      <nav class="settings__nav" aria-label="Settings sections">
        <RouterLink
          v-for="item in NAV"
          :key="item.key"
          :to="`/dashboard/settings/${item.key}`"
          class="settings__link"
          :class="{ 'is-active': section === item.key }"
          :aria-current="section === item.key ? 'page' : undefined"
        >
          <AppIcon :name="item.icon" :size="18" />
          {{ item.label }}
        </RouterLink>
      </nav>
      <button type="button" class="settings__delete" @click="deleteOpen = true">
        <AppIcon name="trash" :size="18" /> Delete Account
      </button>
    </aside>

    <section class="settings__panel" :class="{ 'settings__panel--center': section === 'payout' }">
      <KeepAlive>
        <component :is="PANELS[section]" :key="section" />
      </KeepAlive>
    </section>

    <DeleteAccountFlow v-model:open="deleteOpen" />
  </div>
</template>

<style scoped>
.settings {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 48px;
  align-items: start;
}

.settings__aside {
  position: sticky;
  top: calc(var(--header-height) + 24px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 660px;
}

.settings__nav {
  display: grid;
  gap: 8px;
}

.settings__link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--color-ink);
}

.settings__link:hover {
  background: var(--color-page);
}

.settings__link.is-active {
  background: var(--color-success-bg);
  box-shadow: inset 3px 0 0 var(--color-primary);
  color: var(--color-primary);
  font-weight: 500;
}

.settings__delete {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  border-radius: var(--radius-sm);
  background: var(--color-danger-bg);
  font-size: var(--text-sm);
  color: var(--color-danger);
}

.settings__delete:hover {
  background: #fbd5d5;
}

.settings__panel {
  padding: 32px;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-xl);
  background: var(--color-bg);
}

@media (max-width: 899px) {
  .settings {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .settings__aside {
    position: static;
    min-height: 0;
    gap: 12px;
  }

  .settings__nav {
    display: flex;
    overflow-x: auto;
    gap: 6px;
    scrollbar-width: none;
    margin-right: calc(var(--gutter) * -1);
  }

  .settings__link {
    flex-shrink: 0;
    padding: 10px 14px;
    border: 1px solid var(--color-border-subtle);
  }

  .settings__link.is-active {
    box-shadow: none;
    border-color: var(--color-primary);
  }

  .settings__delete {
    order: 3;
    align-self: flex-start;
  }

  .settings__panel {
    padding: 20px 16px;
    border-radius: var(--radius-lg);
  }
}
</style>
