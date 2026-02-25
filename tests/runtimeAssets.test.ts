import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { MAP_OBJECTS } from '../src/game/world/mapData'

const staticRuntimeAssets = [
  '/assets/game/pixellab/characters/player/south.png',
  '/assets/game/pixellab/characters/player/walk/south.png',
  '/assets/game/pixellab/characters/player/walk/north.png',
  '/assets/game/pixellab/characters/player/walk/east.png',
  '/assets/game/pixellab/characters/player/walk/west.png',
  '/assets/game/pixellab/characters/npc/guide/south.png',
  '/assets/game/pixellab/characters/npc/recruiter/south.png',
  '/assets/game/pixellab/characters/npc/south.png',
  '/assets/game/pixellab/characters/npc/east.png',
  '/assets/game/pixellab/characters/npc/cute_girl.png',
  '/assets/game/map/map-composite.png',
  '/assets/pictures/artesiana-pixelimg.png',
  '/assets/pictures/leo-headshot.png',
  '/assets/pictures/leo-headshot-og.jpg',
]

function toPublicPath(assetPath: string): string {
  return join(process.cwd(), 'public', assetPath.replace(/^\/assets\//, 'assets/'))
}

describe('runtime assets', () => {
  it('contains every sprite loaded by runtime', () => {
    const mapObjectAssets = MAP_OBJECTS.map((obj) => `/assets/game/map/objects/${obj.filename}`)
    const requiredAssets = new Set([...staticRuntimeAssets, ...mapObjectAssets])

    for (const asset of requiredAssets) {
      expect(existsSync(toPublicPath(asset))).toBe(true)
    }
  })
})
