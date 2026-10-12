<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthCard from '@/components/auth/AuthCard.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppSpinner from '@/components/base/AppSpinner.vue'
import { authService } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

/** Exchanges the OAuth `code`/`state` with Laravel (Socialite) for an API session. */
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const failed = ref<string | null>(null)

onMounted(async () => {
  const query = Object.fromEntries(Object.entries(route.query).filter(([, v]) => typeof v === 'string')) as Record<string, string>
  if (!query.code) {
    failed.value = query.error_description ?? 'Google sign-in was cancelled.'
    return
  }
  try {
    const session = await authService.googleCallback(query)
    auth.applySession(session, true)
    const target = typeof query.redirect_to === 'string' && query.redirect_to.startsWith('/') ? query.redirect_to : null
    void router.replace(target ?? (session.user.profile_completed ? auth.homeRoute() : '/onboarding'))
  } catch {
    failed.value = "We couldn't sign you in with Google. Please try again or use your email and password."
  }
})
</script>

<template>
  <AuthCard>
    <div v-if="!failed" class="state" role="status">
      <AppSpinner :size="32" />
      <p>Signing you in with Google…</p>
    </div>
    <div v-else class="state">
      <p>{{ failed }}</p>
      <AppButton to="/login">Back to log in</AppButton>
    </div>
  </AuthCard>
</template>

<style scoped>
.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px 0;
  text-align: center;
  color: var(--color-body);
}
</style>
