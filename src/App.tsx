import './App.css'
import { portfolioGlossary } from './content/glossary'

function App() {
  const grouped = portfolioGlossary.reduce<Record<string, typeof portfolioGlossary>>(
    (acc, entry) => {
      const district = entry.location.district
      if (!acc[district]) {
        acc[district] = []
      }
      acc[district].push(entry)
      return acc
    },
    {},
  )

  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">Interactive Portfolio Blueprint</p>
        <h1>Leonaderi Pixel Town</h1>
        <p>
          Setup ist fertig. Naechster Schritt ist die Phaser-Integration und die erste spielbare Map.
          Alle Orte und Links sind bereits als Glossar vorbereitet.
        </p>
      </header>

      <section className="meta-grid">
        <article className="panel">
          <h2>Stack</h2>
          <p>React + TypeScript + Vite, geplant mit Phaser 3 und Tiled Maps.</p>
        </article>
        <article className="panel">
          <h2>Status</h2>
          <p>Plan, Architektur, Assets, Deploy und Content-Modell sind dokumentiert.</p>
        </article>
        <article className="panel">
          <h2>Docs</h2>
          <p>Siehe `docs/` fuer Pitch, Roadmap, Assets, Easter Eggs und GitHub Pages Setup.</p>
        </article>
      </section>

      <section className="districts">
        <h2>Glossary Preview</h2>
        <div className="district-grid">
          {Object.entries(grouped).map(([district, entries]) => (
            <article className="district-card" key={district}>
              <h3>{district}</h3>
              <ul>
                {entries.map((entry) => (
                  <li key={entry.id}>
                    <span className={`status status-${entry.status}`}>{entry.status}</span>
                    <strong>{entry.name}</strong>
                    <small>{entry.kind}</small>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
      <div className="footer-note">
        Pokemon-inspirierte Optik: ja. Direkte Pokemon-IP-Assets: nein.
      </div>
    </main>
  )
}

export default App
