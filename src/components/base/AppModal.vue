<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { focusFirst, lockScroll, trapFocus, unlockScroll } from '@/composables/useScrollLock'
import AppIcon from './AppIcon.vue'

/**
 * Accessible dialog. Desktop: centred modal. Mobile (≤767px): bottom sheet with a grab handle,
 * matching the "Bottom Sheet" designs.
 */
defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    title?: string
    description?: string
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
    /** Prevent closing via overlay click / Escape (e.g. while submitting). */
    persistent?: boolean
    hideClose?: boolean
    /** Visually hide the title (still announced). */
    hideTitle?: boolean
    titleTone?: 'default' | 'danger'
    /** Remove body padding (galleries). */
    flush?: boolean
    divided?: boolean
  }>(),
  { size: 'md', titleTone: 'default', divided: true },
)

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ close: [] }>()

const panel = ref<HTMLElement | null>(null)
const titleId = useId()
const descId = useId()
let releaseTrap: (() => void) | null = null
let restoreFocus: HTMLElement | null = null

function close() {
  if (props.persistent) return
  open.value = false
  emit('close')
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.stopPropagation()
    close()
  }
}

watch(
  open,
  async (value) => {
    if (value) {
      restoreFocus = document.activeElement as HTMLElement | null
      lockScroll()
      await nextTick()
      if (panel.value) {
        releaseTrap = trapFocus(panel.value)
        focusFirst(panel.value)
      }
    } else {
      releaseTrap?.()
      releaseTrap = null
      unlockScroll()
      restoreFocus?.focus?.()
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (open.value) {
    releaseTrap?.()
    unlockScroll()
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="modal" v-bind="$attrs" @keydown="onKeydown">
        <div class="modal__overlay" aria-hidden="true" @click="close" />
        <div
          ref="panel"
          class="modal__panel"
          :class="[`modal__panel--${size}`, { 'modal__panel--flush': flush }]"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="title ? titleId : undefined"
          :aria-describedby="description ? descId : undefined"
          tabindex="-1"
        >
          <span class="modal__handle" aria-hidden="true" />
          <header v-if="title || !hideClose || $slots.header" class="modal__header" :class="{ 'modal__header--divided': divided && title, 'modal__header--bare': !title }">
            <slot name="header">
              <div v-if="title" class="modal__titles" :class="{ 'sr-only': hideTitle }">
                <h2 :id="titleId" class="modal__title" :class="`modal__title--${titleTone}`">{{ title }}</h2>
                <p v-if="description" :id="descId" class="modal__description">{{ description }}</p>
              </div>
            </slot>
            <button v-if="!hideClose" type="button" class="modal__close" aria-label="Close dialog" :disabled="persistent" @click="close">
              <AppIcon name="close" :size="22" />
            </button>
          </header>
          <div class="modal__body">
            <slot />
          </div>
          <footer v-if="$slots.footer" class="modal__footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: grid;
  place-items: center;
  padding: 24px;
}

.modal__overlay {
  position: absolute;
  inset: 0;
  background: rgba(17, 20, 24, 0.32);
  backdrop-filter: blur(1px);
}

.modal__panel {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: calc(100vh - 48px);
  background: var(--color-bg);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.modal__panel:focus {
  outline: none;
}

.modal__panel--sm {
  max-width: 520px;
}
.modal__panel--md {
  max-width: 740px;
}
.modal__panel--lg {
  max-width: 960px;
}
.modal__panel--xl {
  max-width: 1200px;
}
.modal__panel--full {
  max-width: none;
  height: 100%;
  max-height: none;
  border-radius: 0;
}

.modal__handle {
  display: none;
}

.modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 32px 20px;
}

.modal__header--divided {
  border-bottom: 1px solid var(--color-border-subtle);
}

.modal__header--bare {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 2;
  padding: 24px 24px 0;
}

.modal__title {
  font-size: var(--text-xl);
  font-weight: 500;
  color: var(--color-ink);
}

.modal__title--danger {
  color: var(--color-danger-strong);
  font-weight: 600;
}

.modal__description {
  margin-top: 4px;
  font-size: var(--text-sm);
  color: var(--color-body);
}

.modal__close {
  display: inline-grid;
  place-items: center;
  width: 36px;
  height: 36px;
  margin: -6px -6px 0 0;
  border-radius: 50%;
  color: var(--color-muted);
  flex-shrink: 0;
}

.modal__close:hover {
  background: var(--color-neutral-bg);
  color: var(--color-ink);
}

.modal__body {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 24px 32px;
}

.modal__panel--flush .modal__body {
  padding: 0;
}

.modal__footer {
  padding: 16px 32px 24px;
  border-top: 1px solid var(--color-border-subtle);
}

/* Desktop transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity var(--duration) var(--ease);
}
.modal-enter-active .modal__panel,
.modal-leave-active .modal__panel {
  transition: transform var(--duration-slow) var(--ease), opacity var(--duration) var(--ease);
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal__panel,
.modal-leave-to .modal__panel {
  transform: translateY(12px) scale(0.98);
}

/* Mobile bottom sheet */
@media (max-width: 767px) {
  .modal {
    align-items: end;
    padding: 0;
  }

  .modal__panel,
  .modal__panel--sm,
  .modal__panel--md,
  .modal__panel--lg,
  .modal__panel--xl {
    max-width: none;
    max-height: 92vh;
    border-radius: 24px 24px 0 0;
    padding-bottom: env(safe-area-inset-bottom);
  }

  .modal__handle {
    display: block;
    width: 36px;
    height: 4px;
    margin: 10px auto 0;
    border-radius: var(--radius-pill);
    background: #d1d5db;
  }

  .modal__header {
    padding: 16px 16px 12px;
  }

  .modal__header--divided {
    border-bottom: 0;
  }

  .modal__header--bare {
    padding: 20px 16px 0;
  }

  .modal__body {
    padding: 8px 16px 20px;
  }

  .modal__footer {
    padding: 12px 16px 16px;
  }

  .modal-enter-from .modal__panel,
  .modal-leave-to .modal__panel {
    transform: translateY(100%);
  }
}
</style>
