import type { PoiEntry } from '../../content/types'
import type { AdminPatchV1, AdminSelection, WorldPlacementPatch } from '../../ui/admin/types'

export interface EntryDialogPayload {
  entry: PoiEntry
}

export interface HoverPayload {
  label: string | null
}

export interface UiBlockedPayload {
  blocked: boolean
}

export interface AdminTogglePayload {
  open: boolean
}

export interface AdminStateChangedPayload {
  open: boolean
  mode: 'live' | 'full-map' | 'text'
}

export interface AdminPatchPayload {
  patch: AdminPatchV1
}

export interface AdminCameraPayload {
  mode: 'live' | 'full-map'
  zoom?: number
}

export interface AdminSelectionPayload {
  selection: AdminSelection
}

export interface AdminPoiWorldUpdatePayload {
  id: PoiEntry['id']
  world: WorldPlacementPatch
}

export interface AdminSelectionChangedPayload {
  selection: AdminSelection
}

type GameEventMap = {
  'entry:open': EntryDialogPayload
  'entry:hover': HoverPayload
  'ui:block': UiBlockedPayload
  'admin:toggle': AdminTogglePayload
  'admin:state-changed': AdminStateChangedPayload
  'admin:patch-updated': AdminPatchPayload
  'admin:camera:set': AdminCameraPayload
  'admin:camera:fit-map': { fit: true }
  'admin:selection:set': AdminSelectionPayload
  'admin:poi-world:update': AdminPoiWorldUpdatePayload
  'admin:selection:changed': AdminSelectionChangedPayload
}

class GameEventBus {
  private readonly target = new EventTarget()

  on<K extends keyof GameEventMap>(type: K, handler: (payload: GameEventMap[K]) => void): () => void {
    const wrapped = (event: Event) => {
      const custom = event as CustomEvent<GameEventMap[K]>
      handler(custom.detail)
    }

    this.target.addEventListener(type, wrapped as EventListener)

    return () => {
      this.target.removeEventListener(type, wrapped as EventListener)
    }
  }

  emit<K extends keyof GameEventMap>(type: K, payload: GameEventMap[K]): void {
    this.target.dispatchEvent(new CustomEvent(type, { detail: payload }))
  }
}

export const gameEventBus = new GameEventBus()
