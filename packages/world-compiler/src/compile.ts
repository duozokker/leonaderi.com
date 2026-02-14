import {
  type AuthoringWorldV1,
  AuthoringWorldSchema,
  type InteractionAction,
  RuntimeWorldSchema,
  type RuntimeWorldV1,
} from '@leonaderi/world-schema'

export interface CompileOptions {
  sourcePath: string
}

export interface CompileWarning {
  code: string
  message: string
}

export interface CompileResult {
  runtime: RuntimeWorldV1
  generated: {
    glossaryTs: string
    mapDataTs: string
    uiTextRegistryTs: string
  }
  warnings: CompileWarning[]
}

const ruleToPredicate = {
  not_water: '(t) => t !== T_WATER',
  dirt_or_brick: '(t) => t === T_DIRT || t === T_BRICK',
  flowers: '(t) => t === T_FLOWERS',
  brick: '(t) => t === T_BRICK',
} as const

function sortById<T extends { id: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.id.localeCompare(b.id))
}

function toRuntimeAction(action: InteractionAction) {
  if (action.type === 'open_link_confirm') {
    return {
      id: action.id,
      label: action.label,
      type: 'open_link' as const,
      href: action.href,
      confirmMessage: action.confirmMessage ?? 'Externer Link. Fortfahren?',
    }
  }

  if (action.type === 'open_dialogue') {
    return {
      id: action.id,
      label: action.label,
      type: 'open_modal' as const,
    }
  }

  if (action.type === 'open_modal') {
    return {
      id: action.id,
      label: action.label,
      type: 'open_modal' as const,
    }
  }

  return {
    id: action.id,
    label: action.label,
    type: 'coming_soon' as const,
  }
}

function renderGlossaryTs(glossary: RuntimeWorldV1['glossary'], sourcePath: string): string {
  const body = JSON.stringify(sortById(glossary), null, 2)
  return `// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Source: ${sourcePath}

import type { PoiEntry } from './types'

export const portfolioGlossary: PoiEntry[] = ${body}

export const portfolioById = new Map(portfolioGlossary.map((entry) => [entry.id, entry]))
`
}

function renderMapDataTs(mapData: RuntimeWorldV1['mapData'], sourcePath: string): string {
  const width = mapData.columns * mapData.tileSize
  const height = mapData.rows * mapData.tileSize
  const mapObjects = JSON.stringify(mapData.objects, null, 2)
  const overlay = JSON.stringify(mapData.overlay, null, 2)

  const npcPositions = JSON.stringify(mapData.npcPositions, null, 2)
  const terrain = JSON.stringify(mapData.terrainGrid, null, 2)
  const tilesets = mapData.tilesets
    .map(
      (set) => `  {
    key: '${set.key}',
    filename: '${set.filename}',
    isUpper: ${ruleToPredicate[set.upperRule]},
    depth: ${set.depth},
  },`,
    )
    .join('\n')

  return `// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Source: ${sourcePath}

export const MAP_TILE_SIZE = ${mapData.tileSize}
export const MAP_COLUMNS = ${mapData.columns}
export const MAP_ROWS = ${mapData.rows}
export const MAP_Y_OFFSET = ${mapData.yOffset}
export const MAP_OBJECT_OFFSET_X = ${mapData.objectOffset.x}
export const MAP_OBJECT_OFFSET_Y = ${mapData.objectOffset.y}
export const MAP_WIDTH = ${width}
export const MAP_HEIGHT = ${height}

export const T_WATER = 1
export const T_GRASS = 2
export const T_DIRT = 3
export const T_COBBLESTONE = 4
export const T_BRICK = 5
export const T_FLOWERS = 7

export const WANG_FRAME: Record<number, number> = {
  0: 6, 1: 7, 2: 10, 3: 9, 4: 2, 5: 11, 6: 4, 7: 15,
  8: 5, 9: 14, 10: 1, 11: 8, 12: 3, 13: 0, 14: 13, 15: 12,
}

// prettier-ignore
export const TERRAIN_GRID: number[][] = ${terrain}

export interface TilesetDef {
  key: string
  filename: string
  isUpper: (terrainId: number) => boolean
  depth: number
}

export const TILESET_DEFS: TilesetDef[] = [
${tilesets}
]

export interface MapObject {
  key: string
  filename: string
  x: number
  y: number
  width: number
  height: number
  depth: number
  poiId?: string
  collision?: boolean
}

export const MAP_OBJECTS: MapObject[] = ${mapObjects}

export const MAP_OVERLAY = ${overlay}

export const NPC_POSITIONS = ${npcPositions}

export const PLAYER_SPAWN = { x: ${mapData.playerSpawn.x}, y: ${mapData.playerSpawn.y} }

export function getTerrainAt(col: number, row: number): number {
  if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLUMNS) {
    return T_WATER
  }
  return TERRAIN_GRID[row][col]
}
`
}

