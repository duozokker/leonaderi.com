interface TopHudProps {
  hoverLabel: string | null
  onOpenIntro: () => void
  title: string
  defaultSubtitle: string
  helpLabel: string
}

export function TopHud({ hoverLabel, onOpenIntro, title, defaultSubtitle, helpLabel }: TopHudProps) {
  return (
    <div className="hud-shell">
      <div>
        <strong>{title}</strong>
        <p>{hoverLabel ?? defaultSubtitle}</p>
      </div>
      <button className="pixel-btn" type="button" onClick={onOpenIntro}>
        {helpLabel}
      </button>
    </div>
  )
}
