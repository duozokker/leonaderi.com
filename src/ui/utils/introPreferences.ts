export const INTRO_DISMISSED_STORAGE_KEY = 'portfolio:intro-dismissed:v1'

export function shouldOpenIntroByDefault(search: string, dismissed: boolean): boolean {
  const params = new URLSearchParams(search)
  if (params.get('intro') === '1') return true
  if (params.get('intro') === '0') return false
  if (params.get('skipIntro') === '1') return false
  return !dismissed
}

export function readIntroDismissedFlag(rawValue: string | null): boolean {
  if (!rawValue) return false
  const normalized = rawValue.trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes'
}

