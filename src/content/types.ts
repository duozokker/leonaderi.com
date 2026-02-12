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

export interface PoiLocation {
  district: string
  mapObjectId?: string
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
  location: PoiLocation
  actions: PoiAction[]
}

