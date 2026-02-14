import {
  ADMIN_PATCH_STORAGE_KEY,
  ADMIN_SESSION_STORAGE_KEY,
  type AdminPatchV1,
  type AdminRuntimeState,
} from '../types'

export function createEmptyPatch(): AdminPatchV1 {
  const now = new Date().toISOString()
  return {
    version: 1,
    meta: {
      createdAt: now,
      updatedAt: now,
      mapId: 'default-map',
      appVersion: '0.0.0',
    },
    global: {
      mapOffset: { x: 0, y: 0 },
      uiTextOverrides: {},
    },
    pois: {},
    mapObjects: {},
    npcs: {},
  }
}

export function loadPatchFromStorage(): AdminPatchV1 {
  if (typeof window === 'undefined') return createEmptyPatch()
  try {
    const raw = window.localStorage.getItem(ADMIN_PATCH_STORAGE_KEY)
    if (!raw) return createEmptyPatch()
    const parsed = JSON.parse(raw) as AdminPatchV1
    if (!parsed || parsed.version !== 1) return createEmptyPatch()
    return parsed
  } catch {
    return createEmptyPatch()
  }
}

export function savePatchToStorage(patch: AdminPatchV1): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ADMIN_PATCH_STORAGE_KEY, JSON.stringify(patch))
}

export function loadSessionFromStorage(): Pick<AdminRuntimeState, 'mode'> {
  if (typeof window === 'undefined') return { mode: 'live' }
  try {
    const raw = window.localStorage.getItem(ADMIN_SESSION_STORAGE_KEY)
    if (!raw) return { mode: 'live' }
    const parsed = JSON.parse(raw) as Pick<AdminRuntimeState, 'mode'>
    if (parsed.mode !== 'live' && parsed.mode !== 'full-map' && parsed.mode !== 'text') {
      return { mode: 'live' }
    }
    return parsed
  } catch {
    return { mode: 'live' }
  }
}

export function saveSessionToStorage(session: Pick<AdminRuntimeState, 'mode'>): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(session))
}
