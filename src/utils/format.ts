import type { ISODate, ISODateTime, Naira, PricePeriod } from '@/types'

const nairaFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  currencyDisplay: 'narrowSymbol',
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('en-NG')

/** ₦5,000,000 */
export function formatNaira(value: Naira | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return nairaFormatter.format(value)
}

/** +₦1,260,000 */
export function formatSignedNaira(value: Naira): string {
  return `${value >= 0 ? '+' : '−'}${formatNaira(Math.abs(value))}`
}

/** ₦10M, ₦2B, ₦6.5M */
export function formatCompactNaira(value: Naira): string {
  const abs = Math.abs(value)
  const units: [number, string][] = [
    [1e9, 'B'],
    [1e6, 'M'],
    [1e3, 'K'],
  ]
  for (const [size, suffix] of units) {
    if (abs >= size) {
      const n = value / size
      return `₦${Number.isInteger(n) ? n : n.toFixed(1).replace(/\.0$/, '')}${suffix}`
    }
  }
  return formatNaira(value)
}

export function formatPrice(value: Naira, period: PricePeriod): string {
  if (!period) return formatNaira(value)
  return `${formatNaira(value)}/${period}`
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return numberFormatter.format(value)
}

export function formatPercent(value: number, options: { signed?: boolean } = {}): string {
  const rounded = Math.round(value * 10) / 10
  const sign = options.signed && rounded > 0 ? '+' : ''
  return `${sign}${rounded}%`
}

function toDate(value: ISODate | ISODateTime | Date): Date {
  if (value instanceof Date) return value
  // Plain dates (YYYY-MM-DD) are calendar dates — parse as local midnight.
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value)
}

/** 14 Aug 2027 */
export function formatDate(value: ISODate | ISODateTime | Date | null | undefined): string {
  if (!value) return '—'
  return toDate(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Aug 5, 2026 */
export function formatDateUS(value: ISODate | ISODateTime | null | undefined): string {
  if (!value) return '—'
  return toDate(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** June 2025 */
export function formatMonthYear(value: ISODate | null | undefined): string {
  if (!value) return '—'
  return toDate(value).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

export function formatDateTime(value: ISODateTime | null | undefined): string {
  if (!value) return '—'
  return toDate(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelativeTime(value: ISODateTime): string {
  const diffMs = toDate(value).getTime() - Date.now()
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const minutes = Math.round(diffMs / 60_000)
  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return rtf.format(hours, 'hour')
  const days = Math.round(hours / 24)
  if (Math.abs(days) < 30) return rtf.format(days, 'day')
  return formatDate(value)
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unit = 0
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit++
  }
  return `${size.toFixed(unit === 0 ? 0 : 1).replace(/\.0$/, '')} ${units[unit]}`
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (first + last).toUpperCase() || '?'
}

const ONES = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten']

/** "One (1)" — matches the plot count presentation in the designs. */
export function formatCountWord(n: number): string {
  return `${ONES[n] ?? n} (${n})`
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

export function toISODate(date: Date): ISODate {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Humanise snake_case API enums: "pending_verification" → "Pending verification". */
export function humanize(value: string | null | undefined): string {
  if (!value) return '—'
  const text = value.replace(/_/g, ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}
