import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import type { PersistedLayout } from '@shared/ipc-types'

function layoutPath(): string {
  return join(app.getPath('userData'), 'layout.json')
}

export function getPersistedLayout(): PersistedLayout | null {
  const path = layoutPath()
  if (!existsSync(path)) return null
  try {
    const raw = JSON.parse(readFileSync(path, 'utf-8'))
    if (raw?.version !== 1 || !Array.isArray(raw.tabs)) return null
    return raw as PersistedLayout
  } catch {
    return null
  }
}

export function savePersistedLayout(layout: PersistedLayout): void {
  const path = layoutPath()
  mkdirSync(join(path, '..'), { recursive: true })
  writeFileSync(path, JSON.stringify(layout), 'utf-8')
}

export function clearPersistedLayout(): void {
  const path = layoutPath()
  if (existsSync(path)) {
    writeFileSync(path, JSON.stringify(null), 'utf-8')
  }
}
