<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppAlert from '@/components/base/AppAlert.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppCheckbox from '@/components/base/AppCheckbox.vue'
import AppErrorState from '@/components/base/AppErrorState.vue'
import AppSkeleton from '@/components/base/AppSkeleton.vue'
import { useAsync } from '@/composables/useAsync'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import { adminService } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { Permission, PermissionDefinition, RoleDefinition } from '@/types'

/**
 * Role → permission matrix. System roles (user, super_admin) are read-only.
 * Changes apply server-side immediately; affected sessions get fresh permissions on their next request.
 */
const auth = useAuthStore()
const ui = useUiStore()
const roles = useAsync(() => adminService.roles())
const perms = useAsync(() => adminService.permissions())

const selectedId = ref<number | null>(null)
watch(roles.data, (r) => {
  if (r && !selectedId.value) selectedId.value = r.find((x) => !x.is_system)?.id ?? r[0]?.id ?? null
})
const role = computed<RoleDefinition | undefined>(() => roles.data.value?.find((r) => r.id === selectedId.value))

const draft = ref<Set<Permission>>(new Set())
watch(role, (r) => (draft.value = new Set(r?.permissions ?? [])), { immediate: true })
const dirty = computed(() => !!role.value && (draft.value.size !== role.value.permissions.length || role.value.permissions.some((p) => !draft.value.has(p))))
useUnsavedChanges(dirty)

const groups = computed(() => {
  const out = new Map<string, PermissionDefinition[]>()
  for (const p of perms.data.value ?? []) out.set(p.group, [...(out.get(p.group) ?? []), p])
  return [...out.entries()]
})

function toggle(key: Permission, on: boolean) {
  const next = new Set(draft.value)
  if (on) next.add(key)
  else next.delete(key)
  draft.value = next
}

const saving = ref(false)
async function save() {
  if (!role.value) return
  saving.value = true
  try {
    const updated = await adminService.updateRolePermissions(role.value.id, [...draft.value])
    roles.data.value = roles.data.value?.map((r) => (r.id === updated.id ? updated : r))
    ui.success(`${updated.label} permissions updated`)
    if (auth.role === updated.name) await auth.refreshUser()
  } catch (e) {
    ui.apiError(e)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <AppErrorState v-if="roles.error.value || perms.error.value" :error="roles.error.value ?? perms.error.value" @retry="() => { roles.execute(); perms.execute() }" />
    <AppSkeleton v-else-if="!roles.data.value || !perms.data.value" :lines="10" height="24px" />
    <div v-else class="roles">
      <nav class="roles__list" aria-label="Roles">
        <button
          v-for="r in roles.data.value"
          :key="r.id"
          type="button"
          class="roles__item"
          :class="{ 'is-active': r.id === selectedId }"
          :aria-current="r.id === selectedId || undefined"
          @click="selectedId = r.id"
        >
          <span class="roles__name">{{ r.label }}<small v-if="r.is_system"> · system</small></span>
          <span class="roles__count">{{ r.users_count }} {{ r.users_count === 1 ? 'account' : 'accounts' }}</span>
        </button>
      </nav>

      <section v-if="role" class="matrix" :aria-label="`${role.label} permissions`">
        <header class="matrix__head">
          <div>
            <h2 class="matrix__title">{{ role.label }}</h2>
            <p class="matrix__desc">{{ role.description }}</p>
          </div>
          <AppButton v-if="!role.is_system" :disabled="!dirty" :loading="saving" @click="save">Save permissions</AppButton>
        </header>
        <AppAlert v-if="role.is_system" tone="neutral">System roles cannot be edited. Customers never receive admin permissions; Super Admin always has every permission.</AppAlert>
        <fieldset v-for="[group, items] in groups" :key="group" class="matrix__group" :disabled="role.is_system">
          <legend class="matrix__legend">{{ group }}</legend>
          <div v-for="p in items" :key="p.key" class="matrix__row">
            <AppCheckbox :model-value="draft.has(p.key)" :disabled="role.is_system" @update:model-value="toggle(p.key, $event)">
              <span class="matrix__label">{{ p.label }}</span>
              <span class="matrix__hint">{{ p.description }}</span>
            </AppCheckbox>
            <code class="matrix__key">{{ p.key }}</code>
          </div>
        </fieldset>
      </section>
    </div>
  </div>
</template>

<style scoped>
.roles {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

.roles__list {
  display: grid;
  gap: 8px;
}

.roles__item {
  display: grid;
  gap: 2px;
  padding: 12px 14px;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  text-align: left;
}

.roles__item.is-active {
  border-color: var(--color-primary);
  box-shadow: inset 3px 0 0 var(--color-primary);
}

.roles__name {
  font-weight: 600;
}

.roles__name small,
.roles__count {
  font-size: var(--text-xs);
  font-weight: 400;
  color: var(--color-muted);
}

.matrix {
  padding: 20px;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
}

.matrix__head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.matrix__title {
  font-size: var(--text-lg);
  font-weight: 600;
}

.matrix__desc {
  font-size: var(--text-sm);
  color: var(--color-muted);
}

.matrix__group {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border-subtle);
}

.matrix__legend {
  margin-bottom: 8px;
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.matrix__row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding: 8px 0;
}

.matrix__label {
  display: block;
  font-weight: 500;
}

.matrix__hint {
  display: block;
  font-size: var(--text-xs);
  color: var(--color-muted);
}

.matrix__key {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-subtle);
}

@media (max-width: 899px) {
  .roles {
    grid-template-columns: 1fr;
  }
  .matrix__key {
    display: none;
  }
}
</style>
