interface IntroModalProps {
  onClose: () => void
  texts: {
    title: string
    body: string
    desktopTitle: string
    desktopMove: string
    desktopInteract: string
    mobileTitle: string
    mobileMove: string
    mobileInteract: string
    startButton: string
  }
}

export function IntroModal({ onClose, texts }: IntroModalProps) {
  return (
    <div className="modal-backdrop">
      <div className="modal-card intro-card">
        <h2>{texts.title}</h2>
        <p>{texts.body}</p>

        <div className="intro-grid">
          <div>
            <h3>{texts.desktopTitle}</h3>
            <p>{texts.desktopMove}</p>
            <p>{texts.desktopInteract}</p>
          </div>
          <div>
            <h3>{texts.mobileTitle}</h3>
            <p>{texts.mobileMove}</p>
            <p>{texts.mobileInteract}</p>
          </div>
        </div>

        <div className="modal-actions">
          <button className="pixel-btn primary" onClick={onClose} type="button">
            {texts.startButton}
          </button>
        </div>
      </div>
    </div>
  )
}
