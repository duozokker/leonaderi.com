import { describe, expect, it } from 'vitest'
import { isAdminFeatureEnabledFromValue } from '../src/ui/admin/services/authGuard'
import { normalizeExpectedDebugHash } from '../src/game/systems/debugMenuAuth'

describe('authGuard feature flag', () => {
  it('enables only on true literal', () => {
    expect(isAdminFeatureEnabledFromValue('true')).toBe(true)
    expect(isAdminFeatureEnabledFromValue('false')).toBe(false)
    expect(isAdminFeatureEnabledFromValue(undefined)).toBe(false)
  })
})

describe('authGuard hash parsing', () => {
  const hash = 'a78ccabb135221aa0a3ace92ca5d3480b147c6676c36868a00707f6c1e2861c8'

  it('accepts env assignment format', () => {
    expect(normalizeExpectedDebugHash(`VITE_DEBUG_MENU_HASH=${hash}`)).toBe(hash)
  })
})
