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

const TILE_SIZE = 16
const WORLD_WIDTH = 120 * TILE_SIZE
const WORLD_HEIGHT = 68 * TILE_SIZE
const PLAYER_SPEED = 130

export class OverworldScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle
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

  constructor() {
    super('OverworldScene')
  }

  create(): void {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    this.cameras.main.setZoom(1.7)
    this.cameras.main.setRoundPixels(true)

    this.createGround()
    this.createRoads()
    this.createDecor()

    this.createPlayer()
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
      return
    }

    const directional = this.getDirectionalInput()

    this.playerBody.setVelocity(directional.x * PLAYER_SPEED, directional.y * PLAYER_SPEED)

    if (directional.x !== 0 && directional.y !== 0) {
      this.playerBody.velocity.normalize().scale(PLAYER_SPEED)
    }

    this.nearestInteractable = this.findNearestInteractable()
    this.renderInteractionHint()

    const keyboardInteractPressed =
      Phaser.Input.Keyboard.JustDown(this.keys.E) ||
      Phaser.Input.Keyboard.JustDown(this.keys.SPACE) ||
      Phaser.Input.Keyboard.JustDown(this.keys.ENTER)

    const mobileInteractPressed = consumeMobileInteract()

    if ((keyboardInteractPressed || mobileInteractPressed) && this.nearestInteractable) {
      this.openEntry(this.nearestInteractable.entry)
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
        fontFamily: 'Courier New',
        fontSize: '12px',
        color: '#f8f8f8',
        backgroundColor: '#1a1a1a',
        padding: {
          x: 8,
          y: 4,
        },
      })
      .setDepth(300)
      .setVisible(false)

    this.interactionHint = this.add
      .text(12, this.scale.height - 28, 'Erkunde die Stadt ...', {
        fontFamily: 'Courier New',
        fontSize: '13px',
        color: '#0a1820',
        backgroundColor: '#e6f4de',
        padding: { x: 10, y: 5 },
      })
      .setDepth(300)
      .setScrollFactor(0)
  }

  private renderInteractionHint(): void {
    if (!this.interactionHint) {
      return
    }

    if (!this.nearestInteractable) {
      this.interactionHint.setText('Laufe zu NPCs, Schildern oder Haeusern und druecke E / Enter / Space.')
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
    this.player = this.add.rectangle(960, 560, 14, 18, 0xffefc7).setDepth(200)
    this.player.setStrokeStyle(2, 0x1f2a30)

    this.physics.add.existing(this.player)
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body
    this.playerBody.setCollideWorldBounds(true)
    this.playerBody.setSize(14, 18)
  }

  private createInteractables(): void {
    const interactiveObjects = portfolioGlossary

    for (const entry of interactiveObjects) {
      const fillColor = this.resolveFillColor(entry)
      const strokeColor = this.resolveStrokeColor(entry)
      const { x, y, width, height } = entry.world

      const sprite = this.add
        .rectangle(x + width / 2, y + height / 2, width, height, fillColor)
        .setDepth(entry.world.visual === 'house' ? 120 : 180)

      sprite.setStrokeStyle(3, strokeColor)
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

      if (entry.world.visual === 'house') {
        const roof = this.add
          .triangle(
            x + width / 2,
            y - 10,
            0,
            20,
            width / 2,
            -10,
            width,
            20,
            this.resolveRoofColor(entry),
          )
          .setDepth(130)
        roof.setStrokeStyle(3, strokeColor)
      }

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
    }
  }

  private createGround(): void {
    const graphics = this.add.graphics().setDepth(0)

    for (let tileY = 0; tileY < WORLD_HEIGHT / TILE_SIZE; tileY += 1) {
      for (let tileX = 0; tileX < WORLD_WIDTH / TILE_SIZE; tileX += 1) {
        const isWaterBand = tileY < 4 || tileY > 63 || tileX < 4 || tileX > 115

        let color = isWaterBand ? 0x4f86c6 : 0x91c36f

        if (!isWaterBand && (tileX + tileY) % 9 === 0) {
          color = 0x88bb66
        }

        graphics.fillStyle(color, 1)
        graphics.fillRect(tileX * TILE_SIZE, tileY * TILE_SIZE, TILE_SIZE, TILE_SIZE)
      }
    }

    graphics.lineStyle(1, 0x6ea855, 0.25)
    for (let x = 0; x <= WORLD_WIDTH; x += TILE_SIZE) {
      graphics.lineBetween(x, 0, x, WORLD_HEIGHT)
    }

    for (let y = 0; y <= WORLD_HEIGHT; y += TILE_SIZE) {
      graphics.lineBetween(0, y, WORLD_WIDTH, y)
    }
  }

  private createRoads(): void {
    const roads = this.add.graphics().setDepth(20)

    roads.fillStyle(0xd8c18f, 1)
    roads.fillRect(0, 520, WORLD_WIDTH, 70)
    roads.fillRect(895, 0, 140, WORLD_HEIGHT)

    roads.fillStyle(0xcfb47a, 1)
    roads.fillRect(0, 548, WORLD_WIDTH, 14)
    roads.fillRect(952, 0, 24, WORLD_HEIGHT)
  }

  private createDecor(): void {
    const decor = this.add.graphics().setDepth(40)

    const treePositions = [
      [220, 420],
      [300, 760],
      [580, 760],
      [760, 740],
      [1120, 760],
      [1460, 430],
      [1680, 780],
      [250, 170],
      [1560, 180],
    ]

    for (const [x, y] of treePositions) {
      decor.fillStyle(0x4f8f4b, 1)
      decor.fillCircle(x, y, 26)
      decor.fillStyle(0x6d4c2f, 1)
      decor.fillRect(x - 6, y + 18, 12, 18)
    }

    const lake = this.add.graphics().setDepth(15)
    lake.fillStyle(0x4f86c6, 1)
    lake.fillRoundedRect(1450, 330, 280, 170, 28)
    lake.lineStyle(4, 0x2e6aa2, 0.8)
    lake.strokeRoundedRect(1450, 330, 280, 170, 28)
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

  private resolveFillColor(entry: PoiEntry): number {
    if (entry.world.visual === 'npc') {
      return 0xf8ebc6
    }

    if (entry.world.visual === 'sign') {
      return 0x9d754f
    }

    switch (entry.status) {
      case 'live':
        return 0xf9f5d7
      case 'wip':
        return 0xfce79b
      case 'coming_soon':
        return 0xd0d0d0
      case 'ruins':
        return 0x9d968a
      default:
        return 0xf9f5d7
    }
  }

  private resolveStrokeColor(entry: PoiEntry): number {
    if (entry.world.visual === 'sign') {
      return 0x4b2f18
    }

    if (entry.world.visual === 'npc') {
      return 0x1f2a30
    }

    switch (entry.status) {
      case 'live':
        return 0x2f2d27
      case 'wip':
        return 0x8f6c1f
      case 'coming_soon':
        return 0x535353
      case 'ruins':
        return 0x4e4a43
      default:
        return 0x2f2d27
    }
  }

  private resolveRoofColor(entry: PoiEntry): number {
    switch (entry.status) {
      case 'live':
        return 0xd66f58
      case 'wip':
        return 0xe39d3a
      case 'coming_soon':
        return 0x8d8d8d
      case 'ruins':
        return 0x6f6761
      default:
        return 0xd66f58
    }
  }
}

export function createOverworldScene(): OverworldScene {
  resetMobileInput()
  return new OverworldScene()
}
