import type { AuthoringWorldV1 } from '@leonaderi/world-schema'

function pushDuplicateIdIssues<T extends { id: string }>(
  issues: string[],
  label: string,
  items: T[],
): void {
  const seen = new Set<string>()
  for (const item of items) {
    if (seen.has(item.id)) {
      issues.push(`${label}: Duplicate id ${item.id}`)
      continue
    }
    seen.add(item.id)
  }
}

function pushRectBoundsIssue(
  issues: string[],
  label: string,
  id: string,
  rect: { x: number; y: number; width: number; height: number },
  mapWidth: number,
  mapHeight: number,
): void {
  if (rect.width <= 0 || rect.height <= 0) {
    issues.push(`${label} ${id} has non-positive size`)
    return
  }
  if (rect.x < 0 || rect.y < 0) {
    issues.push(`${label} ${id} is outside map bounds (negative origin)`)
    return
  }
  if (rect.x + rect.width > mapWidth || rect.y + rect.height > mapHeight) {
    issues.push(`${label} ${id} exceeds map bounds`)
  }
}

function collectDialogueEdges(
  node: AuthoringWorldV1['dialogues'][number]['nodes'][number],
  allNodes: AuthoringWorldV1['dialogues'][number]['nodes'],
  index: number,
): string[] {
  if (node.type === 'choice') return node.choices.map((item) => item.targetNodeId)
  if (node.type === 'condition') return [node.onTrueNodeId, node.onFalseNodeId]
  if (node.type === 'jump') return [node.targetNodeId]
  if (node.type === 'line' || node.type === 'action') {
    const next = allNodes[index + 1]
    return next ? [next.id] : []
  }
  return []
}

export function validateWorld(world: AuthoringWorldV1): string[] {
  const issues: string[] = []
  const mapWidth = world.map.columns * world.map.tileSize
  const mapHeight = world.map.rows * world.map.tileSize

  const triggerIds = new Set(world.triggers.map((item) => item.id))
  const interactionIds = new Set(world.interactions.map((item) => item.id))
  const dialogueIds = new Set(world.dialogues.map((item) => item.id))
  const objectIds = new Set(world.objects.map((item) => item.id))

  pushDuplicateIdIssues(issues, 'Objects', world.objects)
  pushDuplicateIdIssues(issues, 'Colliders', world.colliders)
  pushDuplicateIdIssues(issues, 'Triggers', world.triggers)
  pushDuplicateIdIssues(issues, 'Interactions', world.interactions)
  pushDuplicateIdIssues(issues, 'NPCs', world.npcs)
  pushDuplicateIdIssues(issues, 'POIs', world.poiIndex)
  pushDuplicateIdIssues(issues, 'Dialogues', world.dialogues)

  for (const object of world.objects) {
    pushRectBoundsIssue(
      issues,
      'Object',
      object.id,
      {
        x: object.x - object.width / 2,
        y: object.y - object.height / 2,
        width: object.width,
        height: object.height,
      },
      mapWidth,
      mapHeight,
    )
  }

  for (const collider of world.colliders) {
    if (collider.objectId && !objectIds.has(collider.objectId)) {
      issues.push(`Collider ${collider.id} references unknown objectId ${collider.objectId}`)
    }
    if (collider.shape.type === 'rect') {
      pushRectBoundsIssue(issues, 'Collider', collider.id, collider.shape.rect, mapWidth, mapHeight)
    }
  }

  const triggerSeen = new Set<string>()
  for (const interaction of world.interactions) {
    if (triggerSeen.has(interaction.triggerId)) {
      issues.push(`Mehrere interactions referenzieren triggerId ${interaction.triggerId}`)
    }
    triggerSeen.add(interaction.triggerId)
  }

  for (const trigger of world.triggers) {
    if (trigger.objectId && !objectIds.has(trigger.objectId)) {
      issues.push(`Trigger ${trigger.id} references unknown objectId ${trigger.objectId}`)
    }
    if (trigger.interactionId && !interactionIds.has(trigger.interactionId)) {
      issues.push(`Trigger ${trigger.id} has unknown interactionId ${trigger.interactionId}`)
    }
    if (!trigger.interactionId && (trigger.type === 'door' || trigger.type === 'interact' || trigger.type === 'click_zone')) {
      issues.push(`Trigger ${trigger.id} has no interactionId`)
    }
    if (trigger.shape.type === 'rect') {
      pushRectBoundsIssue(issues, 'Trigger', trigger.id, trigger.shape.rect, mapWidth, mapHeight)
    }
  }

  for (const interaction of world.interactions) {
    if (!triggerIds.has(interaction.triggerId)) {
      issues.push(`Interaction ${interaction.id} references unknown trigger ${interaction.triggerId}`)
    }
    for (const action of interaction.actions) {
      if (action.type === 'open_dialogue' && !dialogueIds.has(action.dialogueId)) {
        issues.push(`Interaction ${interaction.id} references unknown dialogue ${action.dialogueId}`)
      }
    }
  }

  for (const poi of world.poiIndex) {
    if (poi.linkedObjectId && !objectIds.has(poi.linkedObjectId)) {
      issues.push(`POI ${poi.id} has unknown linkedObjectId ${poi.linkedObjectId}`)
    }
    if (poi.linkedInteractionId && !interactionIds.has(poi.linkedInteractionId)) {
      issues.push(`POI ${poi.id} has unknown linkedInteractionId ${poi.linkedInteractionId}`)
    }
    pushRectBoundsIssue(issues, 'POI', poi.id, poi.world, mapWidth, mapHeight)
    if (poi.world.hitbox) {
      pushRectBoundsIssue(issues, 'POI hitbox', poi.id, poi.world.hitbox, poi.world.width, poi.world.height)
    }
  }

  for (const dialogue of world.dialogues) {
    const nodeById = new Map(dialogue.nodes.map((node) => [node.id, node]))
    const nodeIndexById = new Map(dialogue.nodes.map((node, index) => [node.id, index]))
    if (!nodeById.has(dialogue.startNodeId)) {
      issues.push(`Dialogue ${dialogue.id} has unknown startNodeId ${dialogue.startNodeId}`)
      continue
    }

    const queue = [dialogue.startNodeId]
    const visited = new Set<string>()
    while (queue.length > 0) {
      const nodeId = queue.shift()!
      if (visited.has(nodeId)) continue
      visited.add(nodeId)
      const node = nodeById.get(nodeId)
      if (!node) {
        issues.push(`Dialogue ${dialogue.id} references missing node ${nodeId}`)
        continue
      }
      const index = nodeIndexById.get(node.id) ?? -1
      for (const nextId of collectDialogueEdges(node, dialogue.nodes, index)) {
        if (!nodeById.has(nextId)) {
          issues.push(`Dialogue ${dialogue.id} node ${node.id} references missing node ${nextId}`)
        } else if (!visited.has(nextId)) {
          queue.push(nextId)
        }
      }
    }

    for (const node of dialogue.nodes) {
      if (!visited.has(node.id)) {
        issues.push(`Dialogue ${dialogue.id} has unreachable node ${node.id}`)
      }
    }
  }

  return issues
}
