#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { AuthoringWorldSchema } from '@leonaderi/world-schema'
import { compileAuthoringToRuntime } from './compile'

const ROOT = process.cwd()

function usage() {
  console.log('Usage: tsx packages/world-compiler/src/cli.ts <validate|compile> <authoring-json> [--check]')
}

function readJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function writeIfChanged(filePath: string, nextContent: string): boolean {
  const prev = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : ''
  if (prev === nextContent) return false
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, nextContent)
  return true
}

function main() {
  const command = process.argv[2]
  const sourceArg = process.argv[3]
  const checkOnly = process.argv.includes('--check')
  if (!command || !sourceArg) {
    usage()
    process.exit(1)
  }

  const sourcePath = path.resolve(ROOT, sourceArg)
  const input = readJson(sourcePath)

  if (command === 'validate') {
    AuthoringWorldSchema.parse(input)
    console.log(`[world:validate] OK ${sourcePath}`)
    return
  }

  if (command !== 'compile') {
    usage()
    process.exit(1)
  }

  const result = compileAuthoringToRuntime(input, { sourcePath })

  if (result.warnings.length > 0) {
    for (const warning of result.warnings) {
      console.warn(`[world:compile][warn] ${warning.code}: ${warning.message}`)
    }
  }

  const targets = [
    {
      path: path.join(ROOT, 'src/content/glossary.ts'),
      content: result.generated.glossaryTs,
    },
    {
      path: path.join(ROOT, 'src/game/world/mapData.ts'),
      content: result.generated.mapDataTs,
    },
    {
      path: path.join(ROOT, 'src/content/uiTextGenerated.ts'),
      content: result.generated.uiTextRegistryTs,
    },
  ]

  if (checkOnly) {
    const drift = targets.filter((target) => {
      if (!fs.existsSync(target.path)) return true
      const current = fs.readFileSync(target.path, 'utf8')
      return current !== target.content
    })

    if (drift.length > 0) {
      for (const item of drift) {
        console.error(`[world:compile:check] drift -> ${path.relative(ROOT, item.path)}`)
      }
      process.exit(2)
    }

    console.log('[world:compile:check] OK generated files are up to date')
    return
  }

  const changed = targets.filter((target) => writeIfChanged(target.path, target.content))
  for (const item of changed) {
    console.log(`[world:compile] updated ${path.relative(ROOT, item.path)}`)
  }
  if (changed.length === 0) {
    console.log('[world:compile] no file changes')
  }
}

main()