function renderUiTextRegistryTs(overrides: RuntimeWorldV1['uiTexts'], sourcePath: string): string {
  const body = JSON.stringify(overrides, null, 2)
  return `// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Source: ${sourcePath}

export const GENERATED_UI_TEXT_OVERRIDES: Record<string, string> = ${body}
`
}

function buildRuntime(input: AuthoringWorldV1): RuntimeWorldV1 {
  const interactionById = new Map(input.interactions.map((it) => [it.id, it]))

  const glossary = sortById(input.poiIndex).map((poi) => {
    const linked = poi.linkedInteractionId ? interactionById.get(poi.linkedInteractionId) : undefined
    const derivedActions = linked ? linked.actions.map((action) => toRuntimeAction(action)) : []

    return {
      id: poi.id,
      name: poi.name,
      kind: poi.kind,
      status: poi.status,
      description: poi.description,
      accentColor: poi.accentColor,
      spriteHint: poi.spriteHint,
      dialog: poi.dialog,
      tags: poi.tags,
      district: poi.district,
      world: poi.world,
      actions: [...poi.actions, ...derivedActions].reduce((acc, next) => {
        const idx = acc.findIndex((item) => item.id === next.id)
        if (idx === -1) {
          acc.push(next)
        } else {
          acc[idx] = { ...acc[idx], ...next }
        }
        return acc
      }, [] as typeof poi.actions),
    }
  })

  const mapData = {
    tileSize: input.map.tileSize,
    columns: input.map.columns,
    rows: input.map.rows,
    yOffset: input.map.yOffset,
    objectOffset: input.map.objectOffset,
    terrainGrid: input.map.terrainGrid,
    tilesets: input.map.tilesets,
    overlay: input.map.overlay,
    objects: [...input.objects]
      .filter((obj) => obj.visible)
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((obj) => ({
        key: obj.key,
        filename: obj.filename,
        x: obj.x,
        y: obj.y,
        width: obj.width,
        height: obj.height,
        depth: obj.depth,
        poiId: obj.poiId,
        collision: obj.collision,
      })),
    npcPositions: input.npcs.reduce((acc, npc) => {
      acc[npc.id] = { x: npc.x, y: npc.y }
      return acc
    }, {} as Record<string, { x: number; y: number }>),
    playerSpawn: input.npcs.find((npc) => npc.id === 'playerSpawn')
      ? { x: input.npcs.find((npc) => npc.id === 'playerSpawn')!.x, y: input.npcs.find((npc) => npc.id === 'playerSpawn')!.y }
      : { x: 64, y: 64 },
  }

  return RuntimeWorldSchema.parse({
    glossary,
    mapData,
    uiTexts: input.uiTexts,
    interactions: sortById(input.interactions).map((rule) => ({
      id: rule.id,
      triggerId: rule.triggerId,
      actions: rule.actions.map((action) => toRuntimeAction(action)),
    })),
  })
}

export function compileAuthoringToRuntime(rawInput: unknown, options: CompileOptions): CompileResult {
  const warnings: CompileWarning[] = []
  const parsed = AuthoringWorldSchema.parse(rawInput)

  const triggerSet = new Set(parsed.triggers.map((t) => t.id))
  for (const rule of parsed.interactions) {
    if (!triggerSet.has(rule.triggerId)) {
      warnings.push({
        code: 'MISSING_TRIGGER',
        message: `Interaction "${rule.id}" references missing trigger "${rule.triggerId}".`,
      })
    }
  }

  const dialogueSet = new Set(parsed.dialogues.map((d) => d.id))
  for (const rule of parsed.interactions) {
    for (const action of rule.actions) {
      if (action.type === 'open_dialogue' && !dialogueSet.has(action.dialogueId)) {
        warnings.push({
          code: 'MISSING_DIALOGUE',
          message: `Interaction "${rule.id}" references missing dialogue "${action.dialogueId}".`,
        })
      }
    }
  }

  const runtime = buildRuntime(parsed)

  return {
    runtime,
    generated: {
      glossaryTs: renderGlossaryTs(runtime.glossary, options.sourcePath),
      mapDataTs: renderMapDataTs(runtime.mapData, options.sourcePath),
      uiTextRegistryTs: renderUiTextRegistryTs(runtime.uiTexts, options.sourcePath),
    },
    warnings,
  }
}
