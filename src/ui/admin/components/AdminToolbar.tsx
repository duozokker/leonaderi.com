interface AdminToolbarProps {
  mode: 'live' | 'full-map' | 'text'
  onModeChange: (mode: 'live' | 'full-map' | 'text') => void
  onExport: () => void
  onImport: () => void
  onReset: () => void
}

export function AdminToolbar({
  mode,
  onModeChange,
  onExport,
  onImport,
  onReset,
}: AdminToolbarProps) {
  return (
    <div className="admin-toolbar">
      <div className="admin-tabs">
        <button className={`pixel-btn ${mode === 'live' ? 'primary' : ''}`} type="button" onClick={() => onModeChange('live')}>Live</button>
        <button className={`pixel-btn ${mode === 'full-map' ? 'primary' : ''}`} type="button" onClick={() => onModeChange('full-map')}>Full Map</button>
        <button className={`pixel-btn ${mode === 'text' ? 'primary' : ''}`} type="button" onClick={() => onModeChange('text')}>Text</button>
      </div>
      <div className="admin-actions">
        <button className="pixel-btn" type="button" onClick={onImport}>Import</button>
        <button className="pixel-btn" type="button" onClick={onExport}>Export</button>
        <button className="pixel-btn" type="button" onClick={onReset}>Reset</button>
      </div>
    </div>
  )
}
