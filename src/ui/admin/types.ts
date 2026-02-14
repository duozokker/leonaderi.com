import type { PoiEntry, PoiStatus, PoiKind, EntryVisualType } from '../../content/types'
import type { MapObject } from '../../game/world/mapData'

export type PoiId = PoiEntry['id']
export type MapObjectKey = MapObject['key']
export type NpcKey = 'guide' | 'recruiter' | 'villageNpc' | 'guideNpc2' | 'playerSpawn'

export interface RectPatch {
  x: number
  y: number
  width: number
  height: number
}

export interface WorldPlacementPatch {
  x?: number
  y?: number
  width?: number
  height?: number
  hitbox?: RectPatch
  interactRadius?: number
  visual?: EntryVisualType
  solid?: boolean
}

export interface PoiContentPatch {
  name?: string
  kind?: PoiKind
  status?: PoiStatus
  description?: string
  accentColor?: string
  spriteHint?: string
  district?: string
  tags?: string[]
  dialogTitle?: string
  dialogBody?: string
  actions?: Array<{
    id: string
    label?: string
    href?: string
    confirmMessage?: string
  }>
}

export interface PoiPatch {
  world?: WorldPlacementPatch
  content?: PoiContentPatch
}

export interface ObjectPatch {
  x?: number
  y?: number
  width?: number
  height?: number
  depth?: number
  poiId?: string
  collision?: boolean
}

export interface NpcPatch {
  x?: number
  y?: number
}

export type UITextOverrides = Record<string, string>

export interface AdminPatchMeta {
  createdAt: string
  updatedAt: string
  mapId: string
  appVersion: string
}

export interface AdminPatchV1 {
  version: 1
  meta: AdminPatchMeta
  global: {
    mapOffset?: { x: number; y: number }
    uiTextOverrides?: UITextOverrides
  }
  pois: Partial<Record<PoiId, PoiPatch>>
  mapObjects: Partial<Record<MapObjectKey, ObjectPatch>>
  npcs: Partial<Record<NpcKey, NpcPatch>>
}

export interface AdminSelection {
  kind: 'poi' | 'mapObject' | 'npc' | 'none'
  id: string
}

export interface AdminRuntimeState {
  open: boolean
  mode: 'live' | 'full-map' | 'text'
  selection: AdminSelection
}

export const ADMIN_PATCH_STORAGE_KEY = 'admin:worldBuilder:patch:v1'
export const ADMIN_SESSION_STORAGE_KEY = 'admin:worldBuilder:session:v1'
