<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppAvatar from '@/components/base/AppAvatar.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import AppLogo from '@/components/base/AppLogo.vue'
import type { IconName } from '@/components/base/icons'
import NotificationBell from '@/components/layout/NotificationBell.vue'
import { ROLE_LABELS } from '@/constants/access'
import { useAuthStore } from '@/stores/auth'
import type { Permission, Role } from '@/types'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const drawer = ref(false)
watch(() => route.fullPath, () => (drawer.value = false))

interface NavItem {
  to: string
  label: string
  icon: IconName
  permission: Permission
  role?: Role
}

const sections: { title: string; items: NavItem[] }[] = [
  {
    title: 'Overview',
    items: [
      { to: '/admin', label: 'Dashboard', icon: 'dashboard', permission: 'dashboard.view' },
      { to: '/admin/reports', label: 'Reports', icon: 'bar-chart', permission: 'reports.view' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { to: '/admin/users', label: 'Users', icon: 'users', permission: 'users.view' },
      { to: '/admin/investments', label: 'Investments', icon: 'trend-up', permission: 'investments.view' },
      { to: '/admin/transactions', label: 'Transactions', icon: 'credit-card', permission: 'transactions.view' },
      { to: '/admin/listings', label: 'Listings', icon: 'home', permission: 'listings.view' },
      { to: '/admin/estates', label: 'Estates', icon: 'map-pin', permission: 'estates.view' },
      { to: '/admin/requests', label: 'Requests', icon: 'message', permission: 'requests.view' },
    ],
  },
  {
    title: 'Content',
    items: [
      { to: '/admin/content', label: 'FAQs & testimonials', icon: 'file-text', permission: 'content.manage' },
      { to: '/admin/media', label: 'Media library', icon: 'image', permission: 'media.manage' },
    ],
  },
  {
    title: 'System',
    items: [
      { to: '/admin/settings', label: 'Settings', icon: 'settings', permission: 'settings.view' },
      { to: '/admin/admins', label: 'Administrators', icon: 'shield', permission: 'admins.manage', role: 'super_admin' },
      { to: '/admin/roles', label: 'Roles & permissions', icon: 'key', permission: 'roles.manage', role: 'super_admin' },
    ],
  },
]

/** Only show what the current admin may open. The API enforces the same rules server-side. */
const visibleSections = computed(() =>
  sections
    .map((s) => ({ ...s, items: s.items.filter((i) => auth.can(i.permission) && (!i.role || auth.hasRole(i.role))) }))
    .filter((s) => s.items.length),
)

const pageTitle = computed(() => [...route.matched].reverse().find((r) => r.meta.title)?.meta.title ?? 'Admin')

async function logout() {
  await auth.logout()
  void router.push('/login')
}
</script>

<template>
  <div class="admin" :class="{ 'is-drawer-open': drawer }">
    <aside class="admin__sidebar" aria-label="Admin navigation">
      <div class="admin__brand">
        <AppLogo :size="40" />
        <span class="admin__brand-text">Amcom <small>Console</small></span>
      </div>
      <nav class="admin__nav">
        <div v-for="section in visibleSections" :key="section.title" class="admin__section">
          <p class="admin__section-title">{{ section.title }}</p>
          <RouterLink
            v-for="item in section.items"
            :key="item.to"
            :to="item.to"
            class="admin__link"
            :class="{ 'is-active': item.to === '/admin' ? route.path === '/admin' : route.path.startsWith(item.to) }"
          >
            <AppIcon :name="item.icon" :size="18" />
            {{ item.label }}
          </RouterLink>
        </div>
      </nav>
      <div class="admin__sidebar-foot">
        <RouterLink to="/" class="admin__link"><AppIcon name="external-link" :size="18" /> View website</RouterLink>
        <button type="button" class="admin__link admin__link--danger" @click="logout">
          <AppIcon name="logout" :size="18" /> Logout
        </button>
      </div>
    </aside>
    <div v-if="drawer" class="admin__scrim" aria-hidden="true" @click="drawer = false" />

    <div class="admin__main">
      <header class="admin__topbar">
        <button type="button" class="admin__burger" :aria-expanded="drawer" aria-label="Toggle navigation" @click="drawer = !drawer">
          <AppIcon name="menu" :size="22" />
        </button>
        <h1 class="admin__page-title">{{ pageTitle }}</h1>
        <div class="admin__topbar-actions">
          <NotificationBell all-url="/admin" />
          <div class="admin__me">
            <AppAvatar :name="auth.displayName" :media="auth.user?.avatar" :size="36" />
            <div class="admin__me-text">
              <span class="admin__me-name">{{ auth.displayName }}</span>
              <span class="admin__me-role">{{ auth.role ? ROLE_LABELS[auth.role] : '' }}</span>
            </div>
          </div>
        </div>
      </header>
      <main id="main" class="admin__content" tabindex="-1">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  min-height: 100vh;
  background: var(--color-page);
}

.admin__sidebar {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 20px 14px;
  background: var(--color-bg);
  border-right: 1px solid var(--color-border-subtle);
  overflow-y: auto;
}

.admin__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 8px 20px;
}

.admin__brand-text {
  font-family: var(--font-serif);
  font-size: var(--text-lg);
  color: var(--color-ink);
}

.admin__brand-text small {
  display: block;
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--color-muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.admin__nav {
  flex: 1;
}

.admin__section + .admin__section {
  margin-top: 18px;
}

.admin__section-title {
  padding: 0 10px 6px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-subtle);
}

.admin__link {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--color-body);
  text-align: left;
}

.admin__link:hover {
  background: var(--color-page);
  color: var(--color-ink);
}

.admin__link.is-active {
  background: var(--color-success-bg);
  color: var(--color-primary);
  font-weight: 600;
  box-shadow: inset 3px 0 0 var(--color-primary);
}

.admin__link--danger {
  color: #8b1d1d;
}

.admin__sidebar-foot {
  padding-top: 16px;
  border-top: 1px solid var(--color-border-subtle);
}

.admin__main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.admin__topbar {
  position: sticky;
  top: 0;
  z-index: var(--z-header);
  display: flex;
  align-items: center;
  gap: 16px;
  height: 68px;
  padding: 0 32px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--color-border-subtle);
}

.admin__burger {
  display: none;
  color: var(--color-muted);
}

.admin__page-title {
  font-size: var(--text-lg);
  font-weight: 600;
}

.admin__topbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.admin__me {
  display: flex;
  align-items: center;
  gap: 10px;
}

.admin__me-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.admin__me-name {
  font-size: var(--text-sm);
  font-weight: 500;
}

.admin__me-role {
  font-size: var(--text-xs);
  color: var(--color-muted);
}

.admin__content {
  padding: 28px 32px 64px;
}

.admin__content:focus {
  outline: none;
}

.admin__scrim {
  display: none;
}

@media (max-width: 1023px) {
  .admin {
    grid-template-columns: 1fr;
  }

  .admin__sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: var(--z-modal);
    width: 280px;
    transform: translateX(-100%);
    transition: transform var(--duration-slow) var(--ease);
  }

  .is-drawer-open .admin__sidebar {
    transform: translateX(0);
    box-shadow: var(--shadow-lg);
  }

  .admin__scrim {
    display: block;
    position: fixed;
    inset: 0;
    z-index: calc(var(--z-modal) - 1);
    background: var(--color-overlay);
  }

  .admin__burger {
    display: inline-flex;
  }

  .admin__topbar {
    padding: 0 16px;
  }

  .admin__content {
    padding: 20px 16px 48px;
  }

  .admin__me-text {
    display: none;
  }
}
</style>
