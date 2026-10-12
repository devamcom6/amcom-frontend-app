/**
 * Allow-list HTML sanitiser for CMS content (legal pages, rich descriptions).
 * The backend must sanitise on write; this is defence in depth before `v-html`.
 */
const ALLOWED_TAGS = new Set([
  'P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'UL', 'OL', 'LI', 'H2', 'H3', 'H4', 'A', 'BLOCKQUOTE', 'SPAN',
])
const ALLOWED_ATTRS: Record<string, string[]> = { A: ['href', 'title'] }

export function sanitizeHtml(dirty: string): string {
  const doc = new DOMParser().parseFromString(`<div>${dirty}</div>`, 'text/html')
  const root = doc.body.firstElementChild
  if (!root) return ''

  const walk = (node: Element) => {
    for (const child of Array.from(node.children)) {
      if (!ALLOWED_TAGS.has(child.tagName)) {
        // Keep the text of disallowed elements but drop the element (and any script content).
        if (['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED'].includes(child.tagName)) {
          child.remove()
        } else {
          child.replaceWith(...Array.from(child.childNodes))
        }
        continue
      }
      for (const attr of Array.from(child.attributes)) {
        const allowed = ALLOWED_ATTRS[child.tagName] ?? []
        if (!allowed.includes(attr.name)) child.removeAttribute(attr.name)
      }
      if (child.tagName === 'A') {
        const href = child.getAttribute('href') ?? ''
        if (!/^(https?:|mailto:|tel:|\/)/i.test(href)) child.removeAttribute('href')
        child.setAttribute('rel', 'noopener noreferrer')
        child.setAttribute('target', '_blank')
      }
      walk(child)
    }
  }
  walk(root)
  return root.innerHTML
}
