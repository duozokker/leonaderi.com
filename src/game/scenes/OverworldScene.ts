import Phaser from 'phaser'
import { portfolioGlossary } from '../../content/glossary'
import { getUIText } from '../../content/uiTextRegistry'
import type { PoiEntry } from '../../content/types'
import { gameEventBus } from '../core/eventBus'
import type { Interactable } from '../entities/interactable'
import {
  consumeMobileInteract,
  getMobileInputState,
  resetMobileInput,
} from '../systems/mobileInputState'
import { loadPatchFromStorage } from '../../ui/admin/services/patchStorage'
import { buildMergedAdminData } from '../../ui/admin/services/patchMerge'
import type { AdminSelection, AdminRuntimeState } from '../../ui/admin/types'
import {
  getTerrainAt,
  MAP_COLUMNS,
  MAP_HEIGHT,
  MAP_OBJECTS,
  MAP_OVERLAY,
  MAP_ROWS,
  MAP_TILE_SIZE,
  MAP_WIDTH,
  NPC_POSITIONS,
  PLAYER_SPAWN,
  T_WATER,
  TILESET_DEFS,
  WANG_FRAME,
} from '../world/mapData'

const PLAYER_SPEED = 120
const HOUSE_HITBOX_X_INSET_RATIO = 0.08
const HOUSE_HITBOX_WIDTH_RATIO = 0.84
const HOUSE_HITBOX_TOP_SHIFT_RATIO = 0.38
const HOUSE_HITBOX_HEIGHT_RATIO = 0.58
const HITBOX_MIN_SIZE = 6
const DEBUG_HITBOX_STORAGE_KEY = 'map-hitbox-overrides'
const DEBUG_OFFSET_STORAGE_KEY = 'map-object-offset'

declare global {
  interface Window {
    render_game_to_text?: () => string
    advanceTime?: (ms: number) => Promise<void>
  }
}

