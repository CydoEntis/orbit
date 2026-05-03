import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { AppSettingsSchema, DEFAULT_SETTINGS } from '@shared/ipc-types'
import type { AppSettings } from '@shared/ipc-types'

function settingsPath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

export function getSettings(): AppSettings {
  const path = settingsPath()
  if (!existsSync(path)) return DEFAULT_SETTINGS
  try {
    const raw = JSON.parse(readFileSync(path, 'utf-8'))
    const parsed = AppSettingsSchema.safeParse(raw)
    return parsed.success ? parsed.data : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function setSettings(patch: Partial<AppSettings>): AppSettings {
  const current = getSettings()
  const merged = AppSettingsSchema.parse({ ...current, ...patch })
  const path = settingsPath()
  mkdirSync(join(path, '..'), { recursive: true })
  writeFileSync(path, JSON.stringify(merged, null, 2), 'utf-8')
  return merged
}
