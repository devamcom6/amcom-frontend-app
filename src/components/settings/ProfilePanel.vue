<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppAlert from '@/components/base/AppAlert.vue'
import AppAvatar from '@/components/base/AppAvatar.vue'
import AppBadge from '@/components/base/AppBadge.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppErrorState from '@/components/base/AppErrorState.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import AppInput from '@/components/base/AppInput.vue'
import AppSelect from '@/components/base/AppSelect.vue'
import AppSkeleton from '@/components/base/AppSkeleton.vue'
import AppSpinner from '@/components/base/AppSpinner.vue'
import { useAsync } from '@/composables/useAsync'
import { useForm } from '@/composables/useForm'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import { profileService } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useLookupStore } from '@/stores/lookups'
import { useUiStore } from '@/stores/ui'
import { AVATAR_UPLOAD_RULES, validateFile } from '@/utils/files'
import { email, phone, required } from '@/utils/validators'
import SettingsSection from './SettingsSection.vue'

const auth = useAuthStore()
const ui = useUiStore()
const lookups = useLookupStore()
void lookups.ensure()

const { data: profile, loading, error, execute } = useAsync(() => profileService.get())

const verified = computed(() => profile.value?.identity?.status === 'verified')
const locked = computed(() => new Set(profile.value?.identity?.locked_fields ?? []))

const info = useForm(
  { first_name: '', last_name: '', phone: '', alt_phone: '', country: '', state: '', city: '', address: '' },
  {
    rules: {
      first_name: [required('Enter your first name.')],
      last_name: [required('Enter your last name.')],
      phone: [required('Enter your phone number.'), phone()],
      alt_phone: [phone()],
    },
  },
)
const kin = useForm(
  { full_name: '', relationship: '', phone: '', email: '' },
  {
    rules: {
      full_name: [required('Enter a full name.')],
      relationship: [required('Select a relationship.')],
      phone: [required('Enter a phone number.'), phone()],
      email: [email()],
    },
  },
)
useUnsavedChanges(computed(() => info.isDirty || kin.isDirty))

watch(profile, (p) => {
  if (!p) return
  info.reset({
    first_name: p.user.first_name ?? '',
    last_name: p.user.last_name ?? '',
    phone: p.contact.phone ?? '',
    alt_phone: p.contact.alt_phone ?? '',
    country: p.contact.country ?? '',
    state: p.contact.state ?? '',
    city: p.contact.city ?? '',
    address: p.contact.address ?? '',
  })
  if (p.next_of_kin) kin.reset({ ...p.next_of_kin, email: p.next_of_kin.email ?? '' })
})

async function saveInfo() {
  try {
    const p = await info.submit(() =>
      profileService.update({
        ...info.values,
        alt_phone: info.values.alt_phone || null,
        ...(locked.value.has('first_name') ? { first_name: undefined, last_name: undefined } : {}),
      }),
    )
    if (p) {
      info.markClean()
      auth.patchUser({ first_name: p.user.first_name, last_name: p.user.last_name, name: p.user.name, phone: p.user.phone })
      ui.success('Profile updated')
    }
  } catch (e) {
    ui.apiError(e)
  }
}

async function saveKin() {
  try {
    const p = await kin.submit(() => profileService.saveNextOfKin({ ...kin.values, email: kin.values.email || null }))
    if (p) {
      kin.markClean()
      ui.success('Next of kin updated')
    }
  } catch (e) {
    ui.apiError(e)
  }
}

