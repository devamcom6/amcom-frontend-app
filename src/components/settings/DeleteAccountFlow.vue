<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '@/components/base/AppButton.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import AppInput from '@/components/base/AppInput.vue'
import AppModal from '@/components/base/AppModal.vue'
import { profileService } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

/** Two-stage destructive confirmation: warning → type DELETE. */
const open = defineModel<boolean>('open', { default: false })
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const stage = ref<'warn' | 'confirm'>('warn')
const typed = ref('')
const error = ref<string | null>(null)
const deleting = ref(false)

watch(open, (v) => {
  if (v) {
    stage.value = 'warn'
    typed.value = ''
    error.value = null
  }
})

async function confirmDelete() {
  if (typed.value !== 'DELETE') {
    error.value = 'Type DELETE in capital letters to confirm.'
    return
  }
  deleting.value = true
  try {
    await profileService.deleteAccount('DELETE')
    auth.clearSession()
    open.value = false
    ui.info('Your account has been scheduled for deletion', "We've sent a confirmation to your email.")
    void router.replace('/')
  } catch (e) {
    ui.apiError(e)
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <AppModal
    v-model:open="open"
    :title="stage === 'warn' ? 'Delete Account' : 'Confirm Account Deletion'"
    :description="stage === 'warn' ? 'Permanently delete your Amcom account and all associated data.' : undefined"
    title-tone="danger"
    size="md"
    :persistent="deleting"
  >
    <div v-if="stage === 'warn'" class="warn" role="alert">
      <p class="warn__title"><AppIcon name="alert" :size="20" /> This action is permanent and cannot be undone</p>
      <ul class="warn__list">
        <li>All your property listings will be removed permanently.</li>
        <li>Your investment portfolio data will be completely deleted.</li>
        <li>Transaction history will no longer be accessible.</li>
        <li>You will lose access to all signed documents and account statements.</li>
      </ul>
    </div>
    <form v-else id="delete-form" novalidate @submit.prevent="confirmDelete">
      <p class="confirm-text">To confirm, type <strong>DELETE</strong> in the field below.</p>
      <AppInput v-model="typed" label="Confirmation" hide-label placeholder="Type DELETE here" autocomplete="off" :error="error" autofocus />
    </form>
    <template #footer>
      <AppButton v-if="stage === 'warn'" variant="danger" size="lg" block @click="stage = 'confirm'">Continue</AppButton>
      <AppButton v-else type="submit" form="delete-form" variant="danger" size="lg" block :loading="deleting" :disabled="typed !== 'DELETE'">
        Delete my Account
      </AppButton>
    </template>
  </AppModal>
</template>

<style scoped>
.warn {
  padding: 20px 24px;
  border: 1px solid #f5d77a;
  border-radius: var(--radius-sm);
  background: #fffbea;
}

.warn__title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: var(--text-md);
  color: var(--color-warning);
}

.warn__list {
  margin: 14px 0 0;
  padding-left: 52px;
  display: grid;
  gap: 8px;
  font-size: var(--text-sm);
  color: #9a3412;
}

.confirm-text {
  margin-bottom: 16px;
  font-size: var(--text-sm);
  color: var(--color-body);
}
</style>
