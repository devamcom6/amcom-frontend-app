<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import AppButton from '@/components/base/AppButton.vue'
import AppErrorState from '@/components/base/AppErrorState.vue'
import AppSkeleton from '@/components/base/AppSkeleton.vue'
import AppToggle from '@/components/base/AppToggle.vue'
import { useAsync } from '@/composables/useAsync'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import { profileService } from '@/services/api'
import { useUiStore } from '@/stores/ui'
import type { NotificationGroup } from '@/types'

/** Email notification preferences (delivered by Laravel through ZeptoMail). */
const ui = useUiStore()
const { data: prefs, loading, error, execute } = useAsync(() => profileService.notificationPreferences())

const state = reactive<Record<string, boolean>>({})
const baseline = ref('')
watch(prefs, (list) => {
  if (!list) return
  for (const p of list) state[p.key] = p.enabled
  baseline.value = JSON.stringify(state)
})
const dirty = computed(() => JSON.stringify(state) !== baseline.value)
useUnsavedChanges(dirty)

const GROUPS: { key: NotificationGroup; label: string }[] = [
  { key: 'transactions', label: 'Transaction Notifications' },
  { key: 'investments', label: 'Investment Alerts' },
  { key: 'property', label: 'Property Updates' },
  { key: 'security', label: 'Account & Security' },
]

const saving = ref(false)
async function save() {
  saving.value = true
  try {
    prefs.value = await profileService.saveNotificationPreferences({ ...state })
    baseline.value = JSON.stringify(state)
    ui.success('Notification preferences saved')
  } catch (e) {
    ui.apiError(e)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <header class="head">
      <h2 class="head__title">Notification Preferences</h2>
      <p class="head__desc">Choose how and when you want to be notified</p>
    </header>
    <AppSkeleton v-if="loading && !prefs" :lines="8" height="24px" />
    <AppErrorState v-else-if="error" :error="error" @retry="execute" />
    <template v-else-if="prefs">
      <section v-for="g in GROUPS" :key="g.key" class="group" :aria-labelledby="`grp-${g.key}`">
        <h3 :id="`grp-${g.key}`" class="group__title">{{ g.label }}</h3>
        <div class="group__list">
          <AppToggle
            v-for="p in prefs.filter((x) => x.group === g.key)"
            :id="`pref-${p.key}`"
            :key="p.key"
            v-model="state[p.key]"
            :label="p.label"
            :description="p.locked ? `${p.description} (required for account security)` : p.description"
            :disabled="p.locked"
          />
        </div>
      </section>
      <div class="actions">
        <AppButton :loading="saving" :disabled="!dirty" @click="save">Save Changes</AppButton>
      </div>
    </template>
  </div>
</template>

<style scoped>
.head {
  padding-bottom: 24px;
  border-bottom: 1px solid var(--color-border);
}

.head__title {
  font-size: var(--text-lg);
  font-weight: 500;
}

.head__desc {
  margin-top: 4px;
  font-size: var(--text-sm);
  color: var(--color-body);
}

.group {
  padding: 32px 0;
  border-bottom: 1px solid var(--color-border);
}

.group__title {
  margin-bottom: 20px;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-primary);
}

.group__list {
  display: grid;
  gap: 28px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 24px;
}
</style>
