import { z } from 'zod'

export const worldVersion = 1 as const

export const PoiStatusSchema = z.enum(['live', 'wip', 'coming_soon', 'ruins'])
export const PoiKindSchema = z.enum([
  'company',
  'external_link',
  'project_showcase',
  'social',
  'npc',
  'sign',
  'coming_soon',
])
export const EntryVisualTypeSchema = z.enum(['house', 'npc', 'sign', 'plaza'])

export const RectSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
})

export const PolygonSchema = z.object({
  points: z.array(z.object({ x: z.number(), y: z.number() })).min(3),
})

export const ColliderSchema = z.object({
  id: z.string().min(1),
  objectId: z.string().optional(),
  shape: z.union([
    z.object({ type: z.literal('rect'), rect: RectSchema }),
    z.object({ type: z.literal('polygon'), polygon: PolygonSchema }),
  ]),
  solid: z.boolean().default(true),
})

export const TriggerTypeSchema = z.enum(['door', 'interact', 'proximity', 'click_zone', 'area_enter'])

export const TriggerSchema = z.object({
  id: z.string().min(1),
  type: TriggerTypeSchema,
  label: z.string().min(1),
  shape: z.union([
    z.object({ type: z.literal('rect'), rect: RectSchema }),
    z.object({ type: z.literal('polygon'), polygon: PolygonSchema }),
  ]),
  objectId: z.string().optional(),
  interactionId: z.string().optional(),
  enabled: z.boolean().default(true),
})

const BaseActionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
})

export const InteractionActionSchema = z.discriminatedUnion('type', [
  BaseActionSchema.extend({
    type: z.literal('open_dialogue'),
    dialogueId: z.string().min(1),
  }),
  BaseActionSchema.extend({
    type: z.literal('open_link_confirm'),
    href: z.string().url(),
    confirmMessage: z.string().optional(),
  }),
  BaseActionSchema.extend({
    type: z.literal('set_flag'),
    flag: z.string().min(1),
    value: z.boolean().default(true),
  }),
  BaseActionSchema.extend({
    type: z.literal('teleport'),
    target: z.object({ x: z.number(), y: z.number() }),
  }),
  BaseActionSchema.extend({
    type: z.literal('show_toast'),
    message: z.string().min(1),
  }),
  BaseActionSchema.extend({
    type: z.literal('open_modal'),
    modalKey: z.string().min(1),
  }),
])

export const InteractionRuleSchema = z.object({
  id: z.string().min(1),
  triggerId: z.string().min(1),
  actions: z.array(InteractionActionSchema).min(1),
})

export const DialogueNodeSchema = z.discriminatedUnion('type', [
  z.object({
    id: z.string().min(1),
    type: z.literal('line'),
    speaker: z.string().default('Narrator'),
    text: z.string().min(1),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal('choice'),
    text: z.string().min(1),
    choices: z.array(z.object({ id: z.string().min(1), label: z.string().min(1), targetNodeId: z.string().min(1) })).min(1),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal('condition'),
    flag: z.string().min(1),
    onTrueNodeId: z.string().min(1),
    onFalseNodeId: z.string().min(1),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal('jump'),
    targetNodeId: z.string().min(1),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal('action'),
    actionId: z.string().min(1),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal('end'),
    text: z.string().optional(),
  }),
])

export const DialogueGraphSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  startNodeId: z.string().min(1),
  nodes: z.array(DialogueNodeSchema).min(1),
})

export const PoiActionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['open_link', 'open_modal', 'coming_soon']),
  href: z.string().url().optional(),
  confirmMessage: z.string().optional(),
})

export const PoiWorldSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  hitbox: RectSchema.optional(),
  interactRadius: z.number().positive(),
  visual: EntryVisualTypeSchema,
  solid: z.boolean(),
})

export const PoiIndexEntrySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: PoiKindSchema,
  status: PoiStatusSchema,
  description: z.string().min(1),
  accentColor: z.string().min(1),
  spriteHint: z.string().min(1),
  dialog: z.object({
    title: z.string().min(1),
    body: z.string().min(1),
  }),
  tags: z.array(z.string().min(1)),
  district: z.string().min(1),
  world: PoiWorldSchema,
  actions: z.array(PoiActionSchema),
  linkedObjectId: z.string().optional(),
  linkedInteractionId: z.string().optional(),
})

export const MapObjectSchema = z.object({
  id: z.string().min(1),
  key: z.string().min(1),
  filename: z.string().min(1),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  depth: z.number(),
  poiId: z.string().optional(),
  collision: z.boolean().optional(),
  renderGroup: z.string().default('default'),
  visible: z.boolean().default(true),
})

export const NpcSchema = z.object({
  id: z.string().min(1),
  spriteKey: z.string().min(1),
  x: z.number(),
  y: z.number(),
  facing: z.enum(['north', 'south', 'east', 'west']).default('south'),
  movement: z.enum(['static', 'path', 'patrol']).default('static'),
  interactionId: z.string().optional(),
})

export const MapTilesetSchema = z.object({
  key: z.string().min(1),
  filename: z.string().min(1),
  upperRule: z.enum(['not_water', 'dirt_or_brick', 'flowers', 'brick']),
  depth: z.number(),
})

export const AuthoringWorldSchema = z.object({
  meta: z.object({
    projectId: z.string().min(1),
    version: z.literal(worldVersion),
    createdAt: z.string().min(1),
    updatedAt: z.string().min(1),
    appVersion: z.string().default('0.1.0'),
  }),
  map: z.object({
    tileSize: z.number().int().positive(),
    columns: z.number().int().positive(),
    rows: z.number().int().positive(),
    yOffset: z.number().int().default(0),
    objectOffset: z.object({ x: z.number(), y: z.number() }).default({ x: 0, y: 0 }),
    terrainGrid: z.array(z.array(z.number().int())).min(1),
    tilesets: z.array(MapTilesetSchema),
    overlay: z.object({
      filename: z.string().min(1),
      x: z.number(),
      y: z.number(),
      width: z.number().positive(),
      height: z.number().positive(),
      depth: z.number(),
    }),
  }),
  assets: z.object({
    objectTextures: z.array(z.string().min(1)).default([]),
    npcSprites: z.array(z.string().min(1)).default([]),
    logos: z.array(z.string().min(1)).default([]),
  }),
  objects: z.array(MapObjectSchema),
  colliders: z.array(ColliderSchema),
  triggers: z.array(TriggerSchema),
  interactions: z.array(InteractionRuleSchema),
  dialogues: z.array(DialogueGraphSchema),
  npcs: z.array(NpcSchema),
  poiIndex: z.array(PoiIndexEntrySchema),
  uiTexts: z.record(z.string(), z.string()).default({}),
})

export type AuthoringWorldV1 = z.infer<typeof AuthoringWorldSchema>
export type InteractionAction = z.infer<typeof InteractionActionSchema>
