<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import AuthCard from '@/components/auth/AuthCard.vue'
import GoogleButton from '@/components/auth/GoogleButton.vue'
import AppAlert from '@/components/base/AppAlert.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppInput from '@/components/base/AppInput.vue'
import { config } from '@/config/env'
import { useForm } from '@/composables/useForm'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { email, required, sameAs, strongPassword } from '@/utils/validators'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const form = useForm(
  { email: '', password: '', password_confirmation: '' },
  {
    rules: {
      email: [required('Enter your email address.'), email()],
      password: [required('Create a password.'), strongPassword()],
      password_confirmation: [required('Re-enter your password.'), sameAs('password', 'Passwords do not match.')],
    },
  },
)

async function submit() {
  try {
    const user = await form.submit(() => auth.register({ ...form.values, email: form.values.email.trim() }))
    if (user) {
      // Laravel sends the 6-digit verification code via ZeptoMail on registration.
      void router.replace({ name: 'verify-email', query: route.query.redirect ? { redirect: route.query.redirect } : {} })
    }
  } catch (e) {
    ui.apiError(e)
  }
}
</script>

<template>
  <AuthCard title="Create an account" subtitle="Enter your details to create a new account." closable>
    <form class="form" novalidate @submit.prevent="submit">
      <AppAlert v-if="form.errors._form" tone="danger">{{ form.errors._form }}</AppAlert>
      <AppInput
        v-model="form.values.email"
        label="Email"
        type="email"
        placeholder="Enter email address"
        autocomplete="email"
        size="lg"
        :error="form.errors.email"
        required
        @blur="form.touch('email')"
      />
      <AppInput
        v-model="form.values.password"
        label="Password"
        type="password"
        placeholder="Enter password"
        autocomplete="new-password"
        size="lg"
        :error="form.errors.password"
        :hint="form.errors.password ? undefined : 'At least 8 characters, with upper & lower case letters and a number.'"
        required
        @blur="form.touch('password')"
      />
      <AppInput
        v-model="form.values.password_confirmation"
        label="Confirm Password"
        type="password"
        placeholder="Re-enter password"
        autocomplete="new-password"
        size="lg"
        :error="form.errors.password_confirmation"
        required
        @blur="form.touch('password_confirmation')"
      />
      <AppButton type="submit" size="lg" block :loading="form.submitting">Sign Up</AppButton>
    </form>

    <template v-if="config.googleAuthEnabled">
      <div class="divider-or" role="separator"><span>OR</span></div>
      <GoogleButton :redirect="typeof route.query.redirect === 'string' ? route.query.redirect : '/onboarding'" />
    </template>

    <p class="terms">
      By continuing you agree that you have reviewed and agree to the
      <RouterLink to="/legal/terms-of-service">Terms of Service</RouterLink> and <RouterLink to="/legal/privacy-policy">Privacy Policy</RouterLink>.
    </p>
    <p class="switch">
      Already have an account?
      <RouterLink :to="{ name: 'login', query: route.query.redirect ? { redirect: route.query.redirect } : {} }" class="link link--accent">Log in</RouterLink>
    </p>
  </AuthCard>
</template>

<style scoped>
.form {
  display: grid;
  gap: 20px;
}

.divider-or {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 28px 0;
  font-size: var(--text-xs);
  color: var(--color-muted);
}

.divider-or::before,
.divider-or::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border-subtle);
}

.terms {
  margin-top: 28px;
  font-size: var(--text-xs);
  line-height: 1.6;
  color: var(--color-ink);
}

.terms a {
  text-decoration: underline;
}

.switch {
  margin-top: 36px;
  text-align: center;
  font-size: var(--text-sm);
  color: var(--color-body);
}

.switch .link {
  margin-left: 6px;
  font-weight: 600;
}

@media (min-width: 768px) {
  .switch {
    margin-top: 20px;
  }
}
</style>
