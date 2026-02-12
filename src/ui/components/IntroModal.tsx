interface IntroModalProps {
  onClose: () => void
}

export function IntroModal({ onClose }: IntroModalProps) {
  return (
    <div className="modal-backdrop">
      <div className="modal-card intro-card">
        <h2>Willkommen in deiner Pixel Portfolio World</h2>
        <p>
          Du spawnst als Charakter in einer Pokemon-like Stadt. Erkunde Haeuser, NPCs, Schilder
          und entdecke Links zu LinkedIn, GitHub, Firma und Projekten.
        </p>

        <div className="intro-grid">
          <div>
            <h3>Desktop</h3>
            <p>Bewegung: WASD oder Pfeiltasten</p>
            <p>Interaktion: E, Enter, Space oder Mausklick</p>
          </div>
          <div>
            <h3>Mobile</h3>
            <p>Nutze das D-Pad unten links</p>
            <p>Mit Interact unten rechts sprichst du mit NPCs und betrittst Haeuser</p>
          </div>
        </div>

        <div className="modal-actions">
          <button className="pixel-btn primary" onClick={onClose} type="button">
            Spiel starten
          </button>
        </div>
      </div>
    </div>
  )
}
