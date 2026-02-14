import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type Konva from 'konva'
import { Layer, Rect, Stage, Text, Transformer, Group, Circle, Image as KonvaImage } from 'react-konva'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Edge,
  type Node,
  type OnEdgesChange,
  type OnNodesChange,
  applyEdgeChanges,
  applyNodeChanges,
} from 'reactflow'
import 'reactflow/dist/style.css'
import {
  AuthoringWorldSchema,
  type AuthoringWorldV1,
} from '@leonaderi/world-schema'
import seedWorldJson from '../../../world-data/project.world.v1.json'
import './styles.css'

type Selection =
  | { kind: 'none'; id: '' }
  | { kind: 'object'; id: string }
  | { kind: 'collider'; id: string }
  | { kind: 'trigger'; id: string }
  | { kind: 'npc'; id: string }
  | { kind: 'poi'; id: string }

type Tabs = 'canvas' | 'dialogue' | 'validation' | 'json'
type StatusTone = 'ok' | 'warn' | 'error'
type BackgroundMode = 'abstract' | 'rendered' | 'blend'

type FileHandleLike = {
  createWritable?: () => Promise<{
    write: (content: string) => Promise<void>
    close: () => Promise<void>
  }>
}

declare global {
  interface Window {
    showOpenFilePicker?: (options?: unknown) => Promise<Array<{ getFile: () => Promise<File> }>>
    showSaveFilePicker?: (options?: unknown) => Promise<FileHandleLike>
    render_game_to_text?: () => string
    advanceTime?: (ms: number) => Promise<void>
  }
}

const seedWorld = AuthoringWorldSchema.parse(seedWorldJson)
const WORLD_LOCAL_STORAGE_KEY = 'worldbuilder:v2:draft'
const SESSION_LOCAL_STORAGE_KEY = 'worldbuilder:v2:session'
const CAMERA_MIN_PADDING = 24

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function clampRectToMap(
  rect: { x: number; y: number; width: number; height: number },
  mapWidth: number,
  mapHeight: number,
): { x: number; y: number; width: number; height: number } {
  const width = Math.max(1, Math.min(rect.width, mapWidth))
  const height = Math.max(1, Math.min(rect.height, mapHeight))
  const x = clamp(rect.x, 0, Math.max(0, mapWidth - width))
  const y = clamp(rect.y, 0, Math.max(0, mapHeight - height))
  return { x, y, width, height }
}

function toNodeLabel(node: AuthoringWorldV1['dialogues'][number]['nodes'][number]): string {
  switch (node.type) {
    case 'line':
      return `${node.speaker}: ${node.text}`
    case 'choice':
      return `Choice: ${node.text}`
    case 'condition':
      return `If ${node.flag}`
    case 'jump':
      return `Jump -> ${node.targetNodeId}`
    case 'action':
      return `Action: ${node.actionId}`
    case 'end':
      return `End ${node.text ?? ''}`
    default:
      return node.type
  }
}

function buildDialogueFlow(dialogue: AuthoringWorldV1['dialogues'][number]): {
  nodes: Node[]
  edges: Edge[]
} {
  const nodes: Node[] = dialogue.nodes.map((node, index) => ({
    id: node.id,
    type: 'default',
    position: { x: (index % 4) * 250, y: Math.floor(index / 4) * 120 },
    data: { label: toNodeLabel(node) },
  }))

  const edges: Edge[] = []
  for (const node of dialogue.nodes) {
    if (node.type === 'choice') {
      for (const choice of node.choices) {
        edges.push({ id: `${node.id}-${choice.id}`, source: node.id, target: choice.targetNodeId, label: choice.label })
      }
    }
    if (node.type === 'condition') {
      edges.push({ id: `${node.id}-true`, source: node.id, target: node.onTrueNodeId, label: 'true' })
      edges.push({ id: `${node.id}-false`, source: node.id, target: node.onFalseNodeId, label: 'false' })
    }
    if (node.type === 'jump') {
      edges.push({ id: `${node.id}-jump`, source: node.id, target: node.targetNodeId })
    }
  }

  return { nodes, edges }
}

function terrainColor(id: number): string {
  switch (id) {
    case 1:
      return '#2f6ee5'
    case 2:
      return '#52c85a'
    case 3:
      return '#8f5f46'
    case 4:
      return '#7a7a7a'
    case 5:
      return '#9d6d47'
    case 7:
      return '#d9558a'
    default:
      return '#444'
  }
}

function numberInput(
  id: string,
  value: number,
  onChange: (next: number) => void,
  options?: { min?: number; max?: number; step?: number },
) {
  return (
    <input
      id={id}
      name={id}
      type="number"
      className="wb-input"
      value={Number.isFinite(value) ? value : 0}
      step={options?.step ?? 1}
      min={options?.min}
      max={options?.max}
      aria-label={id}
      onChange={(event) => {
        const next = Number(event.target.value)
        if (!Number.isFinite(next)) return
        let clamped = next
        if (typeof options?.min === 'number') clamped = Math.max(options.min, clamped)
        if (typeof options?.max === 'number') clamped = Math.min(options.max, clamped)
        onChange(clamped)
      }}
    />
  )
}

function validateWorld(world: AuthoringWorldV1): string[] {
  const issues: string[] = []

  const triggerIds = new Set(world.triggers.map((item) => item.id))
  const interactionIds = new Set(world.interactions.map((item) => item.id))
  const dialogueIds = new Set(world.dialogues.map((item) => item.id))
  const objectIds = new Set(world.objects.map((item) => item.id))

  for (const trigger of world.triggers) {
    if (trigger.interactionId && !interactionIds.has(trigger.interactionId)) {
      issues.push(`Trigger ${trigger.id} hat unbekannte interactionId ${trigger.interactionId}`)
    }
  }

  for (const interaction of world.interactions) {
    if (!triggerIds.has(interaction.triggerId)) {
      issues.push(`Interaction ${interaction.id} referenziert unbekannten Trigger ${interaction.triggerId}`)
    }
    for (const action of interaction.actions) {
      if (action.type === 'open_dialogue' && !dialogueIds.has(action.dialogueId)) {
        issues.push(`Interaction ${interaction.id} referenziert unbekannten Dialog ${action.dialogueId}`)
      }
    }
  }

  for (const poi of world.poiIndex) {
    if (poi.linkedObjectId && !objectIds.has(poi.linkedObjectId)) {
      issues.push(`POI ${poi.id} hat unbekanntes linkedObjectId ${poi.linkedObjectId}`)
    }
    if (poi.linkedInteractionId && !interactionIds.has(poi.linkedInteractionId)) {
      issues.push(`POI ${poi.id} hat unbekanntes linkedInteractionId ${poi.linkedInteractionId}`)
    }
  }

  return issues
}

type SavedSessionV1 = {
  tab: Tabs
  zoom: number
  camera: { x: number; y: number }
  panMode: boolean
}

function loadDraftWorld(): AuthoringWorldV1 {
  if (typeof window === 'undefined') return seedWorld
  try {
    const raw = window.localStorage.getItem(WORLD_LOCAL_STORAGE_KEY)
    if (!raw) return seedWorld
    const parsed = AuthoringWorldSchema.parse(JSON.parse(raw))
    return parsed
  } catch {
    return seedWorld
  }
}

function loadSessionDefaults(): SavedSessionV1 {
  const fallback: SavedSessionV1 = {
    tab: 'canvas',
    zoom: 1,
    camera: { x: 20, y: 20 },
    panMode: false,
  }
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(SESSION_LOCAL_STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<SavedSessionV1>
    return {
      tab: parsed.tab === 'canvas' || parsed.tab === 'dialogue' || parsed.tab === 'validation' || parsed.tab === 'json' ? parsed.tab : fallback.tab,
      zoom: clamp(typeof parsed.zoom === 'number' ? parsed.zoom : fallback.zoom, 0.35, 2.5),
      camera: {
        x: typeof parsed.camera?.x === 'number' ? parsed.camera.x : fallback.camera.x,
        y: typeof parsed.camera?.y === 'number' ? parsed.camera.y : fallback.camera.y,
      },
      panMode: Boolean(parsed.panMode),
    }
  } catch {
    return fallback
  }
}

