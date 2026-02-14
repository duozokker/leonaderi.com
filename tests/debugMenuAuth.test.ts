import { describe, expect, it } from 'vitest'
import {
  DEFAULT_DEBUG_HASH_FALLBACK,
  normalizeExpectedDebugHash,
  verifyDebugPasswordHash,
} from '../src/game/systems/debugMenuAuth'

const HASH = 'a78ccabb135221aa0a3ace92ca5d3480b147c6676c36868a00707f6c1e2861c8'

describe('normalizeExpectedDebugHash', () => {
  it('uses fallback for undefined input', () => {
    expect(normalizeExpectedDebugHash(undefined, HASH)).toBe(HASH)
  })

  it('accepts plain 64-char hash', () => {
    expect(normalizeExpectedDebugHash(HASH, DEFAULT_DEBUG_HASH_FALLBACK)).toBe(HASH)
  })

  it('accepts quoted hash', () => {
    expect(normalizeExpectedDebugHash(`"${HASH}"`, DEFAULT_DEBUG_HASH_FALLBACK)).toBe(HASH)
  })

  it('accepts sha256 prefix', () => {
    expect(normalizeExpectedDebugHash(`sha256:${HASH}`, DEFAULT_DEBUG_HASH_FALLBACK)).toBe(HASH)
  })

  it('accepts full env assignment format', () => {
    expect(normalizeExpectedDebugHash(`VITE_DEBUG_MENU_HASH=${HASH}`, DEFAULT_DEBUG_HASH_FALLBACK)).toBe(HASH)
  })

  it('falls back for invalid values', () => {
    expect(normalizeExpectedDebugHash('not-a-hash', HASH)).toBe(HASH)
  })
})

describe('verifyDebugPasswordHash', () => {
  const fakeHash = async (value: string): Promise<string> => (value === 'ok' ? HASH : 'deadbeef')

  it('returns true for correct password', async () => {
    await expect(verifyDebugPasswordHash('ok', HASH, fakeHash)).resolves.toBe(true)
  })

  it('trims password input', async () => {
    await expect(verifyDebugPasswordHash('  ok  ', HASH, fakeHash)).resolves.toBe(true)
  })

  it('returns false for wrong password', async () => {
    await expect(verifyDebugPasswordHash('wrong', HASH, fakeHash)).resolves.toBe(false)
  })
})
