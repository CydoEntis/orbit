import { ipc } from '../../lib/ipc'
import { IPC } from '@shared/ipc-channels'
import type { PersistedLayout } from '@shared/ipc-types'

export async function loadLayout(): Promise<PersistedLayout | null> {
  return ipc.invoke(IPC.PERSISTENCE_LOAD) as Promise<PersistedLayout | null>
}

export async function saveLayout(layout: PersistedLayout): Promise<void> {
  await ipc.invoke(IPC.PERSISTENCE_SAVE, layout)
}

export async function clearLayout(): Promise<void> {
  await ipc.invoke(IPC.PERSISTENCE_CLEAR)
}
