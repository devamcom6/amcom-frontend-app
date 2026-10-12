<script setup lang="ts">
import AppButton from '@/components/base/AppButton.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <section class="status-page">
    <p class="status-page__code display">403</p>
    <h1 class="status-page__title">You don't have access to this page</h1>
    <p class="status-page__text">
      Your account doesn't have permission to view this area. If you believe this is a mistake, contact an administrator.
    </p>
    <div class="status-page__actions">
      <AppButton :to="auth.isAuthenticated ? auth.homeRoute() : '/'">Go to {{ auth.isAuthenticated ? 'my dashboard' : 'home' }}</AppButton>
      <AppButton v-if="!auth.isAuthenticated" variant="outline" to="/login">Log in</AppButton>
    </div>
  </section>
</template>

<style scoped>
.status-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 96px var(--gutter);
  text-align: center;
}

.status-page__code {
  font-size: 5rem;
  color: var(--color-maroon);
}

.status-page__title {
  font-size: var(--text-2xl);
}

.status-page__text {
  max-width: 520px;
  color: var(--color-muted);
}

.status-page__actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}
</style>
