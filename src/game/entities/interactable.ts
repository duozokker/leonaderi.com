import type Phaser from 'phaser'
import type { PoiEntry } from '../../content/types'

export interface Interactable {
  entry: PoiEntry
  sprite: Phaser.GameObjects.Rectangle
  obstacleBody?: Phaser.Physics.Arcade.StaticBody
}
