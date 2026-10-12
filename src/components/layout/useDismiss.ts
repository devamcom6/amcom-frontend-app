import { onBeforeUnmount, onMounted, type Ref } from 'vue'

/** Closes a popover on outside click or Escape. */
export function useDismiss(root: Ref<HTMLElement | null>, open: Ref<boolean>) {
  const onPointer = (e: PointerEvent) => {
    if (open.value && root.value && !root.value.contains(e.target as Node)) open.value = false
  }
  const onKey = (e: KeyboardEvent) => {
    if (open.value && e.key === 'Escape') {
      open.value = false
      root.value?.querySelector<HTMLElement>('[aria-expanded]')?.focus()
    }
  }
  onMounted(() => {
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
  })
  onBeforeUnmount(() => {
    document.removeEventListener('pointerdown', onPointer)
    document.removeEventListener('keydown', onKey)
  })
}