export class OverworldScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
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
  private playerFacing: 'south' | 'north' | 'east' | 'west' = 'south'

  private readonly highlightTweens = new Map<string, Phaser.Tweens.Tween>()
  private readonly markerTweens = new Map<string, Phaser.Tweens.Tween>()
  private readonly proximityMarkers = new Map<string, Phaser.GameObjects.Text>()
  private readonly terrainColliders: Phaser.GameObjects.Rectangle[] = []
  private mergedPois: PoiEntry[] = portfolioGlossary
  private mergedMapObjects = MAP_OBJECTS
  private mergedNpcPositions = {
    ...NPC_POSITIONS,
    playerSpawn: PLAYER_SPAWN,
  }
  private adminRuntime: AdminRuntimeState = {
    open: false,
    mode: 'live',
    selection: { kind: 'none', id: '' },
  }
  private pointerPanActive = false
  private pointerPanLast = { x: 0, y: 0 }
  private adminWheelDeltaY = 0
  private uiTextOverrides: Record<string, string> = {}
  private mapObjectOffset = { x: 0, y: 0 }
  private debugHitboxOverrides: Record<string, { x: number; y: number; width: number; height: number }> = {}
  private debugHitboxGraphics?: Phaser.GameObjects.Graphics
  private debugEditableEntries: PoiEntry[] = []
  private debugSelectedEntryIndex = 0
  private debugOffsetLabel?: Phaser.GameObjects.Text
  private debugOffsetsVisible = false
  private dragPreviewHitboxes: Record<string, { x: number; y: number; width: number; height: number }> = {}
  private hitboxDragState:
    | {
      poiId: string
      mode: 'move' | 'resize-nw' | 'resize-ne' | 'resize-sw' | 'resize-se'
      startPointer: { x: number; y: number }
      startHitbox: { x: number; y: number; width: number; height: number }
    }
    | null = null
  private debugKeys?: {
    F8: Phaser.Input.Keyboard.Key
    Z: Phaser.Input.Keyboard.Key
    X: Phaser.Input.Keyboard.Key
    C: Phaser.Input.Keyboard.Key
    V: Phaser.Input.Keyboard.Key
    B: Phaser.Input.Keyboard.Key
    OPEN_BRACKET: Phaser.Input.Keyboard.Key
    CLOSE_BRACKET: Phaser.Input.Keyboard.Key
    UP: Phaser.Input.Keyboard.Key
    DOWN: Phaser.Input.Keyboard.Key
    LEFT: Phaser.Input.Keyboard.Key
    RIGHT: Phaser.Input.Keyboard.Key
    SHIFT: Phaser.Input.Keyboard.Key
    R: Phaser.Input.Keyboard.Key
    P: Phaser.Input.Keyboard.Key
  }
  private eventBusDisposers: Array<() => void> = []
  private debugFrameCounter = 0

  constructor() {
    super('OverworldScene')
  }

  preload(): void {
    // ─── Player sprites ───
    this.load.image('playerSouth', 'assets/game/pixellab/characters/player/south.png')
    this.load.image('playerNorth', 'assets/game/pixellab/characters/player/north.png')
    this.load.image('playerEast', 'assets/game/pixellab/characters/player/east.png')
    this.load.image('playerWest', 'assets/game/pixellab/characters/player/west.png')
    this.load.spritesheet('walkSouth', 'assets/game/pixellab/characters/player/walk/south.png', { frameWidth: 32, frameHeight: 32 })
    this.load.spritesheet('walkNorth', 'assets/game/pixellab/characters/player/walk/north.png', { frameWidth: 32, frameHeight: 32 })
    this.load.spritesheet('walkEast', 'assets/game/pixellab/characters/player/walk/east.png', { frameWidth: 32, frameHeight: 32 })
    this.load.spritesheet('walkWest', 'assets/game/pixellab/characters/player/walk/west.png', { frameWidth: 32, frameHeight: 32 })

    // ─── NPC sprites ───
    this.load.image('guideSouth', 'assets/game/pixellab/characters/npc/guide/south.png')
    this.load.image('guideNorth', 'assets/game/pixellab/characters/npc/guide/north.png')
    this.load.image('guideEast', 'assets/game/pixellab/characters/npc/guide/east.png')
    this.load.image('guideWest', 'assets/game/pixellab/characters/npc/guide/west.png')
    this.load.spritesheet('guideIdleSouth', 'assets/game/pixellab/characters/npc/guide/idle/south.png', { frameWidth: 32, frameHeight: 32 })
    this.load.spritesheet('guideIdleNorth', 'assets/game/pixellab/characters/npc/guide/idle/north.png', { frameWidth: 32, frameHeight: 32 })
    this.load.spritesheet('guideIdleEast', 'assets/game/pixellab/characters/npc/guide/idle/east.png', { frameWidth: 32, frameHeight: 32 })
    this.load.spritesheet('guideIdleWest', 'assets/game/pixellab/characters/npc/guide/idle/west.png', { frameWidth: 32, frameHeight: 32 })
    this.load.image('recruiterSouth', 'assets/game/pixellab/characters/npc/recruiter/south.png')
    this.load.image('recruiterNorth', 'assets/game/pixellab/characters/npc/recruiter/north.png')
    this.load.image('recruiterEast', 'assets/game/pixellab/characters/npc/recruiter/east.png')
    this.load.image('recruiterWest', 'assets/game/pixellab/characters/npc/recruiter/west.png')
    this.load.image('npcSouth', 'assets/game/pixellab/characters/npc/south.png')
    this.load.image('npcNorth', 'assets/game/pixellab/characters/npc/north.png')
    this.load.image('npcEast', 'assets/game/pixellab/characters/npc/east.png')
    this.load.image('npcWest', 'assets/game/pixellab/characters/npc/west.png')

    // ─── Terrain tilesets (Wang 4x4 spritesheets) ───
    const tileFrame = { frameWidth: 16, frameHeight: 16 }
    for (const ts of TILESET_DEFS) {
      this.load.spritesheet(ts.key, `assets/game/map/tilesets/${ts.filename}`, tileFrame)
    }

    // ─── Map objects (buildings, decor) ───
    const loaded = new Set<string>()
    for (const obj of MAP_OBJECTS) {
      if (!loaded.has(obj.key)) {
        this.load.image(obj.key, `assets/game/map/objects/${obj.filename}`)
        loaded.add(obj.key)
      }
    }

    // ─── Overlay ───
    this.load.image('mapOverlay', `assets/game/map/overlays/${MAP_OVERLAY.filename}`)
  }

  create(): void {
    const loadedPatch = loadPatchFromStorage()
    const merged = buildMergedAdminData(portfolioGlossary, loadedPatch)
    this.mergedPois = merged.pois
    this.mergedMapObjects = merged.mapObjects
    this.mergedNpcPositions = merged.npcPositions
    this.mapObjectOffset = merged.globalOffset
    this.uiTextOverrides = merged.uiTextOverrides
    this.debugHitboxOverrides = this.readHitboxOverridesFromStorage()

    this.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT)
    this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT)
    this.cameras.main.setZoom(1.8)
    this.cameras.main.setRoundPixels(true)

    this.createTerrain()
    this.createMapObjects()
    this.createWalkAnimations()
    this.createNpcSprites()
    this.createPlayer()
    this.createTerrainColliders()
    this.createInteractables()
    this.setupInput()
    this.setupOffsetDebugUi()
    this.setupUiText()
    this.setupEventBridge()
    this.setupDebugHooks()
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.teardownScene, this)
    this.events.once(Phaser.Scenes.Events.DESTROY, this.teardownScene, this)
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _go: unknown, _dx: number, dy: number) => {
      this.adminWheelDeltaY = dy
    })

    this.cameras.main.startFollow(this.player, true, 0.14, 0.14)
    this.cameras.main.fadeIn(400, 0, 0, 0)
  }

  update(): void {
    this.debugFrameCounter += 1
    this.handleOffsetDebugInput()

    if (this.adminRuntime.open && this.adminRuntime.mode === 'full-map') {
      this.handleFullMapCamera()
      return
    }

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

    this.player.setDepth(this.getWorldDepth(this.player.y + 10))
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

  // ─── TERRAIN RENDERING (layered Wang tile overlays) ────────────

  private createTerrain(): void {
    // Base: fill everything with water color
    this.add.rectangle(MAP_WIDTH / 2, MAP_HEIGHT / 2, MAP_WIDTH, MAP_HEIGHT, 0x2563eb).setDepth(1)

    // For each tileset layer, compute Wang indices and place tiles
    for (const tsDef of TILESET_DEFS) {
      this.createWangOverlay(tsDef)
    }

    // Place the hand-painted overlay on top of terrain
    this.add.image(MAP_OVERLAY.x + MAP_OVERLAY.width / 2, MAP_OVERLAY.y + MAP_OVERLAY.height / 2, 'mapOverlay')
      .setDepth(MAP_OVERLAY.depth)

    // Water shimmer animation
    this.createWaterShimmer()
  }

  private createWangOverlay(tsDef: { key: string; isUpper: (t: number) => boolean; depth: number }): void {
    const cols = MAP_COLUMNS
    const rows = MAP_ROWS
    const ts = MAP_TILE_SIZE

    // Build vertex grid: vertex[row][col] = 1 if "upper", 0 if "lower"
    // Vertex at (vx, vy) uses the terrain of cell (vx, vy)
    const vertices: number[][] = []
    for (let vy = 0; vy <= rows; vy++) {
      const row: number[] = []
      for (let vx = 0; vx <= cols; vx++) {
        const terrain = getTerrainAt(vx, vy)
        row.push(tsDef.isUpper(terrain) ? 1 : 0)
      }
      vertices.push(row)
    }

    // Build tile data — only place tiles where at least one corner differs
    const overlayData: number[][] = []
    for (let y = 0; y < rows; y++) {
      const row: number[] = []
      for (let x = 0; x < cols; x++) {
        const tl = vertices[y][x]
        const tr = vertices[y][x + 1]
        const bl = vertices[y + 1][x]
        const br = vertices[y + 1][x + 1]

        // Keep pure-water tiles for the base water layer so open sea is textured too.
        const isPureLower = tl === 0 && tr === 0 && bl === 0 && br === 0
        if (isPureLower && tsDef.key !== 'tsWaterGrass') {
          row.push(-1)
          continue
        }

        const wangIndex = (tl ? 8 : 0) + (tr ? 4 : 0) + (bl ? 2 : 0) + (br ? 1 : 0)
        row.push(WANG_FRAME[wangIndex] ?? 0)
      }
      overlayData.push(row)
    }

    const map = this.make.tilemap({
      data: overlayData,
      tileWidth: ts,
      tileHeight: ts,
    })

    const tileset = map.addTilesetImage(tsDef.key)
    if (!tileset) return

    const layer = map.createLayer(0, tileset, 0, 0)
    if (!layer) return

    layer.setDepth(tsDef.depth)
  }

  private createWaterShimmer(): void {
    // Find water regions and add shimmer effects
    const ts = MAP_TILE_SIZE
    const checked = new Set<string>()

    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLUMNS; col++) {
        if (getTerrainAt(col, row) !== T_WATER) continue
        const key = `${col},${row}`
        if (checked.has(key)) continue
        checked.add(key)

        // Add sparse sparkle dots on water (every ~10 tiles)
        if (((col * 92821 + row * 68917) & 0x7fffffff) % 10 === 0) {
          const sx = col * ts + ts / 2
          const sy = row * ts + ts / 2
          const sparkle = this.add.circle(sx, sy, 1, 0xffffff, 0.5).setDepth(10)
          this.tweens.add({
            targets: sparkle,
            alpha: { from: 0, to: 0.7 },
            duration: 800 + (col % 5) * 200,
            delay: (col + row) * 80,
            yoyo: true,
            repeat: -1,
          })
        }
      }
    }
  }

  // ─── MAP OBJECTS (buildings, decor sprites) ─────────────────────

  private createMapObjects(): void {
    const { x: ox, y: oy } = this.mapObjectOffset

    for (const obj of this.mergedMapObjects) {
      const sx = obj.x + ox
      const sy = obj.y + oy
      const spriteDepth = this.getWorldDepth(sy + obj.height / 2)
      const sprite = this.add.image(sx, sy, obj.key).setDepth(spriteDepth)

      // Add subtle shadow below buildings
      if (obj.collision) {
        this.add.ellipse(
          sx + 2, sy + obj.height / 2 + 3,
          obj.width * 0.8, 12,
          0x2a2824, 0.18,
        ).setDepth(spriteDepth - 1)
      }

      // Nameplate for interactive buildings
      if (obj.poiId) {
        const entry = this.mergedPois.find((e) => e.id === obj.poiId)
        if (entry) {
          const nameTagDepth = Math.max(210, spriteDepth + 1)
          this.add.text(sx, sy - obj.height / 2 + 2, entry.name, {
            fontFamily: 'Press Start 2P, Courier New, monospace',
            fontSize: '5px',
            color: '#4a4438',
            backgroundColor: '#f8f2e4',
            padding: { x: 4, y: 2 },
          }).setOrigin(0.5, 1).setDepth(nameTagDepth).setAlpha(0.9)
        }
      }

      // Fountain shimmer
      if (obj.key === 'objFountain') {
        const shimmer = this.add.circle(sx, sy + 2, 8, 0x90e0ff, 0.25).setDepth(spriteDepth + 1)
        this.tweens.add({
          targets: shimmer,
          alpha: { from: 0.15, to: 0.45 },
          scaleX: { from: 0.9, to: 1.15 },
          duration: 1100,
          yoyo: true,
          repeat: -1,
        })
      }

      // Tree shadow
      if (obj.key.startsWith('objTree')) {
        this.add.ellipse(sx + 2, sy + obj.height / 2 + 4, obj.width * 0.6, 12, 0x2a4430, 0.14)
          .setDepth(spriteDepth - 1)
      }

      // Store sprite for potential use
      sprite.setData('mapObj', obj)
      sprite.setInteractive({ useHandCursor: this.adminRuntime.open })
      sprite.on('pointerdown', () => {
        if (!this.adminRuntime.open) return
        this.emitAdminSelection({ kind: 'mapObject', id: obj.key })
      })
    }
  }

  // ─── NPC SPRITES ───────────────────────────────────────────────

  private createNpcSprites(): void {
    const { x: ox, y: oy } = this.mapObjectOffset
    const npcEntries = this.mergedPois.filter((e) => e.world.visual === 'npc')

    for (const npc of npcEntries) {
      const cx = npc.world.x + ox + npc.world.width / 2
      const cy = npc.world.y + oy + npc.world.height / 2 + 4
      const npcDepth = this.getWorldDepth(cy + 8)

      if (npc.id === 'npc-guide') {
        const guideSprite = this.add.sprite(cx, cy, 'guideIdleSouth').setDepth(npcDepth).setScale(1.3)
        guideSprite.play('guide-idle-south')
        guideSprite.setInteractive({ useHandCursor: this.adminRuntime.open })
        guideSprite.on('pointerdown', () => {
          if (!this.adminRuntime.open) return
          this.emitAdminSelection({ kind: 'npc', id: 'guide' })
        })
      } else if (npc.id === 'npc-recruiter-secret') {
        const sprite = this.add.image(cx, cy, 'recruiterEast').setDepth(npcDepth).setScale(1.3)
        this.tweens.add({
          targets: sprite,
          y: sprite.y - 2,
          duration: 900,
          yoyo: true,
          repeat: -1,
        })
        sprite.setInteractive({ useHandCursor: this.adminRuntime.open })
        sprite.on('pointerdown', () => {
          if (!this.adminRuntime.open) return
          this.emitAdminSelection({ kind: 'npc', id: 'recruiter' })
        })
      } else {
        const sprite = this.add.image(cx, cy, 'npcSouth').setDepth(npcDepth).setScale(1.3)
        this.tweens.add({
          targets: sprite,
          y: sprite.y - 2,
          duration: 900,
          yoyo: true,
          repeat: -1,
        })
        sprite.setInteractive({ useHandCursor: this.adminRuntime.open })
      }
    }

    // Ambient NPCs from map positions
    const ambientSpots = [
      this.mergedNpcPositions.villageNpc,
      this.mergedNpcPositions.guideNpc2,
    ]
    const ambientKeys = ['npcSouth', 'guideSouth']
    for (let i = 0; i < ambientSpots.length; i++) {
      const spot = ambientSpots[i]
      const key = ambientKeys[i % ambientKeys.length]
      const ambientY = spot.y + oy
      const ambientNpc = this.add.image(spot.x + ox, ambientY, key)
        .setDepth(this.getWorldDepth(ambientY + 8))
        .setScale(1.1)
        .setAlpha(0.88)
      this.tweens.add({
        targets: ambientNpc,
        y: ambientNpc.y - 2,
        duration: 1050,
        yoyo: true,
        repeat: -1,
      })
      ambientNpc.setInteractive({ useHandCursor: this.adminRuntime.open })
      ambientNpc.on('pointerdown', () => {
        if (!this.adminRuntime.open) return
        const npcId = i === 0 ? 'villageNpc' : 'guideNpc2'
        this.emitAdminSelection({ kind: 'npc', id: npcId })
      })
    }
  }

  // ─── COLLISION ─────────────────────────────────────────────────

  private createTerrainColliders(): void {
    const cols = MAP_COLUMNS
    const rows = MAP_ROWS
    const ts = MAP_TILE_SIZE

    // Build blocked mask from terrain data (water = blocked)
    const blockedMask: boolean[][] = Array.from({ length: rows }, (_, row) =>
      Array.from({ length: cols }, (_, col) => getTerrainAt(col, row) === T_WATER),
    )

    // Unblock bridge area (the bridge object spans a walkable path over water)
    const bridgeObj = this.mergedMapObjects.find((o) => o.key === 'objBridge')
    if (bridgeObj) {
      const bx = bridgeObj.x + this.mapObjectOffset.x
      const by = bridgeObj.y + this.mapObjectOffset.y
      const bx1 = Math.floor((bx - bridgeObj.width / 2) / ts)
      const by1 = Math.floor((by - bridgeObj.height / 2) / ts)
      const bx2 = Math.ceil((bx + bridgeObj.width / 2) / ts)
      const by2 = Math.ceil((by + bridgeObj.height / 2) / ts)
      for (let row = by1; row < by2; row++) {
        for (let col = bx1; col < bx2; col++) {
          if (row >= 0 && row < rows && col >= 0 && col < cols) {
            blockedMask[row][col] = false
          }
        }
      }
    }

    // Create RLE collision rectangles
    for (let row = 0; row < rows; row++) {
      let runStart = -1
      for (let col = 0; col <= cols; col++) {
        const isBlocked = col < cols ? blockedMask[row][col] : false
        if (isBlocked && runStart === -1) {
          runStart = col
        }
        if (!isBlocked && runStart !== -1) {
          const runWidth = col - runStart
          const collider = this.add
            .rectangle(
              runStart * ts + (runWidth * ts) / 2,
              row * ts + ts / 2,
              runWidth * ts,
              ts,
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

  // ─── PLAYER ────────────────────────────────────────────────────

  private createPlayer(): void {
    this.player = this.physics.add
      .sprite(this.mergedNpcPositions.playerSpawn.x + this.mapObjectOffset.x, this.mergedNpcPositions.playerSpawn.y + this.mapObjectOffset.y, 'playerSouth')
      .setDepth(this.getWorldDepth(this.mergedNpcPositions.playerSpawn.y + this.mapObjectOffset.y + 10))
      .setScale(1.2)
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body
    this.playerBody.setCollideWorldBounds(true)
    this.playerBody.setSize(12, 13)
    this.playerBody.setOffset(10, 18)
  }

  private createWalkAnimations(): void {
    const directions = ['south', 'north', 'east', 'west'] as const
    const walkSheetKeys = { south: 'walkSouth', north: 'walkNorth', east: 'walkEast', west: 'walkWest' }
    const guideIdleKeys = { south: 'guideIdleSouth', north: 'guideIdleNorth', east: 'guideIdleEast', west: 'guideIdleWest' }

    for (const dir of directions) {
      this.anims.create({
        key: `walk-${dir}`,
        frames: this.anims.generateFrameNumbers(walkSheetKeys[dir], { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1,
      })
      this.anims.create({
        key: `guide-idle-${dir}`,
        frames: this.anims.generateFrameNumbers(guideIdleKeys[dir], { start: 0, end: 3 }),
        frameRate: 4,
        repeat: -1,
      })
    }
  }

  private playAnimationByVelocity(vx: number, vy: number): void {
    const isMoving = Math.abs(vx) > 6 || Math.abs(vy) > 6

    if (!isMoving) {
      this.player.stop()
      const staticKey = `player${this.playerFacing.charAt(0).toUpperCase()}${this.playerFacing.slice(1)}`
      this.player.setTexture(staticKey)
      this.player.setScale(1.2)
      return
    }

    let newFacing: 'south' | 'north' | 'east' | 'west'
    if (Math.abs(vx) > Math.abs(vy)) {
      newFacing = vx < 0 ? 'west' : 'east'
    } else {
      newFacing = vy < 0 ? 'north' : 'south'
    }

    const animKey = `walk-${newFacing}`
    if (this.playerFacing !== newFacing || this.player.anims.currentAnim?.key !== animKey) {
      this.player.play(animKey, true)
    }
    this.playerFacing = newFacing
    this.player.setScale(1.2)
  }

  // ─── INPUT ─────────────────────────────────────────────────────

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

  private getDirectionalInput(): { x: number; y: number } {
    if (this.adminRuntime.open) {
      return { x: 0, y: 0 }
    }

    const mobile = getMobileInputState()

    const left = this.cursors.left.isDown || this.keys.A.isDown || mobile.left
    const right = this.cursors.right.isDown || this.keys.D.isDown || mobile.right
    const up = this.cursors.up.isDown || this.keys.W.isDown || mobile.up
    const down = this.cursors.down.isDown || this.keys.S.isDown || mobile.down

    const x = (left ? -1 : 0) + (right ? 1 : 0)
    const y = (up ? -1 : 0) + (down ? 1 : 0)

    return { x, y }
  }

  // ─── UI TEXT ───────────────────────────────────────────────────

  private setupUiText(): void {
    this.hoverLabel = this.add
      .text(0, 0, '', {
        fontFamily: 'Press Start 2P, Courier New, monospace',
        fontSize: '8px',
        color: '#f8f8f8',
        backgroundColor: '#1a1a1a',
        padding: { x: 8, y: 5 },
      })
      .setDepth(300)
      .setVisible(false)

    this.interactionHint = this.add
      .text(10, this.scale.height - 24, getUIText('scene.hint.default', this.uiTextOverrides), {
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
    if (!this.interactionHint) return

    if (!this.nearestInteractable) {
      this.interactionHint.setText(getUIText('scene.hint.default', this.uiTextOverrides))
      return
    }

    const entry = this.nearestInteractable.entry
    this.interactionHint.setText(`${getUIText('scene.hint.prefix', this.uiTextOverrides)} ${entry.name} (${entry.status})`)
  }

  // ─── EVENT BRIDGE ──────────────────────────────────────────────

  private setupEventBridge(): void {
    this.eventBusDisposers.push(gameEventBus.on('ui:block', ({ blocked }) => {
      this.uiBlocked = blocked
      if (blocked) {
        this.playerBody.setVelocity(0, 0)
      }
    }))

    this.eventBusDisposers.push(gameEventBus.on('admin:state-changed', (payload) => {
      this.adminRuntime = {
        ...this.adminRuntime,
        ...payload,
      }

      this.debugOffsetsVisible = payload.open
      this.refreshOffsetDebugLabel()
      this.drawDebugHitboxes()

      if (!payload.open) {
        this.pointerPanActive = false
        this.hitboxDragState = null
        this.dragPreviewHitboxes = {}
        this.cameras.main.startFollow(this.player, true, 0.14, 0.14)
        this.cameras.main.setZoom(1.8)
        return
      }

      if (payload.mode === 'full-map') {
        this.cameras.main.stopFollow()
      } else {
        this.cameras.main.startFollow(this.player, true, 0.14, 0.14)
        this.cameras.main.setZoom(1.8)
      }
    }))

    this.eventBusDisposers.push(gameEventBus.on('admin:selection:changed', ({ selection }) => {
      this.adminRuntime = {
        ...this.adminRuntime,
        selection,
      }
      this.refreshOffsetDebugLabel()
      this.drawDebugHitboxes()
    }))

    this.eventBusDisposers.push(gameEventBus.on('admin:patch-updated', ({ patch }) => {
      const nextMerged = buildMergedAdminData(portfolioGlossary, patch)
      const requiresRebuild = this.requiresSceneRebuild(nextMerged)

      this.mergedPois = nextMerged.pois
      this.uiTextOverrides = nextMerged.uiTextOverrides

      if (requiresRebuild) {
        this.hitboxDragState = null
        this.dragPreviewHitboxes = {}
        this.scene.restart()
        return
      }

      this.syncInteractablesFromMergedPois()
      this.refreshOffsetDebugLabel()
      this.drawDebugHitboxes()
    }))

    this.eventBusDisposers.push(gameEventBus.on('admin:camera:fit-map', () => {
      this.fitCameraToMap()
    }))
  }

  private teardownScene(): void {
    for (const dispose of this.eventBusDisposers) {
      dispose()
    }
    this.eventBusDisposers = []
    if (typeof window !== 'undefined') {
      delete window.render_game_to_text
      delete window.advanceTime
    }
  }

  private setupDebugHooks(): void {
    if (typeof window === 'undefined') return

    window.render_game_to_text = () => JSON.stringify({
      scene: 'OverworldScene',
      frameCounter: this.debugFrameCounter,
      uiBlocked: this.uiBlocked,
      adminOpen: this.adminRuntime.open,
      adminMode: this.adminRuntime.mode,
      player: {
        x: Number(this.player.x.toFixed(2)),
        y: Number(this.player.y.toFixed(2)),
        facing: this.playerFacing,
        velocityX: Number(this.playerBody.velocity.x.toFixed(2)),
        velocityY: Number(this.playerBody.velocity.y.toFixed(2)),
      },
      camera: {
        x: Number(this.cameras.main.scrollX.toFixed(2)),
        y: Number(this.cameras.main.scrollY.toFixed(2)),
        zoom: Number(this.cameras.main.zoom.toFixed(2)),
      },
      nearestInteractable: this.nearestInteractable?.entry.id ?? null,
      activeInteractables: this.interactables.length,
      map: {
        width: MAP_WIDTH,
        height: MAP_HEIGHT,
        tileSize: MAP_TILE_SIZE,
      },
      coordinateSystem: 'origin: top-left, +x right, +y down',
    })

    window.advanceTime = async (ms: number) => {
      this.debugFrameCounter += Math.max(1, Math.round(ms / (1000 / 60)))
      await Promise.resolve()
    }
  }

  // ─── INTERACTABLES ─────────────────────────────────────────────

  private createInteractables(): void {
    const { x: ox, y: oy } = this.mapObjectOffset
    for (const entry of this.mergedPois) {
      const { x, y } = entry.world
      const worldX = x + ox
      const worldY = y + oy
      const hitbox = this.resolveEntryHitbox(entry, worldX, worldY)

      const sprite = this.add
        .rectangle(hitbox.x + hitbox.width / 2, hitbox.y + hitbox.height / 2, hitbox.width, hitbox.height, 0xffffff, 0.001)
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
        if (this.adminRuntime.open) {
          this.emitAdminSelection({ kind: 'poi', id: entry.id })
          return
        }
        this.openEntry(entry)
      })

      let obstacleBody: Phaser.Physics.Arcade.StaticBody | undefined

      if (entry.world.solid) {
        this.physics.add.existing(sprite, true)
        obstacleBody = sprite.body as Phaser.Physics.Arcade.StaticBody
        this.physics.add.collider(this.player, sprite)
      }

      this.interactables.push({ entry, sprite, obstacleBody })

      // Proximity marker
      const markerY = hitbox.y - 10
      const marker = this.add
        .text(hitbox.x + hitbox.width / 2, markerY, '!', {
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

  private resolveEntryHitbox(
    entry: PoiEntry,
    worldX: number,
    worldY: number,
  ): { x: number; y: number; width: number; height: number } {
    const hb = this.getEditableHitboxRelative(entry)
    return {
      x: worldX + hb.x,
      y: worldY + hb.y,
      width: hb.width,
      height: hb.height,
    }
  }

  private saveMapOffsetToStorage(): void {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(DEBUG_OFFSET_STORAGE_KEY, JSON.stringify(this.mapObjectOffset))
  }

  private readHitboxOverridesFromStorage(): Record<string, { x: number; y: number; width: number; height: number }> {
    if (typeof window === 'undefined') return {}

    try {
      const raw = window.localStorage.getItem(DEBUG_HITBOX_STORAGE_KEY)
      if (!raw) return {}
      const parsed = JSON.parse(raw) as Record<string, { x: number; y: number; width: number; height: number }>
      return parsed ?? {}
    } catch {
      return {}
    }
  }

  private setupOffsetDebugUi(): void {
    this.debugEditableEntries = this.interactables
      .map((item) => item.entry)
      .filter((entry) => entry.world.solid)

    this.debugKeys = this.input.keyboard!.addKeys('F8,Z,X,C,V,B,OPEN_BRACKET,CLOSE_BRACKET,UP,DOWN,LEFT,RIGHT,SHIFT,R,P') as {
      F8: Phaser.Input.Keyboard.Key
      Z: Phaser.Input.Keyboard.Key
      X: Phaser.Input.Keyboard.Key
      C: Phaser.Input.Keyboard.Key
      V: Phaser.Input.Keyboard.Key
      B: Phaser.Input.Keyboard.Key
      OPEN_BRACKET: Phaser.Input.Keyboard.Key
      CLOSE_BRACKET: Phaser.Input.Keyboard.Key
      UP: Phaser.Input.Keyboard.Key
      DOWN: Phaser.Input.Keyboard.Key
      LEFT: Phaser.Input.Keyboard.Key
      RIGHT: Phaser.Input.Keyboard.Key
      SHIFT: Phaser.Input.Keyboard.Key
      R: Phaser.Input.Keyboard.Key
      P: Phaser.Input.Keyboard.Key
    }

    this.debugOffsetLabel = this.add.text(8, 8, '', {
      fontFamily: 'Press Start 2P, Courier New, monospace',
      fontSize: '8px',
      color: '#f5f5f5',
      backgroundColor: '#111111',
      padding: { x: 6, y: 5 },
    })
      .setScrollFactor(0)
      .setDepth(400)
      .setVisible(false)

    this.debugHitboxGraphics = this.add.graphics().setDepth(399)

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.debugOffsetsVisible || this.adminRuntime.mode !== 'live') return

      if (this.tryBeginHitboxDrag(pointer)) {
        return
      }

      const px = pointer.worldX
      const py = pointer.worldY
      const clicked = this.interactables.find((item) => {
        const b = item.sprite.getBounds()
        return Phaser.Geom.Rectangle.Contains(b, px, py)
      })
      if (!clicked) return
      const idx = this.debugEditableEntries.findIndex((entry) => entry.id === clicked.entry.id)
      if (idx === -1) return
      this.debugSelectedEntryIndex = idx
      this.emitAdminSelection({ kind: 'poi', id: clicked.entry.id })
      this.refreshOffsetDebugLabel()
      this.drawDebugHitboxes()
    })

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.handleHitboxDrag(pointer)
    })

    this.input.on('pointerup', () => {
      this.commitHitboxDrag()
    })
  }

  private handleOffsetDebugInput(): void {
    if (!this.debugKeys) return

    if (!this.debugOffsetsVisible || this.adminRuntime.mode !== 'live') return

    let changed = false
    const step = 0.5
    if (Phaser.Input.Keyboard.JustDown(this.debugKeys.Z)) {
      this.mapObjectOffset.x = Number((this.mapObjectOffset.x - step).toFixed(2))
      changed = true
    }
    if (Phaser.Input.Keyboard.JustDown(this.debugKeys.X)) {
      this.mapObjectOffset.x = Number((this.mapObjectOffset.x + step).toFixed(2))
      changed = true
    }
    if (Phaser.Input.Keyboard.JustDown(this.debugKeys.C)) {
      this.mapObjectOffset.y = Number((this.mapObjectOffset.y - step).toFixed(2))
      changed = true
    }
    if (Phaser.Input.Keyboard.JustDown(this.debugKeys.V)) {
      this.mapObjectOffset.y = Number((this.mapObjectOffset.y + step).toFixed(2))
      changed = true
    }
    if (Phaser.Input.Keyboard.JustDown(this.debugKeys.B)) {
      this.mapObjectOffset = { x: 0, y: 0 }
      changed = true
    }

    if (Phaser.Input.Keyboard.JustDown(this.debugKeys.OPEN_BRACKET)) {
      this.cycleDebugSelection(-1)
    }
    if (Phaser.Input.Keyboard.JustDown(this.debugKeys.CLOSE_BRACKET)) {
      this.cycleDebugSelection(1)
    }

    const selected = this.getSelectedDebugEntry()
    if (selected) {
      const isShift = this.debugKeys.SHIFT.isDown
      const hb = this.getEditableHitboxRelative(selected)
      let hitboxChanged = false

      if (Phaser.Input.Keyboard.JustDown(this.debugKeys.LEFT)) {
        if (isShift) {
          hb.width = Math.max(4, hb.width - step)
        } else {
          hb.x -= step
        }
        hitboxChanged = true
      }
      if (Phaser.Input.Keyboard.JustDown(this.debugKeys.RIGHT)) {
        if (isShift) {
          hb.width += step
        } else {
          hb.x += step
        }
        hitboxChanged = true
      }
      if (Phaser.Input.Keyboard.JustDown(this.debugKeys.UP)) {
        if (isShift) {
          hb.height = Math.max(4, hb.height - step)
        } else {
          hb.y -= step
        }
        hitboxChanged = true
      }
      if (Phaser.Input.Keyboard.JustDown(this.debugKeys.DOWN)) {
        if (isShift) {
          hb.height += step
        } else {
          hb.y += step
        }
        hitboxChanged = true
      }

      if (Phaser.Input.Keyboard.JustDown(this.debugKeys.R)) {
        const resetHitbox = this.getDefaultHitboxRelative(selected)
        this.dragPreviewHitboxes[selected.id] = resetHitbox
        this.applyEntryHitboxToInteractable(selected)
        gameEventBus.emit('admin:poi-world:update', {
          id: selected.id,
          world: { hitbox: resetHitbox },
        })
        this.refreshOffsetDebugLabel()
        this.drawDebugHitboxes()
      } else if (hitboxChanged) {
        const nextHitbox = {
          x: Number(hb.x.toFixed(2)),
          y: Number(hb.y.toFixed(2)),
          width: Number(hb.width.toFixed(2)),
          height: Number(hb.height.toFixed(2)),
        }
        this.dragPreviewHitboxes[selected.id] = nextHitbox
        this.applyEntryHitboxToInteractable(selected)
        gameEventBus.emit('admin:poi-world:update', {
          id: selected.id,
          world: { hitbox: nextHitbox },
        })
        this.refreshOffsetDebugLabel()
        this.drawDebugHitboxes()
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.debugKeys.P)) {
      void this.copyDebugHitboxesToClipboard()
    }

    this.refreshOffsetDebugLabel()

    if (changed) {
      this.saveMapOffsetToStorage()
      this.scene.restart()
    }
  }

  private tryBeginHitboxDrag(pointer: Phaser.Input.Pointer): boolean {
    const selected = this.getSelectedDebugEntry()
    if (!selected || selected.world.visual !== 'house' || !selected.world.solid) return false

    const worldHitbox = this.resolveEntryHitbox(
      selected,
      selected.world.x + this.mapObjectOffset.x,
      selected.world.y + this.mapObjectOffset.y,
    )
    const handle = this.getHitboxHandleUnderPointer(pointer.worldX, pointer.worldY, worldHitbox)
    const inside =
      pointer.worldX >= worldHitbox.x &&
      pointer.worldX <= worldHitbox.x + worldHitbox.width &&
      pointer.worldY >= worldHitbox.y &&
      pointer.worldY <= worldHitbox.y + worldHitbox.height

    if (!handle && !inside) return false

    this.hitboxDragState = {
      poiId: selected.id,
      mode: handle ?? 'move',
      startPointer: { x: pointer.worldX, y: pointer.worldY },
      startHitbox: this.getEditableHitboxRelative(selected),
    }
    return true
  }

  private handleHitboxDrag(pointer: Phaser.Input.Pointer): void {
    if (!this.hitboxDragState || !pointer.isDown) return
    if (!this.debugOffsetsVisible || this.adminRuntime.mode !== 'live') return

    const entry = this.mergedPois.find((poi) => poi.id === this.hitboxDragState?.poiId)
    if (!entry) return

    const dx = pointer.worldX - this.hitboxDragState.startPointer.x
    const dy = pointer.worldY - this.hitboxDragState.startPointer.y
    const next = { ...this.hitboxDragState.startHitbox }

    switch (this.hitboxDragState.mode) {
      case 'move':
        next.x += dx
        next.y += dy
        break
      case 'resize-nw':
        next.x += dx
        next.y += dy
        next.width -= dx
        next.height -= dy
        break
      case 'resize-ne':
        next.y += dy
        next.width += dx
        next.height -= dy
        break
      case 'resize-sw':
        next.x += dx
        next.width -= dx
        next.height += dy
        break
      case 'resize-se':
        next.width += dx
        next.height += dy
        break
    }

    if (next.width < HITBOX_MIN_SIZE) {
      if (this.hitboxDragState.mode === 'resize-nw' || this.hitboxDragState.mode === 'resize-sw') {
        next.x -= HITBOX_MIN_SIZE - next.width
      }
      next.width = HITBOX_MIN_SIZE
    }

    if (next.height < HITBOX_MIN_SIZE) {
      if (this.hitboxDragState.mode === 'resize-nw' || this.hitboxDragState.mode === 'resize-ne') {
        next.y -= HITBOX_MIN_SIZE - next.height
      }
      next.height = HITBOX_MIN_SIZE
    }

    const rounded = {
      x: Number(next.x.toFixed(2)),
      y: Number(next.y.toFixed(2)),
      width: Number(next.width.toFixed(2)),
      height: Number(next.height.toFixed(2)),
    }
    this.dragPreviewHitboxes[entry.id] = rounded
    this.applyEntryHitboxToInteractable(entry)
    this.refreshOffsetDebugLabel()
    this.drawDebugHitboxes()
  }

  private commitHitboxDrag(): void {
    if (!this.hitboxDragState) return

    const poiId = this.hitboxDragState.poiId
    const preview = this.dragPreviewHitboxes[poiId]
    this.hitboxDragState = null
    if (!preview) return

    gameEventBus.emit('admin:poi-world:update', {
      id: poiId,
      world: { hitbox: preview },
    })
  }

  private refreshOffsetDebugLabel(): void {
    if (!this.debugOffsetLabel) return
    this.debugOffsetLabel.setVisible(this.debugOffsetsVisible)
    if (!this.debugOffsetsVisible) return

    const selected = this.getSelectedDebugEntry()
    const hb = selected ? this.getEditableHitboxRelative(selected) : null
    const selectedLine = selected && hb
      ? `${selected.name}: x=${hb.x.toFixed(1)} y=${hb.y.toFixed(1)} w=${hb.width.toFixed(1)} h=${hb.height.toFixed(1)}`
      : 'Kein Haus selektiert'

    this.debugOffsetLabel.setText([
      'Debug Legende',
      'Outline: Orange=Objekt, Blau/Tuerkis=Hitbox',
      `Global Offset: x=${this.mapObjectOffset.x.toFixed(2)} y=${this.mapObjectOffset.y.toFixed(2)}`,
      'Live-Update aktiv',
      selectedLine,
      'Z/X = Offset X -/+',
      'C/V = Offset Y -/+',
      'B = Offset reset',
      'Maus: Ecke ziehen = Hitbox resize, innen ziehen = move',
      '[/] = Objekt wechseln',
      'Mausklick auf Hitbox = Objekt selektieren',
      'Pfeile = Hitbox bewegen',
      'Shift + Pfeile = Hitbox groesse',
      'R = Hitbox reset, P = copy JSON',
    ])
  }

  private cycleDebugSelection(direction: -1 | 1): void {
    if (this.debugEditableEntries.length === 0) return
    const total = this.debugEditableEntries.length
    this.debugSelectedEntryIndex = (this.debugSelectedEntryIndex + direction + total) % total
    this.refreshOffsetDebugLabel()
    this.drawDebugHitboxes()
  }

  private getSelectedDebugEntry(): PoiEntry | null {
    if (this.adminRuntime.selection.kind === 'poi' && this.adminRuntime.selection.id) {
      return this.mergedPois.find((entry) => entry.id === this.adminRuntime.selection.id) ?? null
    }
    if (this.debugEditableEntries.length === 0) return null
    return this.debugEditableEntries[this.debugSelectedEntryIndex] ?? null
  }

  private getEditableHitboxRelative(entry: PoiEntry): { x: number; y: number; width: number; height: number } {
    const dragPreview = this.dragPreviewHitboxes[entry.id]
    if (dragPreview) return { ...dragPreview }

    const adminOverride = this.mergedPois.find((poi) => poi.id === entry.id)?.world.hitbox
    if (adminOverride) return { ...adminOverride }
    const override = this.debugHitboxOverrides[entry.id]
    if (override) return { ...override }
    return this.getDefaultHitboxRelative(entry)
  }

  private getDefaultHitboxRelative(entry: PoiEntry): { x: number; y: number; width: number; height: number } {
    if (entry.world.hitbox) return { ...entry.world.hitbox }
    if (entry.world.visual === 'house' && entry.world.solid) {
      return {
        x: Number((entry.world.width * HOUSE_HITBOX_X_INSET_RATIO).toFixed(2)),
        y: Number((entry.world.height * HOUSE_HITBOX_TOP_SHIFT_RATIO).toFixed(2)),
        width: Number((entry.world.width * HOUSE_HITBOX_WIDTH_RATIO).toFixed(2)),
        height: Number((entry.world.height * HOUSE_HITBOX_HEIGHT_RATIO).toFixed(2)),
      }
    }
    return { x: 0, y: 0, width: entry.world.width, height: entry.world.height }
  }

  private applyEntryHitboxToInteractable(entry: PoiEntry): void {
    const item = this.interactables.find((x) => x.entry.id === entry.id)
    if (!item) return

    const hb = this.getEditableHitboxRelative(entry)
    const worldX = entry.world.x + this.mapObjectOffset.x + hb.x
    const worldY = entry.world.y + this.mapObjectOffset.y + hb.y
    const centerX = worldX + hb.width / 2
    const centerY = worldY + hb.height / 2

    item.sprite.setPosition(centerX, centerY)
    item.sprite.setSize(hb.width, hb.height)
    item.sprite.setDisplaySize(hb.width, hb.height)

    if (item.obstacleBody) {
      item.obstacleBody.updateFromGameObject()
    }

    const marker = this.proximityMarkers.get(entry.id)
    if (marker) {
      const markerY = worldY - 10
      marker.setPosition(centerX, markerY)
      marker.setData('baseY', markerY)
    }
  }

  private drawDebugHitboxes(): void {
    if (!this.debugHitboxGraphics) return
    this.debugHitboxGraphics.clear()
    if (!this.debugOffsetsVisible) return

    const selected = this.getSelectedDebugEntry()
    const selectedMapObjectId = this.adminRuntime.selection.kind === 'mapObject' ? this.adminRuntime.selection.id : ''
    const handleSize = 4

    // Object bounds (orange)
    for (const obj of this.mergedMapObjects) {
      const x = obj.x + this.mapObjectOffset.x - obj.width / 2
      const y = obj.y + this.mapObjectOffset.y - obj.height / 2
      const isSelected = selectedMapObjectId === obj.key
      this.debugHitboxGraphics.lineStyle(isSelected ? 2 : 1, isSelected ? 0xffcc33 : 0xff7a59, 0.9)
      this.debugHitboxGraphics.strokeRect(x, y, obj.width, obj.height)
    }

    // Hitboxes (cyan)
    for (const item of this.interactables) {
      if (!item.entry.world.solid) continue
      const b = item.sprite.getBounds()
      const isSelected = selected?.id === item.entry.id
      this.debugHitboxGraphics.lineStyle(isSelected ? 2 : 1, isSelected ? 0x00f5d4 : 0x69b3ff, 0.95)
      this.debugHitboxGraphics.strokeRect(b.x, b.y, b.width, b.height)

      if (isSelected && this.adminRuntime.mode === 'live') {
        const handles = [
          { x: b.x, y: b.y },
          { x: b.x + b.width, y: b.y },
          { x: b.x, y: b.y + b.height },
          { x: b.x + b.width, y: b.y + b.height },
        ]

        this.debugHitboxGraphics.fillStyle(0x00f5d4, 0.95)
        for (const h of handles) {
          this.debugHitboxGraphics.fillRect(h.x - handleSize, h.y - handleSize, handleSize * 2, handleSize * 2)
        }
      }
    }
  }

  private getHitboxHandleUnderPointer(
    px: number,
    py: number,
    rect: { x: number; y: number; width: number; height: number },
  ): 'resize-nw' | 'resize-ne' | 'resize-sw' | 'resize-se' | null {
    const gripRadius = 8
    const handles = [
      { mode: 'resize-nw' as const, x: rect.x, y: rect.y },
      { mode: 'resize-ne' as const, x: rect.x + rect.width, y: rect.y },
      { mode: 'resize-sw' as const, x: rect.x, y: rect.y + rect.height },
      { mode: 'resize-se' as const, x: rect.x + rect.width, y: rect.y + rect.height },
    ]

    for (const handle of handles) {
      if (Math.abs(px - handle.x) <= gripRadius && Math.abs(py - handle.y) <= gripRadius) {
        return handle.mode
      }
    }
    return null
  }

  private async copyDebugHitboxesToClipboard(): Promise<void> {
    const ordered: Record<string, { x: number; y: number; width: number; height: number }> = {}
    for (const entry of this.debugEditableEntries) {
      ordered[entry.id] = this.getEditableHitboxRelative(entry)
    }
    const content = JSON.stringify(ordered, null, 2)

    try {
      await navigator.clipboard.writeText(content)
      window.alert('Hitbox-JSON in die Zwischenablage kopiert.')
    } catch {
      window.alert('Kopieren fehlgeschlagen. Browser erlaubt Clipboard ggf. nicht.')
    }
  }

  private requiresSceneRebuild(nextMerged: ReturnType<typeof buildMergedAdminData>): boolean {
    if (
      nextMerged.globalOffset.x !== this.mapObjectOffset.x ||
      nextMerged.globalOffset.y !== this.mapObjectOffset.y
    ) {
      this.mapObjectOffset = nextMerged.globalOffset
      return true
    }

    if (nextMerged.mapObjects.length !== this.mergedMapObjects.length) {
      return true
    }
    for (let i = 0; i < nextMerged.mapObjects.length; i++) {
      const prev = this.mergedMapObjects[i]
      const next = nextMerged.mapObjects[i]
      if (
        prev.key !== next.key ||
        prev.filename !== next.filename ||
        prev.x !== next.x ||
        prev.y !== next.y ||
        prev.width !== next.width ||
        prev.height !== next.height ||
        prev.depth !== next.depth ||
        prev.poiId !== next.poiId ||
        prev.collision !== next.collision
      ) {
        return true
      }
    }

    const npcKeys: Array<keyof typeof this.mergedNpcPositions> = ['guide', 'recruiter', 'villageNpc', 'guideNpc2', 'playerSpawn']
    for (const key of npcKeys) {
      if (
        nextMerged.npcPositions[key].x !== this.mergedNpcPositions[key].x ||
        nextMerged.npcPositions[key].y !== this.mergedNpcPositions[key].y
      ) {
        this.mergedNpcPositions = nextMerged.npcPositions
        return true
      }
    }

    const prevPoiById = new Map(this.mergedPois.map((poi) => [poi.id, poi]))
    for (const nextPoi of nextMerged.pois) {
      const prevPoi = prevPoiById.get(nextPoi.id)
      if (!prevPoi) return true
      if (prevPoi.world.solid !== nextPoi.world.solid || prevPoi.world.visual !== nextPoi.world.visual) {
        return true
      }
    }

    return false
  }

  private syncInteractablesFromMergedPois(): void {
    const byId = new Map(this.mergedPois.map((poi) => [poi.id, poi]))
    for (const item of this.interactables) {
      const nextEntry = byId.get(item.entry.id)
      if (!nextEntry) continue
      item.entry = nextEntry
      this.applyEntryHitboxToInteractable(nextEntry)
    }
  }

  private getWorldDepth(y: number): number {
    return 100 + y
  }

  private emitAdminSelection(selection: AdminSelection): void {
    this.adminRuntime = {
      ...this.adminRuntime,
      selection,
    }
    if (selection.kind === 'poi') {
      const idx = this.debugEditableEntries.findIndex((entry) => entry.id === selection.id)
      if (idx >= 0) {
        this.debugSelectedEntryIndex = idx
      }
    }
    this.refreshOffsetDebugLabel()
    this.drawDebugHitboxes()
    gameEventBus.emit('admin:selection:set', { selection })
  }

  private fitCameraToMap(): void {
    this.cameras.main.stopFollow()
    const zoomX = this.scale.width / MAP_WIDTH
    const zoomY = this.scale.height / MAP_HEIGHT
    const nextZoom = Math.max(0.45, Math.min(1.6, Math.min(zoomX, zoomY)))
    this.cameras.main.setZoom(nextZoom)
    this.cameras.main.centerOn(MAP_WIDTH / 2, MAP_HEIGHT / 2)
  }

  private handleFullMapCamera(): void {
    const camera = this.cameras.main
    const pointer = this.input.activePointer

    if (pointer.isDown && !this.pointerPanActive) {
      this.pointerPanActive = true
      this.pointerPanLast = { x: pointer.x, y: pointer.y }
    } else if (!pointer.isDown) {
      this.pointerPanActive = false
    }

    if (this.pointerPanActive) {
      const dx = pointer.x - this.pointerPanLast.x
      const dy = pointer.y - this.pointerPanLast.y
      camera.scrollX -= dx / camera.zoom
      camera.scrollY -= dy / camera.zoom
      this.pointerPanLast = { x: pointer.x, y: pointer.y }
    }

    const wheelDelta = this.adminWheelDeltaY
    if (wheelDelta !== 0) {
      const dir = wheelDelta > 0 ? -1 : 1
      const nextZoom = Phaser.Math.Clamp(camera.zoom + dir * 0.06, 0.45, 2.2)
      camera.setZoom(nextZoom)
      this.adminWheelDeltaY = 0
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

      if (distance > item.entry.world.interactRadius) continue

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

  // ─── HOVER LABELS ──────────────────────────────────────────────

  private showHoverLabel(pointer: Phaser.Input.Pointer, text: string): void {
    if (!this.hoverLabel) return

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
}

export function createOverworldScene(): OverworldScene {
  resetMobileInput()
  return new OverworldScene()
}
