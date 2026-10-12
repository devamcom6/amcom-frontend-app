import { ref } from 'vue'
import { defineStore } from 'pinia'
import { notificationService } from '@/services/api'
import type { AppNotification } from '@/types'

const POLL_MS = 60_000

export const useNotificationStore = defineStore('notifications', () => {
  const items = ref<AppNotification[]>([])
  const unread = ref(0)
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref<string | null>(null)
  let timer: ReturnType<typeof setInterval> | null = null

  async function refreshCount() {
    try {
      unread.value = (await notificationService.unreadCount()).unread
    } catch {
      /* non-critical */
    }
  }

  async function load() {
    loading.value = true
    error.value = null
    try {
      const page = await notificationService.list({ per_page: 10 })
      items.value = page.data
      loaded.value = true
    } catch {
      error.value = "We couldn't load your notifications."
    } finally {
      loading.value = false
    }
  }

  async function markRead(n: AppNotification) {
    if (n.read_at) return
    n.read_at = new Date().toISOString()
    unread.value = Math.max(0, unread.value - 1)
    try {
      await notificationService.markRead(n.id)
    } catch {
      n.read_at = null
      unread.value++
    }
  }

  async function markAllRead() {
    const previous = items.value.map((n) => ({ ...n }))
    const now = new Date().toISOString()
    items.value.forEach((n) => (n.read_at ??= now))
    const before = unread.value
    unread.value = 0
    try {
      await notificationService.markAllRead()
    } catch {
      items.value = previous
      unread.value = before
    }
  }

  function startPolling() {
    stopPolling()
    void refreshCount()
    timer = setInterval(() => {
      if (document.visibilityState === 'visible') void refreshCount()
    }, POLL_MS)
  }

  function stopPolling() {
    if (timer) clearInterval(timer)
    timer = null
  }

  function reset() {
    stopPolling()
    items.value = []
    unread.value = 0
    loaded.value = false
  }

  return { items, unread, loading, loaded, error, load, refreshCount, markRead, markAllRead, startPolling, stopPolling, reset }
})
