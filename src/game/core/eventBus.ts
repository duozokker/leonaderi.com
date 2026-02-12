import type { PoiEntry } from '../../content/types'

export interface EntryDialogPayload {
  entry: PoiEntry
}

export interface HoverPayload {
  label: string | null
}

export interface UiBlockedPayload {
  blocked: boolean
}

type GameEventMap = {
  'entry:open': EntryDialogPayload
  'entry:hover': HoverPayload
  'ui:block': UiBlockedPayload
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
