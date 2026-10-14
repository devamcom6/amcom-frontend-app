<script setup lang="ts">
import AppSelect from '@/components/base/AppSelect.vue'
import { useRouter } from 'vue-router'
import AppBackLink from '@/components/base/AppBackLink.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppEmptyState from '@/components/base/AppEmptyState.vue'
import AppErrorState from '@/components/base/AppErrorState.vue'
import AppPagination from '@/components/base/AppPagination.vue'
import AppSkeleton from '@/components/base/AppSkeleton.vue'
import { useResourceList } from '@/composables/useResourceList'
import { notificationService } from '@/services/api'
import { useNotificationStore } from '@/stores/notifications'
import type { AppNotification } from '@/types'
import { formatRelativeTime } from '@/utils/format'

const router = useRouter()
const store = useNotificationStore()
const list = useResourceList<AppNotification, { unread: string }>({
  fetcher: (q) => notificationService.list(q),
  perPage: 15,
  filters: { unread: '' },
})

async function open(n: AppNotification) {
  await store.markRead(n)
  if (n.action_url) void router.push(n.action_url)
}

async function markAll() {
  await store.markAllRead()
  await list.refresh()
}
</script>

<template>
  <div class="notes">
    <AppBackLink fallback="/dashboard" icon="chevron" />
    <header class="notes__head">
      <h1 class="notes__title">Notifications</h1>
      <div class="notes__actions">
        <AppSelect v-model="list.filters.unread" variant="filter" label="Show" hide-label empty-label="All" class="notes__filter" :options="[{ value: 'true', label: 'Unread' }]" />
        <AppButton variant="outline" size="sm" :disabled="!store.unread" @click="markAll">Mark all as read</AppButton>
      </div>
    </header>

    <AppErrorState v-if="list.error.value" :error="list.error.value" @retry="list.refresh" />
    <div v-else-if="list.loading.value && !list.loaded.value" class="notes__list"><AppSkeleton v-for="i in 4" :key="i" height="72px" radius="12px" /></div>
    <AppEmptyState v-else-if="!list.items.value.length" icon="bell" title="You're all caught up" description="New updates about your payments, investments and listings will appear here." />
    <template v-else>
      <ul class="notes__list" role="list">
        <li v-for="n in list.items.value" :key="n.id">
          <button type="button" class="note" :class="{ 'is-unread': !n.read_at }" @click="open(n)">
            <span class="note__dot" aria-hidden="true" />
            <span class="note__body">
              <span class="note__title">{{ n.title }}<span v-if="!n.read_at" class="sr-only"> (unread)</span></span>
              <span class="note__text">{{ n.body }}</span>
            </span>
            <time class="note__time" :datetime="n.created_at">{{ formatRelativeTime(n.created_at) }}</time>
          </button>
        </li>
      </ul>
      <AppPagination v-model:page="list.page.value" :meta="list.meta.value" label="notifications" />
    </template>
  </div>
</template>

<style scoped>
.notes {
  padding-top: 40px;
}

.notes__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin: 28px 0 24px;
}

.notes__title {
  font-size: var(--text-2xl);
  font-weight: 600;
}

.notes__actions {
  display: flex;
  gap: 12px;
}


.notes__list {
  display: grid;
  gap: 10px;
}

.note {
  display: grid;
  grid-template-columns: 10px minmax(0, 1fr) auto;
  align-items: start;
  gap: 14px;
  width: 100%;
  padding: 16px 18px;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  text-align: left;
}

.note:hover {
  border-color: var(--color-border);
}

.note__dot {
  width: 8px;
  height: 8px;
  margin-top: 7px;
  border-radius: 50%;
  background: transparent;
}

.note.is-unread {
  background: #f8fbf9;
}

.note.is-unread .note__dot {
  background: var(--color-primary);
}

.note__body {
  display: grid;
  gap: 2px;
}

.note__title {
  font-weight: 600;
  font-size: var(--text-sm);
}

.note__text {
  font-size: var(--text-sm);
  color: var(--color-body);
}

.note__time {
  font-size: var(--text-xs);
  color: var(--color-muted);
  white-space: nowrap;
}

@media (max-width: 767px) {
  .notes {
    padding-top: 16px;
  }
  .note {
    grid-template-columns: 10px minmax(0, 1fr);
  }
  .note__time {
    grid-column: 2;
  }
}
</style>
