import { sanitizeHtml } from '@/utils/sanitize'

/**
 * Converts a public .docx (e.g. the Terms of Service on Cloudinary) to safe HTML for in-page reading.
 * The converter (mammoth, ~100 kB gz) is loaded on first use only, and results are cached per URL.
 * Requires the file host to send CORS headers (Cloudinary does) and the CSP connect-src to allow it.
 */
const cache = new Map<string, Promise<string>>()

/** List items that already carry their own clause number ("1.1 …", "2.") shouldn't also get a bullet. */
function markNumberedItems(html: string): string {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html')
  const root = doc.body.firstElementChild!
  root.querySelectorAll('li').forEach((li) => {
    if (/^\s*\d+(\.\d+)*\.?\s/.test(li.textContent ?? '')) li.classList.add('is-numbered')
  })
  return root.innerHTML
}

async function convert(url: string): Promise<string> {
  const res = await fetch(url, { credentials: 'omit' })
  if (!res.ok) throw new Error(`Could not load the document (HTTP ${res.status}).`)
  const arrayBuffer = await res.arrayBuffer()
  const { default: mammoth } = await import('mammoth')
  const { value } = await mammoth.convertToHtml({ arrayBuffer })
  // Sanitise first (allow-list), then add our own presentation classes.
  return markNumberedItems(sanitizeHtml(value))
}

export function loadDocxHtml(url: string): Promise<string> {
  let pending = cache.get(url)
  if (!pending) {
    pending = convert(url)
    pending.catch(() => cache.delete(url)) // allow a retry after a failure
    cache.set(url, pending)
  }
  return pending
}
