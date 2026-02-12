interface TopHudProps {
  hoverLabel: string | null
  onOpenIntro: () => void
}

export function TopHud({ hoverLabel, onOpenIntro }: TopHudProps) {
  return (
    <div className="hud-shell">
      <div>
        <strong>Leonaderi Pixel World</strong>
        <p>{hoverLabel ?? 'Bewege dich mit WASD/Pfeiltasten und erkunde die Stadt.'}</p>
      </div>
      <button className="pixel-btn" type="button" onClick={onOpenIntro}>
        Hilfe
      </button>
    </div>
  )
}
