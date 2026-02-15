export function toSafeExternalHref(rawHref: string, baseOrigin?: string): string | null {
  const href = rawHref.trim()
  if (!href) return null

  try {
    const base = baseOrigin ?? (typeof window !== 'undefined' ? window.location.origin : 'https://example.com')
    const url = new URL(href, base)
    if (url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'mailto:') {
      return url.toString()
    }
    return null
  } catch {
    return null
  }
}

