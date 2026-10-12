<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '@/components/base/AppIcon.vue'
import AppSkeleton from '@/components/base/AppSkeleton.vue'
import { useNotificationStore } from '@/stores/notifications'
import type { AppNotification } from '@/types'
import { formatRelativeTime } from '@/utils/format'
import { useDismiss } from './useDismiss'

withDefaults(defineProps<{ allUrl?: string }>(), { allUrl: "/dashboard/notifications" })

const store = useNotificationStore()
const router = useRouter()
const route = useRoute()
const open = ref(false)
const root = ref<HTMLElement | null>(null)
useDismiss(root, open)
watch(() => route.fullPath, () => (open.value = false))

watch(open, (v) => {
  if (v) void store.load()
})

async function select(n: AppNotification) {
  await store.markRead(n)
  open.value = false
  if (n.action_url) void router.push(n.action_url)
}
</script>

<template>
  <div ref="root" class="bell">
    <button
      type="button"
      class="bell__trigger"
      :aria-expanded="open"
      aria-haspopup="dialog"
      :aria-label="store.unread ? `Notifications, ${store.unread} unread` : 'Notifications'"
      @click="open = !open"
    >
      <AppIcon name="bell" :size="22" />
      <span v-if="store.unread" class="bell__dot" aria-hidden="true">{{ store.unread > 9 ? '9+' : store.unread }}</span>
    </button>

    <Transition name="slide-up">
      <div v-if="open" class="bell__panel" role="dialog" aria-label="Notifications">
        <div class="bell__head">
          <h2 class="bell__title">Notifications</h2>
          <button v-if="store.unread" type="button" class="bell__mark" @click="store.markAllRead()">Mark all as read</button>
        </div>
        <div v-if="store.loading && !store.loaded" class="bell__state">
          <AppSkeleton v-for="i in 3" :key="i" height="44px" />
        </div>
        <p v-else-if="store.error" class="bell__state">{{ store.error }}</p>
        <p v-else-if="!store.items.length" class="bell__state bell__empty">You're all caught up.</p>
        <ul v-else class="bell__list" role="list">
          <li v-for="n in store.items" :key="n.id">
            <button type="button" class="bell__item" :class="{ 'is-unread': !n.read_at }" @click="select(n)">
              <span class="bell__item-title">{{ n.title }}</span>
              <span class="bell__item-body">{{ n.body }}</span>
              <span class="bell__item-time">{{ formatRelativeTime(n.created_at) }}</span>
            </button>
          </li>
        </ul>
        <RouterLink :to="allUrl" class="bell__all">View all notifications</RouterLink>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.bell {
  position: relative;
}

.bell__trigger {
  position: relative;
  display: inline-grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  color: var(--color-muted);
}

.bell__trigger:hover {
  background: var(--color-page);
  color: var(--color-ink);
}

.bell__dot {
  position: absolute;
  top: 6px;
  right: 4px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: var(--radius-pill);
  background: var(--color-terracotta);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
}

.bell__panel {
  position: absolute;
  right: -60px;
  top: calc(100% + 12px);
  z-index: var(--z-dropdown);
  width: min(380px, calc(100vw - 32px));
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.bell__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid var(--color-border-subtle);
}

.bell__title {
  font-size: var(--text-base);
  font-weight: 600;
}

.bell__mark {
  font-size: var(--text-xs);
  color: var(--color-primary);
  font-weight: 500;
}

.bell__state {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px;
  font-size: var(--text-sm);
  color: var(--color-muted);
}

.bell__empty {
  text-align: center;
  padding: 32px 18px;
}

.bell__list {
  max-height: 360px;
  overflow-y: auto;
}

.bell__item {
  display: grid;
  gap: 2px;
  width: 100%;
  padding: 14px 18px;
  border-bottom: 1px solid var(--color-border-subtle);
  text-align: left;
}

.bell__item:hover {
  background: var(--color-page);
}

.bell__item.is-unread {
  background: #f6faf8;
  box-shadow: inset 3px 0 0 var(--color-primary);
}

.bell__item-title {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-ink);
}

.bell__item-body {
  font-size: var(--text-sm);
  color: var(--color-body);
}

.bell__item-time {
  font-size: var(--text-xs);
  color: var(--color-muted);
}

.bell__all {
  display: block;
  padding: 14px 18px;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-primary);
  text-align: center;
}

@media (max-width: 767px) {
  .bell__panel {
    position: fixed;
    left: 16px;
    right: 16px;
    top: calc(var(--header-height) + 8px);
    width: auto;
  }
}
</style>
