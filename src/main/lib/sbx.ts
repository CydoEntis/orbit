import { spawnSync } from 'child_process'

export function isSbxAvailable(): boolean {
  // spawnSync sets result.error = ENOENT when the binary doesn't exist.
  // We don't care about the exit code — just whether sbx was found at all.
  const result = spawnSync('sbx', [], { timeout: 3000, stdio: 'ignore' })
  return result.error === undefined
}
