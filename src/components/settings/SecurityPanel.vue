<script setup lang="ts">
import { ref } from 'vue'
import AppBadge from '@/components/base/AppBadge.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppDataTable, { type Column } from '@/components/base/AppDataTable.vue'
import AppErrorState from '@/components/base/AppErrorState.vue'
import AppInput from '@/components/base/AppInput.vue'
import AppModal from '@/components/base/AppModal.vue'
import StatusBadge from '@/components/dashboard/StatusBadge.vue'
import { useAsync } from '@/composables/useAsync'
import { useForm } from '@/composables/useForm'
import { profileService } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { formatDate } from '@/utils/format'
import { required, sixDigitCode } from '@/utils/validators'
import SettingsSection from './SettingsSection.vue'

const auth = useAuthStore()
const ui = useUiStore()
const { data: sessions, loading, error, execute } = useAsync(() => profileService.loginActivity())

const columns: Column[] = [
  { key: 'date', label: 'Date', primary: true },
  { key: 'device', label: 'Device' },
  { key: 'location', label: 'Location' },
  { key: 'status', label: 'Status' },
]

/* Enable 2FA: request code → confirm → show recovery codes */
const enableOpen = ref(false)
const destination = ref('')
const recovery = ref<string[] | null>(null)
const starting = ref(false)
const codeForm = useForm({ code: '' }, { rules: { code: [sixDigitCode()] } })

async function startEnable() {
  starting.value = true
  try {
    const res = await profileService.enableTwoFactor()
    destination.value = res.masked_destination
    recovery.value = null
    codeForm.reset()
    enableOpen.value = true
  } catch (e) {
    ui.apiError(e)
  } finally {
    starting.value = false
  }
}

async function confirmEnable() {
  try {
    const res = await codeForm.submit(() => profileService.confirmTwoFactor(codeForm.values.code))
    if (res) {
      recovery.value = res.recovery_codes
      auth.patchUser({ two_factor_enabled: true })
    }
  } catch (e) {
    ui.apiError(e)
  }
}

/* Disable 2FA (requires password) */
const disableOpen = ref(false)
const pwForm = useForm({ password: '' }, { rules: { password: [required('Enter your password.')] } })
async function disable() {
  try {
    const ok = await pwForm.submit(() => profileService.disableTwoFactor(pwForm.values.password).then(() => true))
    if (ok) {
      auth.patchUser({ two_factor_enabled: false })
      disableOpen.value = false
      pwForm.reset()
      ui.success('Two-factor authentication disabled')
    }
  } catch (e) {
    ui.apiError(e)
  }
}
</script>

<template>
  <div>
    <header class="head">
      <h2 class="head__title">Security</h2>
      <p class="head__desc">Protect your account with additional security measures.</p>
    </header>

    <SettingsSection id="tfa-title" title="Two-Factor Authentication (2FA)">
      <template #title>
        Two-Factor Authentication (2FA)
        <AppBadge :tone="auth.user?.two_factor_enabled ? 'success' : 'neutral'" size="sm">{{ auth.user?.two_factor_enabled ? 'Enabled' : 'Disabled' }}</AppBadge>
      </template>
      <p class="text">
        Add an extra layer of security to your account. When enabled, you will need to enter a verification code sent to your phone each
        time you sign in.
      </p>
      <AppButton v-if="!auth.user?.two_factor_enabled" class="tfa-btn" :loading="starting" @click="startEnable">Enable Two-Factor Authentication</AppButton>
      <AppButton v-else variant="danger-soft" class="tfa-btn" @click="disableOpen = true">Disable Two-Factor Authentication</AppButton>
    </SettingsSection>

    <SettingsSection id="act-title" title="Recent Login Activity" description="Review recent sign-ins to your account.">
      <AppErrorState v-if="error" :error="error" compact @retry="execute" />
      <AppDataTable v-else :columns="columns" :rows="sessions ?? []" :loading="loading" caption="Recent login activity">
        <template #cell-date="{ row }">{{ formatDate(row.date) }}</template>
        <template #cell-status="{ row }">
          <StatusBadge :status="row.status" :label="row.status === 'current' ? 'Current Session' : undefined" size="sm" />
        </template>
      </AppDataTable>
    </SettingsSection>

    <AppModal v-model:open="enableOpen" title="Enable two-factor authentication" size="sm" :persistent="codeForm.submitting">
      <div v-if="recovery" class="stack">
        <p>2FA is on. Save these recovery codes somewhere safe — each can be used once if you lose access to your phone.</p>
        <ul class="codes" role="list">
          <li v-for="c in recovery" :key="c"><code>{{ c }}</code></li>
        </ul>
        <AppButton block @click="enableOpen = false">I've saved my codes</AppButton>
      </div>
      <form v-else class="stack" novalidate @submit.prevent="confirmEnable">
        <p>We sent a 6-digit code to {{ destination }}. Enter it to turn on 2FA.</p>
        <AppInput v-model="codeForm.values.code" label="Verification code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" :error="codeForm.errors.code" autofocus />
        <AppButton type="submit" block :loading="codeForm.submitting">Verify and enable</AppButton>
      </form>
    </AppModal>

    <AppModal v-model:open="disableOpen" title="Disable two-factor authentication" size="sm" :persistent="pwForm.submitting">
      <form class="stack" novalidate @submit.prevent="disable">
        <p>Confirm your password to turn off 2FA. Your account will be less secure.</p>
        <AppInput v-model="pwForm.values.password" label="Password" type="password" autocomplete="current-password" :error="pwForm.errors.password" />
        <AppButton type="submit" variant="danger" block :loading="pwForm.submitting">Disable 2FA</AppButton>
      </form>
    </AppModal>
  </div>
</template>

<style scoped>
.head {
  margin-bottom: 32px;
  padding-bottom: 32px;
  border-bottom: 1px solid var(--color-border);
}

.head__title {
  font-size: var(--text-xl);
  font-weight: 500;
}

.head__desc {
  margin-top: 6px;
  color: var(--color-body);
}

.text {
  margin-top: -8px;
  color: var(--color-body);
}

.tfa-btn {
  margin-top: 24px;
}

.stack {
  display: grid;
  gap: 16px;
}

.codes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.codes code {
  display: block;
  padding: 8px;
  border-radius: var(--radius-sm);
  background: var(--color-page);
  font-family: var(--font-mono);
  text-align: center;
}
</style>
