import { app, BrowserWindow, nativeImage } from 'electron'
import { join } from 'path'
import { createWindow, focusMainWindow } from './window-manager'
import { registerSessionIpc } from './features/session/session-ipc'
import { registerWindowIpc } from './features/window/window-ipc'
import { registerSettingsIpc } from './features/settings/settings-ipc'
import { registerPersistenceIpc } from './features/persistence/persistence-ipc'
import { registerFsIpc } from './features/fs/fs-ipc'
import { registerNotesIpc } from './features/notes/notes-ipc'
import { initUpdater } from './features/updater/updater'

app.setName('Orbit')
// Tells GNOME which .desktop file belongs to this app so the dock shows the right icon.
// The .deb install places orbit.desktop in /usr/share/applications/.
// AppImage users need AppImageLauncher for full desktop integration.
if (process.platform === 'linux') (app as unknown as { setDesktopName: (n: string) => void }).setDesktopName('orbit.desktop')

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
}

app.on('second-instance', () => {
  focusMainWindow()
})

function registerAllIpc(): void {
  registerSessionIpc()
  registerWindowIpc()
  registerSettingsIpc()
  registerPersistenceIpc()
  registerFsIpc()
  registerNotesIpc()
}

app.whenReady().then(() => {
  if (process.platform === 'linux') {
    const iconPath = app.isPackaged
      ? join(process.resourcesPath, 'logo.png')
      : join(process.cwd(), 'logo.png')
    app.setIcon(nativeImage.createFromPath(iconPath))
  }
  registerAllIpc()
  createWindow()
  initUpdater()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
