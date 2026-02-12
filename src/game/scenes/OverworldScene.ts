import Phaser from 'phaser'
import { portfolioGlossary } from '../../content/glossary'
import type { PoiEntry } from '../../content/types'
import { gameEventBus } from '../core/eventBus'
import type { Interactable } from '../entities/interactable'
import {
  consumeMobileInteract,
  getMobileInputState,
  resetMobileInput,
} from '../systems/mobileInputState'
import {
  WORLD_HEIGHT,
  WORLD_ROWS,
  WORLD_TILE_SIZE,
  WORLD_WIDTH,
  PIXELLAB_FRAME_BY_WANG_INDEX,
  ambientNpcSpots,
  benchSpots,
  buildingVisuals,
  fountainSpots,
  lampSpots,
  npcEntries,
  signEntries,
  worldMapDefinition,
} from '../world/worldLayout'

const PLAYER_SPEED = 130

export class OverworldScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Image
  private playerBody!: Phaser.Physics.Arcade.Body
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keys!: {
    W: Phaser.Input.Keyboard.Key
    A: Phaser.Input.Keyboard.Key
    S: Phaser.Input.Keyboard.Key
    D: Phaser.Input.Keyboard.Key
    E: Phaser.Input.Keyboard.Key
    SPACE: Phaser.Input.Keyboard.Key
    ENTER: Phaser.Input.Keyboard.Key
  }

  private interactables: Interactable[] = []
  private uiBlocked = true
  private hoverLabel?: Phaser.GameObjects.Text
  private interactionHint?: Phaser.GameObjects.Text
  private nearestInteractable: Interactable | null = null
  private tileLayer?: Phaser.Tilemaps.TilemapLayer

  private readonly highlightTweens = new Map<string, Phaser.Tweens.Tween>()
  private readonly markerTweens = new Map<string, Phaser.Tweens.Tween>()
  private readonly proximityMarkers = new Map<string, Phaser.GameObjects.Text>()
  private readonly terrainColliders: Phaser.GameObjects.Rectangle[] = []

  constructor() {
    super('OverworldScene')
  }

  preload(): void {
    this.load.spritesheet('pixellabWaterGrass', 'assets/game/pixellab/water_grass_tileset.png', {
      frameWidth: 16,
      frameHeight: 16,
    })
    this.load.spritesheet('pixellabGrassPath', 'assets/game/pixellab/grass_path_tileset.png', {
      frameWidth: 16,
      frameHeight: 16,
    })
    this.load.image('playerSouth', 'assets/game/pixellab/characters/player/south.png')
    this.load.image('playerNorth', 'assets/game/pixellab/characters/player/north.png')
    this.load.image('playerEast', 'assets/game/pixellab/characters/player/east.png')
    this.load.image('playerWest', 'assets/game/pixellab/characters/player/west.png')
    this.load.image('npcSouth', 'assets/game/pixellab/characters/npc/south.png')
    this.load.image('npcNorth', 'assets/game/pixellab/characters/npc/north.png')
    this.load.image('npcEast', 'assets/game/pixellab/characters/npc/east.png')
    this.load.image('npcWest', 'assets/game/pixellab/characters/npc/west.png')
    this.load.image('signTile', 'assets/game/pixellab/decor/sign_tile.png')
    this.load.image('treeTile', 'assets/game/pixellab/decor/tree_tile.png')
  }

  create(): void {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    this.cameras.main.setZoom(2.1)
    this.cameras.main.setRoundPixels(true)

    this.createTileWorld()
    this.createBridgeOverlay()
    this.createGroundDecorations()
    this.createLandmarks()
    this.createBuildingsFromTiles()
    this.createDecorSprites()

    this.createPlayer()
    this.createTerrainColliders()
    this.createInteractables()
    this.setupInput()
    this.setupUiText()
    this.setupEventBridge()

    this.cameras.main.startFollow(this.player, true, 0.16, 0.16)
    this.cameras.main.fadeIn(300, 0, 0, 0)
  }

  update(): void {
    if (this.uiBlocked) {
      this.playerBody.setVelocity(0, 0)
      this.playAnimationByVelocity(0, 0)
      return
    }

    const directional = this.getDirectionalInput()

    this.playerBody.setVelocity(directional.x * PLAYER_SPEED, directional.y * PLAYER_SPEED)

    if (directional.x !== 0 && directional.y !== 0) {
      this.playerBody.velocity.normalize().scale(PLAYER_SPEED)
    }

    this.playAnimationByVelocity(this.playerBody.velocity.x, this.playerBody.velocity.y)

    this.nearestInteractable = this.findNearestInteractable()
    this.renderInteractionHint()
    this.updateProximityHighlights()

    const keyboardInteractPressed =
      Phaser.Input.Keyboard.JustDown(this.keys.E) ||
      Phaser.Input.Keyboard.JustDown(this.keys.SPACE) ||
      Phaser.Input.Keyboard.JustDown(this.keys.ENTER)

    const mobileInteractPressed = consumeMobileInteract()

    if ((keyboardInteractPressed || mobileInteractPressed) && this.nearestInteractable) {
      this.openEntry(this.nearestInteractable.entry)
    }
  }

  private createTileWorld(): void {
    const columns = WORLD_WIDTH / WORLD_TILE_SIZE
    const rows = WORLD_ROWS
    const baseGrassFrame = PIXELLAB_FRAME_BY_WANG_INDEX[0] ?? 0

    const data: number[][] = []

    for (let y = 0; y < rows; y += 1) {
      const row: number[] = []

      for (let x = 0; x < columns; x += 1) {
        row.push(baseGrassFrame)
      }

      data.push(row)
    }

    const map = this.make.tilemap({
      data,
      tileWidth: WORLD_TILE_SIZE,
      tileHeight: WORLD_TILE_SIZE,
    })

    const tileset = map.addTilesetImage('pixellabGrassPath')
    if (!tileset) {
      throw new Error('Failed to create tileset for world map')
    }

    const layer = map.createLayer(0, tileset, 0, 0)
    if (!layer) {
      throw new Error('Failed to create tilemap layer')
    }

    this.tileLayer = layer
    this.tileLayer.setDepth(5)

    this.createPixellabWaterOverlay()
    this.createPixellabPathOverlay()
  }

  private createPixellabWaterOverlay(): void {
    const columns = WORLD_WIDTH / WORLD_TILE_SIZE
    const rows = WORLD_ROWS

    const terrainVertices: number[][] = []

    for (let y = 0; y <= rows; y += 1) {
      const row: number[] = []
      for (let x = 0; x <= columns; x += 1) {
        const water = this.isInsideAreas(x, y, worldMapDefinition.waterAreas)
        row.push(water ? 0 : 1)
      }
      terrainVertices.push(row)
    }

    const overlayData: number[][] = []
    for (let y = 0; y < rows; y += 1) {
      const row: number[] = []
      for (let x = 0; x < columns; x += 1) {
        if (!this.isInsideOrNearAreas(x, y, worldMapDefinition.waterAreas, 1)) {
          row.push(-1)
          continue
        }

        const wangIndex =
          (terrainVertices[y][x] ? 8 : 0) +
          (terrainVertices[y][x + 1] ? 4 : 0) +
          (terrainVertices[y + 1][x] ? 2 : 0) +
          (terrainVertices[y + 1][x + 1] ? 1 : 0)
        row.push(PIXELLAB_FRAME_BY_WANG_INDEX[wangIndex] ?? 0)
      }
      overlayData.push(row)
    }

    const map = this.make.tilemap({
      data: overlayData,
      tileWidth: WORLD_TILE_SIZE,
      tileHeight: WORLD_TILE_SIZE,
    })

    const tileset = map.addTilesetImage('pixellabWaterGrass')
    if (!tileset) {
      return
    }

    const overlayLayer = map.createLayer(0, tileset, 0, 0)
    if (!overlayLayer) {
      return
    }

    overlayLayer.setDepth(7)
    overlayLayer.setAlpha(0.95)
    this.tweens.add({
      targets: overlayLayer,
      alpha: { from: 0.88, to: 0.98 },
      duration: 1400,
      yoyo: true,
      repeat: -1,
    })
  }

  private createPixellabPathOverlay(): void {
    const columns = WORLD_WIDTH / WORLD_TILE_SIZE
    const rows = WORLD_ROWS

    const terrainVertices: number[][] = []

    for (let y = 0; y <= rows; y += 1) {
      const row: number[] = []
      for (let x = 0; x <= columns; x += 1) {
        const path = this.isInsideAreas(x, y, worldMapDefinition.pathAreas)
        row.push(path ? 1 : 0)
      }
      terrainVertices.push(row)
    }

    const overlayData: number[][] = []
    for (let y = 0; y < rows; y += 1) {
      const row: number[] = []
      for (let x = 0; x < columns; x += 1) {
        if (!this.isInsideOrNearAreas(x, y, worldMapDefinition.pathAreas, 1)) {
          row.push(-1)
          continue
        }

        const wangIndex =
          (terrainVertices[y][x] ? 8 : 0) +
          (terrainVertices[y][x + 1] ? 4 : 0) +
          (terrainVertices[y + 1][x] ? 2 : 0) +
          (terrainVertices[y + 1][x + 1] ? 1 : 0)
        row.push(PIXELLAB_FRAME_BY_WANG_INDEX[wangIndex] ?? 0)
      }
      overlayData.push(row)
    }

    const map = this.make.tilemap({
      data: overlayData,
      tileWidth: WORLD_TILE_SIZE,
      tileHeight: WORLD_TILE_SIZE,
    })

    const tileset = map.addTilesetImage('pixellabGrassPath')
    if (!tileset) {
      return
    }

    const overlayLayer = map.createLayer(0, tileset, 0, 0)
    if (!overlayLayer) {
      return
    }

    overlayLayer.setDepth(8)
    overlayLayer.setAlpha(0.98)
  }

  private createBridgeOverlay(): void {
    const bridgeGraphics = this.add.graphics().setDepth(11)

    for (const bridge of worldMapDefinition.bridgeAreas) {
      const px = bridge.x * WORLD_TILE_SIZE
      const py = bridge.y * WORLD_TILE_SIZE
      const pw = bridge.width * WORLD_TILE_SIZE
      const ph = bridge.height * WORLD_TILE_SIZE

      bridgeGraphics.fillStyle(0x896240, 1)
      bridgeGraphics.fillRect(px, py, pw, ph)
      bridgeGraphics.fillStyle(0xaa7e56, 1)
      bridgeGraphics.fillRect(px + 1, py + 1, pw - 2, 4)
      bridgeGraphics.lineStyle(2, 0x4f3622, 1)
      bridgeGraphics.strokeRect(px, py, pw, ph)

      const isHorizontal = pw >= ph
      if (isHorizontal) {
        for (let x = px + 4; x < px + pw - 2; x += 6) {
          bridgeGraphics.lineBetween(x, py + 1, x, py + ph - 1)
        }
      } else {
        for (let y = py + 4; y < py + ph - 2; y += 6) {
          bridgeGraphics.lineBetween(px + 1, y, px + pw - 1, y)
        }
      }
    }
  }

  private createGroundDecorations(): void {
    const hedgeGraphics = this.add.graphics().setDepth(12)
    const flowerGraphics = this.add.graphics().setDepth(13)
    const plazaGraphics = this.add.graphics().setDepth(10)

    for (const area of worldMapDefinition.plazaAreas) {
      const px = area.x * WORLD_TILE_SIZE
      const py = area.y * WORLD_TILE_SIZE
      const pw = area.width * WORLD_TILE_SIZE
      const ph = area.height * WORLD_TILE_SIZE
      plazaGraphics.fillStyle(0xc5b087, 0.9)
      plazaGraphics.fillRect(px, py, pw, ph)
      plazaGraphics.lineStyle(1, 0xa28d6a, 0.75)
      for (let y = py + 8; y < py + ph; y += 8) {
        plazaGraphics.lineBetween(px, y, px + pw, y)
      }
      for (let x = px + 8; x < px + pw; x += 8) {
        plazaGraphics.lineBetween(x, py, x, py + ph)
      }
    }

    for (const area of worldMapDefinition.hedgeAreas) {
      const px = area.x * WORLD_TILE_SIZE
      const py = area.y * WORLD_TILE_SIZE
      const pw = area.width * WORLD_TILE_SIZE
      const ph = area.height * WORLD_TILE_SIZE
      hedgeGraphics.fillStyle(0x2d7e39, 0.95)
      hedgeGraphics.fillRect(px, py, pw, ph)
      hedgeGraphics.fillStyle(0x4bb853, 0.9)
      hedgeGraphics.fillRect(px, py, pw, Math.max(2, Math.floor(ph * 0.35)))
      hedgeGraphics.lineStyle(1, 0x1d5526, 0.8)
      hedgeGraphics.strokeRect(px, py, pw, ph)
    }

    for (const area of worldMapDefinition.flowerAreas) {
      for (let tx = area.x; tx < area.x + area.width; tx += 1) {
        for (let ty = area.y; ty < area.y + area.height; ty += 1) {
          const seed = (tx * 92821 + ty * 68917) % 17
          if (seed > 7) {
            continue
          }
          const px = tx * WORLD_TILE_SIZE + 3 + (seed % 4)
          const py = ty * WORLD_TILE_SIZE + 5 + ((seed * 3) % 4)
          const palette = [0xffd6e7, 0xfff08a, 0xa8e6ff, 0xffa3a3, 0xdcc3ff]
          const color = palette[seed % palette.length]
          flowerGraphics.fillStyle(color, 0.95)
          flowerGraphics.fillRect(px, py, 3, 3)
          flowerGraphics.fillStyle(0x2d8c3f, 0.9)
          flowerGraphics.fillRect(px + 1, py + 3, 1, 2)
        }
      }
    }
  }

  private createLandmarks(): void {
    const landmarkGraphics = this.add.graphics().setDepth(140)

    for (const spot of fountainSpots) {
      const cx = spot.x * WORLD_TILE_SIZE + WORLD_TILE_SIZE / 2
      const cy = spot.y * WORLD_TILE_SIZE + WORLD_TILE_SIZE / 2

      landmarkGraphics.fillStyle(0x6f6d68, 1)
      landmarkGraphics.fillCircle(cx, cy, 16)
      landmarkGraphics.fillStyle(0x4e4b46, 1)
      landmarkGraphics.fillCircle(cx, cy, 12)
      landmarkGraphics.fillStyle(0x74d3ff, 0.9)
      landmarkGraphics.fillCircle(cx, cy, 8)

      const shimmer = this.add.circle(cx, cy, 6, 0xa7e7ff, 0.7).setDepth(141)
      this.tweens.add({
        targets: shimmer,
        alpha: { from: 0.4, to: 0.85 },
        radius: { from: 5, to: 8 },
        duration: 760,
        yoyo: true,
        repeat: -1,
      })
    }

    for (const bench of benchSpots) {
      const bx = bench.x * WORLD_TILE_SIZE
      const by = bench.y * WORLD_TILE_SIZE
      const horizontal = bench.facing === 'north' || bench.facing === 'south'
      const width = horizontal ? 18 : 8
      const height = horizontal ? 8 : 18
      const benchRect = this.add
        .rectangle(bx + WORLD_TILE_SIZE / 2, by + WORLD_TILE_SIZE / 2, width, height, 0x8c6239)
        .setDepth(141)
      benchRect.setStrokeStyle(1, 0x4d3117, 1)
    }

    for (const lamp of lampSpots) {
      const lx = lamp.x * WORLD_TILE_SIZE + WORLD_TILE_SIZE / 2
      const ly = lamp.y * WORLD_TILE_SIZE + WORLD_TILE_SIZE / 2
      const pole = this.add.rectangle(lx, ly + 5, 3, 14, 0x3e3a34).setDepth(141)
      pole.setStrokeStyle(1, 0x22201d, 1)
      const glow = this.add.circle(lx, ly - 3, 4, 0xffde8a, 0.85).setDepth(142)
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.45, to: 0.9 },
        duration: 880,
        yoyo: true,
        repeat: -1,
      })
    }
  }

  private createBuildingsFromTiles(): void {
    for (const building of buildingVisuals) {
      const x = building.baseTileX * WORLD_TILE_SIZE
      const y = building.baseTileY * WORLD_TILE_SIZE
      const width = building.widthTiles * WORLD_TILE_SIZE
      const height = building.heightTiles * WORLD_TILE_SIZE

      const outlineColor = 0x2f2d27
      const roofColor = this.tintColor(building.color, 0.86)
      const roofHighlight = this.tintColor(roofColor, 1.15)
      const roofShadow = this.tintColor(roofColor, 0.72)
      const wallColor = this.tintColor(building.color, 1.22)
      const wallShadow = this.tintColor(wallColor, 0.82)

      const roofHeight = Math.max(22, Math.floor(height * 0.58))
      const wallHeight = Math.max(20, height - roofHeight + 10)
      const wallY = y + roofHeight - 8

      const roofBody = this.add.graphics().setDepth(124)
      roofBody.fillStyle(roofColor, 1)
      roofBody.fillRect(x - 2, y + 6, width + 4, roofHeight - 8)
      roofBody.fillStyle(roofHighlight, 1)
      roofBody.fillRect(x - 2, y + 6, width + 4, 5)
      roofBody.fillStyle(roofShadow, 1)
      roofBody.fillRect(x - 2, y + roofHeight - 8, width + 4, 6)
      roofBody.lineStyle(2, outlineColor, 1)
      roofBody.strokeRect(x - 2, y + 6, width + 4, roofHeight - 8)

      const gable = this.add.graphics().setDepth(125)
      gable.fillStyle(roofColor, 1)
      gable.fillTriangle(x - 2, y + 10, x + width / 2, y - 14, x + width + 2, y + 10)
      gable.lineStyle(2, outlineColor, 1)
      gable.strokeTriangle(x - 2, y + 10, x + width / 2, y - 14, x + width + 2, y + 10)

      const shingles = this.add.graphics().setDepth(126)
      shingles.lineStyle(1, roofShadow, 0.65)
      for (let sy = y + 14; sy < y + roofHeight - 6; sy += 6) {
        shingles.lineBetween(x + 3, sy, x + width - 3, sy)
      }

      const door = this.add
        .rectangle(x + width / 2, wallY + wallHeight - 10, 16, 18, 0x5c3d2a)
        .setDepth(129)
      door.setStrokeStyle(2, outlineColor)

      const wall = this.add.graphics().setDepth(127)
      wall.fillStyle(wallColor, 1)
      wall.fillRect(x + 1, wallY, width - 2, wallHeight)
      wall.fillStyle(wallShadow, 0.9)
      wall.fillRect(x + 1, wallY + wallHeight - 8, width - 2, 8)
      wall.lineStyle(2, outlineColor, 1)
      wall.strokeRect(x + 1, wallY, width - 2, wallHeight)

      const windows = this.add.graphics().setDepth(128)
      const windowY = wallY + Math.max(6, Math.floor(wallHeight * 0.2))
      windows.fillStyle(0x9ad8ff, 1)
      windows.fillRect(x + 10, windowY, 12, 10)
      windows.fillRect(x + width - 22, windowY, 12, 10)
      windows.lineStyle(2, outlineColor, 1)
      windows.strokeRect(x + 10, windowY, 12, 10)
      windows.strokeRect(x + width - 22, windowY, 12, 10)

      if (width > 110) {
        const chimney = this.add.rectangle(x + width - 16, y + 8, 10, 16, 0x8e5a43).setDepth(127)
        chimney.setStrokeStyle(2, outlineColor)
      }
    }
  }

  private createDecorSprites(): void {
    for (const npc of npcEntries) {
      const key = npc.id === 'npc-recruiter-secret' ? 'npcEast' : 'npcSouth'
      const sprite = this.add
        .image(npc.world.x + npc.world.width / 2, npc.world.y + npc.world.height / 2 + 4, key)
        .setDepth(170)
        .setScale(1.35)
      this.tweens.add({
        targets: sprite,
        y: sprite.y - 2,
        duration: 900,
        yoyo: true,
        repeat: -1,
      })
    }

    for (const sign of signEntries) {
      this.add
        .image(sign.world.x + sign.world.width / 2, sign.world.y + sign.world.height / 2 + 3, 'signTile')
        .setDepth(168)
        .setScale(0.62)
    }

    for (const area of worldMapDefinition.treeAreas) {
      const x = area.x * WORLD_TILE_SIZE + (area.width * WORLD_TILE_SIZE) / 2
      const y = area.y * WORLD_TILE_SIZE + (area.height * WORLD_TILE_SIZE) / 2
      this.add.image(x, y, 'treeTile').setDepth(145).setScale(1.2)
    }

    for (const spot of ambientNpcSpots) {
      const keys = ['npcSouth', 'npcEast', 'npcNorth', 'npcWest'] as const
      const key = keys[(spot.x + spot.y) % keys.length]
      const ambientNpc = this.add
        .image(spot.x * WORLD_TILE_SIZE + 8, spot.y * WORLD_TILE_SIZE + 8, key)
        .setDepth(166)
        .setScale(1.15)
        .setAlpha(0.92)
      this.tweens.add({
        targets: ambientNpc,
        y: ambientNpc.y - 2,
        duration: 980,
        yoyo: true,
        repeat: -1,
      })
    }
  }

  private createTerrainColliders(): void {
    const columns = WORLD_WIDTH / WORLD_TILE_SIZE
    const rows = WORLD_ROWS

    const blockedMask: boolean[][] = Array.from({ length: rows }, () => Array.from({ length: columns }, () => false))

    for (const area of worldMapDefinition.waterAreas) {
      for (let y = area.y; y < area.y + area.height; y += 1) {
        for (let x = area.x; x < area.x + area.width; x += 1) {
          if (x >= 0 && x < columns && y >= 0 && y < rows) {
            blockedMask[y][x] = true
          }
        }
      }
    }

    for (const area of worldMapDefinition.bridgeAreas) {
      for (let y = area.y; y < area.y + area.height; y += 1) {
        for (let x = area.x; x < area.x + area.width; x += 1) {
          if (x >= 0 && x < columns && y >= 0 && y < rows) {
            blockedMask[y][x] = false
          }
        }
      }
    }

    for (let y = 0; y < rows; y += 1) {
      let runStart = -1
      for (let x = 0; x <= columns; x += 1) {
        const isBlocked = x < columns ? blockedMask[y][x] : false
        if (isBlocked && runStart === -1) {
          runStart = x
        }
        if (!isBlocked && runStart !== -1) {
          const runWidth = x - runStart
          const collider = this.add
            .rectangle(
              runStart * WORLD_TILE_SIZE + (runWidth * WORLD_TILE_SIZE) / 2,
              y * WORLD_TILE_SIZE + WORLD_TILE_SIZE / 2,
              runWidth * WORLD_TILE_SIZE,
              WORLD_TILE_SIZE,
              0x000000,
              0.001,
            )
            .setDepth(20)
          this.physics.add.existing(collider, true)
          this.physics.add.collider(this.player, collider)
          this.terrainColliders.push(collider)
          runStart = -1
        }
      }
    }
  }

  private setupEventBridge(): void {
    gameEventBus.on('ui:block', ({ blocked }) => {
      this.uiBlocked = blocked
      if (blocked) {
        this.playerBody.setVelocity(0, 0)
      }
    })
  }

  private setupInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys()

    const customKeys = this.input.keyboard!.addKeys('W,A,S,D,E,SPACE,ENTER') as {
      W: Phaser.Input.Keyboard.Key
      A: Phaser.Input.Keyboard.Key
      S: Phaser.Input.Keyboard.Key
      D: Phaser.Input.Keyboard.Key
      E: Phaser.Input.Keyboard.Key
      SPACE: Phaser.Input.Keyboard.Key
      ENTER: Phaser.Input.Keyboard.Key
    }

    this.keys = customKeys
  }

  private setupUiText(): void {
    this.hoverLabel = this.add
      .text(0, 0, '', {
        fontFamily: 'Press Start 2P, Courier New, monospace',
        fontSize: '8px',
        color: '#f8f8f8',
        backgroundColor: '#1a1a1a',
        padding: {
          x: 8,
          y: 5,
        },
      })
      .setDepth(300)
      .setVisible(false)

    this.interactionHint = this.add
      .text(10, this.scale.height - 24, 'Erkunde die Stadt ...', {
        fontFamily: 'Press Start 2P, Courier New, monospace',
        fontSize: '8px',
        color: '#0a1820',
        backgroundColor: '#e6f4de',
        padding: { x: 8, y: 5 },
      })
      .setDepth(300)
      .setScrollFactor(0)
  }

  private renderInteractionHint(): void {
    if (!this.interactionHint) {
      return
    }

    if (!this.nearestInteractable) {
      this.interactionHint.setText('Folge den Wegen, nutze Bruecken ueber Wasser und druecke E / Enter / Space.')
      return
    }

    const entry = this.nearestInteractable.entry
    this.interactionHint.setText(`Interaktion: ${entry.name} (${entry.status})`)
  }

  private getDirectionalInput(): { x: number; y: number } {
    const mobile = getMobileInputState()

    const left = this.cursors.left.isDown || this.keys.A.isDown || mobile.left
    const right = this.cursors.right.isDown || this.keys.D.isDown || mobile.right
    const up = this.cursors.up.isDown || this.keys.W.isDown || mobile.up
    const down = this.cursors.down.isDown || this.keys.S.isDown || mobile.down

    const x = (left ? -1 : 0) + (right ? 1 : 0)
    const y = (up ? -1 : 0) + (down ? 1 : 0)

    return { x, y }
  }

  private createPlayer(): void {
    this.player = this.physics.add.image(500, 372, 'playerSouth').setDepth(200).setScale(1.22)
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body
    this.playerBody.setCollideWorldBounds(true)
    this.playerBody.setSize(12, 13)
    this.playerBody.setOffset(10, 18)
  }

  private playAnimationByVelocity(vx: number, vy: number): void {
    if (Math.abs(vx) < 6 && Math.abs(vy) < 6) {
      this.player.setScale(1.22)
      return
    }

    this.player.setScale(1.2 + Math.sin(this.time.now / 90) * 0.02)

    if (Math.abs(vx) > Math.abs(vy)) {
      this.player.setTexture(vx < 0 ? 'playerWest' : 'playerEast')
      return
    }

    this.player.setTexture(vy < 0 ? 'playerNorth' : 'playerSouth')
  }

  private createInteractables(): void {
    const interactiveObjects = portfolioGlossary

    for (const entry of interactiveObjects) {
      const { x, y, width, height } = entry.world

      const sprite = this.add
        .rectangle(x + width / 2, y + height / 2, width, height, 0xffffff, 0.001)
        .setDepth(199)

      sprite.setInteractive({ useHandCursor: true })

      sprite.on('pointerover', (pointer: Phaser.Input.Pointer) => {
        this.showHoverLabel(pointer, `${entry.name} (${entry.status})`)
      })

      sprite.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        this.showHoverLabel(pointer, `${entry.name} (${entry.status})`)
      })

      sprite.on('pointerout', () => {
        this.hideHoverLabel()
      })

      sprite.on('pointerdown', () => {
        this.openEntry(entry)
      })

      let obstacleBody: Phaser.Physics.Arcade.StaticBody | undefined

      if (entry.world.solid) {
        this.physics.add.existing(sprite, true)
        obstacleBody = sprite.body as Phaser.Physics.Arcade.StaticBody
        this.physics.add.collider(this.player, sprite)
      }

      this.interactables.push({
        entry,
        sprite,
        obstacleBody,
      })

      const markerY = y - 10
      const marker = this.add
        .text(x + width / 2, markerY, '!', {
          fontFamily: 'Press Start 2P, Courier New, monospace',
          fontSize: '10px',
          color: '#ffe56c',
          stroke: '#2f2d27',
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setDepth(260)
        .setVisible(false)
      marker.setData('baseY', markerY)

      this.proximityMarkers.set(entry.id, marker)
    }
  }

  private findNearestInteractable(): Interactable | null {
    const px = this.player.x
    const py = this.player.y

    let best: Interactable | null = null
    let bestDistance = Number.POSITIVE_INFINITY

    for (const item of this.interactables) {
      const dx = item.sprite.x - px
      const dy = item.sprite.y - py
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > item.entry.world.interactRadius) {
        continue
      }

      if (distance < bestDistance) {
        bestDistance = distance
        best = item
      }
    }

    return best
  }

  private updateProximityHighlights(): void {
    const nearbyIds = new Set<string>()

    for (const item of this.interactables) {
      const entry = item.entry
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, item.sprite.x, item.sprite.y)
      if (distance <= entry.world.interactRadius * 0.85) {
        nearbyIds.add(entry.id)
        if (!this.highlightTweens.has(entry.id)) {
          const tween = this.tweens.add({
            targets: item.sprite,
            alpha: { from: 0.9, to: 0.25 },
            duration: 420,
            yoyo: true,
            repeat: -1,
          })
          this.highlightTweens.set(entry.id, tween)
        }

        const marker = this.proximityMarkers.get(entry.id)
        if (marker && !this.markerTweens.has(entry.id)) {
          marker.setVisible(true)
          const baseY = marker.getData('baseY') as number
          const markerTween = this.tweens.add({
            targets: marker,
            y: { from: baseY, to: baseY - 5 },
            alpha: { from: 1, to: 0.5 },
            duration: 420,
            yoyo: true,
            repeat: -1,
          })
          this.markerTweens.set(entry.id, markerTween)
        }
      }
    }

    for (const [id, tween] of this.highlightTweens.entries()) {
      if (!nearbyIds.has(id)) {
        tween.stop()
        const item = this.interactables.find((entry) => entry.entry.id === id)
        if (item) {
          item.sprite.setAlpha(0.001)
        }
        this.highlightTweens.delete(id)
      }
    }

    for (const [id, markerTween] of this.markerTweens.entries()) {
      if (!nearbyIds.has(id)) {
        markerTween.stop()
        const marker = this.proximityMarkers.get(id)
        if (marker) {
          marker.setVisible(false)
          marker.setAlpha(1)
          marker.setY(marker.getData('baseY') as number)
        }
        this.markerTweens.delete(id)
      }
    }
  }

  private openEntry(entry: PoiEntry): void {
    gameEventBus.emit('entry:open', { entry })
  }

  private showHoverLabel(pointer: Phaser.Input.Pointer, text: string): void {
    if (!this.hoverLabel) {
      return
    }

    this.hoverLabel.setText(text)
    this.hoverLabel.setPosition(pointer.worldX + 12, pointer.worldY - 26)
    this.hoverLabel.setVisible(true)
    this.hoverLabel.setDepth(350)

    gameEventBus.emit('entry:hover', { label: text })
  }

  private hideHoverLabel(): void {
    this.hoverLabel?.setVisible(false)
    gameEventBus.emit('entry:hover', { label: null })
  }

  private isInsideAreas(x: number, y: number, areas: { x: number; y: number; width: number; height: number }[]): boolean {
    return areas.some((area) => x >= area.x && x < area.x + area.width && y >= area.y && y < area.y + area.height)
  }

  private isInsideOrNearAreas(
    x: number,
    y: number,
    areas: { x: number; y: number; width: number; height: number }[],
    padding: number,
  ): boolean {
    return areas.some(
      (area) =>
        x >= area.x - padding &&
        x < area.x + area.width + padding &&
        y >= area.y - padding &&
        y < area.y + area.height + padding,
    )
  }

  private tintColor(color: number, multiplier: number): number {
    const r = Math.min(255, Math.floor(((color >> 16) & 0xff) * multiplier))
    const g = Math.min(255, Math.floor(((color >> 8) & 0xff) * multiplier))
    const b = Math.min(255, Math.floor((color & 0xff) * multiplier))
    return (r << 16) | (g << 8) | b
  }
}

export function createOverworldScene(): OverworldScene {
  resetMobileInput()
  return new OverworldScene()
}
