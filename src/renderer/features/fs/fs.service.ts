import { ipc } from '../../lib/ipc'
import { IPC } from '@shared/ipc-channels'
import type { FsEntry, GitStatusEntry } from '@shared/ipc-types'

export async function readDir(dirPath: string): Promise<FsEntry[]> {
  return ipc.invoke(IPC.FS_READ_DIR, { dirPath }) as Promise<FsEntry[]>
}

export async function readFile(filePath: string): Promise<string | null> {
  return ipc.invoke(IPC.FS_READ_FILE, { filePath }) as Promise<string | null>
}

export async function getGitStatus(projectRoot: string): Promise<GitStatusEntry[]> {
  return ipc.invoke(IPC.FS_GIT_STATUS, { projectRoot }) as Promise<GitStatusEntry[]>
}

export async function getGitDiff(projectRoot: string, filePath: string): Promise<string | null> {
  return ipc.invoke(IPC.FS_GIT_DIFF_FILE, { projectRoot, filePath }) as Promise<string | null>
}
