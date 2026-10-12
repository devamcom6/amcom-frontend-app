<script setup lang="ts">
import { ref } from 'vue'
import AppAlert from '@/components/base/AppAlert.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import AppInput from '@/components/base/AppInput.vue'
import AppModal from '@/components/base/AppModal.vue'
import { useForm } from '@/composables/useForm'
import { authService, profileService } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { phone, required, sameAs, sixDigitCode, strongPassword } from '@/utils/validators'
import SettingsSection from './SettingsSection.vue'

const auth = useAuthStore()
const ui = useUiStore()

/* Change password (ZeptoMail sends a "password changed" confirmation from Laravel). */
const pw = useForm(
  { current_password: '', password: '', password_confirmation: '' },
  {
    rules: {
      current_password: [required('Enter your current password.')],
      password: [required('Enter a new password.'), strongPassword()],
      password_confirmation: [required('Confirm the new password.'), sameAs('password', 'Passwords do not match.')],
    },
  },
)

async function changePassword() {
  try {
    const ok = await pw.submit(() => authService.changePassword(pw.values).then(() => true))
    if (ok) {
      pw.reset()
      ui.success('Password updated', "We've emailed you a confirmation.")
    }
  } catch (e) {
    ui.apiError(e)
  }
}

/* Change phone number — OTP to active devices. */
const phoneOpen = ref(false)
const phoneStep = ref<'number' | 'code'>('number')
const phoneForm = useForm(
  { phone: '', code: '' },
  { rules: () => ({ phone: [required('Enter the new phone number.'), phone()], ...(phoneStep.value === 'code' ? { code: [sixDigitCode()] } : {}) }) },
)

function openPhone() {
  phoneForm.reset()
  phoneStep.value = 'number'
  phoneOpen.value = true
}

async function submitPhone() {
  try {
    if (phoneStep.value === 'number') {
      const ok = await phoneForm.submit(() => profileService.requestPhoneChange(phoneForm.values.phone).then(() => true))
      if (ok) phoneStep.value = 'code'
      return
    }
    const p = await phoneForm.submit(() => profileService.confirmPhoneChange(phoneForm.values.phone, phoneForm.values.code))
    if (p) {
      auth.patchUser({ phone: p.user.phone })
      phoneOpen.value = false
      ui.success('Phone number updated')
    }
  } catch (e) {
    ui.apiError(e)
  }
}
</script>

<template>
  <div>
    <SettingsSection id="acct-title" title="Account Details" description="Manage your email address and phone number">
      <div class="stack">
        <AppInput :model-value="auth.user?.email ?? ''" label="Email Address" disabled />
        <AppInput :model-value="auth.user?.phone ?? 'Not set'" label="Phone Number" disabled>
          <template #label-aside>
            <button type="button" class="change" @click="openPhone">Change Number</button>
          </template>
        </AppInput>
        <p class="note"><AppIcon name="info" :size="14" /> For security, changing your email or phone number requires entering a verification code sent to your active devices.</p>
      </div>
    </SettingsSection>

    <SettingsSection id="pw-title" title="Change Password" description="Secure your account by using a complex, random password">
      <form class="stack" novalidate @submit.prevent="changePassword">
        <AppAlert v-if="pw.errors._form" tone="danger">{{ pw.errors._form }}</AppAlert>
        <AppInput v-model="pw.values.current_password" label="Current Password" type="password" autocomplete="current-password" :error="pw.errors.current_password" @blur="pw.touch('current_password')" />
        <AppInput v-model="pw.values.password" label="New Password" type="password" autocomplete="new-password" :error="pw.errors.password" @blur="pw.touch('password')" />
        <AppInput v-model="pw.values.password_confirmation" label="Confirm New Password" type="password" autocomplete="new-password" :error="pw.errors.password_confirmation" @blur="pw.touch('password_confirmation')" />
        <div class="actions">
          <AppButton type="submit" variant="outline" :loading="pw.submitting">Update Password</AppButton>
        </div>
      </form>
    </SettingsSection>

    <AppModal v-model:open="phoneOpen" title="Change phone number" size="sm" :persistent="phoneForm.submitting">
      <form id="phone-form" class="stack" novalidate @submit.prevent="submitPhone">
        <AppAlert v-if="phoneForm.errors._form" tone="danger">{{ phoneForm.errors._form }}</AppAlert>
        <AppInput v-model="phoneForm.values.phone" label="New phone number" type="tel" :disabled="phoneStep === 'code'" :error="phoneForm.errors.phone" />
        <AppInput
          v-if="phoneStep === 'code'"
          v-model="phoneForm.values.code"
          label="Verification code"
          hint="Enter the 6-digit code sent to your active devices."
          inputmode="numeric"
          autocomplete="one-time-code"
          maxlength="6"
          :error="phoneForm.errors.code"
          autofocus
        />
      </form>
      <template #footer>
        <AppButton type="submit" form="phone-form" block :loading="phoneForm.submitting">{{ phoneStep === 'number' ? 'Send code' : 'Confirm change' }}</AppButton>
      </template>
    </AppModal>
  </div>
</template>

<style scoped>
.stack {
  display: grid;
  gap: 18px;
}

.change {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-primary);
  text-decoration: underline;
}

.note {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  font-size: var(--text-xs);
  color: var(--color-body);
}

.actions {
  display: flex;
  justify-content: flex-end;
}
</style>
