import { describe, expect, it } from 'vitest'
import { toSafeExternalHref } from '../src/ui/utils/linkSafety'

describe('toSafeExternalHref', () => {
  it('accepts https links', () => {
    expect(toSafeExternalHref('https://example.com')).toBe('https://example.com/')
  })

  it('accepts mailto links', () => {
    expect(toSafeExternalHref('mailto:test@example.com')).toBe('mailto:test@example.com')
  })

  it('normalizes relative links to the provided base', () => {
    expect(toSafeExternalHref('/contact', 'https://leonaderi.com')).toBe('https://leonaderi.com/contact')
  })

  it('rejects dangerous protocols', () => {
    expect(toSafeExternalHref('javascript:alert(1)')).toBeNull()
    expect(toSafeExternalHref('data:text/html;base64,AAA=')).toBeNull()
  })
})

