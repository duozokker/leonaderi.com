import { describe, expect, it } from 'vitest'
import { portfolioGlossary } from '../src/content/glossary'
import { buildMergedAdminData } from '../src/ui/admin/services/patchMerge'
import { createEmptyPatch } from '../src/ui/admin/services/patchStorage'

describe('buildMergedAdminData', () => {
  it('merges poi text and world overrides', () => {
    const patch = createEmptyPatch()
    patch.pois['company-hq'] = {
      content: {
        name: 'HQ Updated',
      },
      world: {
        x: 999,
        y: 111,
        hitbox: { x: 2, y: 3, width: 40, height: 30 },
      },
    }

    const merged = buildMergedAdminData(portfolioGlossary, patch)
    const poi = merged.pois.find((x) => x.id === 'company-hq')
    expect(poi?.name).toBe('HQ Updated')
    expect(poi?.world.x).toBe(999)
    expect(poi?.world.y).toBe(111)
    expect(poi?.world.hitbox?.width).toBe(40)
  })

  it('merges map object and npc overrides', () => {
    const patch = createEmptyPatch()
    patch.mapObjects.objBridge = { x: 700, y: 701 }
    patch.npcs.guide = { x: 200, y: 201 }
    const merged = buildMergedAdminData(portfolioGlossary, patch)
    const bridge = merged.mapObjects.find((x) => x.key === 'objBridge')
    expect(bridge?.x).toBe(700)
    expect(bridge?.y).toBe(701)
    expect(merged.npcPositions.guide.x).toBe(200)
    expect(merged.npcPositions.guide.y).toBe(201)
  })
})
