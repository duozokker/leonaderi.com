#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()

const OBJECT_OFFSET_X = 16
const OBJECT_OFFSET_Y = 16

const OBJECT_DEPTHS = {
  bridge: 110,
  fountain: 140,
  flowerPatch: 115,
  companyHall: 127,
  linkedin: 127,
  github: 127,
  cvArchive: 127,
  twitterRuin: 127,
  youtubeRuin: 127,
  tree1: 145,
  tree2: 145,
  tree3: 145,
}

const TILESET_EXPORT_MAP = [
  { lower: 1, upper: 2, key: 'tsWaterGrass', filename: 'water_grass.png', isUpper: '(t) => t !== T_WATER', depth: 5 },
  { lower: 2, upper: 3, key: 'tsGrassDirt', filename: 'grass_dirt.png', isUpper: '(t) => t === T_DIRT || t === T_BRICK', depth: 6 },
  { lower: 2, upper: 7, key: 'tsGrassFlowers', filename: 'grass_flowers.png', isUpper: '(t) => t === T_FLOWERS', depth: 7 },
  { lower: 3, upper: 5, key: 'tsDirtBrick', filename: 'dirt_brick.png', isUpper: '(t) => t === T_BRICK', depth: 8 },
]

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true })
}

function copyFileSafe(from, to) {
  ensureDir(path.dirname(to))
  fs.copyFileSync(from, to)
}

function norm(value) {
  return String(value ?? '').toLowerCase().trim()
}

function describeObject(obj) {
  const d = norm(obj.description)
  const n = norm(obj.name)
  return `${d} ${n}`
}

function centerFromBoundingBox(bb, mapYOffsetPx) {
  const x = bb.x + bb.width / 2 + OBJECT_OFFSET_X
  const y = bb.y + bb.height / 2 + mapYOffsetPx + OBJECT_OFFSET_Y
  return {
    x: Number(x.toFixed(2)),
    y: Number(y.toFixed(2)),
  }
}

function pickOne(objects, predicate, label) {
  const matches = objects.filter(predicate)
  if (matches.length !== 1) {
    throw new Error(`Expected exactly one "${label}" object, found ${matches.length}`)
  }
  return matches[0]
}

function pickMany(objects, predicate, label, count) {
  const matches = objects.filter(predicate)
  if (matches.length !== count) {
    throw new Error(`Expected ${count} "${label}" objects, found ${matches.length}`)
  }
  return matches
}

function buildTerrainGrid(terrainMap, mapConfig) {
  const minX = mapConfig.boundingBox.minX
  const minY = mapConfig.boundingBox.minY
  const maxX = mapConfig.boundingBox.maxX
  const maxY = mapConfig.boundingBox.maxY
  const width = maxX - minX + 1
  const height = maxY - minY + 1
  const defaultTerrain = terrainMap.defaultTerrain === 0 ? 1 : terrainMap.defaultTerrain
  const grid = Array.from({ length: height }, () => Array.from({ length: width }, () => defaultTerrain))

  for (const cell of terrainMap.cells) {
    const col = cell.x - minX
    const row = cell.y - minY
    if (row < 0 || row >= height || col < 0 || col >= width) continue
    grid[row][col] = cell.terrainId
  }

  return { grid, width, height, yOffset: -minY }
}

function renderGrid(grid) {
  return grid.map((row) => `  [${row.join(',')}],`).join('\n')
}

function renderTilesetDefs(exportTilesets) {
  const availablePairs = new Set(exportTilesets.map((t) => `${t.lowerTerrainId}-${t.upperTerrainId}`))
  const defs = TILESET_EXPORT_MAP.filter((t) => availablePairs.has(`${t.lower}-${t.upper}`))
  if (defs.length === 0) {
    throw new Error('No known tilesets found in export. Update TILESET_EXPORT_MAP in migrate-map.mjs.')
  }

  return defs.map((def) => [
    '  {',
    `    key: '${def.key}',`,
    `    filename: '${def.filename}',`,
    `    isUpper: ${def.isUpper},`,
    `    depth: ${def.depth},`,
    '  },',
  ].join('\n')).join('\n')
}

