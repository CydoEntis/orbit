import { useState, useRef, useCallback } from 'react'
import { Plus, ChevronDown, Loader2, FolderOpen } from 'lucide-react'
import { useStore } from '../../../store/root.store'
import { useProjects } from '../../session/hooks/useProjects'
import { createSession } from '../../session/session.service'
import { cn } from '../../../lib/utils'
import type { SessionMeta } from '@shared/ipc-types'

interface Props {
  activeProject: string | null
  onProjectChange: (path: string | null) => void
  activeSessionId: string | null
  onSelectSession: (id: string) => void
}

function shortPath(p: string): string {
  const parts = p.replace(/\\/g, '/').split('/').filter(Boolean)
  if (parts.length <= 2) return p.replace(/\\/g, '/')
  return `…/${parts.slice(-2).join('/')}`
}

export function AgentMonitorSidebar({
  activeProject,
  onProjectChange,
  activeSessionId,
  onSelectSession,
}: Props): JSX.Element {
  const sessions = useStore((s) => s.sessions)
  const upsertSession = useStore((s) => s.upsertSession)
  const addTab = useStore((s) => s.addTab)

  const { openProjects, addProject } = useProjects()

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const normalizedActive = activeProject?.replace(/\\/g, '/')

  const projectSessions: SessionMeta[] = Object.values(sessions)
    .filter((m) => {
      if (!normalizedActive) return false
      const cwd = m.cwd.replace(/\\/g, '/')
      return cwd === normalizedActive || cwd.startsWith(normalizedActive + '/')
    })
    .sort((a, b) => b.createdAt - a.createdAt)

  const handleNewSession = useCallback(async () => {
    if (!activeProject || creating) return
    setCreating(true)
    try {
      const name = activeProject.replace(/\\/g, '/').split('/').filter(Boolean).pop() ?? 'session'
      const meta = await createSession({
        name,
        agentCommand: 'claude',
        cwd: activeProject,
        cols: 80,
        rows: 24,
      })
      upsertSession(meta)
      addTab(meta.sessionId)
      onSelectSession(meta.sessionId)
    } catch {
      // ignore
    } finally {
      setCreating(false)
    }
  }, [activeProject, creating, upsertSession, addTab, onSelectSession])

  const activeProjectLabel = normalizedActive
    ? normalizedActive.split('/').filter(Boolean).pop() ?? normalizedActive
    : 'Select project'

  return (
    <div className="flex flex-col h-full bg-brand-bg w-full">
      {/* Project dropdown */}
      <div className="flex-shrink-0 p-2 border-b border-brand-panel/60 relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((v) => !v)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded bg-brand-panel hover:bg-brand-panel/80 transition-colors text-left"
        >
          <FolderOpen size={13} className="flex-shrink-0 text-zinc-500" />
          <span className="flex-1 text-xs text-zinc-300 truncate min-w-0">{activeProjectLabel}</span>
          <ChevronDown size={12} className={cn('flex-shrink-0 text-zinc-500 transition-transform', dropdownOpen && 'rotate-180')} />
        </button>

        {dropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setDropdownOpen(false)}
            />
            <div className="absolute left-2 right-2 top-full mt-1 z-50 bg-brand-surface border border-brand-panel/60 rounded shadow-xl py-1 max-h-48 overflow-y-auto">
              {openProjects.length === 0 && (
                <p className="px-3 py-2 text-xs text-zinc-600">No open projects</p>
              )}
              {openProjects.map((p) => {
                const label = p.split('/').filter(Boolean).pop() ?? p
                return (
                  <button
                    key={p}
                    onClick={() => { onProjectChange(p); setDropdownOpen(false) }}
                    className={cn(
                      'w-full flex flex-col px-3 py-1.5 text-left transition-colors hover:bg-brand-panel',
                      p === normalizedActive && 'bg-brand-panel/60'
                    )}
                  >
                    <span className="text-xs text-zinc-200">{label}</span>
                    <span className="text-[10px] text-zinc-600">{shortPath(p)}</span>
                  </button>
                )
              })}
              <div className="h-px bg-brand-panel my-1" />
              <button
                onClick={() => { setDropdownOpen(false); addProject() }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-500 hover:bg-brand-panel hover:text-zinc-300 transition-colors text-left"
              >
                <Plus size={11} />
                Open Project
              </button>
            </div>
          </>
        )}
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto min-h-0 py-1">
        {!activeProject && (
          <div className="flex flex-col items-center gap-2 px-4 py-8">
            <FolderOpen size={24} className="text-zinc-700" />
            <p className="text-xs text-zinc-600 text-center">Select a project</p>
          </div>
        )}

        {activeProject && projectSessions.length === 0 && (
          <p className="text-xs text-zinc-600 text-center mt-6 px-4">No sessions in this project</p>
        )}

        {projectSessions.map((meta) => {
          const isSelected = activeSessionId === meta.sessionId
          const isRunning = meta.status === 'running'
          const agentStatus = meta.agentStatus ?? 'idle'
          const sessionColor = meta.color ?? '#22c55e'

          return (
            <button
              key={meta.sessionId}
              onClick={() => onSelectSession(meta.sessionId)}
              className={cn(
                'w-full flex flex-col gap-0.5 px-3 py-2 transition-all border-l-2 text-left'
              )}
              style={{
                borderLeftColor: isSelected ? sessionColor : 'transparent',
                background: `linear-gradient(to right, ${sessionColor}${isSelected ? '2e' : '12'}, transparent)`,
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                {isRunning && agentStatus === 'running' ? (
                  <Loader2 size={11} className="flex-shrink-0 animate-spin" style={{ color: sessionColor }} />
                ) : isRunning && agentStatus === 'waiting-input' ? (
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse" style={{ backgroundColor: sessionColor }} />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: isRunning ? sessionColor : '#52525b' }} />
                )}
                <span className={cn('text-xs font-medium truncate flex-1 min-w-0', isSelected ? 'text-zinc-100' : 'text-zinc-500')}>
                  {meta.name}
                </span>
              </div>
              <div className={cn('pl-3.5 text-[10px] truncate', isSelected ? 'text-zinc-400' : 'text-zinc-600')}>
                {shortPath(meta.cwd)}
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-brand-panel/60 p-2">
        <button
          onClick={handleNewSession}
          disabled={!activeProject || creating}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-zinc-500 hover:bg-brand-panel hover:text-brand-muted transition-colors rounded disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
          New Session
        </button>
      </div>
    </div>
  )
}
