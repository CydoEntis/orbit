import { useState, useEffect, useRef } from 'react'
import { X, FolderOpen, FolderClosed, Plus, Terminal, Loader2, ExternalLink, Copy } from 'lucide-react'
import { createPortal } from 'react-dom'
import { NewSessionForm } from './NewSessionForm'
import { useStore } from '../../../store/root.store'
import { findTabForSession } from '../../terminal/pane-tree'
import { FileTree } from '../../fs/components/FileTree'
import { useProjects } from '../hooks/useProjects'
import { useInstalledEditors } from '../../fs/hooks/useInstalledEditors'
import { showInFolder, openInEditor, openPath } from '../../fs/fs.service'
import { createSession } from '../session.service'
import { cn } from '../../../lib/utils'

interface ProjectCtxMenu { x: number; y: number; path: string }

function ProjectContextMenu({ x, y, path, onDismiss }: ProjectCtxMenu & { onDismiss: () => void }): JSX.Element {
  const editors = useInstalledEditors()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent): void => {
      if (ref.current?.contains(e.target as Node)) return
      onDismiss()
    }
    document.addEventListener('mousedown', handler, { capture: true })
    document.addEventListener('contextmenu', handler, { capture: true })
    return () => {
      document.removeEventListener('mousedown', handler, { capture: true })
      document.removeEventListener('contextmenu', handler, { capture: true })
    }
  }, [onDismiss])

  const ax = Math.min(x, window.innerWidth - 220)
  const ay = Math.min(y, window.innerHeight - 200)
  const dismiss = (fn: () => void) => () => { fn(); onDismiss() }

  return createPortal(
    <div
      ref={ref}
      style={{ position: 'fixed', top: ay, left: ax, zIndex: 9999 }}
      className="bg-brand-surface border border-brand-panel/60 rounded-md shadow-2xl py-1 w-52"
      onContextMenu={(e) => e.preventDefault()}
    >
      <button onClick={dismiss(() => openPath(path))}
        className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-zinc-300 hover:bg-brand-panel hover:text-zinc-100 transition-colors text-left">
        <ExternalLink size={12} className="flex-shrink-0" />
        Open
      </button>
      {editors.map((ed) => (
        <button key={ed.command} onClick={dismiss(() => openInEditor(ed.command, path))}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-zinc-300 hover:bg-brand-panel hover:text-zinc-100 transition-colors text-left">
          <ExternalLink size={12} className="flex-shrink-0" />
          Open in {ed.name}
        </button>
      ))}
      <div className="h-px bg-brand-panel my-1" />
      <button onClick={dismiss(() => navigator.clipboard.writeText(path))}
        className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-zinc-300 hover:bg-brand-panel hover:text-zinc-100 transition-colors text-left">
        <Copy size={12} className="flex-shrink-0" />
        Copy Path
      </button>
      <div className="h-px bg-brand-panel my-1" />
      <button onClick={dismiss(() => showInFolder(path))}
        className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-zinc-300 hover:bg-brand-panel hover:text-zinc-100 transition-colors text-left">
        <FolderOpen size={12} className="flex-shrink-0" />
        Reveal in Explorer
      </button>
    </div>,
    document.body
  )
}

interface ProjectSectionProps {
  path: string
  name: string
  refreshTick: number
  activeFilePath: string | null
  onFileClick: (path: string, xy: string | undefined) => void
  onNewSession: () => void
  onRemove: () => void
}

function ProjectSection({ path, name, refreshTick, activeFilePath, onFileClick, onNewSession, onRemove }: ProjectSectionProps): JSX.Element {
  const [expanded, setExpanded] = useState(true)
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null)
  return (
    <div className="flex flex-col flex-shrink-0">
      {ctxMenu && <ProjectContextMenu x={ctxMenu.x} y={ctxMenu.y} path={path} onDismiss={() => setCtxMenu(null)} />}
      <div
        className="group flex items-center gap-1.5 px-2 py-1.5 border-b border-brand-panel/60 cursor-pointer hover:bg-brand-panel/20 transition-colors"
        onContextMenu={(e) => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY }) }}
      >
        <button onClick={() => setExpanded((v) => !v)} className="flex items-center gap-1.5 flex-1 min-w-0">
          {expanded ? <FolderOpen size={13} className="text-brand-light flex-shrink-0" /> : <FolderClosed size={13} className="text-zinc-500 flex-shrink-0" />}
          <span className="text-xs font-semibold text-zinc-200 truncate">{name}</span>
        </button>
        <button onClick={(e) => { e.stopPropagation(); onNewSession() }} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-brand-light transition-colors" title="New session in this project"><Terminal size={11} /></button>
        <button onClick={(e) => { e.stopPropagation(); onRemove() }} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-zinc-400 transition-colors" title="Remove"><X size={11} /></button>
      </div>
      {expanded && <FileTree projectRoot={path} activeFilePath={activeFilePath} onFileClick={onFileClick} refreshTick={refreshTick} />}
    </div>
  )
}