function generateMapDataTs({ grid, width, height, yOffset, mapConfig, mapObjects, overlay, npcPositions, playerSpawn, exportDate, tilesetDefs }) {
  return `// Map data generated from PixelLab Map Editor export (${exportDate})
// Grid: ${width} columns x ${height} rows, ${mapConfig.tileSize}px tiles = ${mapConfig.dimensions.pixelWidth}x${mapConfig.dimensions.pixelHeight} pixels
// Original bounding box: x ${mapConfig.boundingBox.minX}-${mapConfig.boundingBox.maxX}, y ${mapConfig.boundingBox.minY} to ${mapConfig.boundingBox.maxY} (offset by +${yOffset} so row 0 = tile y=${mapConfig.boundingBox.minY})

export const MAP_TILE_SIZE = ${mapConfig.tileSize}
export const MAP_COLUMNS = ${width}
export const MAP_ROWS = ${height}
export const MAP_Y_OFFSET = ${yOffset}
export const MAP_OBJECT_OFFSET_X = ${OBJECT_OFFSET_X}
export const MAP_OBJECT_OFFSET_Y = ${OBJECT_OFFSET_Y}
export const MAP_WIDTH = MAP_COLUMNS * MAP_TILE_SIZE
export const MAP_HEIGHT = MAP_ROWS * MAP_TILE_SIZE

// Terrain IDs (from map editor)
export const T_WATER = 1
export const T_GRASS = 2
export const T_DIRT = 3
export const T_COBBLESTONE = 4
export const T_BRICK = 5
export const T_FLOWERS = 7

// Wang corner-index -> frame-index mapping for PixelLab 4x4 tilesets
export const WANG_FRAME: Record<number, number> = {
  0: 6, 1: 7, 2: 10, 3: 9, 4: 2, 5: 11, 6: 4, 7: 15,
  8: 5, 9: 14, 10: 1, 11: 8, 12: 3, 13: 0, 14: 13, 15: 12,
}

// Dense terrain grid [row][col] — row 0 = tile y=${mapConfig.boundingBox.minY}
// prettier-ignore
export const TERRAIN_GRID: number[][] = [
${renderGrid(grid)}
]

export interface TilesetDef {
  key: string
  filename: string
  isUpper: (terrainId: number) => boolean
  depth: number
}

export const TILESET_DEFS: TilesetDef[] = [
${tilesetDefs}
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
${mapObjects}
]

export const MAP_OVERLAY = {
  filename: '${overlay.filename}',
  x: ${overlay.x},
  y: ${overlay.y},
  width: ${overlay.width},
  height: ${overlay.height},
  depth: ${overlay.depth},
}

export const NPC_POSITIONS = {
  guide: { x: ${npcPositions.guide.x}, y: ${npcPositions.guide.y} },
  recruiter: { x: ${npcPositions.recruiter.x}, y: ${npcPositions.recruiter.y} },
  villageNpc: { x: ${npcPositions.villageNpc.x}, y: ${npcPositions.villageNpc.y} },
  guideNpc2: { x: ${npcPositions.guideNpc2.x}, y: ${npcPositions.guideNpc2.y} },
}

export const PLAYER_SPAWN = { x: ${playerSpawn.x}, y: ${playerSpawn.y} }

export function getTerrainAt(col: number, row: number): number {
  if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLUMNS) {
    return T_WATER
  }
  return TERRAIN_GRID[row][col]
}
`
}

function buildMapObjectTsLine(object) {
  const parts = [
    `key: '${object.key}'`,
    `filename: '${object.filename}'`,
    `x: ${object.x}`,
    `y: ${object.y}`,
    `width: ${object.width}`,
    `height: ${object.height}`,
    `depth: ${object.depth}`,
  ]
  if (object.poiId) parts.push(`poiId: '${object.poiId}'`)
  if (object.collision) parts.push('collision: true')
  return `  { ${parts.join(', ')} },`
}

