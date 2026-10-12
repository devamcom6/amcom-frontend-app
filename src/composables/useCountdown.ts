import { computed, onScopeDispose, ref } from 'vue'

/** Simple seconds countdown used to throttle "Resend code" buttons. */
export function useCountdown(seconds = 60) {
  const remaining = ref(0)
  let timer: ReturnType<typeof setInterval> | undefined

  function start(from = seconds) {
    remaining.value = from
    clearInterval(timer)
    timer = setInterval(() => {
      remaining.value = Math.max(0, remaining.value - 1)
      if (remaining.value === 0) clearInterval(timer)
    }, 1000)
  }

  onScopeDispose(() => clearInterval(timer))
  return { remaining, running: computed(() => remaining.value > 0), start }
}