function shortPath(p: string): string {
  const parts = p.replace(/\\/g, '/').split('/').filter(Boolean)
  if (parts.length <= 2) return p.replace(/\\/g, '/')
  return `…/${parts.slice(-2).join('/')}`
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m`
  return `${Math.floor(s / 3600)}h`
}

interface Props {
  onFileClick: (path: string, xy: string | undefined) => void
  activeTab: 'sessions' | 'projects'
  activeFilePath: string | null
  externalRefreshTick?: number
  onSwitchToSessions: () => void
}

export function SessionDashboard({ onFileClick, activeTab, activeFilePath, externalRefreshTick, onSwitchToSessions }: Props): JSX.Element {
  const sessions = useStore((s) => s.sessions)
  const paneTree = useStore((s) => s.paneTree)
  const focusedSessionId = useStore((s) => s.focusedSessionId)
  const setActiveSession = useStore((s) => s.setActiveSession)
  const setFocusedSession = useStore((s) => s.setFocusedSession)
  const updateSettings = useStore((s) => s.updateSettings)
  const upsertSession = useStore((s) => s.upsertSession)
  const addTab = useStore((s) => s.addTab)

  const { openProjects, refreshTicks, bumpRefresh, addProject, removeProject, closeSession } = useProjects()

  useEffect(() => {
    if (!externalRefreshTick) return
    openProjects.forEach((path) => bumpRefresh(path))
  }, [externalRefreshTick])

  const allSessions = Object.values(sessions).sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div className="flex flex-col w-full h-full bg-brand-bg">
      {/* Sessions tab */}
      {activeTab === 'sessions' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto py-1">
            {allSessions.length === 0 && (
              <p className="text-xs text-zinc-600 text-center mt-6">No sessions</p>
            )}
            {allSessions.map((m) => {
              const tabId = findTabForSession(paneTree, m.sessionId)
              const isRunning = m.status === 'running'
              const isFocused = focusedSessionId === m.sessionId
              const agentStatus = m.agentStatus ?? 'idle'
              const sessionColor = m.color ?? '#22c55e'
              return (
                <div
                  key={m.sessionId}
                  className={cn(
                    'group w-full flex flex-col gap-0.5 px-3 py-2 transition-colors border-l-2',
                    tabId ? 'cursor-pointer' : 'opacity-30 cursor-default',
                    isFocused ? 'bg-brand-panel border-l-brand-green' : 'border-l-transparent hover:bg-brand-surface'
                  )}
                  onClick={() => { if (tabId) { setActiveSession(tabId); setFocusedSession(m.sessionId) } }}
                >
                  <div className="flex items-center gap-2">
                    {isRunning && agentStatus === 'running' ? (
                      <Loader2 size={11} className="flex-shrink-0 animate-spin" style={{ color: sessionColor }} />
                    ) : isRunning && agentStatus === 'waiting-input' ? (
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-amber-400 animate-pulse" />
                    ) : (
                      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0',
                        isRunning ? 'bg-green-400' : 'bg-zinc-600'
                      )} />
                    )}
                    <span className={cn('text-xs font-medium truncate flex-1', isFocused ? 'text-zinc-100' : 'text-zinc-500')}>
                      {m.name}
                    </span>
                    <span className={cn('text-[10px] flex-shrink-0', isFocused ? 'text-zinc-400' : 'text-zinc-700')}>
                      {timeAgo(m.createdAt)}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); closeSession(m.sessionId) }}
                      className="flex-shrink-0 text-zinc-700 hover:text-zinc-300 transition-colors opacity-0 group-hover:opacity-100 ml-0.5"
                      title="Close session"
                    >
                      <X size={13} />
                    </button>
                  </div>
                  <div className={cn('pl-3.5 text-[10px] truncate', isFocused ? 'text-zinc-400' : 'text-zinc-600')}>
                    {shortPath(m.cwd)}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex-shrink-0 border-t border-brand-panel/60 p-2">
            <NewSessionForm variant="sidebar" />
          </div>
        </div>
      )}

      {/* Projects tab */}
      {activeTab === 'projects' && (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto min-h-0">
            {openProjects.length === 0 && (
              <p className="text-xs text-zinc-600 text-center mt-6">No projects open</p>
            )}
            {openProjects.map((p) => {
              const name = p.split('/').filter(Boolean).pop() ?? p
              return (
                <ProjectSection
                  key={p}
                  path={p}
                  name={name}
                  refreshTick={refreshTicks[p] ?? 0}
                  activeFilePath={activeFilePath}
                  onFileClick={onFileClick}
                  onNewSession={async () => {
                    try {
                      const meta = await createSession({ name, agentCommand: 'claude', cwd: p, cols: 80, rows: 24 })
                      upsertSession(meta)
                      addTab(meta.sessionId)
                      updateSettings({ projectRoot: p })
                      onSwitchToSessions()
                    } catch {}
                  }}
                  onRemove={() => removeProject(p)}
                />
              )
            })}
          </div>
          <div className="flex-shrink-0 border-t border-brand-panel/60 p-2">
            <button
              onClick={addProject}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs text-zinc-500 hover:bg-brand-panel hover:text-brand-light transition-colors rounded"
            >
              <FolderOpen size={13} /> Open Project
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
