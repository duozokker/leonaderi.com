export const DEFAULT_DEBUG_HASH_FALLBACK = 'a78ccabb135221aa0a3ace92ca5d3480b147c6676c36868a00707f6c1e2861c8'

function parseHashCandidate(raw: string): string | null {
  const trimmed = raw.trim().replace(/^["']+|["']+$/g, '')
  if (!trimmed) return null

  const withoutPrefix = trimmed
    .replace(/^VITE_DEBUG_MENU_HASH\s*=\s*/i, '')
    .replace(/^sha256[:=]/i, '')
    .replace(/^0x/i, '')
    .trim()

  const directMatch = withoutPrefix.match(/[a-fA-F0-9]{64}/)
  if (directMatch) {
    return directMatch[0].toLowerCase()
  }

  const compact = withoutPrefix.replace(/[^a-fA-F0-9]/g, '').toLowerCase()
  if (compact.length === 64) {
    return compact
  }

  return null
}

export function normalizeExpectedDebugHash(value: string | undefined, fallback = DEFAULT_DEBUG_HASH_FALLBACK): string {
  if (!value) return fallback
  return parseHashCandidate(value) ?? fallback
}

export function trimDebugPassword(raw: string): string {
  return raw.trim()
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')
}

export async function sha256Hex(value: string): Promise<string> {
  const encoded = new TextEncoder().encode(value)
  const digest = await window.crypto.subtle.digest('SHA-256', encoded)
  return toHex(digest)
}

export async function verifyDebugPasswordHash(
  rawPassword: string,
  expectedHash: string,
  hashFn: (value: string) => Promise<string> = sha256Hex,
): Promise<boolean> {
  const value = trimDebugPassword(rawPassword)
  if (!value) return false
  const hashed = (await hashFn(value)).toLowerCase()
  return hashed === expectedHash.toLowerCase()
}
