<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
import AppIcon from './AppIcon.vue'
import type { IconName } from './icons'

const ui = useUiStore()
const ICON: Record<string, IconName> = { success: 'check-circle', error: 'x-circle', info: 'info', warning: 'alert' }
</script>

<template>
  <div class="toaster" aria-live="polite" aria-relevant="additions">
    <TransitionGroup name="toast">
      <div v-for="t in ui.toasts" :key="t.id" class="toast" :class="`toast--${t.tone}`" :role="t.tone === 'error' ? 'alert' : 'status'">
        <AppIcon :name="ICON[t.tone] ?? 'info'" :size="20" class="toast__icon" />
        <div class="toast__body">
          <p class="toast__title">{{ t.title }}</p>
          <p v-if="t.description" class="toast__desc">{{ t.description }}</p>
        </div>
        <button type="button" class="toast__close" aria-label="Dismiss notification" @click="ui.dismiss(t.id)">
          <AppIcon name="close" :size="16" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toaster {
  position: fixed;
  z-index: var(--z-toast);
  right: 24px;
  bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: min(400px, calc(100vw - 32px));
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: var(--radius-md);
  background: var(--color-bg);
  border: 1px solid var(--color-border-subtle);
  border-left: 4px solid var(--color-primary);
  box-shadow: var(--shadow-md);
  pointer-events: auto;
}

.toast--success {
  border-left-color: var(--color-success);
}
.toast--success .toast__icon {
  color: var(--color-success);
}
.toast--error {
  border-left-color: var(--color-danger);
}
.toast--error .toast__icon {
  color: var(--color-danger);
}
.toast--warning {
  border-left-color: var(--color-warning);
}
.toast--warning .toast__icon {
  color: var(--color-warning);
}
.toast--info .toast__icon {
  color: var(--color-primary);
}

.toast__body {
  flex: 1;
  min-width: 0;
}

.toast__title {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-ink);
}

.toast__desc {
  margin-top: 2px;
  font-size: var(--text-sm);
  color: var(--color-muted);
}

.toast__close {
  color: var(--color-muted);
}

.toast-enter-active,
.toast-leave-active {
  transition: all var(--duration-slow) var(--ease);
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(24px);
}

@media (max-width: 767px) {
  .toaster {
    left: 16px;
    right: 16px;
    bottom: 16px;
    width: auto;
  }
}
</style>
