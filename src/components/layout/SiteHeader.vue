<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppButton from '@/components/base/AppButton.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import AppLogo from '@/components/base/AppLogo.vue'
import { lockScroll, unlockScroll } from '@/composables/useScrollLock'
import { useAuthStore } from '@/stores/auth'
import NotificationBell from './NotificationBell.vue'
import UserMenu from './UserMenu.vue'
import { useDismiss } from './useDismiss'

const auth = useAuthStore()
const route = useRoute()

const navActive = computed(() => [...route.matched].reverse().find((r) => r.meta.nav)?.meta.nav)

const propertyLinks = [
  { to: '/property-management', label: 'Overview', description: 'How Amcom manages, lists and markets property' },
  { to: '/properties', label: 'Browse properties', description: 'Verified listings to buy, rent or lease' },
  { to: '/list-property', label: 'List your property', description: 'Register a property for sale, rent or lease' },
]

const pmOpen = ref(false)
const pmRoot = ref<HTMLElement | null>(null)
useDismiss(pmRoot, pmOpen)

const mobileOpen = ref(false)
watch(mobileOpen, (v) => (v ? lockScroll() : unlockScroll()))
watch(
  () => route.fullPath,
  () => {
    pmOpen.value = false
    mobileOpen.value = false
  },
)
onBeforeUnmount(() => mobileOpen.value && unlockScroll())
</script>

<template>
  <header class="header">
    <div class="header__inner container">
      <AppLogo :size="52" class="header__logo" />

      <nav class="header__nav" aria-label="Primary">
        <RouterLink to="/buyback" class="nav-link" :class="{ 'is-active': navActive === 'buyback' }">Buyback</RouterLink>
        <RouterLink to="/capital-investment" class="nav-link" :class="{ 'is-active': navActive === 'capital' }">Capital investment</RouterLink>
        <div ref="pmRoot" class="nav-dropdown">
          <button
            type="button"
            class="nav-link"
            :class="{ 'is-active': navActive === 'property' }"
            :aria-expanded="pmOpen"
            aria-controls="pm-menu"
            @click="pmOpen = !pmOpen"
          >
            Property management
            <AppIcon name="chevron-down" :size="16" class="nav-link__chevron" :class="{ 'is-open': pmOpen }" />
          </button>
          <Transition name="slide-up">
            <div v-if="pmOpen" id="pm-menu" class="nav-dropdown__panel">
              <RouterLink v-for="l in propertyLinks" :key="l.to" :to="l.to" class="nav-dropdown__item">
                <span class="nav-dropdown__label">{{ l.label }}</span>
                <span class="nav-dropdown__desc">{{ l.description }}</span>
              </RouterLink>
            </div>
          </Transition>
        </div>
        <RouterLink v-if="!auth.isAuthenticated" to="/about" class="nav-link" active-class="is-active">About us</RouterLink>
        <RouterLink to="/contact" class="nav-link" active-class="is-active">Contact us</RouterLink>
      </nav>

      <div class="header__actions">
        <template v-if="auth.isAuthenticated">
          <NotificationBell :all-url="auth.isAdmin ? '/admin' : '/dashboard/notifications'" />
          <UserMenu class="hide-mobile" />
        </template>
        <template v-else>
          <AppButton variant="outline" to="/login" class="hide-mobile header__btn">Login</AppButton>
          <AppButton to="/register" class="hide-mobile header__btn">Get started</AppButton>
        </template>
        <button
          type="button"
          class="header__burger"
          :aria-expanded="mobileOpen"
          aria-controls="mobile-nav"
          :aria-label="mobileOpen ? 'Close menu' : 'Open menu'"
          @click="mobileOpen = !mobileOpen"
        >
          <AppIcon :name="mobileOpen ? 'close' : 'menu'" :size="24" />
        </button>
      </div>
    </div>

    <Transition name="fade">
      <div v-if="mobileOpen" id="mobile-nav" class="mobile-nav" aria-label="Mobile">
        <nav class="mobile-nav__links">
          <RouterLink to="/buyback" class="mobile-nav__link">Buyback</RouterLink>
          <RouterLink to="/capital-investment" class="mobile-nav__link">Capital investment</RouterLink>
          <p class="mobile-nav__group">Property management</p>
          <RouterLink v-for="l in propertyLinks" :key="l.to" :to="l.to" class="mobile-nav__link mobile-nav__link--sub">{{ l.label }}</RouterLink>
          <RouterLink to="/about" class="mobile-nav__link">About us</RouterLink>
          <RouterLink to="/contact" class="mobile-nav__link">Contact us</RouterLink>
          <template v-if="auth.isAuthenticated">
            <RouterLink :to="auth.isAdmin ? '/admin' : '/dashboard'" class="mobile-nav__link">
              {{ auth.isAdmin ? 'Admin console' : 'Dashboard' }}
            </RouterLink>
            <RouterLink v-if="!auth.isAdmin" to="/dashboard/settings/profile" class="mobile-nav__link">Settings</RouterLink>
          </template>
        </nav>
        <div class="mobile-nav__actions">
          <template v-if="auth.isAuthenticated">
            <AppButton variant="outline" block @click="auth.logout().then(() => $router.push('/'))">Logout</AppButton>
          </template>
          <template v-else>
            <AppButton variant="outline" to="/login" block>Login</AppButton>
            <AppButton to="/register" block>Get started</AppButton>
          </template>
        </div>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: var(--z-header);
  background: rgba(255, 255, 255, 0.97);
  backdrop-filter: saturate(160%) blur(8px);
  border-bottom: 1px solid var(--color-nav-border);
}

