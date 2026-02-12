import { portfolioGlossary } from '../../content/glossary'
import type { PoiEntry } from '../../content/types'

export const WORLD_TILE_SIZE = 16
export const WORLD_COLUMNS = 64
export const WORLD_ROWS = 44

export const WORLD_WIDTH = WORLD_COLUMNS * WORLD_TILE_SIZE
export const WORLD_HEIGHT = WORLD_ROWS * WORLD_TILE_SIZE

export interface RectArea {
  x: number
  y: number
  width: number
  height: number
}

export interface WorldMapDefinition {
  baseTile: number
  grassVariantTiles: number[]
  waterTile: number
  roadTile: number
  roadStripeTile: number
  treeTile: number
  signTile: number
  pathAreas: RectArea[]
  bridgeAreas: RectArea[]
  plazaAreas: RectArea[]
  waterAreas: RectArea[]
  treeAreas: RectArea[]
  flowerAreas: RectArea[]
  hedgeAreas: RectArea[]
}

export interface TilePoint {
  x: number
  y: number
}

export interface BenchPoint extends TilePoint {
  facing: 'north' | 'south' | 'east' | 'west'
}

export const worldMapDefinition: WorldMapDefinition = {
  baseTile: 3,
  grassVariantTiles: [2, 3, 4, 34, 35, 36],
  waterTile: 72,
  roadTile: 27,
  roadStripeTile: 28,
  treeTile: 98,
  signTile: 17,
  pathAreas: [
    { x: 8, y: 20, width: 48, height: 4 },
    { x: 28, y: 12, width: 4, height: 20 },
    { x: 12, y: 10, width: 4, height: 14 },
    { x: 46, y: 10, width: 4, height: 16 },
    { x: 17, y: 30, width: 16, height: 3 },
    { x: 36, y: 28, width: 4, height: 12 },
  ],
  bridgeAreas: [
    { x: 29, y: 4, width: 3, height: 4 },
    { x: 49, y: 32, width: 6, height: 2 },
    { x: 48, y: 36, width: 6, height: 2 },
  ],
  plazaAreas: [{ x: 24, y: 16, width: 16, height: 12 }],
  waterAreas: [
    { x: 20, y: 4, width: 20, height: 4 },
    { x: 4, y: 8, width: 10, height: 8 },
    { x: 45, y: 28, width: 14, height: 10 },
  ],
  treeAreas: [
    { x: 2, y: 3, width: 4, height: 4 },
    { x: 8, y: 3, width: 3, height: 3 },
    { x: 56, y: 4, width: 5, height: 4 },
    { x: 52, y: 10, width: 3, height: 3 },
    { x: 4, y: 34, width: 5, height: 4 },
    { x: 10, y: 37, width: 3, height: 3 },
    { x: 57, y: 38, width: 4, height: 3 },
    { x: 38, y: 35, width: 3, height: 2 },
  ],
  flowerAreas: [
    { x: 18, y: 14, width: 5, height: 3 },
    { x: 41, y: 14, width: 4, height: 3 },
    { x: 18, y: 34, width: 8, height: 4 },
    { x: 33, y: 34, width: 6, height: 4 },
    { x: 53, y: 22, width: 5, height: 3 },
  ],
  hedgeAreas: [
    { x: 22, y: 15, width: 20, height: 1 },
    { x: 22, y: 28, width: 20, height: 1 },
    { x: 22, y: 15, width: 1, height: 14 },
    { x: 41, y: 15, width: 1, height: 14 },
    { x: 6, y: 18, width: 10, height: 1 },
    { x: 44, y: 26, width: 14, height: 1 },
  ],
}

export const fountainSpots: TilePoint[] = [{ x: 31, y: 21 }]

export const benchSpots: BenchPoint[] = [
  { x: 27, y: 19, facing: 'north' },
  { x: 35, y: 19, facing: 'north' },
  { x: 27, y: 24, facing: 'south' },
  { x: 35, y: 24, facing: 'south' },
  { x: 44, y: 12, facing: 'east' },
  { x: 15, y: 12, facing: 'west' },
]

export const lampSpots: TilePoint[] = [
  { x: 24, y: 15 },
  { x: 39, y: 15 },
  { x: 24, y: 28 },
  { x: 39, y: 28 },
  { x: 13, y: 21 },
  { x: 48, y: 21 },
]

export const ambientNpcSpots: TilePoint[] = [
  { x: 14, y: 14 },
  { x: 46, y: 15 },
  { x: 21, y: 35 },
  { x: 54, y: 24 },
]

// Mapping from Wang corner index to frame index in the 4x4 PixelLab tilesets.
// Verified from:
// - public/assets/game/pixellab/water_grass_tileset.metadata.json
// - public/assets/game/pixellab/grass_path_tileset.metadata.json
export const PIXELLAB_FRAME_BY_WANG_INDEX: Record<number, number> = {
  0: 6,
  1: 7,
  2: 10,
  3: 9,
  4: 2,
  5: 11,
  6: 4,
  7: 15,
  8: 5,
  9: 14,
  10: 1,
  11: 8,
  12: 3,
  13: 0,
  14: 13,
  15: 12,
}

export interface BuildingVisual {
  id: string
  baseTileX: number
  baseTileY: number
  widthTiles: number
  heightTiles: number
  color: number
}

export const buildingVisuals: BuildingVisual[] = portfolioGlossary
  .filter((entry) => entry.world.visual === 'house')
  .map((entry) => {
    const baseTileX = Math.round(entry.world.x / WORLD_TILE_SIZE)
    const baseTileY = Math.round(entry.world.y / WORLD_TILE_SIZE)
    const widthTiles = Math.max(4, Math.round(entry.world.width / WORLD_TILE_SIZE))
    const heightTiles = Math.max(4, Math.round(entry.world.height / WORLD_TILE_SIZE))

    return {
      id: entry.id,
      baseTileX,
      baseTileY,
      widthTiles,
      heightTiles,
      color: parseInt(entry.accentColor.replace('#', ''), 16),
    }
  })

export const npcEntries: PoiEntry[] = portfolioGlossary.filter((entry) => entry.world.visual === 'npc')
export const signEntries: PoiEntry[] = portfolioGlossary.filter((entry) => entry.world.visual === 'sign')
