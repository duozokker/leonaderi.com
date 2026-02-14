import { useEffect, useMemo, useRef, useState } from 'react'
import type Konva from 'konva'
import { Layer, Rect, Stage, Text, Transformer, Group, Circle } from 'react-konva'
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
  }
}

const seedWorld = AuthoringWorldSchema.parse(seedWorldJson)

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

function numberInput(value: number, onChange: (next: number) => void) {
  return (
    <input
      className="wb-input"
      value={value}
      onChange={(event) => {
        const next = Number(event.target.value)
        if (!Number.isFinite(next)) return
        onChange(next)
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

function App() {
  const [world, setWorld] = useState<AuthoringWorldV1>(seedWorld)
  const [selection, setSelection] = useState<Selection>({ kind: 'none', id: '' })
  const [tab, setTab] = useState<Tabs>('canvas')
  const [dialogueId, setDialogueId] = useState<string>(seedWorld.dialogues[0]?.id ?? '')
  const [fileHandle, setFileHandle] = useState<FileHandleLike | null>(null)
  const [jsonBuffer, setJsonBuffer] = useState(() => JSON.stringify(seedWorld, null, 2))
  const [zoom, setZoom] = useState(1)
  const [camera, setCamera] = useState({ x: 20, y: 20 })
  const [panMode, setPanMode] = useState(false)

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

  const selectedRef = useRef<Konva.Node | null>(null)
  const transformerRef = useRef<Konva.Transformer | null>(null)

  const mapWidth = world.map.columns * world.map.tileSize
  const mapHeight = world.map.rows * world.map.tileSize

  const validationIssues = useMemo(() => validateWorld(world), [world])

  const onNodesChange: OnNodesChange = (changes) => setFlowNodes((nds) => applyNodeChanges(changes, nds))
  const onEdgesChange: OnEdgesChange = (changes) => setFlowEdges((eds) => applyEdgeChanges(changes, eds))

  const refreshJsonBuffer = (nextWorld: AuthoringWorldV1) => {
    setJsonBuffer(JSON.stringify(nextWorld, null, 2))
  }

  const updateWorld = (nextWorld: AuthoringWorldV1) => {
    setWorld(nextWorld)
    refreshJsonBuffer(nextWorld)
  }

  const updateObject = (id: string, patch: Partial<AuthoringWorldV1['objects'][number]>) => {
    updateWorld({
      ...world,
      objects: world.objects.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      meta: { ...world.meta, updatedAt: new Date().toISOString() },
    })
  }

  const updateColliderRect = (id: string, patch: Partial<{ x: number; y: number; width: number; height: number }>) => {
    updateWorld({
      ...world,
      colliders: world.colliders.map((item) => {
        if (item.id !== id || item.shape.type !== 'rect') return item
        return {
          ...item,
          shape: {
            ...item.shape,
            rect: {
              ...item.shape.rect,
              ...patch,
            },
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
        return {
          ...item,
          shape: {
            ...item.shape,
            rect: {
              ...item.shape.rect,
              ...patch,
            },
          },
        }
      }),
      meta: { ...world.meta, updatedAt: new Date().toISOString() },
    })
  }

  const updateNpc = (id: string, patch: Partial<AuthoringWorldV1['npcs'][number]>) => {
    updateWorld({
      ...world,
      npcs: world.npcs.map((item) => (item.id === id ? { ...item, ...patch } : item)),
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

  const exportJson = () => {
    const content = `${JSON.stringify(world, null, 2)}\n`
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `project.world.v1.${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importFromFile = async () => {
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
      const parsed = AuthoringWorldSchema.parse(JSON.parse(text))
      setFileHandle(handle)
      updateWorld(parsed)
      return
    }

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const text = await file.text()
      const parsed = AuthoringWorldSchema.parse(JSON.parse(text))
      updateWorld(parsed)
    }
    input.click()
  }

  const saveToFile = async () => {
    const payload = `${JSON.stringify(world, null, 2)}\n`

    if (fileHandle?.createWritable) {
      const writer = await fileHandle.createWritable()
      await writer.write(payload)
      await writer.close()
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
        return
      }
    }

    exportJson()
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
  }

  const applyJsonBuffer = () => {
    const parsed = AuthoringWorldSchema.parse(JSON.parse(jsonBuffer))
    updateWorld(parsed)
  }

  const resetSeed = () => {
    updateWorld(seedWorld)
    setSelection({ kind: 'none', id: '' })
  }

  const showDialogue = (id: string) => {
    setDialogueId(id)
    const target = world.dialogues.find((item) => item.id === id)
    if (!target) return
    const flow = buildDialogueFlow(target)
    setFlowNodes(flow.nodes)
    setFlowEdges(flow.edges)
  }

  const clampZoom = (value: number) => Math.max(0.35, Math.min(2.5, value))

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

  return (
    <div className="wb-root">
      <header className="wb-topbar">
        <div>
          <h1>Worldbuilder Studio V2</h1>
          <p>Lokales Authoring-Tool. Runtime-Dateien werden ueber `npm run world:compile` generiert.</p>
        </div>
        <div className="wb-actions">
          <button onClick={importFromFile}>Open JSON</button>
          <button onClick={saveToFile}>Save JSON</button>
          <button onClick={exportJson}>Export</button>
          <button onClick={addObject}>+ Object</button>
          <button onClick={addCollider}>+ Collider</button>
          <button onClick={addTrigger}>+ Trigger</button>
          <button onClick={addNpc}>+ NPC</button>
          <button onClick={resetSeed}>Reset Seed</button>
        </div>
      </header>

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
          <div className="wb-list">
            <h4>Objects</h4>
            {world.objects.map((item) => (
              <button key={item.id} className={selection.kind === 'object' && selection.id === item.id ? 'sel' : ''} onClick={() => setSelection({ kind: 'object', id: item.id })}>{item.key}</button>
            ))}
            <h4>Colliders</h4>
            {world.colliders.map((item) => (
              <button key={item.id} className={selection.kind === 'collider' && selection.id === item.id ? 'sel' : ''} onClick={() => setSelection({ kind: 'collider', id: item.id })}>{item.id}</button>
            ))}
            <h4>Triggers</h4>
            {world.triggers.map((item) => (
              <button key={item.id} className={selection.kind === 'trigger' && selection.id === item.id ? 'sel' : ''} onClick={() => setSelection({ kind: 'trigger', id: item.id })}>{item.label}</button>
            ))}
            <h4>NPCs</h4>
            {world.npcs.map((item) => (
              <button key={item.id} className={selection.kind === 'npc' && selection.id === item.id ? 'sel' : ''} onClick={() => setSelection({ kind: 'npc', id: item.id })}>{item.id}</button>
            ))}
            <h4>POIs</h4>
            {world.poiIndex.map((item) => (
              <button key={item.id} className={selection.kind === 'poi' && selection.id === item.id ? 'sel' : ''} onClick={() => setSelection({ kind: 'poi', id: item.id })}>{item.name}</button>
            ))}
          </div>
        </aside>

        <main className="wb-main">
          {tab === 'canvas' ? (
            <div className="wb-canvas">
              <div className="wb-canvas-toolbar">
                <label>
                  Zoom
                  <input
                    type="range"
                    min="0.4"
                    max="2.5"
                    step="0.05"
                    value={zoom}
                    onChange={(event) => setZoom(clampZoom(Number(event.target.value)))}
                  />
                </label>
                <button onClick={() => setPanMode((prev) => !prev)}>
                  {panMode ? 'Pan: ON' : 'Pan: OFF'}
                </button>
                <button
                  onClick={() => {
                    setZoom(1)
                    setCamera({ x: 20, y: 20 })
                  }}
                >
                  Reset View
                </button>
              </div>

              <Stage
                width={1000}
                height={640}
                className="wb-stage"
                onWheel={(event) => {
                  event.evt.preventDefault()
                  const direction = event.evt.deltaY > 0 ? -1 : 1
                  const nextZoom = clampZoom(zoom + direction * 0.05)
                  setZoom(nextZoom)
                }}
              >
                <Layer>
                  <Group
                    x={camera.x}
                    y={camera.y}
                    scale={{ x: zoom, y: zoom }}
                    draggable={panMode}
                    onDragEnd={(event) => {
                      setCamera({
                        x: Number(event.target.x().toFixed(2)),
                        y: Number(event.target.y().toFixed(2)),
                      })
                    }}
                  >
                    {world.map.terrainGrid.map((row, y) => row.map((terrain, x) => (
                      <Rect
                        key={`t-${x}-${y}`}
                        x={x * world.map.tileSize}
                        y={y * world.map.tileSize}
                        width={world.map.tileSize}
                        height={world.map.tileSize}
                        fill={terrainColor(terrain)}
                        listening={false}
                      />
                    )))}

                    {world.objects.map((object) => (
                      <Rect
                        key={object.id}
                        ref={selection.kind === 'object' && selection.id === object.id ? selectedRef : undefined}
                        x={object.x - object.width / 2}
                        y={object.y - object.height / 2}
                        width={object.width}
                        height={object.height}
                        fill="rgba(255, 157, 58, 0.15)"
                        stroke={selection.kind === 'object' && selection.id === object.id ? '#ffd250' : '#ff7a59'}
                        strokeWidth={selection.kind === 'object' && selection.id === object.id ? 3 : 2}
                        draggable
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
                    ))}

                    {world.colliders.map((collider) => collider.shape.type === 'rect' ? (
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
                        draggable
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
                    ) : null)}

                    {world.triggers.map((trigger) => trigger.shape.type === 'rect' ? (
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
                        draggable
                        onClick={() => setSelection({ kind: 'trigger', id: trigger.id })}
                        onDragEnd={(event) => {
                          updateTriggerRect(trigger.id, {
                            x: Number(event.target.x().toFixed(2)),
                            y: Number(event.target.y().toFixed(2)),
                          })
                        }}
                      />
                    ) : null)}

                    {world.npcs.map((npc) => (
                      <Circle
                        key={npc.id}
                        x={npc.x}
                        y={npc.y}
                        radius={8}
                        fill={selection.kind === 'npc' && selection.id === npc.id ? '#ffe88f' : '#f4d35e'}
                        stroke="#7d5c00"
                        strokeWidth={2}
                        draggable
                        onClick={() => setSelection({ kind: 'npc', id: npc.id })}
                        onDragEnd={(event) => {
                          updateNpc(npc.id, {
                            x: Number(event.target.x().toFixed(2)),
                            y: Number(event.target.y().toFixed(2)),
                          })
                        }}
                      />
                    ))}

                    <Text x={8} y={8} text="Orange=Object  Cyan=Collider  Pink=Trigger  Yellow=NPC" fontSize={12} fill="#fefefe" />
                  </Group>
                  <Transformer ref={transformerRef} rotateEnabled enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']} />
                </Layer>
              </Stage>
            </div>
          ) : null}

          {tab === 'dialogue' ? (
            <div className="wb-dialogue-tab">
              <div className="wb-dialogue-head">
                <select value={selectedDialogue?.id ?? ''} onChange={(event) => showDialogue(event.target.value)}>
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
                  <label>Title</label>
                  <input
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
              <textarea value={jsonBuffer} onChange={(event) => setJsonBuffer(event.target.value)} />
              <button onClick={applyJsonBuffer}>Apply JSON</button>
            </div>
          ) : null}
        </main>

        <aside className="wb-sidebar right">
          <h3>Inspector</h3>
          {selectedObject ? (
            <>
              <h4>Object: {selectedObject.key}</h4>
              <label>X</label>
              {numberInput(selectedObject.x, (next) => updateObject(selectedObject.id, { x: next }))}
              <label>Y</label>
              {numberInput(selectedObject.y, (next) => updateObject(selectedObject.id, { y: next }))}
              <label>Width</label>
              {numberInput(selectedObject.width, (next) => updateObject(selectedObject.id, { width: Math.max(8, next) }))}
              <label>Height</label>
              {numberInput(selectedObject.height, (next) => updateObject(selectedObject.id, { height: Math.max(8, next) }))}
              <label>Depth</label>
              {numberInput(selectedObject.depth, (next) => updateObject(selectedObject.id, { depth: next }))}
            </>
          ) : null}

          {selectedCollider && selectedCollider.shape.type === 'rect' ? (
            <>
              <h4>Collider: {selectedCollider.id}</h4>
              <label>X</label>
              {numberInput(selectedCollider.shape.rect.x, (next) => updateColliderRect(selectedCollider.id, { x: next }))}
              <label>Y</label>
              {numberInput(selectedCollider.shape.rect.y, (next) => updateColliderRect(selectedCollider.id, { y: next }))}
              <label>Width</label>
              {numberInput(selectedCollider.shape.rect.width, (next) => updateColliderRect(selectedCollider.id, { width: Math.max(4, next) }))}
              <label>Height</label>
              {numberInput(selectedCollider.shape.rect.height, (next) => updateColliderRect(selectedCollider.id, { height: Math.max(4, next) }))}
            </>
          ) : null}

          {selectedTrigger && selectedTrigger.shape.type === 'rect' ? (
            <>
              <h4>Trigger: {selectedTrigger.id}</h4>
              <label>Label</label>
              <input
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
              <label>X</label>
              {numberInput(selectedTrigger.shape.rect.x, (next) => updateTriggerRect(selectedTrigger.id, { x: next }))}
              <label>Y</label>
              {numberInput(selectedTrigger.shape.rect.y, (next) => updateTriggerRect(selectedTrigger.id, { y: next }))}
              <label>Width</label>
              {numberInput(selectedTrigger.shape.rect.width, (next) => updateTriggerRect(selectedTrigger.id, { width: Math.max(4, next) }))}
              <label>Height</label>
              {numberInput(selectedTrigger.shape.rect.height, (next) => updateTriggerRect(selectedTrigger.id, { height: Math.max(4, next) }))}
            </>
          ) : null}

          {selectedNpc ? (
            <>
              <h4>NPC: {selectedNpc.id}</h4>
              <label>X</label>
              {numberInput(selectedNpc.x, (next) => updateNpc(selectedNpc.id, { x: next }))}
              <label>Y</label>
              {numberInput(selectedNpc.y, (next) => updateNpc(selectedNpc.id, { y: next }))}
              <label>Facing</label>
              <select
                className="wb-input"
                value={selectedNpc.facing}
                onChange={(event) => updateNpc(selectedNpc.id, { facing: event.target.value as AuthoringWorldV1['npcs'][number]['facing'] })}
              >
                <option value="north">north</option>
                <option value="south">south</option>
                <option value="east">east</option>
                <option value="west">west</option>
              </select>
            </>
          ) : null}

          {selectedPoi ? (
            <>
              <h4>POI: {selectedPoi.name}</h4>
              <label>Name</label>
              <input className="wb-input" value={selectedPoi.name} onChange={(event) => updatePoi(selectedPoi.id, { name: event.target.value })} />
              <label>Dialog Title</label>
              <input
                className="wb-input"
                value={selectedPoi.dialog.title}
                onChange={(event) => updatePoi(selectedPoi.id, { dialog: { ...selectedPoi.dialog, title: event.target.value } })}
              />
              <label>Dialog Body</label>
              <textarea
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
