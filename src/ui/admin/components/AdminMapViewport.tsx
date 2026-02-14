interface AdminMapViewportProps {
  mode: 'live' | 'full-map' | 'text'
  onFitMap: () => void
}

export function AdminMapViewport({ mode, onFitMap }: AdminMapViewportProps) {
  if (mode !== 'full-map') return null

  return (
    <div className="admin-map-tools">
      <strong>Vollkartenmodus aktiv</strong>
      <p>Mausrad: Zoom | Drag: Kamera verschieben</p>
      <button className="pixel-btn" type="button" onClick={onFitMap}>
        Fit Map
      </button>
    </div>
  )
}