.header__inner {
  display: flex;
  align-items: center;
  gap: 48px;
  height: var(--header-height);
}

.header__logo {
  margin-left: 10px;
}

.header__nav {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.nav-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  font-size: var(--text-base);
  letter-spacing: 0.01em;
  color: var(--color-ink);
  white-space: nowrap;
  transition: color var(--duration-fast) var(--ease);
}

.nav-link:hover {
  color: var(--color-primary);
}

.nav-link.is-active {
  color: var(--color-maroon);
}

.nav-link.is-active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -2px;
  height: 2px;
  background: #c9cdd2;
}

.nav-link__chevron {
  color: var(--color-muted);
  transition: transform var(--duration) var(--ease);
}

.nav-link__chevron.is-open {
  transform: rotate(180deg);
}

.nav-dropdown {
  position: relative;
}

.nav-dropdown__panel {
  position: absolute;
  top: calc(100% + 18px);
  left: 0;
  z-index: var(--z-dropdown);
  width: 320px;
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  box-shadow: var(--shadow-md);
}

.nav-dropdown__item {
  display: grid;
  gap: 2px;
  padding: 12px 14px;
  border-radius: var(--radius-md);
}

.nav-dropdown__item:hover,
.nav-dropdown__item.router-link-exact-active {
  background: var(--color-primary-soft);
}

.nav-dropdown__label {
  font-weight: 500;
  color: var(--color-ink);
}

.nav-dropdown__desc {
  font-size: var(--text-sm);
  color: var(--color-muted);
}

.header__actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.header__btn {
  min-width: 85px;
  min-height: 40px;
  padding: 8px 22px;
  font-weight: 600;
}

.header__burger {
  display: none;
  place-items: center;
  width: 44px;
  height: 44px;
  margin-right: -10px;
  color: var(--color-muted);
}

.mobile-nav {
  position: fixed;
  inset: var(--header-height) 0 0;
  z-index: var(--z-header);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px var(--gutter) calc(24px + env(safe-area-inset-bottom));
  background: var(--color-bg);
  overflow-y: auto;
}

.mobile-nav__links {
  display: flex;
  flex-direction: column;
}

.mobile-nav__link {
  padding: 14px 0;
  border-bottom: 1px solid var(--color-border-subtle);
  font-size: var(--text-md);
  color: var(--color-ink);
}

.mobile-nav__link.router-link-active {
  color: var(--color-primary);
}

.mobile-nav__link--sub {
  padding-left: 16px;
  font-size: var(--text-base);
}

.mobile-nav__group {
  padding: 18px 0 6px;
  font-size: var(--text-xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.mobile-nav__actions {
  display: grid;
  gap: 12px;
  padding-top: 24px;
}

@media (max-width: 1100px) {
  .header__inner {
    gap: 24px;
  }
  .nav-link {
    padding: 10px 10px;
    font-size: var(--text-sm);
  }
}

@media (max-width: 959px) {
  .header__nav {
    display: none;
  }

  .header__burger {
    display: inline-grid;
  }

  .header__logo :deep(img) {
    width: 36px;
    height: 36px;
  }

  .header__logo {
    margin-left: 0;
  }
}

@media (min-width: 768px) and (max-width: 959px) {
  .header__actions .hide-mobile {
    display: inline-flex;
  }
}
</style>
