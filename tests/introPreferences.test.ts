import { describe, expect, it } from 'vitest'
import { readIntroDismissedFlag, shouldOpenIntroByDefault } from '../src/ui/utils/introPreferences'

describe('shouldOpenIntroByDefault', () => {
  it('opens intro by default when no dismissal exists', () => {
    expect(shouldOpenIntroByDefault('', false)).toBe(true)
  })

  it('does not open intro after dismissal', () => {
    expect(shouldOpenIntroByDefault('', true)).toBe(false)
  })

  it('supports explicit query overrides', () => {
    expect(shouldOpenIntroByDefault('?intro=1', true)).toBe(true)
    expect(shouldOpenIntroByDefault('?intro=0', false)).toBe(false)
    expect(shouldOpenIntroByDefault('?skipIntro=1', false)).toBe(false)
  })
})

describe('readIntroDismissedFlag', () => {
  it('accepts common truthy values', () => {
    expect(readIntroDismissedFlag('1')).toBe(true)
    expect(readIntroDismissedFlag('true')).toBe(true)
    expect(readIntroDismissedFlag('yes')).toBe(true)
  })

  it('returns false for empty or unknown values', () => {
    expect(readIntroDismissedFlag(null)).toBe(false)
    expect(readIntroDismissedFlag('')).toBe(false)
    expect(readIntroDismissedFlag('0')).toBe(false)
  })
})

