import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { config } from '@/config/env'
import type { ApiPaginated, ApiSuccess, Paginated } from '@/types'
import { toApiError } from './errors'
import { sessionEvents } from './events'
import { tokenStore } from './token'

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Skip the global 401/403 handling (used by login, `me` bootstrap, etc.). */
    skipAuthHandling?: boolean
  }
}

export const http: AxiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: config.apiTimeoutMs,
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  // Laravel expects PHP-style arrays: ?status[]=a&status[]=b
  paramsSerializer: { indexes: false },
})

http.interceptors.request.use((request) => {
  const token = tokenStore.get()
  if (token) request.headers.set('Authorization', `Bearer ${token}`)
  return request
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = toApiError(error)
    const requestConfig = (error?.config ?? {}) as AxiosRequestConfig

    if (!requestConfig.skipAuthHandling) {
      if (apiError.kind === 'unauthorized' && tokenStore.get()) {
        tokenStore.clear()
        sessionEvents.emit('session:expired', { message: 'Your session has expired. Please log in again.' })
      } else if (apiError.kind === 'forbidden') {
        if (apiError.code === 'account_suspended') {
          sessionEvents.emit('session:suspended', { message: apiError.message })
        } else {
          sessionEvents.emit('session:forbidden', { message: apiError.message, url: requestConfig.url ?? '' })
        }
      } else if (apiError.status === 503 && apiError.code === 'maintenance') {
        sessionEvents.emit('app:maintenance', { message: apiError.message })
      }
    }

    return Promise.reject(apiError)
  },
)

// Compared against the raw string so Vite can statically eliminate the mock layer
// (and all mock data) from builds where VITE_USE_MOCK_API is not "true".
if (import.meta.env.VITE_USE_MOCK_API === 'true') {
  const { installMockAdapter } = await import('@/mocks/adapter')
  installMockAdapter(http)
}

/* ------------------------------------------------------------------ */
/* Typed helpers that unwrap the `{ success, message, data }` envelope */
/* ------------------------------------------------------------------ */

export async function get<T>(url: string, cfg?: AxiosRequestConfig): Promise<T> {
  const { data } = await http.get<ApiSuccess<T>>(url, cfg)
  return data.data
}

export async function getPaginated<T>(url: string, cfg?: AxiosRequestConfig): Promise<Paginated<T>> {
  const { data } = await http.get<ApiPaginated<T>>(url, cfg)
  return { data: data.data, meta: data.meta }
}

export async function post<T, B = unknown>(url: string, body?: B, cfg?: AxiosRequestConfig): Promise<T> {
  const { data } = await http.post<ApiSuccess<T>>(url, body, cfg)
  return data.data
}

/** Same as `post` but also returns the server message (used for success toasts). */
export async function postWithMessage<T, B = unknown>(
  url: string,
  body?: B,
  cfg?: AxiosRequestConfig,
): Promise<{ data: T; message: string }> {
  const { data } = await http.post<ApiSuccess<T>>(url, body, cfg)
  return { data: data.data, message: data.message }
}

export async function put<T, B = unknown>(url: string, body?: B, cfg?: AxiosRequestConfig): Promise<T> {
  const { data } = await http.put<ApiSuccess<T>>(url, body, cfg)
  return data.data
}

export async function patch<T, B = unknown>(url: string, body?: B, cfg?: AxiosRequestConfig): Promise<T> {
  const { data } = await http.patch<ApiSuccess<T>>(url, body, cfg)
  return data.data
}

export async function del<T = null>(url: string, cfg?: AxiosRequestConfig): Promise<T> {
  const { data } = await http.delete<ApiSuccess<T>>(url, cfg)
  return data.data
}

/** multipart/form-data upload with progress reporting. */
export async function upload<T>(
  url: string,
  form: FormData,
  onProgress?: (percent: number) => void,
  cfg?: AxiosRequestConfig,
): Promise<T> {
  const { data } = await http.post<ApiSuccess<T>>(url, form, {
    ...cfg,
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100))
    },
  })
  return data.data
}

export async function download(url: string, cfg?: AxiosRequestConfig): Promise<Blob> {
  const { data } = await http.get<Blob>(url, { ...cfg, responseType: 'blob' })
  return data
}
