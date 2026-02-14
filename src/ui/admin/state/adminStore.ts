import { useCallback, useEffect, useMemo, useState } from 'react'
import { portfolioGlossary } from '../../../content/glossary'
import type { PoiEntry } from '../../../content/types'
import { buildMergedAdminData } from '../services/patchMerge'
import {
  createEmptyPatch,
  loadPatchFromStorage,
  loadSessionFromStorage,
  savePatchToStorage,
  saveSessionToStorage,
} from '../services/patchStorage'
import type {
  AdminPatchV1,
  AdminRuntimeState,
  AdminSelection,
  MapObjectKey,
  NpcKey,
  ObjectPatch,
  PoiPatch,
  UITextOverrides,
} from '../types'

function nowIso(): string {
  return new Date().toISOString()
}

export interface AdminStoreState {
  patch: AdminPatchV1
  runtime: AdminRuntimeState
  merged: ReturnType<typeof buildMergedAdminData>
  dirty: boolean
}

export interface AdminStoreActions {
  setOpen: (open: boolean) => void
  setMode: (mode: AdminRuntimeState['mode']) => void
  setSelection: (selection: AdminSelection) => void
  setPoiPatch: (id: PoiEntry['id'], patch: PoiPatch) => void
  setMapObjectPatch: (key: MapObjectKey, patch: ObjectPatch) => void
  setNpcPatch: (key: NpcKey, patch: { x?: number; y?: number }) => void
  setGlobalOffset: (offset: { x: number; y: number }) => void
  setUiTextOverrides: (overrides: UITextOverrides) => void
  replacePatch: (patch: AdminPatchV1) => void
  resetPatch: () => void
}

export function useAdminStore(): AdminStoreState & AdminStoreActions {
  const [patch, setPatch] = useState<AdminPatchV1>(() => loadPatchFromStorage())
  const [runtime, setRuntime] = useState<AdminRuntimeState>(() => ({
    open: false,
    mode: loadSessionFromStorage().mode,
    selection: { kind: 'none', id: '' },
  }))
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    savePatchToStorage(patch)
  }, [patch])

  useEffect(() => {
    saveSessionToStorage({ mode: runtime.mode })
  }, [runtime.mode])

  const merged = useMemo(() => buildMergedAdminData(portfolioGlossary, patch), [patch])

  const withMeta = useCallback((next: AdminPatchV1): AdminPatchV1 => {
    return {
      ...next,
      meta: {
        ...next.meta,
        updatedAt: nowIso(),
      },
    }
  }, [])

  const setOpen = useCallback((open: boolean) => {
    setRuntime((prev) => ({ ...prev, open }))
  }, [])

  const setMode = useCallback((mode: AdminRuntimeState['mode']) => {
    setRuntime((prev) => ({ ...prev, mode }))
  }, [])

  const setSelection = useCallback((selection: AdminSelection) => {
    setRuntime((prev) => ({ ...prev, selection }))
  }, [])

  const setPoiPatch = useCallback((id: PoiEntry['id'], poiPatch: PoiPatch) => {
    setPatch((prev) => withMeta({
      ...prev,
      pois: {
        ...prev.pois,
        [id]: {
          ...(prev.pois[id] ?? {}),
          world: {
            ...(prev.pois[id]?.world ?? {}),
            ...(poiPatch.world ?? {}),
            hitbox: poiPatch.world?.hitbox
              ? {
                  ...(prev.pois[id]?.world?.hitbox ?? {}),
                  ...poiPatch.world.hitbox,
                }
              : prev.pois[id]?.world?.hitbox,
          },
          content: {
            ...(prev.pois[id]?.content ?? {}),
            ...(poiPatch.content ?? {}),
            actions: poiPatch.content?.actions
              ? (() => {
                  const prevActions = prev.pois[id]?.content?.actions ?? []
                  const nextActions = [...prevActions]
                  for (const item of poiPatch.content.actions) {
                    const foundIdx = nextActions.findIndex((x) => x.id === item.id)
                    if (foundIdx === -1) {
                      nextActions.push(item)
                    } else {
                      nextActions[foundIdx] = { ...nextActions[foundIdx], ...item }
                    }
                  }
                  return nextActions
                })()
              : prev.pois[id]?.content?.actions,
          },
        },
      },
    }))
    setDirty(true)
  }, [withMeta])

  const setMapObjectPatch = useCallback((key: MapObjectKey, objectPatch: ObjectPatch) => {
    setPatch((prev) => withMeta({
      ...prev,
      mapObjects: {
        ...prev.mapObjects,
        [key]: {
          ...(prev.mapObjects[key] ?? {}),
          ...objectPatch,
        },
      },
    }))
    setDirty(true)
  }, [withMeta])

  const setNpcPatch = useCallback((key: NpcKey, npcPatch: { x?: number; y?: number }) => {
    setPatch((prev) => withMeta({
      ...prev,
      npcs: {
        ...prev.npcs,
        [key]: {
          ...(prev.npcs[key] ?? {}),
          ...npcPatch,
        },
      },
    }))
    setDirty(true)
  }, [withMeta])

  const setGlobalOffset = useCallback((offset: { x: number; y: number }) => {
    setPatch((prev) => withMeta({
      ...prev,
      global: {
        ...prev.global,
        mapOffset: offset,
      },
    }))
    setDirty(true)
  }, [withMeta])

  const setUiTextOverrides = useCallback((overrides: UITextOverrides) => {
    setPatch((prev) => withMeta({
      ...prev,
      global: {
        ...prev.global,
        uiTextOverrides: overrides,
      },
    }))
    setDirty(true)
  }, [withMeta])

  const replacePatch = useCallback((nextPatch: AdminPatchV1) => {
    setPatch(withMeta(nextPatch))
    setDirty(true)
  }, [withMeta])

  const resetPatch = useCallback(() => {
    setPatch(createEmptyPatch())
    setDirty(false)
  }, [])

  return {
    patch,
    runtime,
    merged,
    dirty,
    setOpen,
    setMode,
    setSelection,
    setPoiPatch,
    setMapObjectPatch,
    setNpcPatch,
    setGlobalOffset,
    setUiTextOverrides,
    replacePatch,
    resetPatch,
  }
}
