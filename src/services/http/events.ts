/**
 * Tiny typed event bus that lets the HTTP layer signal session problems to the
 * auth store / router without importing them (avoids circular dependencies).
 */
type SessionEvents = {
  /** 401 on an authenticated request: token expired or revoked. */
  'session:expired': { message: string }
  /** 403: the user lacks a permission (it may have been revoked server-side). */
  'session:forbidden': { message: string; url: string }
  /** 423 / `account_suspended`: account disabled by an administrator. */
  'session:suspended': { message: string }
  /** 503 with `maintenance` code. */
  'app:maintenance': { message: string }
}

type Handler<T> = (payload: T) => void

const handlers: { [K in keyof SessionEvents]?: Set<Handler<SessionEvents[K]>> } = {}

export const sessionEvents = {
  on<K extends keyof SessionEvents>(event: K, handler: Handler<SessionEvents[K]>): () => void {
    const bucket = handlers as Record<K, Set<Handler<SessionEvents[K]>> | undefined>
    const set = (bucket[event] ??= new Set<Handler<SessionEvents[K]>>())
    set.add(handler)
    return () => set.delete(handler)
  },
  emit<K extends keyof SessionEvents>(event: K, payload: SessionEvents[K]): void {
    ;(handlers[event] as Set<Handler<SessionEvents[K]>> | undefined)?.forEach((h) => h(payload))
  },
}
