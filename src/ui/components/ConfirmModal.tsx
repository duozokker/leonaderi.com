import { useEffect, useRef } from 'react'

interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  onCancel: () => void
  onConfirm: () => void
  cancelLabel: string
  confirmLabel: string
}

export function ConfirmModal({
  open,
  title,
  message,
  onCancel,
  onConfirm,
  cancelLabel,
  confirmLabel,
}: ConfirmModalProps) {
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!open) return
    cancelButtonRef.current?.focus()
  }, [open])

  if (!open) {
    return null
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onCancel()
    }}>
      <div className="modal-card confirm-card" role="dialog" aria-modal="true" aria-label={title}>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="modal-actions">
          <button ref={cancelButtonRef} className="pixel-btn" type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className="pixel-btn primary" type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
