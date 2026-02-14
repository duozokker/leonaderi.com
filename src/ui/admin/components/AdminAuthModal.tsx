import { useState } from 'react'

interface AdminAuthModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (password: string) => Promise<boolean>
}

export function AdminAuthModal({ open, onClose, onSubmit }: AdminAuthModalProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const ok = await onSubmit(password)
      if (!ok) {
        setError('Passwort ist ungueltig.')
        return
      }
      setPassword('')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card confirm-card">
        <h2>Admin Zugriff</h2>
        <p>Bitte Passwort eingeben, um den World Builder zu oeffnen.</p>
        <input
          className="admin-input"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Admin Passwort"
        />
        {error ? <p className="admin-error">{error}</p> : null}
        <div className="modal-actions">
          <button className="pixel-btn" type="button" onClick={onClose} disabled={loading}>
            Abbrechen
          </button>
          <button className="pixel-btn primary" type="button" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Pruefe...' : 'Freischalten'}
          </button>
        </div>
      </div>
    </div>
  )
}
