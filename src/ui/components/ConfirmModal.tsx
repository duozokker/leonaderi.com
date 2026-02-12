interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmModal({
  open,
  title,
  message,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card confirm-card">
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="pixel-btn" type="button" onClick={onCancel}>
            Zurueck
          </button>
          <button className="pixel-btn primary" type="button" onClick={onConfirm}>
            OK, weiter
          </button>
        </div>
      </div>
    </div>
  )
}
