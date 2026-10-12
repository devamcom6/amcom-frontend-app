<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthCard from '@/components/auth/AuthCard.vue'
import AppAlert from '@/components/base/AppAlert.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppCheckbox from '@/components/base/AppCheckbox.vue'
import AppInput from '@/components/base/AppInput.vue'
import { useForm } from '@/composables/useForm'
import { isApiError } from '@/services/http/errors'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { TwoFactorChallenge } from '@/types'
import { email, required, sixDigitCode } from '@/utils/validators'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const challenge = ref<TwoFactorChallenge | null>(null)
const form = useForm(
  { email: '', password: '', remember: true, two_factor_code: '' },
  {
    rules: () => ({
      email: [required('Enter your email address.'), email()],
      password: [required('Enter your password.')],
      ...(challenge.value ? { two_factor_code: [sixDigitCode()] } : {}),
    }),
  },
)

/** Only allow same-origin, in-app redirects (prevents open-redirect abuse). */
const redirectTarget = computed(() => {
  const r = route.query.redirect
  return typeof r === 'string' && r.startsWith('/') && !r.startsWith('//') ? r : null
})

async function submit() {
  try {
    const result = await form.submit(() =>
      auth.login({
        email: form.values.email.trim(),
        password: form.values.password,
        remember: form.values.remember,
        two_factor_code: challenge.value ? form.values.two_factor_code : undefined,
      }),
    )
    if (!result) return
    if ('two_factor_required' in result) {
      challenge.value = result
      return
    }
    if (!result.email_verified_at) return router.replace({ name: 'verify-email', query: { redirect: redirectTarget.value ?? undefined } })
    ui.success(`Welcome back${result.first_name ? `, ${result.first_name}` : ''}!`)
    void router.replace(redirectTarget.value ?? auth.homeRoute())
  } catch (e) {
    if (isApiError(e) && (e.code === 'invalid_credentials' || e.status === 401)) {
      form.errors._form = 'These credentials do not match our records.'
      form.values.password = ''
      return
    }
    if (isApiError(e) && e.kind === 'rate_limited') {
      form.errors._form = `Too many login attempts. Try again in ${e.retryAfterSeconds ?? 60} seconds.`
      return
    }
    ui.apiError(e)
  }
}
</script>

<template>
  <AuthCard :title="challenge ? 'Two-step verification' : 'Welcome back'" closable>
    <template v-if="!challenge">
      <p class="lead">Enter your credentials to log in to your account.</p>
    </template>
    <p v-else class="lead">We sent a 6-digit code to {{ challenge.masked_destination }}. Enter it below to finish signing in.</p>

    <form class="form" novalidate @submit.prevent="submit">
      <AppAlert v-if="route.query.reset === '1'" tone="success">Password updated. Log in with your new password.</AppAlert>
      <AppAlert v-if="form.errors._form" tone="danger">{{ form.errors._form }}</AppAlert>

      <template v-if="!challenge">
        <AppInput
          v-model="form.values.email"
          label="Email"
          type="email"
          placeholder="Enter email address"
          autocomplete="username"
          size="lg"
          :error="form.errors.email"
          required
          autofocus
          @blur="form.touch('email')"
        />
        <AppInput
          v-model="form.values.password"
          label="Password"
          type="password"
          placeholder="Enter password"
          autocomplete="current-password"
          size="lg"
          :error="form.errors.password"
          required
          @blur="form.touch('password')"
        />
        <div class="form__row">
          <AppCheckbox v-model="form.values.remember" label="Keep me signed in" />
          <RouterLink to="/forgot-password" class="form__forgot">Forgot password?</RouterLink>
        </div>
      </template>
      <AppInput
        v-else
        v-model="form.values.two_factor_code"
        label="Verification code"
        inputmode="numeric"
        autocomplete="one-time-code"
        placeholder="Enter code"
        size="lg"
        maxlength="6"
        :error="form.errors.two_factor_code"
        autofocus
      />

      <AppButton type="submit" size="lg" block :loading="form.submitting">{{ challenge ? 'Verify and sign in' : 'Sign in' }}</AppButton>
      <AppButton v-if="challenge" variant="ghost" block @click="challenge = null">Use a different account</AppButton>
    </form>

    <p class="switch">
      Don’t have an account?
      <RouterLink :to="{ name: 'register', query: route.query.redirect ? { redirect: route.query.redirect } : {} }" class="link link--accent">Create account</RouterLink>
    </p>
  </AuthCard>
</template>

<style scoped>
.lead {
  margin: -16px 0 24px;
  color: var(--color-body);
}

.form {
  display: grid;
  gap: 20px;
}

.form__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: -6px;
}

.form__forgot {
  font-size: var(--text-sm);
  color: #1c2a0c;
}

.form__forgot:hover {
  text-decoration: underline;
}

.switch {
  margin-top: 32px;
  text-align: center;
  font-size: var(--text-sm);
  color: var(--color-body);
}

.switch .link {
  margin-left: 6px;
  font-weight: 600;
}
</style>