function App() {
  const [world, setWorld] = useState<AuthoringWorldV1>(() => loadDraftWorld())
  const [selection, setSelection] = useState<Selection>({ kind: 'none', id: '' })
  const sessionDefaults = useMemo(() => loadSessionDefaults(), [])
  const [tab, setTab] = useState<Tabs>(sessionDefaults.tab)
  const [dialogueId, setDialogueId] = useState<string>(world.dialogues[0]?.id ?? '')
  const [fileHandle, setFileHandle] = useState<FileHandleLike | null>(null)
  const [jsonBuffer, setJsonBuffer] = useState(() => JSON.stringify(world, null, 2))
  const [zoom, setZoom] = useState(sessionDefaults.zoom)
  const [camera, setCamera] = useState(sessionDefaults.camera)
  const [panMode, setPanMode] = useState(sessionDefaults.panMode)
  const [spaceHeld, setSpaceHeld] = useState(false)
  const [middlePanActive, setMiddlePanActive] = useState(false)
  const [snapToGrid, setSnapToGrid] = useState(false)
  const [showLabels, setShowLabels] = useState(true)
  const [status, setStatus] = useState<{ tone: StatusTone; text: string } | null>(null)
  const [frameCounter, setFrameCounter] = useState(0)
  const [history, setHistory] = useState<AuthoringWorldV1[]>([])
  const [future, setFuture] = useState<AuthoringWorldV1[]>([])
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>('abstract')
  const [backgroundBlendOpacity, setBackgroundBlendOpacity] = useState(0.4)
  const [renderedMapImage, setRenderedMapImage] = useState<HTMLImageElement | null>(null)
  const [hoverWorld, setHoverWorld] = useState<{ x: number; y: number } | null>(null)
  const [showCrosshair, setShowCrosshair] = useState(true)
  const [layerVisibility, setLayerVisibility] = useState({
    objects: true,
    colliders: true,
    triggers: true,
    npcs: true,
    minimap: true,
  })
  const [layerLock, setLayerLock] = useState({
    objects: false,
    colliders: false,
    triggers: false,
    npcs: false,
  })
  const [entityFilter, setEntityFilter] = useState('')

  useEffect(() => {
    const img = new window.Image()
    img.src = '/map-composite.png'
    img.onload = () => setRenderedMapImage(img)
  }, [])

  const selectedDialogue = useMemo(
    () => world.dialogues.find((item) => item.id === dialogueId) ?? world.dialogues[0] ?? null,
    [world.dialogues, dialogueId],
  )

  const [flowNodes, setFlowNodes] = useState<Node[]>(() => (selectedDialogue ? buildDialogueFlow(selectedDialogue).nodes : []))
  const [flowEdges, setFlowEdges] = useState<Edge[]>(() => (selectedDialogue ? buildDialogueFlow(selectedDialogue).edges : []))

  const selectedObject = selection.kind === 'object' ? world.objects.find((item) => item.id === selection.id) ?? null : null
  const selectedCollider = selection.kind === 'collider' ? world.colliders.find((item) => item.id === selection.id) ?? null : null
  const selectedTrigger = selection.kind === 'trigger' ? world.triggers.find((item) => item.id === selection.id) ?? null : null
  const selectedNpc = selection.kind === 'npc' ? world.npcs.find((item) => item.id === selection.id) ?? null : null
  const selectedPoi = selection.kind === 'poi' ? world.poiIndex.find((item) => item.id === selection.id) ?? null : null
  const selectedInteraction = selectedTrigger?.interactionId ? world.interactions.find((item) => item.id === selectedTrigger.interactionId) ?? null : null

  const selectedRef = useRef<Konva.Node | null>(null)
  const transformerRef = useRef<Konva.Transformer | null>(null)
  const stageRef = useRef<Konva.Stage | null>(null)
  const autosaveTimerRef = useRef<number | null>(null)
  const statusTimerRef = useRef<number | null>(null)
  const deleteSelectionRef = useRef<() => void>(() => undefined)
  const duplicateSelectionRef = useRef<() => void>(() => undefined)
  const middlePanStartRef = useRef<{ pointerX: number; pointerY: number; cameraX: number; cameraY: number } | null>(null)

  const mapWidth = world.map.columns * world.map.tileSize
  const mapHeight = world.map.rows * world.map.tileSize
  const stageWidth = 1000
  const stageHeight = 640
  const drawOrderedObjects = useMemo(
    () => [...world.objects].sort((a, b) => {
      const groupRank = (group: string) => {
        if (group === 'ground') return 0
        if (group === 'default') return 1
        if (group === 'foreground') return 2
        return 1
      }
      return groupRank(a.renderGroup) - groupRank(b.renderGroup) || a.depth - b.depth || a.y - b.y
    }),
    [world.objects],
  )
  const filterNeedle = entityFilter.trim().toLowerCase()
  const filteredObjects = useMemo(
    () => drawOrderedObjects.filter((item) => `${item.key} ${item.id}`.toLowerCase().includes(filterNeedle)),
    [drawOrderedObjects, filterNeedle],
  )
  const filteredColliders = useMemo(
    () => world.colliders.filter((item) => item.id.toLowerCase().includes(filterNeedle)),
    [world.colliders, filterNeedle],
  )
  const filteredTriggers = useMemo(
    () => world.triggers.filter((item) => `${item.id} ${item.label}`.toLowerCase().includes(filterNeedle)),
    [world.triggers, filterNeedle],
  )
  const filteredNpcs = useMemo(
    () => world.npcs.filter((item) => `${item.id} ${item.spriteKey}`.toLowerCase().includes(filterNeedle)),
    [world.npcs, filterNeedle],
  )
  const filteredPois = useMemo(
    () => world.poiIndex.filter((item) => `${item.id} ${item.name}`.toLowerCase().includes(filterNeedle)),
    [world.poiIndex, filterNeedle],
  )

  const validationIssues = useMemo(() => validateWorld(world), [world])

  const onNodesChange: OnNodesChange = (changes) => setFlowNodes((nds) => applyNodeChanges(changes, nds))
  const onEdgesChange: OnEdgesChange = (changes) => setFlowEdges((eds) => applyEdgeChanges(changes, eds))

  const snapValue = (value: number) => (snapToGrid ? Math.round(value / world.map.tileSize) * world.map.tileSize : value)

  const clampWorldPoint = (x: number, y: number) => ({
    x: clamp(x, 0, mapWidth),
    y: clamp(y, 0, mapHeight),
  })

  const showStatus = useCallback((tone: StatusTone, text: string) => {
    setStatus({ tone, text })
    if (statusTimerRef.current) window.clearTimeout(statusTimerRef.current)
    statusTimerRef.current = window.setTimeout(() => setStatus(null), 2800)
  }, [])

  const refreshJsonBuffer = useCallback((nextWorld: AuthoringWorldV1) => {
    setJsonBuffer(JSON.stringify(nextWorld, null, 2))
  }, [])

  const updateWorld = useCallback((nextWorld: AuthoringWorldV1, options?: { trackHistory?: boolean }) => {
    if (options?.trackHistory !== false) {
      setHistory((prev) => [...prev.slice(-79), world])
      setFuture([])
    }
    setWorld(nextWorld)
    refreshJsonBuffer(nextWorld)
  }, [refreshJsonBuffer, world])

  const updateObject = (id: string, patch: Partial<AuthoringWorldV1['objects'][number]>) => {
    updateWorld({
      ...world,
      objects: world.objects.map((item) => {
        if (item.id !== id) return item
        const width = Math.max(8, patch.width ?? item.width)
        const height = Math.max(8, patch.height ?? item.height)
        const requestedX = patch.x ?? item.x
        const requestedY = patch.y ?? item.y
        const center = clampWorldPoint(snapValue(requestedX), snapValue(requestedY))
        return {
          ...item,
          ...patch,
          width,
          height,
          x: center.x,
          y: center.y,
        }
      }),
      meta: { ...world.meta, updatedAt: new Date().toISOString() },
    })
  }

  const nudgeObjectDepth = (id: string, delta: number) => {
    const object = world.objects.find((item) => item.id === id)
    if (!object) return
    updateObject(id, { depth: object.depth + delta })
  }

  const updateColliderRect = (id: string, patch: Partial<{ x: number; y: number; width: number; height: number }>) => {
    updateWorld({
      ...world,
      colliders: world.colliders.map((item) => {
        if (item.id !== id || item.shape.type !== 'rect') return item
        const nextRect = clampRectToMap(
          {
            x: snapValue(patch.x ?? item.shape.rect.x),
            y: snapValue(patch.y ?? item.shape.rect.y),
            width: Math.max(4, patch.width ?? item.shape.rect.width),
            height: Math.max(4, patch.height ?? item.shape.rect.height),
          },
          mapWidth,
          mapHeight,
        )
        return {
          ...item,
          shape: {
            ...item.shape,
            rect: nextRect,
          },
        }
      }),
      meta: { ...world.meta, updatedAt: new Date().toISOString() },
    })
  }

  const updateTriggerRect = (id: string, patch: Partial<{ x: number; y: number; width: number; height: number }>) => {
    updateWorld({
      ...world,
      triggers: world.triggers.map((item) => {
        if (item.id !== id || item.shape.type !== 'rect') return item
        const nextRect = clampRectToMap(
          {
            x: snapValue(patch.x ?? item.shape.rect.x),
            y: snapValue(patch.y ?? item.shape.rect.y),
            width: Math.max(4, patch.width ?? item.shape.rect.width),
            height: Math.max(4, patch.height ?? item.shape.rect.height),
          },
          mapWidth,
          mapHeight,
        )
        return {
          ...item,
          shape: {
            ...item.shape,
            rect: nextRect,
          },
        }
      }),
      meta: { ...world.meta, updatedAt: new Date().toISOString() },
    })
  }

  const updateNpc = (id: string, patch: Partial<AuthoringWorldV1['npcs'][number]>) => {
    updateWorld({
      ...world,
      npcs: world.npcs.map((item) => {
        if (item.id !== id) return item
        const nextPos = clampWorldPoint(snapValue(patch.x ?? item.x), snapValue(patch.y ?? item.y))
        return { ...item, ...patch, x: nextPos.x, y: nextPos.y }
      }),
      meta: { ...world.meta, updatedAt: new Date().toISOString() },
    })
  }

  const updatePoi = (id: string, patch: Partial<AuthoringWorldV1['poiIndex'][number]>) => {
    updateWorld({
      ...world,
      poiIndex: world.poiIndex.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      meta: { ...world.meta, updatedAt: new Date().toISOString() },
    })
  }

  const updateInteraction = (interactionId: string, updater: (current: AuthoringWorldV1['interactions'][number]) => AuthoringWorldV1['interactions'][number]) => {
    updateWorld({
      ...world,
      interactions: world.interactions.map((item) => (item.id === interactionId ? updater(item) : item)),
      meta: { ...world.meta, updatedAt: new Date().toISOString() },
    })
  }

  const createInteractionForTrigger = (triggerId: string) => {
    const trigger = world.triggers.find((item) => item.id === triggerId)
    if (!trigger) return
    const existing = trigger.interactionId ? world.interactions.find((item) => item.id === trigger.interactionId) : null
    if (existing) return
    const interactionId = `int-${Date.now()}`
    updateWorld({
      ...world,
      triggers: world.triggers.map((item) => item.id === triggerId ? { ...item, interactionId } : item),
      interactions: [
        ...world.interactions,
        {
          id: interactionId,
          triggerId,
          actions: [
            {
              id: `action-${Date.now()}`,
              label: 'Show Dialogue',
              type: 'open_dialogue',
              dialogueId: world.dialogues[0]?.id ?? '',
            },
          ],
        },
      ],
      meta: { ...world.meta, updatedAt: new Date().toISOString() },
    })
    showStatus('ok', 'Interaction erstellt')
  }

  const createDoorTriggerFromObject = (objectId: string) => {
    const object = world.objects.find((item) => item.id === objectId)
    if (!object) return
    const triggerId = `trigger-door-${Date.now()}`
    const interactionId = `int-door-${Date.now()}`
    const doorWidth = Math.max(16, Math.min(36, Math.round(object.width * 0.36)))
    const doorHeight = 16
    const poi = object.poiId ? world.poiIndex.find((item) => item.id === object.poiId) : null
    const targetDialogue = world.dialogues.find((dialogue) => dialogue.id === `dlg-${object.poiId}`) ?? world.dialogues[0]
    updateWorld({
      ...world,
      triggers: [
        ...world.triggers,
        {
          id: triggerId,
          type: 'door',
          label: `${object.key} Door`,
          objectId: object.id,
          interactionId,
          enabled: true,
          shape: {
            type: 'rect',
            rect: clampRectToMap({
              x: object.x - doorWidth / 2,
              y: object.y + object.height / 2 - doorHeight - 2,
              width: doorWidth,
              height: doorHeight,
            }, mapWidth, mapHeight),
          },
        },
      ],
      interactions: [
        ...world.interactions,
        {
          id: interactionId,
          triggerId,
          actions: targetDialogue
            ? [{ id: `action-${Date.now()}`, label: `${poi?.name ?? object.key} Dialog`, type: 'open_dialogue', dialogueId: targetDialogue.id }]
            : [{ id: `action-${Date.now()}`, label: 'Interact', type: 'show_toast', message: `Interaktion mit ${poi?.name ?? object.key}` }],
        },
      ],
      meta: { ...world.meta, updatedAt: new Date().toISOString() },
    })
    setSelection({ kind: 'trigger', id: triggerId })
    showStatus('ok', 'Door Trigger erzeugt')
  }

  const autoColliderFromObject = (objectId: string) => {
    const object = world.objects.find((item) => item.id === objectId)
    if (!object) return
    const existing = world.colliders.find((item) => item.objectId === objectId && item.shape.type === 'rect')
    const rect = clampRectToMap({
      x: object.x - object.width / 2 + 4,
      y: object.y - object.height / 2 + object.height * 0.42,
      width: Math.max(8, object.width - 8),
      height: Math.max(8, object.height * 0.5),
    }, mapWidth, mapHeight)

    if (existing && existing.shape.type === 'rect') {
      updateWorld({
        ...world,
        colliders: world.colliders.map((item) => item.id === existing.id ? { ...item, shape: { type: 'rect', rect } } : item),
        meta: { ...world.meta, updatedAt: new Date().toISOString() },
      })
      setSelection({ kind: 'collider', id: existing.id })
      showStatus('ok', 'Collider aktualisiert')
      return
    }

    const id = `col-auto-${Date.now()}`
    updateWorld({
      ...world,
      colliders: [
        ...world.colliders,
        {
          id,
          objectId,
          shape: { type: 'rect', rect },
          solid: true,
        },
      ],
      meta: { ...world.meta, updatedAt: new Date().toISOString() },
    })
    setSelection({ kind: 'collider', id })
    showStatus('ok', 'Collider erzeugt')
  }

  const parseAndLoadWorld = (source: string, context: string) => {
    const parsed = AuthoringWorldSchema.parse(JSON.parse(source))
    updateWorld(parsed)
    if (!parsed.dialogues.find((item) => item.id === dialogueId)) {
      setDialogueId(parsed.dialogues[0]?.id ?? '')
    }
    showStatus('ok', `${context}: OK`)
  }

  const exportJson = () => {
    const content = `${JSON.stringify(world, null, 2)}\n`
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `project.world.v1.${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    showStatus('ok', 'JSON exportiert')
  }

  const importFromFile = async () => {
    try {
      if (window.showOpenFilePicker) {
        const [handle] = await window.showOpenFilePicker({
          multiple: false,
          types: [{
            description: 'World JSON',
            accept: { 'application/json': ['.json'] },
          }],
        })
        const file = await handle.getFile()
        const text = await file.text()
        parseAndLoadWorld(text, 'Datei importiert')
        setFileHandle(handle)
        return
      }

      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json,application/json'
      input.onchange = async () => {
        const file = input.files?.[0]
        if (!file) return
        try {
          const text = await file.text()
          parseAndLoadWorld(text, 'Datei importiert')
        } catch (error) {
          showStatus('error', error instanceof Error ? error.message : 'Import fehlgeschlagen')
        }
      }
      input.click()
    } catch (error) {
      showStatus('error', error instanceof Error ? error.message : 'Import fehlgeschlagen')
    }
  }

  const saveToFile = async () => {
    const payload = `${JSON.stringify(world, null, 2)}\n`
    try {
      if (fileHandle?.createWritable) {
        const writer = await fileHandle.createWritable()
        await writer.write(payload)
        await writer.close()
        showStatus('ok', 'Datei gespeichert')
        return
      }

      if (window.showSaveFilePicker) {
        const handle = await window.showSaveFilePicker({
          suggestedName: 'project.world.v1.json',
          types: [{
            description: 'World JSON',
            accept: { 'application/json': ['.json'] },
          }],
        })

        const writer = await handle.createWritable?.()
        if (writer) {
          await writer.write(payload)
          await writer.close()
          setFileHandle(handle)
          showStatus('ok', 'Datei gespeichert')
          return
        }
      }

      exportJson()
    } catch (error) {
      showStatus('error', error instanceof Error ? error.message : 'Speichern fehlgeschlagen')
    }
  }

  const addObject = () => {
    const id = `obj-${Date.now()}`
    const nextObject: AuthoringWorldV1['objects'][number] = {
      id,
      key: `obj${Date.now()}`,
      filename: 'new_object.png',
      x: mapWidth / 2,
      y: mapHeight / 2,
      width: 64,
      height: 64,
      depth: 120,
      collision: true,
      renderGroup: 'default',
      visible: true,
    }
    updateWorld({
      ...world,
      objects: [...world.objects, nextObject],
      meta: { ...world.meta, updatedAt: new Date().toISOString() },
    })
    setSelection({ kind: 'object', id })
    showStatus('ok', 'Objekt erstellt')
  }

  const addCollider = () => {
    const id = `col-${Date.now()}`
    const collider: AuthoringWorldV1['colliders'][number] = {
      id,
      shape: {
        type: 'rect',
        rect: {
          x: mapWidth / 2 - 24,
          y: mapHeight / 2 - 24,
          width: 48,
          height: 48,
        },
      },
      solid: true,
    }
    updateWorld({
      ...world,
      colliders: [...world.colliders, collider],
      meta: { ...world.meta, updatedAt: new Date().toISOString() },
    })
    setSelection({ kind: 'collider', id })
    showStatus('ok', 'Collider erstellt')
  }

  const addTrigger = () => {
    const id = `trigger-${Date.now()}`
    const interactionId = `int-${Date.now()}`

    updateWorld({
      ...world,
      triggers: [
        ...world.triggers,
        {
          id,
          type: 'interact',
          label: 'Neuer Trigger',
          shape: {
            type: 'rect',
            rect: {
              x: mapWidth / 2 - 20,
              y: mapHeight / 2 - 20,
              width: 40,
              height: 40,
            },
          },
          interactionId,
          enabled: true,
        },
      ],
      interactions: [
        ...world.interactions,
        {
          id: interactionId,
          triggerId: id,
          actions: [
            {
              id: `action-${Date.now()}`,
              label: 'Coming soon',
              type: 'show_toast',
              message: 'Noch nicht konfiguriert',
            },
          ],
        },
      ],
      meta: { ...world.meta, updatedAt: new Date().toISOString() },
    })
    setSelection({ kind: 'trigger', id })
    showStatus('ok', 'Trigger erstellt')
  }

  const addNpc = () => {
    const id = `npc-${Date.now()}`
    updateWorld({
      ...world,
      npcs: [
        ...world.npcs,
        {
          id,
          spriteKey: 'npc',
          x: mapWidth / 2,
          y: mapHeight / 2,
          facing: 'south',
          movement: 'static',
        },
      ],
      meta: { ...world.meta, updatedAt: new Date().toISOString() },
    })
    setSelection({ kind: 'npc', id })
    showStatus('ok', 'NPC erstellt')
  }

  const applyJsonBuffer = () => {
    try {
      parseAndLoadWorld(jsonBuffer, 'JSON angewendet')
    } catch (error) {
      showStatus('error', error instanceof Error ? error.message : 'JSON konnte nicht geparst werden')
    }
  }

  const resetSeed = () => {
    const ok = window.confirm('Seed wirklich wiederherstellen? Nicht gespeicherte Aenderungen gehen verloren.')
    if (!ok) return
    updateWorld(seedWorld)
    setSelection({ kind: 'none', id: '' })
    setDialogueId(seedWorld.dialogues[0]?.id ?? '')
    showStatus('warn', 'Seed wiederhergestellt')
  }

  const clearLocalDraft = () => {
    window.localStorage.removeItem(WORLD_LOCAL_STORAGE_KEY)
    window.localStorage.removeItem(SESSION_LOCAL_STORAGE_KEY)
    showStatus('warn', 'Lokaler Draft geloescht')
  }

  const deleteSelection = useCallback(() => {
    if (selection.kind === 'none' || selection.kind === 'poi') return
    const ok = window.confirm(`Element ${selection.id} wirklich loeschen?`)
    if (!ok) return
    if (selection.kind === 'object') {
      updateWorld({
        ...world,
        objects: world.objects.filter((item) => item.id !== selection.id),
        colliders: world.colliders.filter((item) => item.objectId !== selection.id),
        triggers: world.triggers.filter((item) => item.objectId !== selection.id),
        meta: { ...world.meta, updatedAt: new Date().toISOString() },
      })
    }
    if (selection.kind === 'collider') {
      updateWorld({
        ...world,
        colliders: world.colliders.filter((item) => item.id !== selection.id),
        meta: { ...world.meta, updatedAt: new Date().toISOString() },
      })
    }
    if (selection.kind === 'trigger') {
      const trigger = world.triggers.find((item) => item.id === selection.id)
      updateWorld({
        ...world,
        triggers: world.triggers.filter((item) => item.id !== selection.id),
        interactions: trigger?.interactionId ? world.interactions.filter((item) => item.id !== trigger.interactionId) : world.interactions,
        meta: { ...world.meta, updatedAt: new Date().toISOString() },
      })
    }
    if (selection.kind === 'npc') {
      updateWorld({
        ...world,
        npcs: world.npcs.filter((item) => item.id !== selection.id),
        meta: { ...world.meta, updatedAt: new Date().toISOString() },
      })
    }
    setSelection({ kind: 'none', id: '' })
    showStatus('warn', 'Element geloescht')
  }, [selection, world, showStatus, updateWorld])

  const duplicateSelection = useCallback(() => {
    const now = Date.now()
    if (selection.kind === 'object') {
      const item = world.objects.find((object) => object.id === selection.id)
      if (!item) return
      const id = `${item.id}-copy-${now}`
      const copy = {
        ...item,
        id,
        key: `${item.key}Copy`,
        x: clamp(item.x + 16, 0, mapWidth),
        y: clamp(item.y + 16, 0, mapHeight),
      }
      updateWorld({
        ...world,
        objects: [...world.objects, copy],
        meta: { ...world.meta, updatedAt: new Date().toISOString() },
      })
      setSelection({ kind: 'object', id })
      showStatus('ok', 'Objekt dupliziert')
      return
    }
    if (selection.kind === 'collider') {
      const item = world.colliders.find((collider) => collider.id === selection.id)
      if (!item || item.shape.type !== 'rect') return
      const id = `${item.id}-copy-${now}`
      const copy = {
        ...item,
        id,
        shape: {
          ...item.shape,
          rect: clampRectToMap(
            {
              ...item.shape.rect,
              x: item.shape.rect.x + 16,
              y: item.shape.rect.y + 16,
            },
            mapWidth,
            mapHeight,
          ),
        },
      }
      updateWorld({
        ...world,
        colliders: [...world.colliders, copy],
        meta: { ...world.meta, updatedAt: new Date().toISOString() },
      })
      setSelection({ kind: 'collider', id })
      showStatus('ok', 'Collider dupliziert')
      return
    }
    if (selection.kind === 'trigger') {
      const item = world.triggers.find((trigger) => trigger.id === selection.id)
      if (!item || item.shape.type !== 'rect') return
      const id = `${item.id}-copy-${now}`
      const copyInteractionId = item.interactionId ? `${item.interactionId}-copy-${now}` : undefined
      const copy = {
        ...item,
        id,
        interactionId: copyInteractionId,
        shape: {
          ...item.shape,
          rect: clampRectToMap(
            {
              ...item.shape.rect,
              x: item.shape.rect.x + 16,
              y: item.shape.rect.y + 16,
            },
            mapWidth,
            mapHeight,
          ),
        },
      }
      const originalInteraction = item.interactionId ? world.interactions.find((entry) => entry.id === item.interactionId) : undefined
      const copiedInteraction = originalInteraction && copyInteractionId
        ? {
          ...originalInteraction,
          id: copyInteractionId,
          triggerId: id,
          actions: originalInteraction.actions.map((action) => ({ ...action, id: `${action.id}-copy-${now}` })),
        }
        : undefined
      updateWorld({
        ...world,
        triggers: [...world.triggers, copy],
        interactions: copiedInteraction ? [...world.interactions, copiedInteraction] : world.interactions,
        meta: { ...world.meta, updatedAt: new Date().toISOString() },
      })
      setSelection({ kind: 'trigger', id })
      showStatus('ok', 'Trigger dupliziert')
      return
    }
    if (selection.kind === 'npc') {
      const item = world.npcs.find((npc) => npc.id === selection.id)
      if (!item) return
      const id = `${item.id}-copy-${now}`
      updateWorld({
        ...world,
        npcs: [...world.npcs, { ...item, id, x: clamp(item.x + 16, 0, mapWidth), y: clamp(item.y + 16, 0, mapHeight) }],
        meta: { ...world.meta, updatedAt: new Date().toISOString() },
      })
      setSelection({ kind: 'npc', id })
      showStatus('ok', 'NPC dupliziert')
    }
  }, [selection, world, mapWidth, mapHeight, showStatus, updateWorld])

  useEffect(() => {
    deleteSelectionRef.current = deleteSelection
    duplicateSelectionRef.current = duplicateSelection
  }, [deleteSelection, duplicateSelection])

  const showDialogue = (id: string) => {
    setDialogueId(id)
    const target = world.dialogues.find((item) => item.id === id)
    if (!target) return
    const flow = buildDialogueFlow(target)
    setFlowNodes(flow.nodes)
    setFlowEdges(flow.edges)
  }

  const clampZoom = (value: number) => Math.max(0.35, Math.min(2.5, value))
  const clampCameraToBounds = useCallback((nextX: number, nextY: number, zoomValue: number) => {
    const minX = stageWidth - mapWidth * zoomValue - CAMERA_MIN_PADDING
    const minY = stageHeight - mapHeight * zoomValue - CAMERA_MIN_PADDING
    const maxX = CAMERA_MIN_PADDING
    const maxY = CAMERA_MIN_PADDING
    return {
      x: Number(clamp(nextX, minX, maxX).toFixed(2)),
      y: Number(clamp(nextY, minY, maxY).toFixed(2)),
    }
  }, [mapHeight, mapWidth])

  const fitMapView = useCallback(() => {
    const fitZoom = clampZoom(Math.min(
      (stageWidth - CAMERA_MIN_PADDING * 2) / mapWidth,
      (stageHeight - CAMERA_MIN_PADDING * 2) / mapHeight,
    ))
    setZoom(fitZoom)
    setCamera(clampCameraToBounds(
      (stageWidth - mapWidth * fitZoom) / 2,
      (stageHeight - mapHeight * fitZoom) / 2,
      fitZoom,
    ))
  }, [clampCameraToBounds, mapHeight, mapWidth])

  const frameSelection = useCallback(() => {
    const padding = 60
    if (selectedObject) {
      const targetZoom = clampZoom(Math.min(
        (stageWidth - padding * 2) / selectedObject.width,
        (stageHeight - padding * 2) / selectedObject.height,
      ))
      setZoom(targetZoom)
      setCamera(clampCameraToBounds(
        stageWidth / 2 - selectedObject.x * targetZoom,
        stageHeight / 2 - selectedObject.y * targetZoom,
        targetZoom,
      ))
      return
    }
    if (selectedCollider?.shape.type === 'rect') {
      const rect = selectedCollider.shape.rect
      const cx = rect.x + rect.width / 2
      const cy = rect.y + rect.height / 2
      const targetZoom = clampZoom(Math.min(
        (stageWidth - padding * 2) / rect.width,
        (stageHeight - padding * 2) / rect.height,
      ))
      setZoom(targetZoom)
      setCamera(clampCameraToBounds(
        stageWidth / 2 - cx * targetZoom,
        stageHeight / 2 - cy * targetZoom,
        targetZoom,
      ))
      return
    }
    if (selectedTrigger?.shape.type === 'rect') {
      const rect = selectedTrigger.shape.rect
      const cx = rect.x + rect.width / 2
      const cy = rect.y + rect.height / 2
      const targetZoom = clampZoom(Math.min(
        (stageWidth - padding * 2) / rect.width,
        (stageHeight - padding * 2) / rect.height,
      ))
      setZoom(targetZoom)
      setCamera(clampCameraToBounds(
        stageWidth / 2 - cx * targetZoom,
        stageHeight / 2 - cy * targetZoom,
        targetZoom,
      ))
      return
    }
    if (selectedNpc) {
      const targetZoom = clampZoom(2.2)
      setZoom(targetZoom)
      setCamera(clampCameraToBounds(
        stageWidth / 2 - selectedNpc.x * targetZoom,
        stageHeight / 2 - selectedNpc.y * targetZoom,
        targetZoom,
      ))
      return
    }
    fitMapView()
  }, [clampCameraToBounds, fitMapView, selectedCollider, selectedNpc, selectedObject, selectedTrigger])

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev
      const previous = prev[prev.length - 1]
      setFuture((nextFuture) => [world, ...nextFuture].slice(0, 80))
      setWorld(previous)
      refreshJsonBuffer(previous)
      showStatus('ok', 'Undo')
      return prev.slice(0, -1)
    })
  }, [refreshJsonBuffer, showStatus, world])

  const redo = useCallback(() => {
    setFuture((prev) => {
      if (prev.length === 0) return prev
      const next = prev[0]
      setHistory((past) => [...past.slice(-79), world])
      setWorld(next)
      refreshJsonBuffer(next)
      showStatus('ok', 'Redo')
      return prev.slice(1)
    })
  }, [refreshJsonBuffer, showStatus, world])

  useEffect(() => {
    const transformer = transformerRef.current
    if (!transformer) return
    const node = selectedRef.current
    if (!node) {
      transformer.nodes([])
      transformer.getLayer()?.batchDraw()
      return
    }
    transformer.nodes([node])
    transformer.getLayer()?.batchDraw()
  }, [selection, world.objects, world.colliders, world.triggers])

  useEffect(() => {
    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current)
    autosaveTimerRef.current = window.setTimeout(() => {
      window.localStorage.setItem(WORLD_LOCAL_STORAGE_KEY, JSON.stringify(world))
      const session: SavedSessionV1 = { tab, zoom, camera, panMode }
      window.localStorage.setItem(SESSION_LOCAL_STORAGE_KEY, JSON.stringify(session))
    }, 200)
    return () => {
      if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current)
    }
  }, [world, tab, zoom, camera, panMode])

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTypingTarget = Boolean(
        target && (
          target.tagName === 'INPUT'
          || target.tagName === 'TEXTAREA'
          || target.tagName === 'SELECT'
          || target.isContentEditable
        ),
      )

      if (!isTypingTarget && (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
        const amount = event.shiftKey ? 64 : 24
        const nextX = event.key === 'ArrowLeft' ? camera.x + amount : event.key === 'ArrowRight' ? camera.x - amount : camera.x
        const nextY = event.key === 'ArrowUp' ? camera.y + amount : event.key === 'ArrowDown' ? camera.y - amount : camera.y
        setCamera(clampCameraToBounds(nextX, nextY, zoom))
        event.preventDefault()
      }

      if (!isTypingTarget && event.key.toLowerCase() === 'f') {
        if (event.shiftKey) {
          fitMapView()
        } else {
          frameSelection()
        }
        event.preventDefault()
      }

      if (event.key === ' ') {
        setSpaceHeld(true)
        event.preventDefault()
      }
      if (isTypingTarget) return
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selection.kind !== 'none' && selection.kind !== 'poi') {
          deleteSelectionRef.current()
          event.preventDefault()
        }
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'd') {
        duplicateSelectionRef.current()
        event.preventDefault()
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        if (event.shiftKey) {
          redo()
        } else {
          undo()
        }
        event.preventDefault()
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'y') {
        redo()
        event.preventDefault()
      }
    }
    const keyup = (event: KeyboardEvent) => {
      if (event.key === ' ') setSpaceHeld(false)
    }
    window.addEventListener('keydown', keydown)
    window.addEventListener('keyup', keyup)
    return () => {
      window.removeEventListener('keydown', keydown)
      window.removeEventListener('keyup', keyup)
    }
  }, [camera, clampCameraToBounds, fitMapView, frameSelection, redo, selection, undo, zoom])

  useEffect(() => {
    window.render_game_to_text = () => JSON.stringify({
      mode: tab,
      selection,
      zoom,
      camera,
      panMode: panMode || spaceHeld || middlePanActive,
      backgroundMode,
      backgroundBlendOpacity,
      hoverWorld,
      showCrosshair,
      map: { width: mapWidth, height: mapHeight, tileSize: world.map.tileSize },
      counts: {
        objects: world.objects.length,
        colliders: world.colliders.length,
        triggers: world.triggers.length,
        npcs: world.npcs.length,
        pois: world.poiIndex.length,
      },
      history: { undo: history.length, redo: future.length },
      layers: { visibility: layerVisibility, lock: layerLock },
      topLayers: drawOrderedObjects.slice(-5).map((item) => ({ id: item.id, key: item.key, depth: item.depth })),
      frameCounter,
      coordinateSystem: 'origin: top-left, +x right, +y down',
    })
    window.advanceTime = async (ms: number) => {
      const ticks = Math.max(1, Math.round(ms / (1000 / 60)))
      setFrameCounter((prev) => prev + ticks)
      await Promise.resolve()
    }
    return () => {
      delete window.render_game_to_text
      delete window.advanceTime
    }
  }, [tab, selection, zoom, camera, panMode, spaceHeld, middlePanActive, backgroundMode, backgroundBlendOpacity, hoverWorld, showCrosshair, mapWidth, mapHeight, world.map.tileSize, world.objects.length, world.colliders.length, world.triggers.length, world.npcs.length, world.poiIndex.length, frameCounter, history.length, future.length, layerLock, layerVisibility, drawOrderedObjects])

  const minimapScale = Math.min(180 / mapWidth, 120 / mapHeight)
  const minimapWidth = mapWidth * minimapScale
  const minimapHeight = mapHeight * minimapScale
  const minimapX = stageWidth - minimapWidth - 14
  const minimapY = stageHeight - minimapHeight - 14
  const viewportWorld = {
    x: clamp(-camera.x / zoom, 0, mapWidth),
    y: clamp(-camera.y / zoom, 0, mapHeight),
    width: clamp(stageWidth / zoom, 1, mapWidth),
    height: clamp(stageHeight / zoom, 1, mapHeight),
  }

  return (
    <div className="wb-root">
      <header className="wb-topbar">
        <div>
          <h1>Worldbuilder Studio V2</h1>
          <p>Lokales Authoring-Tool. Runtime-Dateien werden ueber `npm run world:compile` generiert.</p>
        </div>
        <div className="wb-actions">
          <button data-testid="open-json-btn" onClick={importFromFile}>Open JSON</button>
          <button data-testid="save-json-btn" onClick={saveToFile}>Save JSON</button>
          <button data-testid="export-json-btn" onClick={exportJson}>Export</button>
          <button data-testid="add-object-btn" onClick={addObject}>+ Object</button>
          <button data-testid="add-collider-btn" onClick={addCollider}>+ Collider</button>
          <button data-testid="add-trigger-btn" onClick={addTrigger}>+ Trigger</button>
          <button data-testid="add-npc-btn" onClick={addNpc}>+ NPC</button>
          <button onClick={undo} disabled={history.length === 0}>Undo</button>
          <button onClick={redo} disabled={future.length === 0}>Redo</button>
          <button onClick={duplicateSelection} disabled={!selectedObject && !selectedCollider && !selectedTrigger && !selectedNpc}>Duplicate</button>
          <button onClick={deleteSelection} disabled={!selectedObject && !selectedCollider && !selectedTrigger && !selectedNpc}>Delete</button>
          <button onClick={resetSeed}>Reset Seed</button>
          <button onClick={clearLocalDraft}>Reset Local Draft</button>
        </div>
      </header>

      {status ? (
        <div className={`wb-status ${status.tone}`} role="status" aria-live="polite">
          {status.text}
        </div>
      ) : null}

      <nav className="wb-tabs">
        {(['canvas', 'dialogue', 'validation', 'json'] as Tabs[]).map((item) => (
          <button
            key={item}
            className={item === tab ? 'active' : ''}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </nav>

      <section className="wb-layout">
        <aside className="wb-sidebar left">
          <h3>Entities</h3>
          <input
            id="entity-filter"
            name="entity-filter"
            aria-label="entity-filter"
            className="wb-input"
            placeholder="Filter (id/name/key)..."
            value={entityFilter}
            onChange={(event) => setEntityFilter(event.target.value)}
          />
          <div className="wb-list">
            <h4>Objects</h4>
            {filteredObjects.map((item) => (
              <button key={item.id} className={selection.kind === 'object' && selection.id === item.id ? 'sel' : ''} onClick={() => setSelection({ kind: 'object', id: item.id })}>
                {item.key} <span className="wb-inline-meta">d:{item.depth} {item.visible ? '' : '(hidden)'}</span>
              </button>
            ))}
            <h4>Colliders</h4>
            {filteredColliders.map((item) => (
              <button key={item.id} className={selection.kind === 'collider' && selection.id === item.id ? 'sel' : ''} onClick={() => setSelection({ kind: 'collider', id: item.id })}>{item.id}</button>
            ))}
            <h4>Triggers</h4>
            {filteredTriggers.map((item) => (
              <button key={item.id} className={selection.kind === 'trigger' && selection.id === item.id ? 'sel' : ''} onClick={() => setSelection({ kind: 'trigger', id: item.id })}>{item.label}</button>
            ))}
            <h4>NPCs</h4>
            {filteredNpcs.map((item) => (
              <button key={item.id} className={selection.kind === 'npc' && selection.id === item.id ? 'sel' : ''} onClick={() => setSelection({ kind: 'npc', id: item.id })}>{item.id}</button>
            ))}
            <h4>POIs</h4>
            {filteredPois.map((item) => (
              <button key={item.id} className={selection.kind === 'poi' && selection.id === item.id ? 'sel' : ''} onClick={() => setSelection({ kind: 'poi', id: item.id })}>{item.name}</button>
            ))}
          </div>
        </aside>

        <main className="wb-main">
          {tab === 'canvas' ? (
            <div className="wb-canvas">
              <div className="wb-canvas-toolbar">
                <label htmlFor="zoom-range">
                  Zoom
                  <input
                    id="zoom-range"
                    type="range"
                    min="0.4"
                    max="2.5"
                    step="0.05"
                    value={zoom}
                    onChange={(event) => setZoom(clampZoom(Number(event.target.value)))}
                  />
                </label>
                <button onClick={() => setSnapToGrid((prev) => !prev)}>
                  {snapToGrid ? 'Snap: ON' : 'Snap: OFF'}
                </button>
                <button onClick={() => setShowLabels((prev) => !prev)}>
                  {showLabels ? 'Labels: ON' : 'Labels: OFF'}
                </button>
                <button onClick={() => setPanMode((prev) => !prev)}>
                  {panMode ? 'Pan: ON' : 'Pan: OFF'}
                </button>
                <button onClick={frameSelection}>Frame Selected</button>
                <button onClick={fitMapView}>Fit Map</button>
                <button
                  onClick={() => {
                    setZoom(1)
                    setCamera({ x: 20, y: 20 })
                    setSelection({ kind: 'none', id: '' })
                  }}
                >
                  Reset View
                </button>
                <span className="wb-history-pill">History {history.length} / Redo {future.length}</span>
                <label className="wb-inline-check" htmlFor="bg-mode-select">
                  View
                  <select
                    id="bg-mode-select"
                    className="wb-input"
                    value={backgroundMode}
                    onChange={(event) => setBackgroundMode(event.target.value as BackgroundMode)}
                  >
                    <option value="abstract">Abstract</option>
                    <option value="rendered">Rendered</option>
                    <option value="blend">Blend</option>
                  </select>
                </label>
                {backgroundMode === 'blend' ? (
                  <label className="wb-inline-check" htmlFor="blend-opacity-range">
                    Blend
                    <input
                      id="blend-opacity-range"
                      type="range"
                      min="0.05"
                      max="1"
                      step="0.05"
                      value={backgroundBlendOpacity}
                      onChange={(event) => setBackgroundBlendOpacity(Number(event.target.value))}
                    />
                  </label>
                ) : null}
                <label className="wb-inline-check">
                  <input type="checkbox" checked={showCrosshair} onChange={(event) => setShowCrosshair(event.target.checked)} />
                  Crosshair
                </label>
                <span className="wb-history-pill">
                  Cursor {hoverWorld ? `${Math.round(hoverWorld.x)},${Math.round(hoverWorld.y)} (tile ${Math.floor(hoverWorld.x / world.map.tileSize)},${Math.floor(hoverWorld.y / world.map.tileSize)})` : '--'}
                </span>
              </div>
              <div className="wb-layer-toggles">
                <label className="wb-inline-check">
                  <input type="checkbox" checked={layerVisibility.objects} onChange={(event) => setLayerVisibility((prev) => ({ ...prev, objects: event.target.checked }))} />
                  Objects
                </label>
                <label className="wb-inline-check">
                  <input type="checkbox" checked={layerVisibility.colliders} onChange={(event) => setLayerVisibility((prev) => ({ ...prev, colliders: event.target.checked }))} />
                  Colliders
                </label>
                <label className="wb-inline-check">
                  <input type="checkbox" checked={layerVisibility.triggers} onChange={(event) => setLayerVisibility((prev) => ({ ...prev, triggers: event.target.checked }))} />
                  Triggers
                </label>
                <label className="wb-inline-check">
                  <input type="checkbox" checked={layerVisibility.npcs} onChange={(event) => setLayerVisibility((prev) => ({ ...prev, npcs: event.target.checked }))} />
                  NPCs
                </label>
                <label className="wb-inline-check">
                  <input type="checkbox" checked={layerVisibility.minimap} onChange={(event) => setLayerVisibility((prev) => ({ ...prev, minimap: event.target.checked }))} />
                  Minimap
                </label>
              </div>
              <div className="wb-layer-toggles">
                <label className="wb-inline-check">
                  <input type="checkbox" checked={layerLock.objects} onChange={(event) => setLayerLock((prev) => ({ ...prev, objects: event.target.checked }))} />
                  Lock Objects
                </label>
                <label className="wb-inline-check">
                  <input type="checkbox" checked={layerLock.colliders} onChange={(event) => setLayerLock((prev) => ({ ...prev, colliders: event.target.checked }))} />
                  Lock Colliders
                </label>
                <label className="wb-inline-check">
                  <input type="checkbox" checked={layerLock.triggers} onChange={(event) => setLayerLock((prev) => ({ ...prev, triggers: event.target.checked }))} />
                  Lock Triggers
                </label>
                <label className="wb-inline-check">
                  <input type="checkbox" checked={layerLock.npcs} onChange={(event) => setLayerLock((prev) => ({ ...prev, npcs: event.target.checked }))} />
                  Lock NPCs
                </label>
              </div>

              <Stage
                ref={stageRef}
                width={stageWidth}
                height={stageHeight}
                className="wb-stage"
                style={{ cursor: middlePanActive || panMode || spaceHeld ? 'grabbing' : 'default' }}
                onMouseDown={(event) => {
                  if (event.evt.button === 1) {
                    event.evt.preventDefault()
                    const stage = event.target.getStage()
                    const pointer = stage?.getPointerPosition()
                    if (!pointer) return
                    middlePanStartRef.current = {
                      pointerX: pointer.x,
                      pointerY: pointer.y,
                      cameraX: camera.x,
                      cameraY: camera.y,
                    }
                    setMiddlePanActive(true)
                    return
                  }
                  const target = event.target
                  if (target === event.target.getStage()) {
                    setSelection({ kind: 'none', id: '' })
                  }
                }}
                onMouseMove={(event) => {
                  const stage = event.target.getStage()
                  const pointer = stage?.getPointerPosition()
                  if (pointer) {
                    setHoverWorld({
                      x: Number(((pointer.x - camera.x) / zoom).toFixed(2)),
                      y: Number(((pointer.y - camera.y) / zoom).toFixed(2)),
                    })
                  }
                  if (!middlePanStartRef.current) return
                  const dragPointer = stage?.getPointerPosition()
                  if (!dragPointer) return
                  const deltaX = dragPointer.x - middlePanStartRef.current.pointerX
                  const deltaY = dragPointer.y - middlePanStartRef.current.pointerY
                  const next = clampCameraToBounds(
                    middlePanStartRef.current.cameraX + deltaX,
                    middlePanStartRef.current.cameraY + deltaY,
                    zoom,
                  )
                  setCamera(next)
                }}
                onMouseUp={() => {
                  middlePanStartRef.current = null
                  setMiddlePanActive(false)
                }}
                onMouseLeave={() => {
                  middlePanStartRef.current = null
                  setMiddlePanActive(false)
                  setHoverWorld(null)
                }}
                onWheel={(event) => {
                  event.evt.preventDefault()
                  const stage = event.target.getStage()
                  if (!stage) return
                  const pointer = stage.getPointerPosition()
                  if (!pointer) return
                  const mousePointTo = {
                    x: (pointer.x - camera.x) / zoom,
                    y: (pointer.y - camera.y) / zoom,
                  }
                  const zoomDelta = event.evt.deltaY > 0 ? -0.08 : 0.08
                  const nextZoom = clampZoom(zoom + zoomDelta)
                  const unclampedCamera = {
                    x: pointer.x - mousePointTo.x * nextZoom,
                    y: pointer.y - mousePointTo.y * nextZoom,
                  }
                  setZoom(nextZoom)
                  setCamera(clampCameraToBounds(unclampedCamera.x, unclampedCamera.y, nextZoom))
                }}
              >
                <Layer>
                  <Group
                    x={camera.x}
                    y={camera.y}
                    scale={{ x: zoom, y: zoom }}
                    draggable={panMode || spaceHeld || middlePanActive}
                    onDragEnd={(event) => {
                      setCamera(clampCameraToBounds(event.target.x(), event.target.y(), zoom))
                    }}
                  >
                    {(backgroundMode === 'rendered' || backgroundMode === 'blend') && renderedMapImage ? (
                      <KonvaImage
                        image={renderedMapImage}
                        x={0}
                        y={0}
                        width={mapWidth}
                        height={mapHeight}
                        listening={false}
                        opacity={backgroundMode === 'blend' ? 1 : 1}
                      />
                    ) : null}

                    {(backgroundMode === 'abstract' || backgroundMode === 'blend')
                      ? world.map.terrainGrid.map((row, y) => row.map((terrain, x) => (
                        <Rect
                          key={`t-${x}-${y}`}
                          x={x * world.map.tileSize}
                          y={y * world.map.tileSize}
                          width={world.map.tileSize}
                          height={world.map.tileSize}
                          fill={terrainColor(terrain)}
                          opacity={backgroundMode === 'blend' ? backgroundBlendOpacity : 1}
                          listening={false}
                        />
                      )))
                      : null}

                    {snapToGrid ? (
                      <>
                        {Array.from({ length: world.map.columns + 1 }, (_, index) => (
                          <Rect
                            key={`grid-v-${index}`}
                            x={index * world.map.tileSize}
                            y={0}
                            width={0.5}
                            height={mapHeight}
                            fill="rgba(255,255,255,0.14)"
                            listening={false}
                          />
                        ))}
                        {Array.from({ length: world.map.rows + 1 }, (_, index) => (
                          <Rect
                            key={`grid-h-${index}`}
                            x={0}
                            y={index * world.map.tileSize}
                            width={mapWidth}
                            height={0.5}
                            fill="rgba(255,255,255,0.14)"
                            listening={false}
                          />
                        ))}
                      </>
                    ) : null}

                    {layerVisibility.objects ? drawOrderedObjects.filter((object) => object.visible).map((object) => (
                      <Group key={object.id}>
                        <Rect
                          ref={selection.kind === 'object' && selection.id === object.id ? selectedRef : undefined}
                          x={object.x - object.width / 2}
                          y={object.y - object.height / 2}
                          width={object.width}
                          height={object.height}
                          fill="rgba(255, 157, 58, 0.15)"
                          stroke={selection.kind === 'object' && selection.id === object.id ? '#ffd250' : '#ff7a59'}
                          strokeWidth={selection.kind === 'object' && selection.id === object.id ? 3 : 2}
                          draggable={!(panMode || spaceHeld || middlePanActive || layerLock.objects)}
                          onClick={() => setSelection({ kind: 'object', id: object.id })}
                          onDragEnd={(event) => {
                            updateObject(object.id, {
                              x: Number((event.target.x() + object.width / 2).toFixed(2)),
                              y: Number((event.target.y() + object.height / 2).toFixed(2)),
                            })
                          }}
                          onTransformEnd={(event) => {
                            const node = event.target
                            const scaleX = node.scaleX()
                            const scaleY = node.scaleY()
                            node.scaleX(1)
                            node.scaleY(1)
                            updateObject(object.id, {
                              x: Number((node.x() + (object.width * scaleX) / 2).toFixed(2)),
                              y: Number((node.y() + (object.height * scaleY) / 2).toFixed(2)),
                              width: Number(Math.max(8, object.width * scaleX).toFixed(2)),
                              height: Number(Math.max(8, object.height * scaleY).toFixed(2)),
                            })
                          }}
                        />
                        {showLabels ? (
                          <Text
                            x={object.x - object.width / 2}
                            y={object.y - object.height / 2 - 16}
                            text={object.key}
                            fontSize={11}
                            fill="#ffe8ca"
                            listening={false}
                          />
                        ) : null}
                      </Group>
                    )) : null}

                    {layerVisibility.colliders ? world.colliders.map((collider) => collider.shape.type === 'rect' ? (
                      <Rect
                        key={collider.id}
                        ref={selection.kind === 'collider' && selection.id === collider.id ? selectedRef : undefined}
                        x={collider.shape.rect.x}
                        y={collider.shape.rect.y}
                        width={collider.shape.rect.width}
                        height={collider.shape.rect.height}
                        fill="rgba(41, 232, 255, 0.1)"
                        stroke={selection.kind === 'collider' && selection.id === collider.id ? '#9af7ff' : '#3cc8ff'}
                        strokeWidth={selection.kind === 'collider' && selection.id === collider.id ? 3 : 2}
                        draggable={!(panMode || spaceHeld || middlePanActive || layerLock.colliders)}
                        onClick={() => setSelection({ kind: 'collider', id: collider.id })}
                        onDragEnd={(event) => {
                          updateColliderRect(collider.id, {
                            x: Number(event.target.x().toFixed(2)),
                            y: Number(event.target.y().toFixed(2)),
                          })
                        }}
                        onTransformEnd={(event) => {
                          const node = event.target
                          const scaleX = node.scaleX()
                          const scaleY = node.scaleY()
                          node.scaleX(1)
                          node.scaleY(1)
                          updateColliderRect(collider.id, {
                            x: Number(node.x().toFixed(2)),
                            y: Number(node.y().toFixed(2)),
                            width: Number(Math.max(4, collider.shape.rect.width * scaleX).toFixed(2)),
                            height: Number(Math.max(4, collider.shape.rect.height * scaleY).toFixed(2)),
                          })
                        }}
                      />
                    ) : null) : null}

                    {layerVisibility.triggers ? world.triggers.map((trigger) => trigger.shape.type === 'rect' ? (
                      <Rect
                        key={trigger.id}
                        ref={selection.kind === 'trigger' && selection.id === trigger.id ? selectedRef : undefined}
                        x={trigger.shape.rect.x}
                        y={trigger.shape.rect.y}
                        width={trigger.shape.rect.width}
                        height={trigger.shape.rect.height}
                        fill="rgba(255, 70, 188, 0.08)"
                        dash={[6, 4]}
                        stroke={selection.kind === 'trigger' && selection.id === trigger.id ? '#ff8bd8' : '#ff47b6'}
                        strokeWidth={selection.kind === 'trigger' && selection.id === trigger.id ? 3 : 2}
                        draggable={!(panMode || spaceHeld || middlePanActive || layerLock.triggers)}
                        onClick={() => setSelection({ kind: 'trigger', id: trigger.id })}
                        onDragEnd={(event) => {
                          updateTriggerRect(trigger.id, {
                            x: Number(event.target.x().toFixed(2)),
                            y: Number(event.target.y().toFixed(2)),
                          })
                        }}
                        onTransformEnd={(event) => {
                          const node = event.target
                          const scaleX = node.scaleX()
                          const scaleY = node.scaleY()
                          node.scaleX(1)
                          node.scaleY(1)
                          updateTriggerRect(trigger.id, {
                            x: Number(node.x().toFixed(2)),
                            y: Number(node.y().toFixed(2)),
                            width: Number(Math.max(4, trigger.shape.rect.width * scaleX).toFixed(2)),
                            height: Number(Math.max(4, trigger.shape.rect.height * scaleY).toFixed(2)),
                          })
                        }}
                      />
                    ) : null) : null}

                    {layerVisibility.npcs ? world.npcs.map((npc) => (
                      <Circle
                        key={npc.id}
                        x={npc.x}
                        y={npc.y}
                        radius={8}
                        fill={selection.kind === 'npc' && selection.id === npc.id ? '#ffe88f' : '#f4d35e'}
                        stroke="#7d5c00"
                        strokeWidth={2}
                        draggable={!(panMode || spaceHeld || middlePanActive || layerLock.npcs)}
                        onClick={() => setSelection({ kind: 'npc', id: npc.id })}
                        onDragEnd={(event) => {
                          updateNpc(npc.id, {
                            x: Number(event.target.x().toFixed(2)),
                            y: Number(event.target.y().toFixed(2)),
                          })
                        }}
                      />
                    )) : null}

                    {showCrosshair && hoverWorld ? (
                      <>
                        <Rect x={hoverWorld.x} y={0} width={1} height={mapHeight} fill="rgba(255,255,255,0.25)" listening={false} />
                        <Rect x={0} y={hoverWorld.y} width={mapWidth} height={1} fill="rgba(255,255,255,0.25)" listening={false} />
                      </>
                    ) : null}
                    <Text x={8} y={8} text="Orange=Object  Cyan=Collider  Pink=Trigger  Yellow=NPC" fontSize={12} fill="#fefefe" listening={false} />
                    <Text x={8} y={22} text="Space/MiddleMouse+Drag = Pan, Wheel = Zoom, Arrows = Pan, F = Fit, Del = Delete, Cmd/Ctrl+D = Duplicate" fontSize={11} fill="#d1d5db" listening={false} />
                  </Group>
                  {layerVisibility.minimap ? (
                    <>
                      <Rect x={minimapX - 2} y={minimapY - 2} width={minimapWidth + 4} height={minimapHeight + 4} fill="rgba(15, 23, 42, 0.9)" stroke="#5b708f" strokeWidth={1} listening={false} />
                  <Rect x={minimapX} y={minimapY} width={minimapWidth} height={minimapHeight} fill="rgba(35, 119, 219, 0.7)" listening={false} />
                  {drawOrderedObjects.filter((object) => object.visible).map((object) => (
                    <Rect
                      key={`mini-${object.id}`}
                      x={minimapX + (object.x - object.width / 2) * minimapScale}
                      y={minimapY + (object.y - object.height / 2) * minimapScale}
                      width={Math.max(1, object.width * minimapScale)}
                      height={Math.max(1, object.height * minimapScale)}
                      fill="rgba(255, 187, 69, 0.55)"
                      listening={false}
                    />
                  ))}
                  <Rect
                    x={minimapX + viewportWorld.x * minimapScale}
                    y={minimapY + viewportWorld.y * minimapScale}
                    width={Math.max(2, viewportWorld.width * minimapScale)}
                    height={Math.max(2, viewportWorld.height * minimapScale)}
                    stroke="#f8fafc"
                    strokeWidth={1}
                    listening={false}
                  />
                  <Text x={minimapX + 4} y={minimapY + 4} text="Minimap" fontSize={10} fill="#e5e7eb" listening={false} />
                    </>
                  ) : null}
                  <Transformer ref={transformerRef} rotateEnabled={false} enabledAnchors={['top-left', 'top-center', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right']} />
                </Layer>
              </Stage>
            </div>
          ) : null}

          {tab === 'dialogue' ? (
            <div className="wb-dialogue-tab">
              <div className="wb-dialogue-head">
                <select id="dialogue-select" name="dialogue-select" aria-label="dialogue-select" value={selectedDialogue?.id ?? ''} onChange={(event) => showDialogue(event.target.value)}>
                  {world.dialogues.map((dialogue) => (
                    <option key={dialogue.id} value={dialogue.id}>{dialogue.title}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    const id = `dlg-${Date.now()}`
                    const newDialogue: AuthoringWorldV1['dialogues'][number] = {
                      id,
                      title: 'Neuer Dialog',
                      startNodeId: `line-${Date.now()}`,
                      nodes: [
                        {
                          id: `line-${Date.now()}`,
                          type: 'line',
                          speaker: 'Narrator',
                          text: 'Neuer Dialog',
                        },
                      ],
                    }
                    const nextWorld = {
                      ...world,
                      dialogues: [...world.dialogues, newDialogue],
                      meta: { ...world.meta, updatedAt: new Date().toISOString() },
                    }
                    updateWorld(nextWorld)
                    showDialogue(id)
                  }}
                >
                  + Dialogue
                </button>
              </div>
              <div className="wb-flow-wrap">
                <ReactFlow nodes={flowNodes} edges={flowEdges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} fitView>
                  <MiniMap />
                  <Controls />
                  <Background />
                </ReactFlow>
              </div>
              {selectedDialogue ? (
                <div className="wb-dialogue-edit">
                  <label htmlFor="dialogue-title">Title</label>
                  <input
                    id="dialogue-title"
                    name="dialogue-title"
                    aria-label="dialogue-title"
                    className="wb-input"
                    value={selectedDialogue.title}
                    onChange={(event) => {
                      updateWorld({
                        ...world,
                        dialogues: world.dialogues.map((dialogue) => dialogue.id === selectedDialogue.id ? { ...dialogue, title: event.target.value } : dialogue),
                        meta: { ...world.meta, updatedAt: new Date().toISOString() },
                      })
                    }}
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {tab === 'validation' ? (
            <div className="wb-validation">
              <h3>Validation</h3>
              {validationIssues.length === 0 ? <p>Keine Probleme gefunden.</p> : null}
              {validationIssues.map((issue) => (
                <p key={issue} className="err">{issue}</p>
              ))}
              <p>Compile Runtime: <code>npm run world:compile</code></p>
            </div>
          ) : null}

          {tab === 'json' ? (
            <div className="wb-json-tab">
              <textarea id="json-editor" name="json-editor" aria-label="json-editor" value={jsonBuffer} onChange={(event) => setJsonBuffer(event.target.value)} />
              <button onClick={applyJsonBuffer}>Apply JSON</button>
            </div>
          ) : null}
        </main>

        <aside className="wb-sidebar right">
          <h3>Inspector</h3>
          <p className="wb-legend"><strong>Shortcuts:</strong> Space+Drag oder MiddleMouse+Drag pan, Wheel zoom, Pfeile pan, F fit, Del delete, Cmd/Ctrl+D duplicate, Cmd/Ctrl+Z undo, Cmd/Ctrl+Shift+Z redo.</p>
          {selectedObject ? (
            <>
              <h4>Object: {selectedObject.key}</h4>
              <p className="wb-hint">Render Order: Hoehere `depth` Werte werden ueber niedrigeren gerendert.</p>
              <label htmlFor="obj-x">X</label>
              {numberInput('obj-x', selectedObject.x, (next) => updateObject(selectedObject.id, { x: next }))}
              <label htmlFor="obj-y">Y</label>
              {numberInput('obj-y', selectedObject.y, (next) => updateObject(selectedObject.id, { y: next }))}
              <label htmlFor="obj-width">Width</label>
              {numberInput('obj-width', selectedObject.width, (next) => updateObject(selectedObject.id, { width: Math.max(8, next) }), { min: 8 })}
              <label htmlFor="obj-height">Height</label>
              {numberInput('obj-height', selectedObject.height, (next) => updateObject(selectedObject.id, { height: Math.max(8, next) }), { min: 8 })}
              <label htmlFor="obj-depth">Depth</label>
              {numberInput('obj-depth', selectedObject.depth, (next) => updateObject(selectedObject.id, { depth: next }))}
              <div className="wb-inline-buttons">
                <button onClick={() => nudgeObjectDepth(selectedObject.id, -10)}>-10</button>
                <button onClick={() => nudgeObjectDepth(selectedObject.id, -1)}>-1</button>
                <button onClick={() => updateObject(selectedObject.id, { depth: Math.round(selectedObject.y) })}>Depth = Y</button>
                <button onClick={() => nudgeObjectDepth(selectedObject.id, 1)}>+1</button>
                <button onClick={() => nudgeObjectDepth(selectedObject.id, 10)}>+10</button>
              </div>
              <label htmlFor="obj-render-group">Render Group</label>
              <select
                id="obj-render-group"
                name="obj-render-group"
                aria-label="obj-render-group"
                className="wb-input"
                value={selectedObject.renderGroup}
                onChange={(event) => updateObject(selectedObject.id, { renderGroup: event.target.value })}
              >
                <option value="ground">ground</option>
                <option value="default">default</option>
                <option value="foreground">foreground</option>
              </select>
              <label className="wb-inline-check" htmlFor="obj-collision">
                <input
                  id="obj-collision"
                  name="obj-collision"
                  type="checkbox"
                  checked={Boolean(selectedObject.collision)}
                  onChange={(event) => updateObject(selectedObject.id, { collision: event.target.checked })}
                />
                Blocking (player cannot walk through this object)
              </label>
              <label className="wb-inline-check" htmlFor="obj-visible">
                <input
                  id="obj-visible"
                  name="obj-visible"
                  type="checkbox"
                  checked={selectedObject.visible}
                  onChange={(event) => updateObject(selectedObject.id, { visible: event.target.checked })}
                />
                Visible
              </label>
              <div className="wb-inline-buttons">
                <button onClick={() => autoColliderFromObject(selectedObject.id)}>Auto Collider from Object</button>
                <button onClick={() => createDoorTriggerFromObject(selectedObject.id)}>Create Door Trigger</button>
              </div>
              <p className="wb-hint">Walkability wird ueber Collider + Blocking gesteuert. Render-Layer steuert nur, was visuell oben liegt.</p>
            </>
          ) : null}

          {selectedCollider && selectedCollider.shape.type === 'rect' ? (
            <>
              <h4>Collider: {selectedCollider.id}</h4>
              <label htmlFor="collider-x">X</label>
              {numberInput('collider-x', selectedCollider.shape.rect.x, (next) => updateColliderRect(selectedCollider.id, { x: next }))}
              <label htmlFor="collider-y">Y</label>
              {numberInput('collider-y', selectedCollider.shape.rect.y, (next) => updateColliderRect(selectedCollider.id, { y: next }))}
              <label htmlFor="collider-width">Width</label>
              {numberInput('collider-width', selectedCollider.shape.rect.width, (next) => updateColliderRect(selectedCollider.id, { width: Math.max(4, next) }), { min: 4 })}
              <label htmlFor="collider-height">Height</label>
              {numberInput('collider-height', selectedCollider.shape.rect.height, (next) => updateColliderRect(selectedCollider.id, { height: Math.max(4, next) }), { min: 4 })}
            </>
          ) : null}

          {selectedTrigger && selectedTrigger.shape.type === 'rect' ? (
            <>
              <h4>Trigger: {selectedTrigger.id}</h4>
              <label htmlFor="trigger-label">Label</label>
              <input
                id="trigger-label"
                name="trigger-label"
                aria-label="trigger-label"
                className="wb-input"
                value={selectedTrigger.label}
                onChange={(event) => {
                  updateWorld({
                    ...world,
                    triggers: world.triggers.map((item) => item.id === selectedTrigger.id ? { ...item, label: event.target.value } : item),
                    meta: { ...world.meta, updatedAt: new Date().toISOString() },
                  })
                }}
              />
              <label htmlFor="trigger-type">Type</label>
              <select
                id="trigger-type"
                name="trigger-type"
                aria-label="trigger-type"
                className="wb-input"
                value={selectedTrigger.type}
                onChange={(event) => {
                  updateWorld({
                    ...world,
                    triggers: world.triggers.map((item) => item.id === selectedTrigger.id ? { ...item, type: event.target.value as AuthoringWorldV1['triggers'][number]['type'] } : item),
                    meta: { ...world.meta, updatedAt: new Date().toISOString() },
                  })
                }}
              >
                <option value="door">door</option>
                <option value="interact">interact</option>
                <option value="proximity">proximity</option>
                <option value="click_zone">click_zone</option>
                <option value="area_enter">area_enter</option>
              </select>
              <label htmlFor="trigger-interaction">Interaction ID</label>
              <input
                id="trigger-interaction"
                name="trigger-interaction"
                aria-label="trigger-interaction"
                className="wb-input"
                value={selectedTrigger.interactionId ?? ''}
                onChange={(event) => {
                  updateWorld({
                    ...world,
                    triggers: world.triggers.map((item) => item.id === selectedTrigger.id ? { ...item, interactionId: event.target.value || undefined } : item),
                    meta: { ...world.meta, updatedAt: new Date().toISOString() },
                  })
                }}
              />
              {!selectedInteraction ? (
                <button onClick={() => createInteractionForTrigger(selectedTrigger.id)}>Create Interaction</button>
              ) : (
                <div className="wb-nested-card">
                  <h5>Interaction: {selectedInteraction.id}</h5>
                  {selectedInteraction.actions.map((action) => (
                    <div key={action.id} className="wb-nested-card">
                      <label htmlFor={`action-label-${action.id}`}>Action Label</label>
                      <input
                        id={`action-label-${action.id}`}
                        className="wb-input"
                        value={action.label}
                        onChange={(event) => {
                          updateInteraction(selectedInteraction.id, (interaction) => ({
                            ...interaction,
                            actions: interaction.actions.map((item) => item.id === action.id ? { ...item, label: event.target.value } : item),
                          }))
                        }}
                      />
                      <label htmlFor={`action-type-${action.id}`}>Type</label>
                      <select
                        id={`action-type-${action.id}`}
                        className="wb-input"
                        value={action.type}
                        onChange={(event) => {
                          const nextType = event.target.value as AuthoringWorldV1['interactions'][number]['actions'][number]['type']
                          updateInteraction(selectedInteraction.id, (interaction) => ({
                            ...interaction,
                            actions: interaction.actions.map((item) => {
                              if (item.id !== action.id) return item
                              if (nextType === 'open_dialogue') {
                                return { id: item.id, label: item.label, type: 'open_dialogue', dialogueId: world.dialogues[0]?.id ?? '' }
                              }
                              if (nextType === 'open_link_confirm') {
                                return { id: item.id, label: item.label, type: 'open_link_confirm', href: 'https://example.com', confirmMessage: 'Diesen Link oeffnen?' }
                              }
                              if (nextType === 'set_flag') {
                                return { id: item.id, label: item.label, type: 'set_flag', flag: 'flag_example', value: true }
                              }
                              if (nextType === 'teleport') {
                                return { id: item.id, label: item.label, type: 'teleport', target: { x: 100, y: 100 } }
                              }
                              if (nextType === 'open_modal') {
                                return { id: item.id, label: item.label, type: 'open_modal', modalKey: 'about' }
                              }
                              return { id: item.id, label: item.label, type: 'show_toast', message: 'Hello' }
                            }),
                          }))
                        }}
                      >
                        <option value="open_dialogue">open_dialogue</option>
                        <option value="open_link_confirm">open_link_confirm</option>
                        <option value="show_toast">show_toast</option>
                        <option value="set_flag">set_flag</option>
                        <option value="teleport">teleport</option>
                        <option value="open_modal">open_modal</option>
                      </select>
                      {action.type === 'open_dialogue' ? (
                        <>
                          <label htmlFor={`action-dialogue-${action.id}`}>Dialogue</label>
                          <select
                            id={`action-dialogue-${action.id}`}
                            className="wb-input"
                            value={action.dialogueId}
                            onChange={(event) => {
                              updateInteraction(selectedInteraction.id, (interaction) => ({
                                ...interaction,
                                actions: interaction.actions.map((item) => item.id === action.id && item.type === 'open_dialogue'
                                  ? { ...item, dialogueId: event.target.value }
                                  : item),
                              }))
                            }}
                          >
                            {world.dialogues.map((dialogue) => (
                              <option key={dialogue.id} value={dialogue.id}>{dialogue.title}</option>
                            ))}
                          </select>
                        </>
                      ) : null}
                      {action.type === 'open_link_confirm' ? (
                        <>
                          <label htmlFor={`action-href-${action.id}`}>Href</label>
                          <input
                            id={`action-href-${action.id}`}
                            className="wb-input"
                            value={action.href}
                            onChange={(event) => {
                              updateInteraction(selectedInteraction.id, (interaction) => ({
                                ...interaction,
                                actions: interaction.actions.map((item) => item.id === action.id && item.type === 'open_link_confirm'
                                  ? { ...item, href: event.target.value }
                                  : item),
                              }))
                            }}
                          />
                          <label htmlFor={`action-confirm-${action.id}`}>Confirm Text</label>
                          <input
                            id={`action-confirm-${action.id}`}
                            className="wb-input"
                            value={action.confirmMessage ?? ''}
                            onChange={(event) => {
                              updateInteraction(selectedInteraction.id, (interaction) => ({
                                ...interaction,
                                actions: interaction.actions.map((item) => item.id === action.id && item.type === 'open_link_confirm'
                                  ? { ...item, confirmMessage: event.target.value }
                                  : item),
                              }))
                            }}
                          />
                        </>
                      ) : null}
                      {action.type === 'show_toast' ? (
                        <>
                          <label htmlFor={`action-message-${action.id}`}>Message</label>
                          <input
                            id={`action-message-${action.id}`}
                            className="wb-input"
                            value={action.message}
                            onChange={(event) => {
                              updateInteraction(selectedInteraction.id, (interaction) => ({
                                ...interaction,
                                actions: interaction.actions.map((item) => item.id === action.id && item.type === 'show_toast'
                                  ? { ...item, message: event.target.value }
                                  : item),
                              }))
                            }}
                          />
                        </>
                      ) : null}
                      {action.type === 'set_flag' ? (
                        <>
                          <label htmlFor={`action-flag-${action.id}`}>Flag</label>
                          <input
                            id={`action-flag-${action.id}`}
                            className="wb-input"
                            value={action.flag}
                            onChange={(event) => {
                              updateInteraction(selectedInteraction.id, (interaction) => ({
                                ...interaction,
                                actions: interaction.actions.map((item) => item.id === action.id && item.type === 'set_flag'
                                  ? { ...item, flag: event.target.value }
                                  : item),
                              }))
                            }}
                          />
                        </>
                      ) : null}
                      {action.type === 'teleport' ? (
                        <>
                          <label htmlFor={`action-target-x-${action.id}`}>Target X</label>
                          {numberInput(`action-target-x-${action.id}`, action.target.x, (next) => {
                            updateInteraction(selectedInteraction.id, (interaction) => ({
                              ...interaction,
                              actions: interaction.actions.map((item) => item.id === action.id && item.type === 'teleport'
                                ? { ...item, target: { ...item.target, x: next } }
                                : item),
                            }))
                          })}
                          <label htmlFor={`action-target-y-${action.id}`}>Target Y</label>
                          {numberInput(`action-target-y-${action.id}`, action.target.y, (next) => {
                            updateInteraction(selectedInteraction.id, (interaction) => ({
                              ...interaction,
                              actions: interaction.actions.map((item) => item.id === action.id && item.type === 'teleport'
                                ? { ...item, target: { ...item.target, y: next } }
                                : item),
                            }))
                          })}
                        </>
                      ) : null}
                      {action.type === 'open_modal' ? (
                        <>
                          <label htmlFor={`action-modal-${action.id}`}>Modal Key</label>
                          <input
                            id={`action-modal-${action.id}`}
                            className="wb-input"
                            value={action.modalKey}
                            onChange={(event) => {
                              updateInteraction(selectedInteraction.id, (interaction) => ({
                                ...interaction,
                                actions: interaction.actions.map((item) => item.id === action.id && item.type === 'open_modal'
                                  ? { ...item, modalKey: event.target.value }
                                  : item),
                              }))
                            }}
                          />
                        </>
                      ) : null}
                      <button
                        onClick={() => {
                          updateInteraction(selectedInteraction.id, (interaction) => ({
                            ...interaction,
                            actions: interaction.actions.filter((item) => item.id !== action.id),
                          }))
                        }}
                      >
                        Remove Action
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      updateInteraction(selectedInteraction.id, (interaction) => ({
                        ...interaction,
                        actions: [
                          ...interaction.actions,
                          {
                            id: `action-${Date.now()}`,
                            label: 'Show Dialogue',
                            type: 'open_dialogue',
                            dialogueId: world.dialogues[0]?.id ?? '',
                          },
                        ],
                      }))
                    }}
                  >
                    Add Action
                  </button>
                </div>
              )}
              <label className="wb-inline-check" htmlFor="trigger-enabled">
                <input
                  id="trigger-enabled"
                  name="trigger-enabled"
                  type="checkbox"
                  checked={selectedTrigger.enabled}
                  onChange={(event) => {
                    updateWorld({
                      ...world,
                      triggers: world.triggers.map((item) => item.id === selectedTrigger.id ? { ...item, enabled: event.target.checked } : item),
                      meta: { ...world.meta, updatedAt: new Date().toISOString() },
                    })
                  }}
                />
                Enabled
              </label>
              <label htmlFor="trigger-x">X</label>
              {numberInput('trigger-x', selectedTrigger.shape.rect.x, (next) => updateTriggerRect(selectedTrigger.id, { x: next }))}
              <label htmlFor="trigger-y">Y</label>
              {numberInput('trigger-y', selectedTrigger.shape.rect.y, (next) => updateTriggerRect(selectedTrigger.id, { y: next }))}
              <label htmlFor="trigger-width">Width</label>
              {numberInput('trigger-width', selectedTrigger.shape.rect.width, (next) => updateTriggerRect(selectedTrigger.id, { width: Math.max(4, next) }), { min: 4 })}
              <label htmlFor="trigger-height">Height</label>
              {numberInput('trigger-height', selectedTrigger.shape.rect.height, (next) => updateTriggerRect(selectedTrigger.id, { height: Math.max(4, next) }), { min: 4 })}
            </>
          ) : null}

          {selectedNpc ? (
            <>
              <h4>NPC: {selectedNpc.id}</h4>
              <label htmlFor="npc-x">X</label>
              {numberInput('npc-x', selectedNpc.x, (next) => updateNpc(selectedNpc.id, { x: next }))}
              <label htmlFor="npc-y">Y</label>
              {numberInput('npc-y', selectedNpc.y, (next) => updateNpc(selectedNpc.id, { y: next }))}
              <label htmlFor="npc-facing">Facing</label>
              <select
                id="npc-facing"
                name="npc-facing"
                aria-label="npc-facing"
                className="wb-input"
                value={selectedNpc.facing}
                onChange={(event) => updateNpc(selectedNpc.id, { facing: event.target.value as AuthoringWorldV1['npcs'][number]['facing'] })}
              >
                <option value="north">north</option>
                <option value="south">south</option>
                <option value="east">east</option>
                <option value="west">west</option>
              </select>
              <label htmlFor="npc-interaction-id">Interaction ID</label>
              <input
                id="npc-interaction-id"
                name="npc-interaction-id"
                aria-label="npc-interaction-id"
                className="wb-input"
                value={selectedNpc.interactionId ?? ''}
                onChange={(event) => updateNpc(selectedNpc.id, { interactionId: event.target.value || undefined })}
              />
            </>
          ) : null}

          {selectedPoi ? (
            <>
              <h4>POI: {selectedPoi.name}</h4>
              <label htmlFor="poi-name">Name</label>
              <input id="poi-name" name="poi-name" aria-label="poi-name" className="wb-input" value={selectedPoi.name} onChange={(event) => updatePoi(selectedPoi.id, { name: event.target.value })} />
              <label htmlFor="poi-dialog-title">Dialog Title</label>
              <input
                id="poi-dialog-title"
                name="poi-dialog-title"
                aria-label="poi-dialog-title"
                className="wb-input"
                value={selectedPoi.dialog.title}
                onChange={(event) => updatePoi(selectedPoi.id, { dialog: { ...selectedPoi.dialog, title: event.target.value } })}
              />
              <label htmlFor="poi-dialog-body">Dialog Body</label>
              <textarea
                id="poi-dialog-body"
                name="poi-dialog-body"
                aria-label="poi-dialog-body"
                className="wb-input"
                value={selectedPoi.dialog.body}
                onChange={(event) => updatePoi(selectedPoi.id, { dialog: { ...selectedPoi.dialog, body: event.target.value } })}
              />
            </>
          ) : null}

          {selection.kind === 'none' ? <p>Waehle links oder auf der Canvas ein Element aus.</p> : null}
        </aside>
      </section>
    </div>
  )
}

export default App
