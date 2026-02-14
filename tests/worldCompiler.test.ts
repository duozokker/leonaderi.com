import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { AuthoringWorldSchema } from '@leonaderi/world-schema'
import { compileAuthoringToRuntime } from '@leonaderi/world-compiler'

const root = process.cwd()
const worldPath = path.join(root, 'world-data/project.world.v1.json')

function loadWorld() {
  return JSON.parse(fs.readFileSync(worldPath, 'utf8'))
}

describe('world schema', () => {
  it('parses canonical authoring world', () => {
    const parsed = AuthoringWorldSchema.parse(loadWorld())
    expect(parsed.meta.version).toBe(1)
    expect(parsed.objects.length).toBeGreaterThan(0)
    expect(parsed.poiIndex.length).toBeGreaterThan(0)
  })
})

describe('compiler bridge', () => {
  it('compiles authoring world into runtime payload and source files', () => {
    const compiled = compileAuthoringToRuntime(loadWorld(), { sourcePath: worldPath })

    expect(compiled.runtime.glossary.length).toBeGreaterThan(0)
    expect(compiled.runtime.mapData.objects.length).toBeGreaterThan(0)
    expect(compiled.generated.glossaryTs).toContain('AUTO-GENERATED FILE')
    expect(compiled.generated.mapDataTs).toContain('export const MAP_OBJECTS')
    expect(compiled.warnings.length).toBe(0)
  })

  it('reports warning when interaction references missing trigger', () => {
    const world = loadWorld()
    world.interactions = [
      {
        id: 'broken',
        triggerId: 'missing-trigger',
        actions: [
          {
            id: 'open',
            label: 'Open',
            type: 'open_modal',
            modalKey: 'demo',
          },
        ],
      },
    ]

    const compiled = compileAuthoringToRuntime(world, { sourcePath: worldPath })
    expect(compiled.warnings.some((warning) => warning.code === 'MISSING_TRIGGER')).toBe(true)
  })
})
