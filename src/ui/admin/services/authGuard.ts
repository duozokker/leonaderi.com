import { normalizeExpectedDebugHash, verifyDebugPasswordHash } from '../../../game/systems/debugMenuAuth'

export function isAdminFeatureEnabledFromValue(value: string | undefined): boolean {
  return value === 'true'
}

export function isAdminFeatureEnabled(): boolean {
  return isAdminFeatureEnabledFromValue(import.meta.env.VITE_ADMIN_ENABLED)
}

export async function verifyAdminPasswordWithHash(rawPassword: string, expectedHashRaw: string | undefined): Promise<boolean> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) return false
  const expected = normalizeExpectedDebugHash(expectedHashRaw)
  return verifyDebugPasswordHash(rawPassword, expected)
}

export async function verifyAdminPassword(rawPassword: string): Promise<boolean> {
  if (!isAdminFeatureEnabled()) return false
  return verifyAdminPasswordWithHash(rawPassword, import.meta.env.VITE_DEBUG_MENU_HASH as string | undefined)
}
