import { describe, expect, it } from 'vitest'
import { npcGlossary, portfolioGlossary } from '../src/content/glossary'
import { birthdayConfig, birthdayGifts } from '../src/content/birthday'
import { MAP_OBJECTS, NPC_POSITIONS } from '../src/game/world/mapData'
import type { LocalizedText } from '../src/content/types'

function expectLocalized(text: LocalizedText, context: string) {
  expect(text.en, `${context} (en)`).toBeTruthy()
  expect(text.de, `${context} (de)`).toBeTruthy()
}

describe('content consistency', () => {
  it('has unique POI ids', () => {
    const ids = portfolioGlossary.map((entry) => entry.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('resolves every map object poiId to a glossary entry', () => {
    const glossaryIds = new Set(portfolioGlossary.map((entry) => entry.id))
    for (const obj of MAP_OBJECTS) {
      if (!obj.poiId) continue
      expect(glossaryIds.has(obj.poiId), `map object ${obj.key} -> ${obj.poiId}`).toBe(true)
    }
  })

  it('places every glossary POI somewhere on the map', () => {
    const placedIds = new Set(MAP_OBJECTS.map((obj) => obj.poiId).filter(Boolean))
    for (const entry of portfolioGlossary) {
      expect(placedIds.has(entry.id), `glossary entry ${entry.id} has no map object`).toBe(true)
    }
  })

  it('keeps world interaction radii valid', () => {
    for (const entry of portfolioGlossary) {
      expect(entry.world.interactRadius).toBeGreaterThan(0)
    }
  })

  it('has complete en/de copy for every POI', () => {
    for (const entry of portfolioGlossary) {
      expectLocalized(entry.dialog.title, `${entry.id} dialog title`)
      expectLocalized(entry.dialog.body, `${entry.id} dialog body`)
      for (const action of entry.actions) {
        expectLocalized(action.label, `${entry.id} action ${action.id}`)
        if (action.type === 'open_link') {
          expect(action.href, `${entry.id} action ${action.id} href`).toMatch(/^https:\/\//)
        }
        if (action.type === 'open_modal') {
          expect(action.modalId, `${entry.id} action ${action.id} modalId`).toBeTruthy()
        }
      }
    }
  })

  it('has complete en/de copy and a valid spawn point for every NPC', () => {
    const ids = npcGlossary.map((npc) => npc.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const npc of npcGlossary) {
      expectLocalized(npc.name, `${npc.id} name`)
      expectLocalized(npc.dialog, `${npc.id} dialog`)
      expect(npc.spriteKey, `${npc.id} spriteKey`).toBeTruthy()
      expect(
        NPC_POSITIONS[npc.positionKey as keyof typeof NPC_POSITIONS],
        `${npc.id} positionKey ${npc.positionKey}`,
      ).toBeDefined()
    }
  })

  it('wires the birthday gate to an existing NPC', () => {
    const gateNpc = npcGlossary.find((npc) => npc.id === birthdayConfig.npcId)
    expect(gateNpc).toBeDefined()
    expect(gateNpc?.special).toBe('birthday_gate')
    // The gate compares lowercased trimmed input, so the secret must be lowercase.
    expect(birthdayConfig.secretWord).toBe(birthdayConfig.secretWord.trim().toLowerCase())
    expect(birthdayConfig.secretWord.length).toBeGreaterThan(0)
    expect(birthdayGifts.length).toBeGreaterThan(0)
    for (const gift of birthdayGifts) {
      expectLocalized(gift.title, `gift ${gift.id} title`)
      expectLocalized(gift.body, `gift ${gift.id} body`)
      expect(gift.image).toMatch(/^\/assets\//)
      if (gift.href) {
        expect(gift.href, `gift ${gift.id} href`).toMatch(/^https:\/\//)
        expectLocalized(gift.linkLabel!, `gift ${gift.id} linkLabel`)
      }
    }
  })
})
