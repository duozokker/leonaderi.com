import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PoiAction, PoiEntry } from './content/types'
import { getUIText } from './content/uiTextRegistry'
import { gameEventBus } from './game/core/eventBus'
import { PhaserGame } from './game/PhaserGame'
import { ConfirmModal } from './ui/components/ConfirmModal'
import { EntryModal } from './ui/components/EntryModal'
import { IntroModal } from './ui/components/IntroModal'
import { MobileControls } from './ui/components/MobileControls'
import { TopHud } from './ui/components/TopHud'
import { useTouchDevice } from './ui/hooks/useTouchDevice'
import { useAdminStore } from './ui/admin/state/adminStore'
import { AdminShell } from './ui/admin/components/AdminShell'
import { isAdminFeatureEnabled, verifyAdminPassword } from './ui/admin/services/authGuard'
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
  const admin = useAdminStore()
  const {
    patch,
    runtime,
    dirty,
    merged,
    setOpen,
    setMode,
    setSelection,
    setPoiPatch,
    setMapObjectPatch,
    setNpcPatch,
    setGlobalOffset,
    setUiTextOverrides,
    replacePatch,
    resetPatch,
  } = admin
  const [introOpen, setIntroOpen] = useState(true)
  const [hoverLabel, setHoverLabel] = useState<string | null>(null)
  const [activeEntry, setActiveEntry] = useState<PoiEntry | null>(null)
  const [entryNote, setEntryNote] = useState<string | null>(null)
  const [confirmState, setConfirmState] = useState<ConfirmState>(defaultConfirmState)

  const requestAdminOpen = useCallback(async (): Promise<void> => {
    if (!isAdminFeatureEnabled()) {
      window.alert('Admin ist deaktiviert. Setze VITE_ADMIN_ENABLED=true')
      return
    }

    const typed = window.prompt('Admin Passwort:')
    if (!typed) return
    const ok = await verifyAdminPassword(typed)
    if (!ok) {
      window.alert('Falsches Passwort.')
      return
    }
    setOpen(true)
  }, [setOpen])

  useEffect(() => {
    const offEntryOpen = gameEventBus.on('entry:open', ({ entry }) => {
      setActiveEntry(entry)
      setEntryNote(null)
    })

    const offEntryHover = gameEventBus.on('entry:hover', ({ label }) => {
      setHoverLabel(label)
    })

    const offAdminToggle = gameEventBus.on('admin:toggle', ({ open }) => {
      if (!open) {
        setOpen(false)
        return
      }
      void requestAdminOpen()
    })

    const offAdminSelection = gameEventBus.on('admin:selection:set', ({ selection }) => {
      setSelection(selection)
    })

    const offAdminPoiWorldUpdate = gameEventBus.on('admin:poi-world:update', ({ id, world }) => {
      setPoiPatch(id, { world })
    })

    return () => {
      offEntryOpen()
      offEntryHover()
      offAdminToggle()
      offAdminSelection()
      offAdminPoiWorldUpdate()
    }
  }, [setOpen, setSelection, setPoiPatch, requestAdminOpen])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'F8') return
      event.preventDefault()
      if (runtime.open) {
        setOpen(false)
        return
      }
      void requestAdminOpen()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [runtime.open, setOpen, requestAdminOpen])

  const uiBlocked = useMemo(() => {
    return introOpen || !!activeEntry || confirmState.open || runtime.open
  }, [introOpen, activeEntry, confirmState.open, runtime.open])

  useEffect(() => {
    gameEventBus.emit('ui:block', { blocked: uiBlocked })
  }, [uiBlocked])

  useEffect(() => {
    gameEventBus.emit('admin:state-changed', {
      open: runtime.open,
      mode: runtime.mode,
    })
  }, [runtime.open, runtime.mode])

  useEffect(() => {
    gameEventBus.emit('admin:selection:changed', {
      selection: runtime.selection,
    })
  }, [runtime.selection])

  useEffect(() => {
    gameEventBus.emit('admin:patch-updated', { patch })
  }, [patch])

  const closeEntryModal = useCallback((): void => {
    setActiveEntry(null)
    setEntryNote(null)
  }, [])

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

  const closeConfirm = useCallback((): void => {
    setConfirmState(defaultConfirmState)
  }, [])

  const proceedConfirm = useCallback((): void => {
    const href = confirmState.href
    if (href) {
      window.open(href, '_blank', 'noopener,noreferrer')
    }

    setConfirmState(defaultConfirmState)
    setActiveEntry(null)
    setEntryNote(null)
  }, [confirmState.href])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return

      if (confirmState.open) {
        event.preventDefault()
        closeConfirm()
        return
      }

      if (activeEntry) {
        event.preventDefault()
        closeEntryModal()
        return
      }

      if (introOpen) {
        event.preventDefault()
        setIntroOpen(false)
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeEntry, closeConfirm, closeEntryModal, confirmState.open, introOpen])

  const uiText = patch.global.uiTextOverrides ?? {}
  const statusLabels = {
    live: getUIText('entry.status.live', uiText),
    wip: getUIText('entry.status.wip', uiText),
    coming_soon: getUIText('entry.status.coming_soon', uiText),
    ruins: getUIText('entry.status.ruins', uiText),
  } satisfies Record<PoiEntry['status'], string>

  return (
    <main className="app-root">
      <section className="game-shell">
        <PhaserGame />
        <TopHud
          hoverLabel={hoverLabel}
          onOpenIntro={() => setIntroOpen(true)}
          title={getUIText('hud.title', uiText)}
          defaultSubtitle={getUIText('hud.subtitle', uiText)}
          helpLabel={getUIText('hud.helpButton', uiText)}
        />
        <AdminShell
          state={{ patch, runtime, merged, dirty }}
          actions={{
            setOpen,
            setMode,
            setSelection,
            setPoiPatch,
            setMapObjectPatch,
            setNpcPatch,
            setGlobalOffset,
            setUiTextOverrides,
            replacePatch,
            resetPatch,
          }}
          onFitMap={() => gameEventBus.emit('admin:camera:fit-map', { fit: true })}
        />
        <MobileControls visible={isTouchDevice} />
      </section>

      <EntryModal
        entry={activeEntry}
        note={entryNote}
        onClose={closeEntryModal}
        onAction={handleEntryAction}
        statusLabels={statusLabels}
        closeLabel={getUIText('entry.close', uiText)}
      />

      <ConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        onCancel={closeConfirm}
        onConfirm={proceedConfirm}
        cancelLabel={getUIText('confirm.cancel', uiText)}
        confirmLabel={getUIText('confirm.proceed', uiText)}
      />

      {introOpen ? (
        <IntroModal
          onClose={() => setIntroOpen(false)}
          texts={{
            title: getUIText('intro.title', uiText),
            body: getUIText('intro.body', uiText),
            desktopTitle: getUIText('intro.desktopTitle', uiText),
            desktopMove: getUIText('intro.desktopMove', uiText),
            desktopInteract: getUIText('intro.desktopInteract', uiText),
            mobileTitle: getUIText('intro.mobileTitle', uiText),
            mobileMove: getUIText('intro.mobileMove', uiText),
            mobileInteract: getUIText('intro.mobileInteract', uiText),
            startButton: getUIText('intro.startButton', uiText),
          }}
        />
      ) : null}
    </main>
  )
}

export default App
