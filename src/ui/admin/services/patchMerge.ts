import type { PoiEntry } from '../../../content/types'
import type { UITextOverrides } from '../types'
import {
  type AdminPatchV1,
  type MapObjectKey,
  type NpcKey,
  type ObjectPatch,
  type PoiPatch,
} from '../types'
import { MAP_OBJECTS, NPC_POSITIONS, PLAYER_SPAWN } from '../../../game/world/mapData'

export interface MergedAdminData {
  pois: PoiEntry[]
  mapObjects: Array<(typeof MAP_OBJECTS)[number]>
  npcPositions: Record<NpcKey, { x: number; y: number }>
  globalOffset: { x: number; y: number }
  uiTextOverrides: UITextOverrides
}

function mergePoi(base: PoiEntry, patch: PoiPatch | undefined): PoiEntry {
  if (!patch) return base
  const world = patch.world
  const content = patch.content
  return {
    ...base,
    name: content?.name ?? base.name,
    kind: content?.kind ?? base.kind,
    status: content?.status ?? base.status,
    description: content?.description ?? base.description,
    accentColor: content?.accentColor ?? base.accentColor,
    spriteHint: content?.spriteHint ?? base.spriteHint,
    district: content?.district ?? base.district,
    tags: content?.tags ?? base.tags,
    dialog: {
      title: content?.dialogTitle ?? base.dialog.title,
      body: content?.dialogBody ?? base.dialog.body,
    },
    actions: content?.actions
      ? base.actions.map((action) => {
          const override = content.actions?.find((item) => item.id === action.id)
          if (!override) return action
          return {
            ...action,
            label: override.label ?? action.label,
            href: override.href ?? action.href,
            confirmMessage: override.confirmMessage ?? action.confirmMessage,
          }
        })
      : base.actions,
    world: {
      ...base.world,
      x: world?.x ?? base.world.x,
      y: world?.y ?? base.world.y,
      width: world?.width ?? base.world.width,
      height: world?.height ?? base.world.height,
      hitbox: world?.hitbox ?? base.world.hitbox,
      interactRadius: world?.interactRadius ?? base.world.interactRadius,
      visual: world?.visual ?? base.world.visual,
      solid: world?.solid ?? base.world.solid,
    },
  }
}

function mergeObject(base: (typeof MAP_OBJECTS)[number], patch: ObjectPatch | undefined): (typeof MAP_OBJECTS)[number] {
  if (!patch) return base
  return {
    ...base,
    x: patch.x ?? base.x,
    y: patch.y ?? base.y,
    width: patch.width ?? base.width,
    height: patch.height ?? base.height,
    depth: patch.depth ?? base.depth,
    poiId: patch.poiId ?? base.poiId,
    collision: patch.collision ?? base.collision,
  }
}

export function buildMergedAdminData(basePois: PoiEntry[], patch: AdminPatchV1): MergedAdminData {
  const pois = basePois.map((entry) => mergePoi(entry, patch.pois[entry.id]))
  const mapObjects = MAP_OBJECTS.map((obj) => mergeObject(obj, patch.mapObjects[obj.key as MapObjectKey]))
  const npcPositions: Record<NpcKey, { x: number; y: number }> = {
    guide: {
      x: patch.npcs.guide?.x ?? NPC_POSITIONS.guide.x,
      y: patch.npcs.guide?.y ?? NPC_POSITIONS.guide.y,
    },
    recruiter: {
      x: patch.npcs.recruiter?.x ?? NPC_POSITIONS.recruiter.x,
      y: patch.npcs.recruiter?.y ?? NPC_POSITIONS.recruiter.y,
    },
    villageNpc: {
      x: patch.npcs.villageNpc?.x ?? NPC_POSITIONS.villageNpc.x,
      y: patch.npcs.villageNpc?.y ?? NPC_POSITIONS.villageNpc.y,
    },
    guideNpc2: {
      x: patch.npcs.guideNpc2?.x ?? NPC_POSITIONS.guideNpc2.x,
      y: patch.npcs.guideNpc2?.y ?? NPC_POSITIONS.guideNpc2.y,
    },
    playerSpawn: {
      x: patch.npcs.playerSpawn?.x ?? PLAYER_SPAWN.x,
      y: patch.npcs.playerSpawn?.y ?? PLAYER_SPAWN.y,
    },
  }

  return {
    pois,
    mapObjects,
    npcPositions,
    globalOffset: patch.global.mapOffset ?? { x: 0, y: 0 },
    uiTextOverrides: patch.global.uiTextOverrides ?? {},
  }
}
