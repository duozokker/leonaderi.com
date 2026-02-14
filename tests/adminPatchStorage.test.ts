import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createEmptyPatch,
  loadPatchFromStorage,
  savePatchToStorage,
} from '../src/ui/admin/services/patchStorage'
import { ADMIN_PATCH_STORAGE_KEY } from '../src/ui/admin/types'

class MemoryStorage {
  private store = new Map<string, string>()

  getItem(key: string): string | null {
    return this.store.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value)
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('patchStorage', () => {
  it('returns empty patch when window is missing', () => {
    const patch = loadPatchFromStorage()
    expect(patch.version).toBe(1)
  })

  it('saves and loads patch via localStorage', () => {
    const localStorage = new MemoryStorage()
    vi.stubGlobal('window', { localStorage })

    const patch = createEmptyPatch()
    patch.global.mapOffset = { x: 44, y: 55 }
    savePatchToStorage(patch)

    const loaded = loadPatchFromStorage()
    expect(loaded.global.mapOffset?.x).toBe(44)
    expect(loaded.global.mapOffset?.y).toBe(55)
  })

  it('falls back on invalid json', () => {
    const localStorage = new MemoryStorage()
    localStorage.setItem(ADMIN_PATCH_STORAGE_KEY, '{broken')
    vi.stubGlobal('window', { localStorage })
    const loaded = loadPatchFromStorage()
    expect(loaded.version).toBe(1)
  })
})
