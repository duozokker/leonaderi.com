import {
  requestMobileInteract,
  resetMobileInput,
  setMobileDirection,
} from '../../game/systems/mobileInputState'

interface MobileControlsProps {
  visible: boolean
}

function DirectionButton({
  label,
  direction,
}: {
  label: string
  direction: 'up' | 'down' | 'left' | 'right'
}) {
  const activate = (): void => setMobileDirection(direction, true)
  const deactivate = (): void => setMobileDirection(direction, false)

  return (
    <button
      className="mobile-btn"
      onPointerDown={activate}
      onPointerUp={deactivate}
      onPointerLeave={deactivate}
      onPointerCancel={deactivate}
      type="button"
    >
      {label}
    </button>
  )
}

export function MobileControls({ visible }: MobileControlsProps) {
  if (!visible) {
    return null
  }

  return (
    <div className="mobile-controls" onContextMenu={(event) => event.preventDefault()}>
      <div className="dpad">
        <div className="dpad-empty" />
        <DirectionButton direction="up" label="▲" />
        <div className="dpad-empty" />
        <DirectionButton direction="left" label="◀" />
        <button
          className="mobile-btn reset"
          type="button"
          onPointerDown={() => {
            resetMobileInput()
          }}
        >
          ■
        </button>
        <DirectionButton direction="right" label="▶" />
        <div className="dpad-empty" />
        <DirectionButton direction="down" label="▼" />
        <div className="dpad-empty" />
      </div>

      <button
        className="mobile-btn interact"
        type="button"
        onPointerDown={() => {
          requestMobileInteract()
        }}
      >
        Interact
      </button>
    </div>
  )
}
