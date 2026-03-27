import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const requiredPublicFiles = [
  'public/robots.txt',
  'public/sitemap.xml',
  'public/site.webmanifest',
  'public/favicon-32x32.png',
  'public/apple-touch-icon.png',
  'public/icons/icon-192.png',
  'public/icons/icon-512.png',
]

describe('public metadata', () => {
  it('ships public-facing web metadata and app icons', () => {
    for (const relativePath of requiredPublicFiles) {
      expect(existsSync(join(process.cwd(), relativePath))).toBe(true)
    }
  })
})
