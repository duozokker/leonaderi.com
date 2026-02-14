import fs from 'node:fs'
import path from 'node:path'
import {
  AuthoringWorldSchema,
  type AuthoringWorldV1,
  type InteractionAction,
} from '@leonaderi/world-schema'
import { portfolioGlossary } from '../../src/content/glossary'
import {
  MAP_COLUMNS,
  MAP_OBJECT_OFFSET_X,
  MAP_OBJECT_OFFSET_Y,
  MAP_OVERLAY,
  MAP_ROWS,
  MAP_TILE_SIZE,
  MAP_Y_OFFSET,
  NPC_POSITIONS,
  PLAYER_SPAWN,
  TERRAIN_GRID,
  TILESET_DEFS,
  MAP_OBJECTS,
} from '../../src/game/world/mapData'
import { UI_TEXT_DEFAULTS } from '../../src/content/uiTextRegistry'

const ROOT = process.cwd()

function toIso(): string {
  return new Date().toISOString()
}

function slugFromObjectKey(key: string): string {
  return key
    .replace(/^obj/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
}

function ruleFromTilesetKey(key: string): AuthoringWorldV1['map']['tilesets'][number]['upperRule'] {
  switch (key) {
    case 'tsWaterGrass':
      return 'not_water'
    case 'tsGrassDirt':
      return 'dirt_or_brick'
    case 'tsGrassFlowers':
      return 'flowers'
    case 'tsDirtBrick':
      return 'brick'
    default:
      return 'not_water'
  }
}

function toInteractionAction(action: (typeof portfolioGlossary)[number]['actions'][number]): InteractionAction {
  if (action.type === 'open_link') {
    return {
      id: action.id,
      label: action.label,
      type: 'open_link_confirm',
      href: action.href ?? 'https://example.com',
      confirmMessage: action.confirmMessage,
    }
  }

  if (action.type === 'open_modal') {
    return {
      id: action.id,
      label: action.label,
      type: 'open_modal',
      modalKey: action.id,
    }
  }

  return {
    id: action.id,
    label: action.label,
    type: 'show_toast',
    message: `${action.label} ist noch nicht verfuegbar.`,
  }
}

function main() {
  const now = toIso()

  const objectIdByPoiId = new Map<string, string>()
  const objects: AuthoringWorldV1['objects'] = MAP_OBJECTS.map((obj) => {
    const id = `obj-${slugFromObjectKey(obj.key)}`
    if (obj.poiId) {
      objectIdByPoiId.set(obj.poiId, id)
    }
    return {
      id,
      key: obj.key,
      filename: obj.filename,
      x: obj.x,
      y: obj.y,
      width: obj.width,
      height: obj.height,
      depth: obj.depth,
      poiId: obj.poiId,
      collision: obj.collision,
      renderGroup: 'default',
      visible: true,
    }
  })

  const colliders: AuthoringWorldV1['colliders'] = portfolioGlossary
    .filter((entry) => entry.world.solid)
    .map((entry) => {
      const hitbox = entry.world.hitbox ?? {
        x: 0,
        y: 0,
        width: entry.world.width,
        height: entry.world.height,
      }
      return {
        id: `col-${entry.id}`,
        objectId: objectIdByPoiId.get(entry.id),
        shape: {
          type: 'rect' as const,
          rect: {
            x: Number((entry.world.x + hitbox.x).toFixed(2)),
            y: Number((entry.world.y + hitbox.y).toFixed(2)),
            width: hitbox.width,
            height: hitbox.height,
          },
        },
        solid: true,
      }
    })

  const triggers: AuthoringWorldV1['triggers'] = portfolioGlossary.map((entry) => {
    const hitbox = entry.world.hitbox ?? {
      x: 0,
      y: 0,
      width: entry.world.width,
      height: entry.world.height,
    }
    const triggerType = entry.world.visual === 'sign'
      ? 'interact'
      : entry.world.visual === 'house'
        ? 'door'
        : 'proximity'

    return {
      id: `trigger-${entry.id}`,
      type: triggerType,
      label: entry.name,
      shape: {
        type: 'rect' as const,
        rect: {
          x: Number((entry.world.x + hitbox.x).toFixed(2)),
          y: Number((entry.world.y + hitbox.y).toFixed(2)),
          width: hitbox.width,
          height: hitbox.height,
        },
      },
      objectId: objectIdByPoiId.get(entry.id),
      interactionId: `int-${entry.id}`,
      enabled: true,
    }
  })

  const interactions: AuthoringWorldV1['interactions'] = portfolioGlossary.map((entry) => {
    const mappedActions = entry.actions.map((action) => toInteractionAction(action))
    const actions = mappedActions.length > 0
      ? mappedActions
      : [
          {
            id: `action-${entry.id}-coming-soon`,
            label: 'Coming soon',
            type: 'show_toast' as const,
            message: `${entry.name} ist noch nicht belegt.`,
          },
        ]
    return {
      id: `int-${entry.id}`,
      triggerId: `trigger-${entry.id}`,
      actions,
    }
  })

  const dialogues: AuthoringWorldV1['dialogues'] = portfolioGlossary.map((entry) => ({
    id: `dlg-${entry.id}`,
    title: entry.dialog.title,
    startNodeId: `line-${entry.id}`,
    nodes: [
      {
        id: `line-${entry.id}`,
        type: 'line' as const,
        speaker: entry.name,
        text: entry.dialog.body,
      },
      {
        id: `end-${entry.id}`,
        type: 'end' as const,
      },
    ],
  }))

  const npcs: AuthoringWorldV1['npcs'] = [
    {
      id: 'guide',
      spriteKey: 'guide',
      x: NPC_POSITIONS.guide.x,
      y: NPC_POSITIONS.guide.y,
      facing: 'south',
      movement: 'static',
    },
    {
      id: 'recruiter',
      spriteKey: 'recruiter',
      x: NPC_POSITIONS.recruiter.x,
      y: NPC_POSITIONS.recruiter.y,
      facing: 'east',
      movement: 'patrol',
    },
    {
      id: 'villageNpc',
      spriteKey: 'npc',
      x: NPC_POSITIONS.villageNpc.x,
      y: NPC_POSITIONS.villageNpc.y,
      facing: 'south',
      movement: 'static',
    },
    {
      id: 'guideNpc2',
      spriteKey: 'guide',
      x: NPC_POSITIONS.guideNpc2.x,
      y: NPC_POSITIONS.guideNpc2.y,
      facing: 'south',
      movement: 'static',
    },
    {
      id: 'playerSpawn',
      spriteKey: 'player',
      x: PLAYER_SPAWN.x,
      y: PLAYER_SPAWN.y,
      facing: 'south',
      movement: 'static',
    },
  ]

  const nextWorld: AuthoringWorldV1 = {
    meta: {
      projectId: 'leonaderi-world',
      version: 1,
      createdAt: now,
      updatedAt: now,
      appVersion: '0.2.0',
    },
    map: {
      tileSize: MAP_TILE_SIZE,
      columns: MAP_COLUMNS,
      rows: MAP_ROWS,
      yOffset: MAP_Y_OFFSET,
      objectOffset: { x: MAP_OBJECT_OFFSET_X, y: MAP_OBJECT_OFFSET_Y },
      terrainGrid: TERRAIN_GRID,
      tilesets: TILESET_DEFS.map((set) => ({
        key: set.key,
        filename: set.filename,
        upperRule: ruleFromTilesetKey(set.key),
        depth: set.depth,
      })),
      overlay: {
        filename: MAP_OVERLAY.filename,
        x: MAP_OVERLAY.x,
        y: MAP_OVERLAY.y,
        width: MAP_OVERLAY.width,
        height: MAP_OVERLAY.height,
        depth: MAP_OVERLAY.depth,
      },
    },
    assets: {
      objectTextures: Array.from(new Set(MAP_OBJECTS.map((obj) => obj.filename))),
      npcSprites: ['guide', 'recruiter', 'npc', 'player'],
      logos: ['linkedin', 'github', 'twitter', 'youtube'],
    },
    objects,
    colliders,
    triggers,
    interactions,
    dialogues,
    npcs,
    poiIndex: portfolioGlossary.map((entry) => ({
      ...entry,
      linkedObjectId: objectIdByPoiId.get(entry.id),
      linkedInteractionId: `int-${entry.id}`,
    })),
    uiTexts: { ...UI_TEXT_DEFAULTS },
  }

  const parsed = AuthoringWorldSchema.parse(nextWorld)

  const outputPath = path.join(ROOT, 'world-data/project.world.v1.json')
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, `${JSON.stringify(parsed, null, 2)}\n`)
  console.log(`[world:bootstrap] wrote ${outputPath}`)
}

main()