/* Avatar → Laravel → Cloudinary */
const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
async function onAvatar(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  ;(e.target as HTMLInputElement).value = ''
  if (!file) return
  const invalid = validateFile(file, AVATAR_UPLOAD_RULES)
  if (invalid) return ui.error(invalid)
  uploading.value = true
  try {
    const media = await profileService.uploadAvatar(file)
    auth.patchUser({ avatar: media })
    ui.success('Profile photo updated')
  } catch (err) {
    ui.apiError(err)
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <AppSkeleton v-if="loading && !profile" :lines="10" height="20px" />
  <AppErrorState v-else-if="error" :error="error" @retry="execute" />
  <div v-else-if="profile">
    <SettingsSection id="kyc-title" title="Identity Verification" :description="verified ? 'Your identity has been verified using a government-issued ID. Name fields are locked.' : 'Please verify your identity using a government-issued ID to unlock all features.'">
      <template #title>
        Identity Verification
        <AppBadge :tone="verified ? 'outline-success' : 'warning'" size="sm">{{ verified ? '✓ Verified' : 'Not Verified' }}</AppBadge>
      </template>
      <template #aside>
        <AppButton :to="{ name: 'onboarding', query: { step: 'identity' } }">{{ verified ? 'Reverify' : 'Verify Now' }}</AppButton>
      </template>
    </SettingsSection>

    <SettingsSection id="info-title" title="Personal Information" description="Update your account details and profile picture here.">
      <template #aside>
        <div class="avatar-edit">
          <span class="avatar-edit__pic">
            <AppAvatar :name="auth.displayName" :media="auth.user?.avatar" :size="64" />
            <span class="avatar-edit__badge" aria-hidden="true"><AppSpinner v-if="uploading" :size="10" /><AppIcon v-else name="camera" :size="12" /></span>
          </span>
          <button type="button" class="avatar-edit__btn" :disabled="uploading" @click="fileInput?.click()">Change Photo</button>
          <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" tabindex="-1" @change="onAvatar" />
        </div>
      </template>
      <form class="grid" novalidate @submit.prevent="saveInfo">
        <AppAlert v-if="info.errors._form" tone="danger" class="span-6">{{ info.errors._form }}</AppAlert>
        <AppInput v-model="info.values.first_name" label="First Name" class="span-3" :locked="locked.has('first_name')" :error="info.errors.first_name" />
        <AppInput v-model="info.values.last_name" label="Last Name" class="span-3" :locked="locked.has('last_name')" :error="info.errors.last_name" />
        <AppInput v-model="info.values.phone" label="Phone Number" type="tel" class="span-3" :error="info.errors.phone" @blur="info.touch('phone')" />
        <AppInput v-model="info.values.alt_phone" label="Alt Phone Number" type="tel" class="span-3" :error="info.errors.alt_phone" @blur="info.touch('alt_phone')" />
        <AppSelect v-model="info.values.country" label="Country of Residence" class="span-2" :options="lookups.countries" />
        <AppSelect v-if="info.values.country === 'Nigeria'" v-model="info.values.state" label="State" class="span-2" :options="lookups.states" />
        <AppInput v-else v-model="info.values.state" label="State" class="span-2" />
        <AppInput v-model="info.values.city" label="City" class="span-2" />
        <AppInput v-model="info.values.address" label="Address" class="span-6" autocomplete="street-address" />
        <div class="span-6 actions">
          <AppButton type="submit" :loading="info.submitting" :disabled="!info.isDirty">Save Changes</AppButton>
        </div>
      </form>
    </SettingsSection>

    <SettingsSection id="kin-title" title="Next of Kin" description="Required for property ownership documentation and emergency reference">
      <form class="grid" novalidate @submit.prevent="saveKin">
        <AppInput v-model="kin.values.full_name" label="Full Name" class="span-6" :error="kin.errors.full_name" @blur="kin.touch('full_name')" />
        <AppSelect v-model="kin.values.relationship" label="Relationship" class="span-3" placeholder="Select relationship" :options="lookups.relationships" :error="kin.errors.relationship" />
        <AppInput v-model="kin.values.phone" label="Phone" type="tel" class="span-3" :error="kin.errors.phone" @blur="kin.touch('phone')" />
        <AppInput v-model="kin.values.email" label="Email" optional type="email" class="span-6" :error="kin.errors.email" @blur="kin.touch('email')" />
        <div class="span-6 actions">
          <AppButton type="submit" :loading="kin.submitting" :disabled="!kin.isDirty">Save Changes</AppButton>
        </div>
      </form>
    </SettingsSection>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 18px 20px;
}

.span-2 {
  grid-column: span 2;
}
.span-3 {
  grid-column: span 3;
}
.span-6 {
  grid-column: 1 / -1;
}

.actions {
  display: flex;
  justify-content: flex-end;
}

.avatar-edit {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar-edit__pic {
  position: relative;
}

.avatar-edit__badge {
  position: absolute;
  right: -2px;
  bottom: -2px;
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border: 2px solid #fff;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
}

.avatar-edit__btn {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-primary);
}

@media (max-width: 767px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .span-2,
  .span-3 {
    grid-column: 1 / -1;
  }
  .actions :deep(.btn) {
    width: 100%;
  }
}
</style>
