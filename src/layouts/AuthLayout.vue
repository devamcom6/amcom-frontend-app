<script setup lang="ts">
import AppLogo from '@/components/base/AppLogo.vue'
</script>

<template>
  <header class="auth-header">
    <div class="auth-header__inner container">
      <AppLogo :size="52" class="auth-header__logo" />
      <!-- Views teleport contextual actions here ("Skip for now", close button). -->
      <div id="auth-header-actions" class="auth-header__actions" />
    </div>
  </header>
  <main id="main" class="auth-main" tabindex="-1">
    <RouterView />
  </main>
</template>

<style scoped>
.auth-header {
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-nav-border);
}

.auth-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--header-height);
}

.auth-header__logo {
  margin-left: 10px;
}

.auth-header__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.auth-main {
  flex: 1;
  background: var(--color-page);
  padding: 48px var(--gutter) 80px;
}

.auth-main:focus {
  outline: none;
}

@media (max-width: 767px) {
  .auth-header__logo {
    margin-left: 0;
  }

  .auth-header__logo :deep(img) {
    width: 36px;
    height: 36px;
  }

  .auth-main {
    background: var(--color-bg);
    padding: 24px var(--gutter) 40px;
  }
}
</style>
