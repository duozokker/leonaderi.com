import type { AdminPatchV1 } from '../types'

export function exportPatchAsJson(patch: AdminPatchV1): void {
  const blob = new Blob([JSON.stringify(patch, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'world-admin-patch.v1.json'
  a.click()
  URL.revokeObjectURL(url)
}

export async function importPatchFromFile(file: File): Promise<AdminPatchV1> {
  const text = await file.text()
  const parsed = JSON.parse(text) as AdminPatchV1
  if (!parsed || parsed.version !== 1) {
    throw new Error('Unsupported patch file version')
  }
  return parsed
}
