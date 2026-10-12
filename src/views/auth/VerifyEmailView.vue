<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import AuthCard from '@/components/auth/AuthCard.vue'
import AppAlert from '@/components/base/AppAlert.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppInput from '@/components/base/AppInput.vue'
import { useCountdown } from '@/composables/useCountdown'
import { useForm } from '@/composables/useForm'
import { authService } from '@/services/api'
import { isApiError } from '@/services/http/errors'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { sixDigitCode } from '@/utils/validators'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()
const cooldown = useCountdown(60)

if (auth.emailVerified) void router.replace(auth.homeRoute())

const form = useForm({ code: '' }, { rules: { code: [sixDigitCode()] } })

async function verify() {
  try {
    const user = await form.submit(() => auth.verifyEmail(form.values.code.trim()))
    if (!user) return
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') ? route.query.redirect : null
    // New investors go through "Account Created" → profile setup unless they came from a checkout.
    if (redirect) void router.replace(redirect)
    else void router.replace({ name: user.profile_completed ? 'dashboard' : 'account-created' })
  } catch (e) {
    ui.apiError(e)
  }
}

async function resend() {
  try {
    await authService.resendVerification()
    cooldown.start()
    ui.success('Code sent', `We sent a new 6-digit code to ${auth.pendingEmail ?? 'your email'}.`)
  } catch (e) {
    if (isApiError(e) && e.kind === 'rate_limited') cooldown.start(e.retryAfterSeconds ?? 60)
    ui.apiError(e)
  }
}

async function back(e: MouseEvent) {
  e.preventDefault()
  await auth.logout()
  void router.replace({ name: 'register' })
}
</script>

<template>
  <AuthCard
    title="Verify your email"
    :subtitle="`We sent a 6-digit code to ${auth.pendingEmail ?? 'your email'}. Enter it below to continue.`"
    :back="{ name: 'register' }"
    @back="back"
  >
    <form class="form" novalidate @submit.prevent="verify">
      <AppAlert v-if="form.errors._form" tone="danger">{{ form.errors._form }}</AppAlert>
      <AppInput
        v-model="form.values.code"
        label="Verification code"
        hide-label
        placeholder="Enter code"
        inputmode="numeric"
        autocomplete="one-time-code"
        maxlength="6"
        size="lg"
        :error="form.errors.code"
        autofocus
      />
      <p class="resend resend--mobile hide-desktop">
        Didn't receive a code?
        <button type="button" class="link link--accent" :disabled="cooldown.running.value" @click="resend">
          {{ cooldown.running.value ? `Resend in ${cooldown.remaining.value}s` : 'Resend Code' }}
        </button>
      </p>
      <AppButton type="submit" size="lg" block :loading="form.submitting">Verify</AppButton>
    </form>
    <p class="resend hide-mobile">
      Didn't receive a code?
      <button type="button" class="link link--accent" :disabled="cooldown.running.value" @click="resend">
        {{ cooldown.running.value ? `Resend in ${cooldown.remaining.value}s` : 'Resend Code' }}
      </button>
    </p>
  </AuthCard>
</template>

<style scoped>
.form {
  display: grid;
  gap: 24px;
}

.resend {
  margin-top: 28px;
  font-size: var(--text-xs);
  color: var(--color-body);
}

.resend--mobile {
  margin-top: 0;
  text-align: center;
}

.resend .link {
  margin-left: 6px;
  font-size: var(--text-sm);
}

.resend .link:disabled {
  color: var(--color-muted);
  text-decoration: none;
}
</style>
