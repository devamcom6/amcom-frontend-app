import { clone } from '@/utils/clone'
import { computed, reactive, ref, toRaw, type UnwrapRef } from 'vue'
import { isApiError } from '@/services/http/errors'
import type { Rule } from '@/utils/validators'

type Values = Record<string, unknown>
export type FormRules<T extends Values> = Partial<Record<keyof T, Rule<unknown, T>[]>>

interface UseFormOptions<T extends Values> {
  rules?: FormRules<T> | (() => FormRules<T>)
  /** Map API field names to form field names (e.g. `password_confirmation` → `confirmPassword`). */
  fieldMap?: Record<string, keyof T & string>
}

/**
 * Reusable form state with client validation and Laravel 422 error mapping.
 *
 *   const form = useForm({ email: '' }, { rules: { email: [required(), email()] } })
 *   await form.submit(() => api.call(form.values))
 */
export function useForm<T extends Values>(initial: T, options: UseFormOptions<T> = {}) {
  const values = reactive(clone(initial)) as UnwrapRef<T>
  let baseline = JSON.stringify(initial)
  type Key = keyof T & string
  const errors = reactive<Record<string, string | undefined>>({}) as Partial<Record<Key | '_form', string>>
  const touched = reactive<Record<string, boolean>>({}) as Partial<Record<Key, boolean>>
  const submitting = ref(false)
  const submitted = ref(false)
  const succeeded = ref(false)

  const rules = (): FormRules<T> => (typeof options.rules === 'function' ? options.rules() : (options.rules ?? {}))

  function validateField(field: Key): boolean {
    const fieldRules = rules()[field] ?? []
    const v = (values as T)[field]
    for (const rule of fieldRules) {
      const result = rule(v, values as T)
      if (result !== true) {
        errors[field] = result
        return false
      }
    }
    delete errors[field]
    return true
  }

  function validate(fields?: (Key)[]): boolean {
    const keys = fields ?? (Object.keys(rules()) as (Key)[])
    let valid = true
    for (const key of keys) {
      touched[key] = true
      if (!validateField(key)) valid = false
    }
    return valid
  }

  function touch(field: Key) {
    touched[field] = true
    if (submitted.value || errors[field]) validateField(field)
  }

  function clearErrors() {
    for (const key of Object.keys(errors)) delete errors[key as Key]
  }

  /** Applies a Laravel validation error bag. Returns true if any field error was mapped. */
  function setServerErrors(serverErrors: Record<string, string[]>): boolean {
    let mapped = false
    for (const [apiField, messages] of Object.entries(serverErrors)) {
      const field = (options.fieldMap?.[apiField] ?? apiField) as Key
      const message = messages[0]
      if (!message) continue
      if (field in (values as T)) {
        errors[field] = message
        touched[field] = true
        mapped = true
      }
    }
    return mapped
  }

  /**
   * Runs client validation then `handler`. API validation errors are mapped onto fields;
   * other errors are re-thrown so the caller can decide how to present them.
   */
  async function submit<R>(handler: () => Promise<R>, { validateFirst = true } = {}): Promise<R | undefined> {
    submitted.value = true
    succeeded.value = false
    delete errors._form
    if (validateFirst && !validate()) {
      focusFirstError()
      return undefined
    }
    submitting.value = true
    try {
      const result = await handler()
      succeeded.value = true
      return result
    } catch (err) {
      if (isApiError(err) && err.isValidation) {
        const mapped = setServerErrors(err.errors)
        if (!mapped) errors._form = err.message
        focusFirstError()
        return undefined
      }
      throw err
    } finally {
      submitting.value = false
    }
  }

  function focusFirstError() {
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>('[aria-invalid="true"]')
      el?.focus({ preventScroll: false })
    })
  }

  function reset(next?: Partial<T>) {
    const fresh = { ...clone(initial), ...(next ?? {}) }
    Object.assign(values as T, fresh)
    baseline = JSON.stringify(fresh)
    clearErrors()
    for (const key of Object.keys(touched)) delete touched[key as Key]
    submitted.value = false
  }

  /** Marks current values as the new clean baseline (e.g. after a successful save). */
  function markClean() {
    baseline = JSON.stringify(toRaw(values))
    dirtyTick.value++
  }

  const dirtyTick = ref(0)
  const isDirty = computed(() => {
    void dirtyTick.value
    return JSON.stringify(values) !== baseline
  })

  const hasErrors = computed(() => Object.keys(errors).length > 0)

  return reactive({
    values,
    errors,
    touched,
    submitting,
    submitted,
    succeeded,
    isDirty,
    hasErrors,
    validate,
    validateField,
    touch,
    submit,
    reset,
    markClean,
    setServerErrors,
    clearErrors,
  })
}

export type FormApi<T extends Values> = ReturnType<typeof useForm<T>>
