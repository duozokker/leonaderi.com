export interface MobileInputState {
  up: boolean
  down: boolean
  left: boolean
  right: boolean
  interactRequested: boolean
}

const state: MobileInputState = {
  up: false,
  down: false,
  left: false,
  right: false,
  interactRequested: false,
}

export function getMobileInputState(): MobileInputState {
  return state
}

export function setMobileDirection(direction: 'up' | 'down' | 'left' | 'right', active: boolean): void {
  state[direction] = active
}

export function requestMobileInteract(): void {
  state.interactRequested = true
}

export function consumeMobileInteract(): boolean {
  if (!state.interactRequested) {
    return false
  }

  state.interactRequested = false
  return true
}

export function resetMobileInput(): void {
  state.up = false
  state.down = false
  state.left = false
  state.right = false
  state.interactRequested = false
}
