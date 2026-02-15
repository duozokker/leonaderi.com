import { describe, expect, it } from 'vitest'
import { resolveRendererPreference } from '../src/game/rendererMode'

describe('resolveRendererPreference', () => {
  it('uses explicit query renderer=canvas', () => {
    expect(resolveRendererPreference({ search: '?renderer=canvas' })).toBe('canvas')
  })

  it('uses explicit query renderer=webgl', () => {
    expect(resolveRendererPreference({ search: '?renderer=webgl' })).toBe('webgl')
  })

  it('forces canvas for webdriver sessions', () => {
    expect(resolveRendererPreference({ webdriver: true, userAgent: 'Mozilla/5.0' })).toBe('canvas')
  })

  it('falls back to auto for normal browsers', () => {
    expect(resolveRendererPreference({ userAgent: 'Mozilla/5.0 Safari/605.1.15', webdriver: false })).toBe('auto')
  })
})
