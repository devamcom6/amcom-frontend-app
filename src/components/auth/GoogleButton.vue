<script setup lang="ts">
import { ref } from 'vue'
import AppSpinner from '@/components/base/AppSpinner.vue'
import { authService } from '@/services/api'
import { useUiStore } from '@/stores/ui'

/**
 * Google sign-in via Laravel Socialite. The backend returns the provider URL;
 * Google redirects to /auth/google/callback where the code is exchanged server-side.
 */
const props = withDefaults(defineProps<{ redirect?: string }>(), { redirect: '/dashboard' })
const ui = useUiStore()
const loading = ref(false)

async function start() {
  loading.value = true
  try {
    const { url } = await authService.googleRedirect(props.redirect)
    window.location.assign(url)
  } catch (e) {
    ui.apiError(e, 'Google sign-in is unavailable right now.')
    loading.value = false
  }
}
</script>

<template>
  <button type="button" class="google" :disabled="loading" :aria-busy="loading" @click="start">
    <AppSpinner v-if="loading" :size="18" label="Redirecting to Google" />
    <svg v-else width="22" height="22" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.5z" />
    </svg>
    <span>Google</span>
  </button>
</template>

<style scoped>
.google {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  min-height: 48px;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-xs);
  background: var(--color-bg);
  font-size: var(--text-md);
  color: var(--color-ink);
  transition: background-color var(--duration-fast) var(--ease);
}

.google:hover:not(:disabled) {
  background: var(--color-page);
}

.google:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}
</style>
