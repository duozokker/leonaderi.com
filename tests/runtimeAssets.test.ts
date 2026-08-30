import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { MAP_OBJECTS } from '../src/game/world/mapData'
import { npcGlossary } from '../src/content/glossary'
import { birthdayGifts } from '../src/content/birthday'

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
    const npcAvatars = npcGlossary.map((npc) => npc.avatar)
    const giftImages = birthdayGifts.map((gift) => gift.image)
    const requiredAssets = new Set([
      ...staticRuntimeAssets,
      ...mapObjectAssets,
      ...npcAvatars,
      ...giftImages,
    ])

    for (const asset of requiredAssets) {
      expect(existsSync(toPublicPath(asset)), `missing: ${asset}`).toBe(true)
    }
  })

  it('ships the self-hosted fonts', () => {
    expect(existsSync(join(process.cwd(), 'public/fonts/press-start-2p-latin.woff2'))).toBe(true)
    expect(existsSync(join(process.cwd(), 'public/fonts/press-start-2p-latin-ext.woff2'))).toBe(true)
  })
})
