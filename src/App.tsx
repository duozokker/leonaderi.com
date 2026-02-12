import { useEffect, useMemo, useState } from 'react'
import type { PoiAction, PoiEntry } from './content/types'
import { gameEventBus } from './game/core/eventBus'
import { PhaserGame } from './game/PhaserGame'
import { ConfirmModal } from './ui/components/ConfirmModal'
import { EntryModal } from './ui/components/EntryModal'
import { IntroModal } from './ui/components/IntroModal'
import { MobileControls } from './ui/components/MobileControls'
import { TopHud } from './ui/components/TopHud'
import { useTouchDevice } from './ui/hooks/useTouchDevice'
import './App.css'

interface ConfirmState {
  open: boolean
  title: string
  message: string
  href: string
}

const defaultConfirmState: ConfirmState = {
  open: false,
  title: '',
  message: '',
  href: '',
}

function getActionModalMessage(entry: PoiEntry, action: PoiAction): string {
  if (action.id === 'company-services') {
    return 'Service-Ideen: Fullstack Apps, Produkt-Design, technische Umsetzung und iterative Optimierung.'
  }

  if (action.id === 'projects-list') {
    return 'Projektformate: Fun prototypes, AI tools, automation builds und schnelle MVP-Experimente.'
  }

  if (action.id === 'guide-controls') {
    return 'Tipp: Laufe erst zur Career Street (LinkedIn + GitHub), danach zum Company HQ und in das Project Lab.'
  }

  if (action.id === 'quest-modal') {
    return 'Quest gestartet: Besuche Company HQ, GitHub Werkstatt und Fun Projects Lab.'
  }

  if (action.type === 'coming_soon') {
    return `${entry.name} ist aktuell noch nicht veroeffentlicht.`
  }

  return `${action.label} ausgewaehlt.`
}

function App() {
  const isTouchDevice = useTouchDevice()
  const [introOpen, setIntroOpen] = useState(true)
  const [hoverLabel, setHoverLabel] = useState<string | null>(null)
  const [activeEntry, setActiveEntry] = useState<PoiEntry | null>(null)
  const [entryNote, setEntryNote] = useState<string | null>(null)
  const [confirmState, setConfirmState] = useState<ConfirmState>(defaultConfirmState)

  useEffect(() => {
    const offEntryOpen = gameEventBus.on('entry:open', ({ entry }) => {
      setActiveEntry(entry)
      setEntryNote(null)
    })

    const offEntryHover = gameEventBus.on('entry:hover', ({ label }) => {
      setHoverLabel(label)
    })

    return () => {
      offEntryOpen()
      offEntryHover()
    }
  }, [])

  const uiBlocked = useMemo(() => {
    return introOpen || !!activeEntry || confirmState.open
  }, [introOpen, activeEntry, confirmState.open])

  useEffect(() => {
    gameEventBus.emit('ui:block', { blocked: uiBlocked })
  }, [uiBlocked])

  const closeEntryModal = (): void => {
    setActiveEntry(null)
    setEntryNote(null)
  }

  const handleEntryAction = (entry: PoiEntry, action: PoiAction): void => {
    if (action.type === 'open_link' && action.href) {
      setConfirmState({
        open: true,
        title: `Externer Link: ${entry.name}`,
        message: action.confirmMessage ?? `Moechtest du ${entry.name} oeffnen?`,
        href: action.href,
      })
      return
    }

    setEntryNote(getActionModalMessage(entry, action))
  }

  const closeConfirm = (): void => {
    setConfirmState(defaultConfirmState)
  }

  const proceedConfirm = (): void => {
    const href = confirmState.href
    if (href) {
      window.open(href, '_blank', 'noopener,noreferrer')
    }

    setConfirmState(defaultConfirmState)
    setActiveEntry(null)
    setEntryNote(null)
  }

  return (
    <main className="app-root">
      <section className="game-shell">
        <PhaserGame />
        <TopHud hoverLabel={hoverLabel} onOpenIntro={() => setIntroOpen(true)} />
        <MobileControls visible={isTouchDevice} />
      </section>

      <EntryModal entry={activeEntry} note={entryNote} onClose={closeEntryModal} onAction={handleEntryAction} />

      <ConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        onCancel={closeConfirm}
        onConfirm={proceedConfirm}
      />

      {introOpen ? <IntroModal onClose={() => setIntroOpen(false)} /> : null}
    </main>
  )
}

export default App
