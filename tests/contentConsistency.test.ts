import { describe, expect, it } from 'vitest'
import { portfolioGlossary } from '../src/content/glossary'
import { MAP_OBJECTS } from '../src/game/world/mapData'

describe('content consistency', () => {
  it('has unique POI ids', () => {
    const ids = portfolioGlossary.map((entry) => entry.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('resolves every map object poiId to glossary entry', () => {
    const glossaryIds = new Set(portfolioGlossary.map((entry) => entry.id))
    for (const obj of MAP_OBJECTS) {
      if (!obj.poiId) continue
      expect(glossaryIds.has(obj.poiId)).toBe(true)
    }
  })

  it('keeps world interaction radii valid', () => {
    for (const entry of portfolioGlossary) {
      expect(entry.world.interactRadius).toBeGreaterThan(0)
    }
  })
})
