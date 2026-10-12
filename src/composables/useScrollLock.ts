let locks = 0
let previousOverflow = ''
let previousPadding = ''

/** Reference-counted body scroll lock used by modals, sheets and the mobile nav. */
export function lockScroll() {
  if (locks++ === 0) {
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    previousOverflow = document.body.style.overflow
    previousPadding = document.body.style.paddingRight
    document.body.style.overflow = 'hidden'
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`
  }
}

export function unlockScroll() {
  if (locks === 0) return
  if (--locks === 0) {
    document.body.style.overflow = previousOverflow
    document.body.style.paddingRight = previousPadding
  }
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Keeps Tab / Shift+Tab inside `container`. Returns a cleanup function. */
export function trapFocus(container: HTMLElement): () => void {
  const onKeydown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return
    const nodes = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null)
    if (!nodes.length) return
    const first = nodes[0]!
    const last = nodes[nodes.length - 1]!
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }
  container.addEventListener('keydown', onKeydown)
  return () => container.removeEventListener('keydown', onKeydown)
}

export function focusFirst(container: HTMLElement) {
  const target =
    container.querySelector<HTMLElement>('[autofocus]') ?? container.querySelector<HTMLElement>(FOCUSABLE) ?? container
  target.focus({ preventScroll: true })
}
