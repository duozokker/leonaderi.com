// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Source: /Users/schayan/Dev/leonaderi.com/world-data/project.world.v1.json

export const MAP_TILE_SIZE = 16
export const MAP_COLUMNS = 24
export const MAP_ROWS = 16
export const MAP_Y_OFFSET = 0
export const MAP_OBJECT_OFFSET_X = 0
export const MAP_OBJECT_OFFSET_Y = 0
export const MAP_WIDTH = 384
export const MAP_HEIGHT = 256

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
export const TERRAIN_GRID: number[][] = [
  [
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1
  ],
  [
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1
  ],
  [
    1,
    1,
    1,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    1,
    1,
    1,
    1
  ],
  [
    1,
    1,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    1,
    1,
    1
  ],
  [
    1,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    3,
    3,
    3,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    1,
    1
  ],
  [
    1,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    3,
    3,
    3,
    3,
    3,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    1,
    1
  ],
  [
    1,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    3,
    3,
    5,
    5,
    3,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    1,
    1
  ],
  [
    1,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    3,
    3,
    5,
    5,
    3,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    1,
    1
  ],
  [
    1,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    3,
    3,
    3,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    1,
    1
  ],
  [
    1,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    1,
    1
  ],
  [
    1,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    1,
    1
  ],
  [
    1,
    1,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    1,
    1,
    1
  ],
  [
    1,
    1,
    1,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    1,
    1,
    1,
    1
  ],
  [
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1
  ],
  [
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1
  ],
  [
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1
  ]
]

export interface TilesetDef {
  key: string
  filename: string
  isUpper: (terrainId: number) => boolean
  depth: number
}

export const TILESET_DEFS: TilesetDef[] = [
  {
    key: 'tsWaterGrass',
    filename: 'water_grass.png',
    isUpper: (t) => t !== T_WATER,
    depth: 5,
  },
  {
    key: 'tsGrassDirt',
    filename: 'grass_dirt.png',
    isUpper: (t) => t === T_DIRT || t === T_BRICK,
    depth: 6,
  },
  {
    key: 'tsDirtBrick',
    filename: 'dirt_brick.png',
    isUpper: (t) => t === T_BRICK,
    depth: 8,
  },
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

export const MAP_OBJECTS: MapObject[] = [
  {
    "key": "objBridge",
    "filename": "bridge.png",
    "x": 190,
    "y": 176,
    "width": 72,
    "height": 40,
    "depth": 110
  },
  {
    "key": "objCompanyHall",
    "filename": "company_hall.png",
    "x": 170,
    "y": 136,
    "width": 95,
    "height": 79,
    "depth": 127,
    "poiId": "company-hq",
    "collision": true
  },
  {
    "key": "objGithub",
    "filename": "github_house.png",
    "x": 128,
    "y": 212,
    "width": 74,
    "height": 71,
    "depth": 127,
    "poiId": "github-house",
    "collision": true
  },
  {
    "key": "objLinkedin",
    "filename": "linkedin_house.png",
    "x": 258,
    "y": 132,
    "width": 72,
    "height": 88,
    "depth": 127,
    "poiId": "linkedin-house",
    "collision": true
  },
  {
    "key": "objSignControls",
    "filename": "sign_board.png",
    "x": 224,
    "y": 188,
    "width": 24,
    "height": 28,
    "depth": 121,
    "poiId": "sign-controls",
    "collision": false
  }
]

export const MAP_OVERLAY = {
  "filename": "overlay_0.png",
  "x": 192,
  "y": 128,
  "width": 384,
  "height": 256,
  "depth": 9
}

export const NPC_POSITIONS = {
  "guide": {
    "x": 198,
    "y": 160
  },
  "recruiter": {
    "x": 144,
    "y": 192
  },
  "villageNpc": {
    "x": 240,
    "y": 208
  },
  "guideNpc2": {
    "x": 290,
    "y": 236
  },
  "playerSpawn": {
    "x": 186,
    "y": 168
  }
}

export const PLAYER_SPAWN = { x: 186, y: 168 }

export function getTerrainAt(col: number, row: number): number {
  if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLUMNS) {
    return T_WATER
  }
  return TERRAIN_GRID[row][col]
}
