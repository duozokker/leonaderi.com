import { z } from 'zod'
import { PoiActionSchema, PoiIndexEntrySchema } from './authoring'

export const RuntimeTilesetSchema = z.object({
  key: z.string(),
  filename: z.string(),
  upperRule: z.enum(['not_water', 'dirt_or_brick', 'flowers', 'brick']),
  depth: z.number(),
})

export const RuntimeMapObjectSchema = z.object({
  key: z.string(),
  filename: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  depth: z.number(),
  poiId: z.string().optional(),
  collision: z.boolean().optional(),
})

export const RuntimeNpcPositionSchema = z.object({ x: z.number(), y: z.number() })

export const RuntimeWorldSchema = z.object({
  glossary: z.array(PoiIndexEntrySchema),
  mapData: z.object({
    tileSize: z.number().int().positive(),
    columns: z.number().int().positive(),
    rows: z.number().int().positive(),
    yOffset: z.number().int(),
    objectOffset: z.object({ x: z.number(), y: z.number() }),
    terrainGrid: z.array(z.array(z.number().int())),
    tilesets: z.array(RuntimeTilesetSchema),
    overlay: z.object({
      filename: z.string(),
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
      depth: z.number(),
    }),
    objects: z.array(RuntimeMapObjectSchema),
    npcPositions: z.record(z.string(), RuntimeNpcPositionSchema),
    playerSpawn: RuntimeNpcPositionSchema,
  }),
  uiTexts: z.record(z.string(), z.string()),
  interactions: z.array(z.object({
    id: z.string(),
    triggerId: z.string(),
    actions: z.array(PoiActionSchema),
  })),
})

export type RuntimeWorldV1 = z.infer<typeof RuntimeWorldSchema>
