export type PoiStatus = 'live' | 'wip' | 'coming_soon' | 'ruins'

export type PoiKind =
  | 'company'
  | 'external_link'
  | 'project_showcase'
  | 'social'
  | 'npc'
  | 'sign'
  | 'coming_soon'

export type PoiActionType = 'open_link' | 'open_modal' | 'coming_soon'

export type EntryVisualType = 'house' | 'npc' | 'sign' | 'plaza'

export interface PoiAction {
  id: string
  label: string
  type: PoiActionType
  href?: string
  confirmMessage?: string
}

export interface PoiDialog {
  title: string
  body: string
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
