<script setup lang="ts">
import AppButton from '@/components/base/AppButton.vue'
</script>

<template>
  <section class="status-page">
    <p class="status-page__code display">404</p>
    <h1 class="status-page__title">We couldn't find that page</h1>
    <p class="status-page__text">The link may be broken or the page may have moved.</p>
    <div class="status-page__actions">
      <AppButton to="/">Go home</AppButton>
      <AppButton variant="outline" to="/contact">Contact support</AppButton>
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
  color: var(--color-muted);
}

.status-page__actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}
</style>