function main() {
  const sourceDir = path.resolve(ROOT, process.argv[2] ?? 'map-v1')
  const mapJsonPath = path.join(sourceDir, 'map.json')
  const terrainMapPath = path.join(sourceDir, 'terrain-map.json')
  const objectManifestPath = path.join(sourceDir, 'objects/manifest.json')
  const overlayPath = path.join(sourceDir, 'overlays/overlay-0.png')

  if (!fs.existsSync(mapJsonPath) || !fs.existsSync(terrainMapPath) || !fs.existsSync(objectManifestPath)) {
    throw new Error(`Invalid export dir: ${sourceDir}`)
  }

  const mapJson = readJson(mapJsonPath)
  const terrainMap = readJson(terrainMapPath)
  const objectManifest = readJson(objectManifestPath)
  const objects = objectManifest.objects

  const terrain = buildTerrainGrid(terrainMap, mapJson.mapConfig)
  const mapYOffsetPx = terrain.yOffset * mapJson.mapConfig.tileSize

  const bridge = pickOne(objects, (o) => describeObject(o).includes('bridge'), 'bridge')
  const fountain = pickOne(objects, (o) => describeObject(o).includes('fountain'), 'fountain')
  const flowerPatch = pickOne(objects, (o) => describeObject(o).includes('flower_patch'), 'flower patch')
  const companyHall = pickOne(objects, (o) => describeObject(o).includes('company_hall'), 'company hall')
  const linkedin = pickOne(objects, (o) => describeObject(o).includes('linkedin'), 'linkedin')
  const github = pickOne(objects, (o) => describeObject(o).includes('github'), 'github')
  const cvArchive = pickOne(objects, (o) => describeObject(o).includes('cv_archive'), 'cv archive')
  const twitterRuin = pickOne(objects, (o) => describeObject(o).includes('twitter_ruin'), 'twitter ruin')
  const youtubeRuin = pickOne(objects, (o) => describeObject(o).includes('youtube_ruin'), 'youtube ruin')

  const trees = pickMany(objects, (o) => norm(o.description) === 'tree', 'tree', 3)
    .sort((a, b) => a.boundingBox.y - b.boundingBox.y)

  const guideNpcs = pickMany(objects, (o) => describeObject(o).includes('guide npc'), 'guide npc', 2)
    .sort((a, b) => a.boundingBox.y - b.boundingBox.y)
  const recruiter = pickOne(objects, (o) => describeObject(o).includes('recruiter npc'), 'recruiter')
  const villageNpc = pickOne(objects, (o) => describeObject(o).includes('village npc'), 'village npc')
  const player = pickOne(objects, (o) => describeObject(o).includes('player hero'), 'player')

  const objectEntries = [
    { src: companyHall, key: 'objCompanyHall', filename: 'company_hall.png', depth: OBJECT_DEPTHS.companyHall, poiId: 'company-hq', collision: true },
    { src: linkedin, key: 'objLinkedin', filename: 'linkedin_house.png', depth: OBJECT_DEPTHS.linkedin, poiId: 'linkedin-house', collision: true },
    { src: github, key: 'objGithub', filename: 'github_house.png', depth: OBJECT_DEPTHS.github, poiId: 'github-house', collision: true },
    { src: cvArchive, key: 'objCvArchive', filename: 'cv_archive.png', depth: OBJECT_DEPTHS.cvArchive, poiId: 'projects-lab', collision: true },
    { src: twitterRuin, key: 'objTwitterRuin', filename: 'twitter_ruin.png', depth: OBJECT_DEPTHS.twitterRuin, poiId: 'twitter-house', collision: true },
    { src: youtubeRuin, key: 'objYoutubeRuin', filename: 'youtube_ruin.png', depth: OBJECT_DEPTHS.youtubeRuin, poiId: 'youtube-house', collision: true },
    { src: bridge, key: 'objBridge', filename: 'bridge.png', depth: OBJECT_DEPTHS.bridge },
    { src: fountain, key: 'objFountain', filename: 'fountain.png', depth: OBJECT_DEPTHS.fountain },
    { src: flowerPatch, key: 'objFlowerPatch', filename: 'flower_patch.png', depth: OBJECT_DEPTHS.flowerPatch },
    { src: trees[2], key: 'objTree1', filename: 'tree.png', depth: OBJECT_DEPTHS.tree1 },
    { src: trees[0], key: 'objTree2', filename: 'tree.png', depth: OBJECT_DEPTHS.tree2 },
    { src: trees[1], key: 'objTree3', filename: 'tree.png', depth: OBJECT_DEPTHS.tree3 },
  ]

  const mapObjects = objectEntries.map(({ src, key, filename, depth, poiId, collision }) => {
    const center = centerFromBoundingBox(src.boundingBox, mapYOffsetPx)
    return buildMapObjectTsLine({
      key,
      filename,
      x: center.x,
      y: center.y,
      width: Math.round(src.boundingBox.width),
      height: Math.round(src.boundingBox.height),
      depth,
      poiId,
      collision,
    })
  }).join('\n')

  const overlayMeta = mapJson.overlays[0]
  const overlay = {
    filename: 'overlay_0.png',
    x: Math.round(overlayMeta.worldCoordinates.x),
    y: Math.round(overlayMeta.worldCoordinates.y + mapYOffsetPx),
    width: Math.round(overlayMeta.dimensions.width),
    height: Math.round(overlayMeta.dimensions.height),
    depth: 9,
  }

  const npcPositions = {
    guide: centerFromBoundingBox(guideNpcs[0].boundingBox, mapYOffsetPx),
    recruiter: centerFromBoundingBox(recruiter.boundingBox, mapYOffsetPx),
    villageNpc: centerFromBoundingBox(villageNpc.boundingBox, mapYOffsetPx),
    guideNpc2: centerFromBoundingBox(guideNpcs[1].boundingBox, mapYOffsetPx),
  }
  const playerSpawn = centerFromBoundingBox(player.boundingBox, mapYOffsetPx)

  const tilesetDefs = renderTilesetDefs(mapJson.tilesets)
  const mapDataTs = generateMapDataTs({
    grid: terrain.grid,
    width: terrain.width,
    height: terrain.height,
    yOffset: terrain.yOffset,
    mapConfig: mapJson.mapConfig,
    mapObjects,
    overlay,
    npcPositions,
    playerSpawn,
    exportDate: mapJson.exportDate,
    tilesetDefs,
  })

  const targetMapDataPath = path.join(ROOT, 'src/game/world/mapData.ts')
  fs.writeFileSync(targetMapDataPath, mapDataTs)

  const targetObjectsDir = path.join(ROOT, 'public/assets/game/map/objects')
  const targetTilesetsDir = path.join(ROOT, 'public/assets/game/map/tilesets')
  const targetOverlaysDir = path.join(ROOT, 'public/assets/game/map/overlays')

  for (const { src, filename } of objectEntries) {
    copyFileSafe(path.join(sourceDir, 'objects', src.filename), path.join(targetObjectsDir, filename))
  }
  copyFileSafe(overlayPath, path.join(targetOverlaysDir, 'overlay_0.png'))

  for (const mapping of TILESET_EXPORT_MAP) {
    const sourceTileset = mapJson.tilesets.find((t) => t.lowerTerrainId === mapping.lower && t.upperTerrainId === mapping.upper)
    if (!sourceTileset) continue
    copyFileSafe(path.join(sourceDir, 'tilesets', sourceTileset.filename), path.join(targetTilesetsDir, mapping.filename))
  }

  console.log(`Map migration complete from: ${sourceDir}`)
  console.log(`Updated: ${path.relative(ROOT, targetMapDataPath)}`)
}

main()
