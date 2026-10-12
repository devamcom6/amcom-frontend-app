import { onBeforeUnmount, onMounted, type Ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

const MESSAGE = 'You have unsaved changes. Leave this page and discard them?'

/** Warns before leaving a page (route change or tab close) while a form is dirty. */
export function useUnsavedChanges(isDirty: Ref<boolean>, isSubmitting?: Ref<boolean>) {
  const onBeforeUnload = (e: BeforeUnloadEvent) => {
    if (!isDirty.value || isSubmitting?.value) return
    e.preventDefault()
    e.returnValue = ''
  }

  onMounted(() => window.addEventListener('beforeunload', onBeforeUnload))
  onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload))

  onBeforeRouteLeave(() => {
    if (!isDirty.value || isSubmitting?.value) return true
    return window.confirm(MESSAGE)
  })
}
