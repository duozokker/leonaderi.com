import { UI_TEXT_DEFAULTS, type UITextKey } from '../../../content/uiTextRegistry'
import type { PoiEntry } from '../../../content/types'
import type { AdminSelection, NpcKey } from '../types'
import type { AdminStoreActions, AdminStoreState } from '../state/adminStore'

interface AdminInspectorProps {
  state: AdminStoreState
  actions: AdminStoreActions
}

function toNum(value: string, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function AdminInspector({ state, actions }: AdminInspectorProps) {
  const { runtime, merged, patch } = state
  const selection = runtime.selection

  const selectedPoi = selection.kind === 'poi' ? merged.pois.find((poi) => poi.id === selection.id) ?? null : null
  const selectedObject = selection.kind === 'mapObject' ? merged.mapObjects.find((obj) => obj.key === selection.id) ?? null : null
  const selectedNpc = selection.kind === 'npc' ? (selection.id as NpcKey) : null

  const setSelection = (next: AdminSelection) => {
    actions.setSelection(next)
  }

  return (
    <div className="admin-inspector">
      <h3>Inspector</h3>
      <div className="admin-section">
        <strong>Global</strong>
        <div className="admin-grid-two">
          <div>
            <label>Map Offset X</label>
            <input
              className="admin-input"
              value={merged.globalOffset.x}
              onChange={(event) => actions.setGlobalOffset({ x: toNum(event.target.value, merged.globalOffset.x), y: merged.globalOffset.y })}
            />
          </div>
          <div>
            <label>Map Offset Y</label>
            <input
              className="admin-input"
              value={merged.globalOffset.y}
              onChange={(event) => actions.setGlobalOffset({ x: merged.globalOffset.x, y: toNum(event.target.value, merged.globalOffset.y) })}
            />
          </div>
        </div>
      </div>
      <div className="admin-field-row">
        <label>Zieltyp</label>
        <select
          className="admin-input"
          value={selection.kind}
          onChange={(event) => {
            const kind = event.target.value as AdminSelection['kind']
            if (kind === 'none') {
              setSelection({ kind: 'none', id: '' })
              return
            }
            if (kind === 'poi') {
              const first = merged.pois[0]
              setSelection({ kind: 'poi', id: first?.id ?? '' })
              return
            }
            if (kind === 'mapObject') {
              const first = merged.mapObjects[0]
              setSelection({ kind: 'mapObject', id: first?.key ?? '' })
              return
            }
            setSelection({ kind: 'npc', id: 'guide' })
          }}
        >
          <option value="none">Keins</option>
          <option value="poi">POI</option>
          <option value="mapObject">Map Object</option>
          <option value="npc">NPC</option>
        </select>
      </div>

      {selection.kind === 'poi' ? (
        <PoiEditor
          mergedPois={merged.pois}
          selected={selectedPoi}
          onSelect={(id) => setSelection({ kind: 'poi', id })}
          onPatch={actions.setPoiPatch}
        />
      ) : null}

      {selection.kind === 'mapObject' ? (
        <ObjectEditor
          objects={merged.mapObjects}
          selected={selectedObject}
          onSelect={(key) => setSelection({ kind: 'mapObject', id: key })}
          onPatch={actions.setMapObjectPatch}
        />
      ) : null}

      {selection.kind === 'npc' ? (
        <NpcEditor
          selected={selectedNpc}
          positions={merged.npcPositions}
          onSelect={(id) => setSelection({ kind: 'npc', id })}
          onPatch={actions.setNpcPatch}
        />
      ) : null}

      {runtime.mode === 'text' ? (
        <TextEditor
          overrides={patch.global.uiTextOverrides ?? {}}
          onChange={actions.setUiTextOverrides}
        />
      ) : null}
    </div>
  )
}

function PoiEditor({
  mergedPois,
  selected,
  onSelect,
  onPatch,
}: {
  mergedPois: PoiEntry[]
  selected: PoiEntry | null
  onSelect: (id: PoiEntry['id']) => void
  onPatch: AdminStoreActions['setPoiPatch']
}) {
  if (!selected) return null

  return (
    <div className="admin-section">
      <strong>POI</strong>
      <select className="admin-input" value={selected.id} onChange={(event) => onSelect(event.target.value)}>
        {mergedPois.map((poi) => (
          <option key={poi.id} value={poi.id}>{poi.name}</option>
        ))}
      </select>

      <label>Name</label>
      <input className="admin-input" value={selected.name} onChange={(event) => onPatch(selected.id, { content: { name: event.target.value } })} />

      <div className="admin-grid-two">
        <div>
          <label>Status</label>
          <select className="admin-input" value={selected.status} onChange={(event) => onPatch(selected.id, { content: { status: event.target.value as PoiEntry['status'] } })}>
            <option value="live">live</option>
            <option value="wip">wip</option>
            <option value="coming_soon">coming_soon</option>
            <option value="ruins">ruins</option>
          </select>
        </div>
        <div>
          <label>Kind</label>
          <select className="admin-input" value={selected.kind} onChange={(event) => onPatch(selected.id, { content: { kind: event.target.value as PoiEntry['kind'] } })}>
            <option value="company">company</option>
            <option value="external_link">external_link</option>
            <option value="project_showcase">project_showcase</option>
            <option value="social">social</option>
            <option value="npc">npc</option>
            <option value="sign">sign</option>
            <option value="coming_soon">coming_soon</option>
          </select>
        </div>
      </div>

      <label>Beschreibung</label>
      <textarea className="admin-input" value={selected.description} onChange={(event) => onPatch(selected.id, { content: { description: event.target.value } })} />

      <div className="admin-grid-two">
        <div>
          <label>Accent</label>
          <input className="admin-input" value={selected.accentColor} onChange={(event) => onPatch(selected.id, { content: { accentColor: event.target.value } })} />
        </div>
        <div>
          <label>Sprite Hint</label>
          <input className="admin-input" value={selected.spriteHint} onChange={(event) => onPatch(selected.id, { content: { spriteHint: event.target.value } })} />
        </div>
      </div>

      <label>District</label>
      <input className="admin-input" value={selected.district} onChange={(event) => onPatch(selected.id, { content: { district: event.target.value } })} />

      <label>Tags (comma separated)</label>
      <input
        className="admin-input"
        value={selected.tags.join(', ')}
        onChange={(event) => onPatch(selected.id, { content: { tags: event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean) } })}
      />

      <label>Dialog Titel</label>
      <input className="admin-input" value={selected.dialog.title} onChange={(event) => onPatch(selected.id, { content: { dialogTitle: event.target.value } })} />

      <label>Dialog Body</label>
      <textarea className="admin-input" value={selected.dialog.body} onChange={(event) => onPatch(selected.id, { content: { dialogBody: event.target.value } })} />

      <div className="admin-grid-two">
        <div>
          <label>X</label>
          <input className="admin-input" value={selected.world.x} onChange={(event) => onPatch(selected.id, { world: { x: toNum(event.target.value, selected.world.x) } })} />
        </div>
        <div>
          <label>Y</label>
          <input className="admin-input" value={selected.world.y} onChange={(event) => onPatch(selected.id, { world: { y: toNum(event.target.value, selected.world.y) } })} />
        </div>
        <div>
          <label>Width</label>
          <input className="admin-input" value={selected.world.width} onChange={(event) => onPatch(selected.id, { world: { width: toNum(event.target.value, selected.world.width) } })} />
        </div>
        <div>
          <label>Height</label>
          <input className="admin-input" value={selected.world.height} onChange={(event) => onPatch(selected.id, { world: { height: toNum(event.target.value, selected.world.height) } })} />
        </div>
      </div>

      {selected.world.solid ? (
        <div className="admin-grid-two">
          <div>
            <label>Hitbox X</label>
            <input
              className="admin-input"
              value={selected.world.hitbox?.x ?? 0}
              onChange={(event) =>
                onPatch(selected.id, {
                  world: {
                    hitbox: {
                      x: toNum(event.target.value, selected.world.hitbox?.x ?? 0),
                      y: selected.world.hitbox?.y ?? 0,
                      width: selected.world.hitbox?.width ?? selected.world.width,
                      height: selected.world.hitbox?.height ?? selected.world.height,
                    },
                  },
                })}
            />
          </div>
          <div>
            <label>Hitbox Y</label>
            <input
              className="admin-input"
              value={selected.world.hitbox?.y ?? 0}
              onChange={(event) =>
                onPatch(selected.id, {
                  world: {
                    hitbox: {
                      x: selected.world.hitbox?.x ?? 0,
                      y: toNum(event.target.value, selected.world.hitbox?.y ?? 0),
                      width: selected.world.hitbox?.width ?? selected.world.width,
                      height: selected.world.hitbox?.height ?? selected.world.height,
                    },
                  },
                })}
            />
          </div>
          <div>
            <label>Hitbox Width</label>
            <input
              className="admin-input"
              value={selected.world.hitbox?.width ?? selected.world.width}
              onChange={(event) =>
                onPatch(selected.id, {
                  world: {
                    hitbox: {
                      x: selected.world.hitbox?.x ?? 0,
                      y: selected.world.hitbox?.y ?? 0,
                      width: toNum(event.target.value, selected.world.hitbox?.width ?? selected.world.width),
                      height: selected.world.hitbox?.height ?? selected.world.height,
                    },
                  },
                })}
            />
          </div>
          <div>
            <label>Hitbox Height</label>
            <input
              className="admin-input"
              value={selected.world.hitbox?.height ?? selected.world.height}
              onChange={(event) =>
                onPatch(selected.id, {
                  world: {
                    hitbox: {
                      x: selected.world.hitbox?.x ?? 0,
                      y: selected.world.hitbox?.y ?? 0,
                      width: selected.world.hitbox?.width ?? selected.world.width,
                      height: toNum(event.target.value, selected.world.hitbox?.height ?? selected.world.height),
                    },
                  },
                })}
            />
          </div>
        </div>
      ) : null}

      {selected.actions.length > 0 ? (
        <div className="admin-section">
          <strong>Actions</strong>
          {selected.actions.map((action) => (
            <div key={action.id}>
              <label>{action.id} Label</label>
              <input
                className="admin-input"
                value={action.label}
                onChange={(event) =>
                  onPatch(selected.id, {
                    content: {
                      actions: [{ id: action.id, label: event.target.value }],
                    },
                  })}
              />
              <label>{action.id} href</label>
              <input
                className="admin-input"
                value={action.href ?? ''}
                onChange={(event) =>
                  onPatch(selected.id, {
                    content: {
                      actions: [{ id: action.id, href: event.target.value }],
                    },
                  })}
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function ObjectEditor({
  objects,
  selected,
  onSelect,
  onPatch,
}: {
  objects: AdminStoreState['merged']['mapObjects']
  selected: AdminStoreState['merged']['mapObjects'][number] | null
  onSelect: (key: string) => void
  onPatch: AdminStoreActions['setMapObjectPatch']
}) {
  if (!selected) return null

  return (
    <div className="admin-section">
      <strong>Map Object</strong>
      <select className="admin-input" value={selected.key} onChange={(event) => onSelect(event.target.value)}>
        {objects.map((obj) => (
          <option key={obj.key} value={obj.key}>{obj.key}</option>
        ))}
      </select>
      <div className="admin-grid-two">
        <div>
          <label>X</label>
          <input className="admin-input" value={selected.x} onChange={(event) => onPatch(selected.key, { x: toNum(event.target.value, selected.x) })} />
        </div>
        <div>
          <label>Y</label>
          <input className="admin-input" value={selected.y} onChange={(event) => onPatch(selected.key, { y: toNum(event.target.value, selected.y) })} />
        </div>
        <div>
          <label>Width</label>
          <input className="admin-input" value={selected.width} onChange={(event) => onPatch(selected.key, { width: toNum(event.target.value, selected.width) })} />
        </div>
        <div>
          <label>Height</label>
          <input className="admin-input" value={selected.height} onChange={(event) => onPatch(selected.key, { height: toNum(event.target.value, selected.height) })} />
        </div>
      </div>
    </div>
  )
}

function NpcEditor({
  selected,
  positions,
  onSelect,
  onPatch,
}: {
  selected: NpcKey | null
  positions: AdminStoreState['merged']['npcPositions']
  onSelect: (id: NpcKey) => void
  onPatch: AdminStoreActions['setNpcPatch']
}) {
  if (!selected) return null
  const current = positions[selected]
  return (
    <div className="admin-section">
      <strong>NPC</strong>
      <select className="admin-input" value={selected} onChange={(event) => onSelect(event.target.value as NpcKey)}>
        {Object.keys(positions).map((key) => (
          <option key={key} value={key}>{key}</option>
        ))}
      </select>
      <div className="admin-grid-two">
        <div>
          <label>X</label>
          <input className="admin-input" value={current.x} onChange={(event) => onPatch(selected, { x: toNum(event.target.value, current.x) })} />
        </div>
        <div>
          <label>Y</label>
          <input className="admin-input" value={current.y} onChange={(event) => onPatch(selected, { y: toNum(event.target.value, current.y) })} />
        </div>
      </div>
    </div>
  )
}

function TextEditor({
  overrides,
  onChange,
}: {
  overrides: Record<string, string>
  onChange: (overrides: Record<string, string>) => void
}) {
  const keys = Object.keys(UI_TEXT_DEFAULTS) as UITextKey[]
  return (
    <div className="admin-section">
      <strong>UI Texte</strong>
      {keys.map((key) => (
        <div key={key}>
          <label>{key}</label>
          <input
            className="admin-input"
            value={overrides[key] ?? UI_TEXT_DEFAULTS[key]}
            onChange={(event) => {
              const next = { ...overrides, [key]: event.target.value }
              onChange(next)
            }}
          />
        </div>
      ))}
    </div>
  )
}
