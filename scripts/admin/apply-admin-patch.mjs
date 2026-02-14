#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()

function usage() {
  console.log('Usage: node scripts/admin/apply-admin-patch.mjs [patch-file] [--dry-run]')
  console.log('Default patch-file: src/ui/admin/world-admin-patch.v1.json')
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function writeMaybe(filePath, content, dryRun) {
  if (dryRun) return
  fs.writeFileSync(filePath, content)
}

function replaceNumberField(block, field, value) {
  const pattern = new RegExp(`(${field}:\\s*)(-?\\d+(?:\\.\\d+)?)`)
  return block.replace(pattern, `$1${value}`)
}

function replaceStringField(block, field, value) {
  const escaped = String(value).replace(/'/g, "\\'")
  const pattern = new RegExp(`(${field}:\\s*)'[^']*'`)
  return block.replace(pattern, `$1'${escaped}'`)
}

function findObjectBlockByKey(text, keyToken) {
  const idx = text.indexOf(keyToken)
  if (idx < 0) return null

  let start = idx
  while (start >= 0 && text[start] !== '{') start--
  if (start < 0) return null

  let depth = 0
  let inString = false
  let quote = ''
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if ((ch === '"' || ch === "'") && text[i - 1] !== '\\') {
      if (!inString) {
        inString = true
        quote = ch
      } else if (quote === ch) {
        inString = false
      }
    }
    if (inString) continue
    if (ch === '{') depth++
    if (ch === '}') {
      depth--
      if (depth === 0) {
        return { start, end: i + 1, block: text.slice(start, i + 1) }
      }
    }
  }
  return null
}

function applyGlossaryPatch(glossaryText, patch) {
  let out = glossaryText
  for (const [poiId, poiPatch] of Object.entries(patch.pois ?? {})) {
    const found = findObjectBlockByKey(out, `id: '${poiId}'`)
    if (!found) continue
    let block = found.block

    if (poiPatch.content?.name != null) block = replaceStringField(block, 'name', poiPatch.content.name)
    if (poiPatch.content?.kind != null) block = replaceStringField(block, 'kind', poiPatch.content.kind)
    if (poiPatch.content?.status != null) block = replaceStringField(block, 'status', poiPatch.content.status)
    if (poiPatch.content?.description != null) block = replaceStringField(block, 'description', poiPatch.content.description)
    if (poiPatch.content?.accentColor != null) block = replaceStringField(block, 'accentColor', poiPatch.content.accentColor)
    if (poiPatch.content?.spriteHint != null) block = replaceStringField(block, 'spriteHint', poiPatch.content.spriteHint)
    if (poiPatch.content?.district != null) block = replaceStringField(block, 'district', poiPatch.content.district)

    if (poiPatch.content?.dialogTitle != null) block = replaceStringField(block, 'title', poiPatch.content.dialogTitle)
    if (poiPatch.content?.dialogBody != null) block = replaceStringField(block, 'body', poiPatch.content.dialogBody)

    if (poiPatch.world?.x != null) block = replaceNumberField(block, 'x', poiPatch.world.x)
    if (poiPatch.world?.y != null) block = replaceNumberField(block, 'y', poiPatch.world.y)
    if (poiPatch.world?.width != null) block = replaceNumberField(block, 'width', poiPatch.world.width)
    if (poiPatch.world?.height != null) block = replaceNumberField(block, 'height', poiPatch.world.height)
    if (poiPatch.world?.interactRadius != null) block = replaceNumberField(block, 'interactRadius', poiPatch.world.interactRadius)

    out = `${out.slice(0, found.start)}${block}${out.slice(found.end)}`
  }
  return out
}

function applyMapDataPatch(mapDataText, patch) {
  let out = mapDataText
  for (const [key, objectPatch] of Object.entries(patch.mapObjects ?? {})) {
    const found = findObjectBlockByKey(out, `key: '${key}'`)
    if (!found) continue
    let block = found.block
    if (objectPatch.x != null) block = replaceNumberField(block, 'x', objectPatch.x)
    if (objectPatch.y != null) block = replaceNumberField(block, 'y', objectPatch.y)
    if (objectPatch.width != null) block = replaceNumberField(block, 'width', objectPatch.width)
    if (objectPatch.height != null) block = replaceNumberField(block, 'height', objectPatch.height)
    if (objectPatch.depth != null) block = replaceNumberField(block, 'depth', objectPatch.depth)
    out = `${out.slice(0, found.start)}${block}${out.slice(found.end)}`
  }

  const npcKeys = ['guide', 'recruiter', 'villageNpc', 'guideNpc2']
  for (const npcKey of npcKeys) {
    const npcPatch = patch.npcs?.[npcKey]
    if (!npcPatch) continue
    const linePattern = new RegExp(`(${npcKey}:\\s*\\{\\s*x:\\s*)(-?\\d+(?:\\.\\d+)?)(,\\s*y:\\s*)(-?\\d+(?:\\.\\d+)?)(\\s*\\})`)
    out = out.replace(linePattern, (_, p1, _x, p3, _y, p5) => `${p1}${npcPatch.x ?? _x}${p3}${npcPatch.y ?? _y}${p5}`)
  }

  if (patch.npcs?.playerSpawn) {
    const playerPattern = /(PLAYER_SPAWN\s*=\s*\{\s*x:\s*)(-?\d+(?:\.\d+)?)(,\s*y:\s*)(-?\d+(?:\.\d+)?)(\s*\})/
    out = out.replace(playerPattern, (_, p1, _x, p3, _y, p5) => `${p1}${patch.npcs.playerSpawn.x ?? _x}${p3}${patch.npcs.playerSpawn.y ?? _y}${p5}`)
  }

  return out
}

function main() {
  const positionalArgs = process.argv.slice(2).filter((arg) => !arg.startsWith('--'))
  const patchPath = positionalArgs[0] ?? 'src/ui/admin/world-admin-patch.v1.json'
  const dryRun = process.argv.includes('--dry-run')
  const absPatchPath = path.resolve(ROOT, patchPath)
  if (!fs.existsSync(absPatchPath)) {
    usage()
    throw new Error(`Patch file not found: ${absPatchPath}`)
  }
  const patch = readJson(absPatchPath)
  if (!patch || patch.version !== 1) {
    throw new Error('Unsupported patch format. Expected version 1.')
  }

  const glossaryPath = path.join(ROOT, 'src/content/glossary.ts')
  const mapDataPath = path.join(ROOT, 'src/game/world/mapData.ts')
  const snapshotPath = path.join(ROOT, 'src/ui/admin/world-admin-patch.v1.json')

  const glossaryBefore = fs.readFileSync(glossaryPath, 'utf8')
  const mapDataBefore = fs.readFileSync(mapDataPath, 'utf8')
  const glossaryAfter = applyGlossaryPatch(glossaryBefore, patch)
  const mapDataAfter = applyMapDataPatch(mapDataBefore, patch)

  writeMaybe(glossaryPath, glossaryAfter, dryRun)
  writeMaybe(mapDataPath, mapDataAfter, dryRun)
  writeMaybe(snapshotPath, `${JSON.stringify(patch, null, 2)}\n`, dryRun)

  console.log(`[admin:apply] patch=${absPatchPath}`)
  console.log(`[admin:apply] glossary.ts ${dryRun ? 'would update' : 'updated'}`)
  console.log(`[admin:apply] mapData.ts ${dryRun ? 'would update' : 'updated'}`)
  console.log(`[admin:apply] snapshot ${dryRun ? 'would update' : 'updated'} -> src/ui/admin/world-admin-patch.v1.json`)
}

main()
