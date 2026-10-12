<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthCard from '@/components/auth/AuthCard.vue'
import AppAlert from '@/components/base/AppAlert.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppInput from '@/components/base/AppInput.vue'
import AppSuccessPanel from '@/components/base/AppSuccessPanel.vue'
import { useCountdown } from '@/composables/useCountdown'
import { useForm } from '@/composables/useForm'
import { authService } from '@/services/api'
import { useUiStore } from '@/stores/ui'
import { email, required, sameAs, sixDigitCode, strongPassword } from '@/utils/validators'

/**
 * Forgot password: email → 6-digit code → new password → success.
 * Laravel emails the code via ZeptoMail and always answers success for unknown emails
 * (no account enumeration).
 */
type Step = 'email' | 'code' | 'password' | 'done'

const router = useRouter()
const ui = useUiStore()
const step = ref<Step>('email')
const resetToken = ref('')
const cooldown = useCountdown(60)

const emailForm = useForm({ email: '' }, { rules: { email: [required('Enter your email address.'), email()] } })
const codeForm = useForm({ code: '' }, { rules: { code: [sixDigitCode()] } })
const passwordForm = useForm(
  { password: '', password_confirmation: '' },
  {
    rules: {
      password: [required('Create a new password.'), strongPassword()],
      password_confirmation: [required('Re-enter the new password.'), sameAs('password', 'Passwords do not match.')],
    },
  },
)

async function sendCode() {
  try {
    const ok = await emailForm.submit(() => authService.forgotPassword({ email: emailForm.values.email.trim() }).then(() => true))
    if (ok) {
      cooldown.start()
      step.value = 'code'
    }
  } catch (e) {
    ui.apiError(e)
  }
}

async function verifyCode() {
  try {
    const res = await codeForm.submit(() => authService.verifyResetCode({ email: emailForm.values.email.trim(), code: codeForm.values.code.trim() }))
    if (res) {
      resetToken.value = res.reset_token
      step.value = 'password'
    }
  } catch (e) {
    ui.apiError(e)
  }
}

async function resetPassword() {
  try {
    const ok = await passwordForm.submit(() =>
      authService
        .resetPassword({ email: emailForm.values.email.trim(), reset_token: resetToken.value, ...passwordForm.values })
        .then(() => true),
    )
    if (ok) step.value = 'done'
  } catch (e) {
    ui.apiError(e)
    step.value = 'code'
  }
}

async function resend() {
  try {
    await authService.forgotPassword({ email: emailForm.values.email.trim() })
    cooldown.start()
    ui.success('A new code is on its way.')
  } catch (e) {
    ui.apiError(e)
  }
}

function back(e: MouseEvent) {
  if (step.value === 'email') return
  e.preventDefault()
  step.value = step.value === 'password' ? 'code' : 'email'
}
</script>

<template>
  <AuthCard v-if="step === 'done'">
    <AppSuccessPanel title="Password Reset!" class="done">
      <p>Your password has been successfully reset.</p>
      <template #actions>
        <AppButton size="lg" block @click="router.replace({ name: 'login', query: { reset: '1' } })">Back to Log in</AppButton>
      </template>
    </AppSuccessPanel>
  </AuthCard>

  <AuthCard
    v-else-if="step === 'email'"
    title="Forgot Password?"
    subtitle="No worries. Enter your email and we'll send you a code to reset your password."
    :back="{ name: 'login' }"
  >
    <form class="form" novalidate @submit.prevent="sendCode">
      <AppAlert v-if="emailForm.errors._form" tone="danger">{{ emailForm.errors._form }}</AppAlert>
      <AppInput v-model="emailForm.values.email" label="Email" hide-label type="email" placeholder="Enter email address" autocomplete="email" size="lg" :error="emailForm.errors.email" autofocus />
      <AppButton type="submit" size="lg" block :loading="emailForm.submitting">Send Reset Code</AppButton>
    </form>
    <p class="foot">Remember your password? <RouterLink to="/login" class="link link--accent">Log in</RouterLink></p>
  </AuthCard>

  <AuthCard
    v-else-if="step === 'code'"
    title="Check your email"
    :subtitle="`If an account exists for ${emailForm.values.email}, we sent a 6-digit code. Enter it below.`"
    :back="{ name: 'forgot-password' }"
    @back="back"
  >
    <form class="form" novalidate @submit.prevent="verifyCode">
      <AppAlert v-if="codeForm.errors._form" tone="danger">{{ codeForm.errors._form }}</AppAlert>
      <AppInput v-model="codeForm.values.code" label="Code" hide-label placeholder="Enter code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" size="lg" :error="codeForm.errors.code" autofocus />
      <AppButton type="submit" size="lg" block :loading="codeForm.submitting">Verify Code</AppButton>
    </form>
    <p class="foot">
      Didn't receive a code?
      <button type="button" class="link link--accent" :disabled="cooldown.running.value" @click="resend">
        {{ cooldown.running.value ? `Resend in ${cooldown.remaining.value}s` : 'Resend Code' }}
      </button>
    </p>
  </AuthCard>

  <AuthCard
    v-else
    title="Create new password"
    subtitle="Your new password must be different from your previous password."
    :back="{ name: 'forgot-password' }"
    @back="back"
  >
    <form class="form" novalidate @submit.prevent="resetPassword">
      <AppAlert v-if="passwordForm.errors._form" tone="danger">{{ passwordForm.errors._form }}</AppAlert>
      <AppInput v-model="passwordForm.values.password" label="New Password" type="password" placeholder="Enter new password" autocomplete="new-password" size="lg" :error="passwordForm.errors.password" @blur="passwordForm.touch('password')" />
      <AppInput v-model="passwordForm.values.password_confirmation" label="Confirm Password" type="password" placeholder="Re-enter new password" autocomplete="new-password" size="lg" :error="passwordForm.errors.password_confirmation" @blur="passwordForm.touch('password_confirmation')" />
      <AppButton type="submit" size="lg" block :loading="passwordForm.submitting">Reset Password</AppButton>
    </form>
    <p class="foot foot--center">Back to <RouterLink to="/login" class="link link--accent">Log in</RouterLink></p>
  </AuthCard>
</template>

<style scoped>
.form {
  display: grid;
  gap: 24px;
}

.foot {
  margin-top: 28px;
  font-size: var(--text-sm);
  color: var(--color-body);
}

.foot--center {
  text-align: center;
}

.foot .link {
  margin-left: 6px;
}

.foot .link:disabled {
  color: var(--color-muted);
  text-decoration: none;
}

.done {
  padding: 32px 0 0;
}
</style>
