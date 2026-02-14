import { useMemo, useRef, useState } from 'react'
import { AdminAuthModal } from './AdminAuthModal'
import { AdminLegend } from './AdminLegend'
import { AdminToolbar } from './AdminToolbar'
import { AdminMapViewport } from './AdminMapViewport'
import { AdminInspector } from './AdminInspector'
import { AdminPatchStatus } from './AdminPatchStatus'
import type { AdminStoreActions, AdminStoreState } from '../state/adminStore'
import { exportPatchAsJson, importPatchFromFile } from '../services/patchExport'
import { isAdminFeatureEnabled, verifyAdminPassword } from '../services/authGuard'

interface AdminShellProps {
  state: AdminStoreState
  actions: AdminStoreActions
  onFitMap: () => void
}

export function AdminShell({ state, actions, onFitMap }: AdminShellProps) {
  const [authOpen, setAuthOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const featureEnabled = isAdminFeatureEnabled()
  const containerClass = useMemo(
    () => `admin-shell ${state.runtime.open ? 'open' : ''}`,
    [state.runtime.open],
  )

  const openAdmin = () => {
    if (!featureEnabled) {
      window.alert('Admin ist deaktiviert. Setze VITE_ADMIN_ENABLED=true')
      return
    }
    setAuthOpen(true)
  }

  if (!state.runtime.open) {
    return (
      <>
        <button className="admin-fab pixel-btn" type="button" onClick={openAdmin}>
          Admin
        </button>
        <AdminAuthModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          onSubmit={async (password) => {
            const ok = await verifyAdminPassword(password)
            if (ok) {
              actions.setOpen(true)
            }
            return ok
          }}
        />
      </>
    )
  }

  return (
    <>
      <aside className={containerClass}>
        <AdminToolbar
          mode={state.runtime.mode}
          onModeChange={actions.setMode}
          onExport={() => exportPatchAsJson(state.patch)}
          onImport={() => fileInputRef.current?.click()}
          onReset={actions.resetPatch}
        />
        <AdminPatchStatus dirty={state.dirty} updatedAt={state.patch.meta.updatedAt} />
        <AdminLegend />
        <AdminMapViewport mode={state.runtime.mode} onFitMap={onFitMap} />
        <AdminInspector state={state} actions={actions} />
        <div className="admin-footer">
          <button className="pixel-btn" type="button" onClick={() => actions.setOpen(false)}>
            Schliessen
          </button>
        </div>
      </aside>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        hidden
        onChange={async (event) => {
          const file = event.target.files?.[0]
          if (!file) return
          try {
            const patch = await importPatchFromFile(file)
            actions.replacePatch(patch)
          } catch (error) {
            window.alert(`Import fehlgeschlagen: ${(error as Error).message}`)
          } finally {
            event.target.value = ''
          }
        }}
      />
    </>
  )
}
