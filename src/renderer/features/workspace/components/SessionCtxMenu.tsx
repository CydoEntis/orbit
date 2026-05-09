import { createPortal } from 'react-dom'
import { Pencil, ExternalLink, PanelLeftOpen, Columns2, Scissors, Trash2 } from 'lucide-react'
import { collectSessionIds, findTabForSession } from '../../layout/layout-tree'
import type { LayoutNode } from '../../layout/layout-tree'
import type { SessionMeta } from '@shared/ipc-types'

interface SessionCtxMenuProps {
  ctxMenu: { x: number; y: number; meta: SessionMeta }
  onDismiss: () => void
  onRename: (meta: SessionMeta) => void
  onSplitHere: (sessionId: string) => void
  onDetach: (sessionId: string) => void
  onReattach: (sessionId: string) => void
  onCloseAllSplits: (meta: SessionMeta) => void
  onKill: (meta: SessionMeta) => void
  activeSessionId: string | null
  paneTree: Record<string, LayoutNode>
  isMainWindow: boolean
  windowId: string | null
  projectSessions: SessionMeta[]
}

export function SessionCtxMenu({ ctxMenu, onDismiss, onRename, onSplitHere, onDetach, onReattach, onCloseAllSplits, onKill, activeSessionId, paneTree, isMainWindow, windowId, projectSessions }: SessionCtxMenuProps): JSX.Element {
  const { x, y, meta } = ctxMenu

  const canSplitHere = !!(
    activeSessionId &&
    activeSessionId !== meta.sessionId &&
    meta.status === 'running' &&
    !collectSessionIds(paneTree[activeSessionId] ?? { type: 'leaf', id: '', panel: 'home' }).includes(meta.sessionId)
  )
  const isInTab = !!(findTabForSession(paneTree, meta.sessionId) && windowId)
  const hasAllSplits = !!(meta.groupId && projectSessions.some((s) => s.groupId === meta.groupId && /^Split #\d+$/.test(s.name)))

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[9998]"
        onMouseDown={onDismiss}
        onContextMenu={(e) => { e.preventDefault(); onDismiss() }}
      />
      <div
        className="fixed z-[9999] bg-brand-surface border border-brand-panel/60 rounded shadow-xl py-1 min-w-[160px]"
        style={{ left: Math.min(x, window.innerWidth - 180), top: Math.min(y, window.innerHeight - 150) }}
      >
        <button
          onMouseDown={(e) => { e.stopPropagation(); onRename(meta); onDismiss() }}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-zinc-300 hover:bg-brand-panel hover:text-zinc-100 transition-colors"
        >
          <Pencil size={12} />Rename / Recolor
        </button>
        {canSplitHere && (
          <>
            <div className="my-1 border-t border-brand-panel/60" />
            <button
              onMouseDown={(e) => { e.stopPropagation(); onSplitHere(meta.sessionId); onDismiss() }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-zinc-300 hover:bg-brand-panel hover:text-zinc-100 transition-colors"
            >
              <Columns2 size={12} />Split Here
            </button>
          </>
        )}
        {isMainWindow && (
          <>
            <div className="my-1 border-t border-brand-panel/60" />
            {isInTab ? (
              <button
                onMouseDown={(e) => { e.stopPropagation(); onDetach(meta.sessionId); onDismiss() }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-zinc-300 hover:bg-brand-panel hover:text-zinc-100 transition-colors"
              >
                <ExternalLink size={12} />Detach to Window
              </button>
            ) : (
              <button
                onMouseDown={(e) => { e.stopPropagation(); onReattach(meta.sessionId); onDismiss() }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-zinc-300 hover:bg-brand-panel hover:text-zinc-100 transition-colors"
              >
                <PanelLeftOpen size={12} />Reattach to Main
              </button>
            )}
          </>
        )}
        {hasAllSplits && (
          <>
            <div className="my-1 border-t border-brand-panel/60" />
            <button
              onMouseDown={(e) => { e.stopPropagation(); onCloseAllSplits(meta); onDismiss() }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-zinc-300 hover:bg-brand-panel hover:text-zinc-100 transition-colors"
            >
              <Scissors size={12} />Close All Splits
            </button>
          </>
        )}
        <div className="my-1 border-t border-brand-panel/60" />
        <button
          onMouseDown={(e) => { e.stopPropagation(); onKill(meta); onDismiss() }}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-red-400 hover:bg-brand-panel hover:text-red-300 transition-colors"
        >
          <Trash2 size={12} />Kill Session
        </button>
      </div>
    </>,
    document.body
  )
}
