import { toRaw } from 'vue'

/**
 * Deep-clones plain JSON-like data, including Vue reactive proxies
 * (which the native structured clone algorithm cannot handle).
 */
export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(toRaw(value))) as T
}
