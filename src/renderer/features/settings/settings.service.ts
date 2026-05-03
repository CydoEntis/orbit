import { ipc } from '../../lib/ipc'
import { IPC } from '@shared/ipc-channels'
import type { AppSettings } from '@shared/ipc-types'

export async function getSettings(): Promise<AppSettings> {
  return ipc.invoke(IPC.SETTINGS_GET) as Promise<AppSettings>
}

export async function setSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  return ipc.invoke(IPC.SETTINGS_SET, patch) as Promise<AppSettings>
}
