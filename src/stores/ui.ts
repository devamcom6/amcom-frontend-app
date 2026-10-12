import { ref } from 'vue'
import { defineStore } from 'pinia'
import { isApiError } from '@/services/http/errors'

export type ToastTone = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: number
  tone: ToastTone
  title: string
  description?: string
  timeout: number
}

let seq = 0

export const useUiStore = defineStore('ui', () => {
  const toasts = ref<Toast[]>([])
  const mobileNavOpen = ref(false)
  const maintenanceMessage = ref<string | null>(null)

  function dismiss(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function notify(tone: ToastTone, title: string, description?: string, timeout = tone === 'error' ? 7000 : 4500) {
    const id = ++seq
    // De-duplicate identical toasts fired in quick succession (e.g. parallel 403s).
    if (toasts.value.some((t) => t.title === title && t.description === description)) return id
    toasts.value = [...toasts.value.slice(-3), { id, tone, title, description, timeout }]
    if (timeout > 0) setTimeout(() => dismiss(id), timeout)
    return id
  }

  const success = (title: string, description?: string) => notify('success', title, description)
  const info = (title: string, description?: string) => notify('info', title, description)
  const warning = (title: string, description?: string) => notify('warning', title, description)
  const error = (title: string, description?: string) => notify('error', title, description)

  /** Shows a safe, user-facing message for any thrown error. */
  function apiError(err: unknown, fallback = 'Something went wrong. Please try again.') {
    if (isApiError(err)) {
      if (err.kind === 'cancelled') return
      // 401/403 are surfaced by the global session handlers.
      if (err.kind === 'unauthorized') return
      notify('error', err.message)
      return
    }
    notify('error', fallback)
  }

  return { toasts, mobileNavOpen, maintenanceMessage, notify, success, info, warning, error, apiError, dismiss }
})
