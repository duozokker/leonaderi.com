export type Lang = 'en' | 'de'

export interface LocalizedText {
  en: string
  de: string
}

export type PoiStatus = 'live' | 'wip' | 'coming_soon' | 'ruins'

export type PoiKind =
  | 'company'
  | 'external_link'
  | 'project_showcase'
  | 'social'
  | 'sign'
  | 'coming_soon'

export type PoiActionType = 'open_link' | 'open_modal' | 'coming_soon'

export type EntryVisualType = 'house' | 'sign' | 'plaza'

export interface PoiAction {
  id: string
  label: LocalizedText
  type: PoiActionType
  href?: string
  modalId?: string
}

export interface PoiDialog {
  title: LocalizedText
  body: LocalizedText
}

export interface WorldPlacement {
  x: number
  y: number
  width: number
  height: number
  hitbox?: {
    x: number
    y: number
    width: number
    height: number
  }
  interactRadius: number
  visual: EntryVisualType
  solid: boolean
}

export interface PoiEntry {
  id: string
  name: string
  kind: PoiKind
  status: PoiStatus
  description: string
  accentColor: string
  spriteHint: string
  dialog: PoiDialog
  tags: string[]
  district: string
  world: WorldPlacement
  actions: PoiAction[]
}

export interface NpcEntry {
  id: string
  name: LocalizedText
  dialog: LocalizedText
  /** Dialog portrait path (under public/). */
  avatar: string
  /** Kaboom sprite key registered in loadAssets(). */
  spriteKey: string
  /** Spawn point key in NPC_POSITIONS (mapData.ts). */
  positionKey: string
  /** Hook for NPCs with scripted behavior beyond a plain dialog. */
  special?: 'recruiter_easteregg' | 'birthday_gate'
}

export interface ProjectEntry {
  id: string
  title: LocalizedText
  description: LocalizedText
  href?: string
  linkLabel?: LocalizedText
}
