import type { PoiAction, PoiEntry } from '../../content/types'
import type { CSSProperties } from 'react'

interface EntryModalProps {
  entry: PoiEntry | null
  note: string | null
  onClose: () => void
  onAction: (entry: PoiEntry, action: PoiAction) => void
  statusLabels: Record<PoiEntry['status'], string>
  closeLabel: string
}

export function EntryModal({ entry, note, onClose, onAction, statusLabels, closeLabel }: EntryModalProps) {
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
            <p className="status-chip status-chip-inline">{statusLabels[entry.status]}</p>
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
            {closeLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
