import type { PoiAction, PoiEntry } from '../../content/types'
import type { CSSProperties } from 'react'

interface EntryModalProps {
  entry: PoiEntry | null
  note: string | null
  onClose: () => void
  onAction: (entry: PoiEntry, action: PoiAction) => void
}

function statusLabel(status: PoiEntry['status']): string {
  switch (status) {
    case 'live':
      return 'Live'
    case 'wip':
      return 'In Produktion'
    case 'coming_soon':
      return 'Coming Soon'
    case 'ruins':
      return 'Ruine'
    default:
      return status
  }
}

export function EntryModal({ entry, note, onClose, onAction }: EntryModalProps) {
  if (!entry) {
    return null
  }

  const previewStyle = { '--accent': entry.accentColor } as CSSProperties

  return (
    <div className="modal-backdrop">
      <div className="modal-card entry-card">
        <div className="entry-layout">
          <div className="entry-preview" style={previewStyle}>
            <div className="entry-preview-house" />
            <span>{entry.spriteHint}</span>
          </div>
          <div>
            <h2>{entry.dialog.title}</h2>
            <p className="status-chip status-chip-inline">{statusLabel(entry.status)}</p>
            <p>{entry.dialog.body}</p>
            <p className="entry-description">{entry.description}</p>
            <p className="entry-tags">{entry.tags.map((tag) => `#${tag}`).join(' ')}</p>
            {note ? <p className="entry-note">{note}</p> : null}
          </div>
        </div>

        <div className="modal-actions wrap">
          {entry.actions.map((action) => (
            <button
              className="pixel-btn"
              key={action.id}
              onClick={() => onAction(entry, action)}
              type="button"
            >
              {action.label}
            </button>
          ))}

          <button className="pixel-btn primary" onClick={onClose} type="button">
            Schliessen
          </button>
        </div>
      </div>
    </div>
  )
}
