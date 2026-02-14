import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { AuthoringWorldSchema } from '@leonaderi/world-schema'
import { validateWorld } from '../apps/worldbuilder/src/lib/validation'

const root = process.cwd()
const worldPath = path.join(root, 'world-data/project.world.v1.json')

function loadWorld() {
  return AuthoringWorldSchema.parse(JSON.parse(fs.readFileSync(worldPath, 'utf8')))
}

describe('worldbuilder validation', () => {
  it('returns no issues for canonical world', () => {
    const issues = validateWorld(loadWorld())
    expect(issues).toEqual([])
  })

  it('detects out-of-bounds geometry and duplicate trigger bindings', () => {
    const world = loadWorld()

    world.objects[0].x = -10
    world.triggers[0].interactionId = undefined
    world.interactions.push({
      ...world.interactions[0],
      id: 'duplicate-binding',
    })

    const issues = validateWorld(world)
    expect(issues.some((issue) => issue.includes('Object'))).toBe(true)
    expect(issues.some((issue) => issue.includes('has no interactionId'))).toBe(true)
    expect(issues.some((issue) => issue.includes('Mehrere interactions referenzieren triggerId'))).toBe(true)
  })

  it('detects broken dialogue graph references', () => {
    const world = loadWorld()
    world.dialogues[0].startNodeId = 'missing-node'

    const issues = validateWorld(world)
    expect(issues.some((issue) => issue.includes('unknown startNodeId'))).toBe(true)
  })
})
