export type RendererPreference = 'auto' | 'canvas' | 'webgl'

export function resolveRendererPreference(options?: {
  search?: string
  userAgent?: string
  webdriver?: boolean
}): RendererPreference {
  const search = options?.search ?? (typeof window !== 'undefined' ? window.location.search : '')
  const params = new URLSearchParams(search)
  const explicit = params.get('renderer')?.trim().toLowerCase()

  if (explicit === 'canvas') return 'canvas'
  if (explicit === 'webgl') return 'webgl'
  if (params.get('canvas') === '1') return 'canvas'

  const webdriver = options?.webdriver ?? (typeof navigator !== 'undefined' ? Boolean(navigator.webdriver) : false)
  const ua = (options?.userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '')).toLowerCase()

  if (webdriver || ua.includes('headless') || ua.includes('playwright') || ua.includes('puppeteer')) {
    return 'canvas'
  }

  return 'auto'
}
