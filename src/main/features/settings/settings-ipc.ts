import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc-channels'
import { AppSettingsSchema } from '@shared/ipc-types'
import { getSettings, setSettings } from './settings-store'

export function registerSettingsIpc(): void {
  ipcMain.handle(IPC.SETTINGS_GET, () => {
    return getSettings()
  })

  ipcMain.handle(IPC.SETTINGS_SET, (_event, patch) => {
    const partial = AppSettingsSchema.partial().parse(patch)
    return setSettings(partial)
  })
}
