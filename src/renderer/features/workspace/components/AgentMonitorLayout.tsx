import { useState, useCallback, useRef } from 'react'
import { TerminalPane } from '../../terminal/components/TerminalPane'
import { GitReviewPanel } from './GitReviewPanel'

interface Props {
  sessionId: string | null
  projectRoot: string | null
}

const DEFAULT_REVIEW_WIDTH = 320
const MIN_REVIEW_WIDTH = 200
const MAX_REVIEW_WIDTH = 600

export function AgentMonitorLayout({ sessionId, projectRoot }: Props): JSX.Element {
  const [reviewWidth, setReviewWidth] = useState(DEFAULT_REVIEW_WIDTH)
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null)

  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    dragRef.current = { startX: e.clientX, startWidth: reviewWidth }
    const onMove = (ev: MouseEvent): void => {
      if (!dragRef.current) return
      // Dragging left = wider review panel (delta is negative when moving left)
      const delta = dragRef.current.startX - ev.clientX
      const next = Math.max(MIN_REVIEW_WIDTH, Math.min(MAX_REVIEW_WIDTH, dragRef.current.startWidth + delta))
      setReviewWidth(next)
    }
    const onUp = (): void => {
      dragRef.current = null
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [reviewWidth])

  return (
    <div className="flex flex-1 min-w-0 min-h-0 h-full">
      {/* Terminal area */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col">
        {sessionId ? (
          <TerminalPane sessionId={sessionId} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm">
            Select a session from the sidebar
          </div>
        )}
      </div>

      {/* Drag handle */}
      <div
        className="w-1 flex-shrink-0 bg-brand-panel hover:bg-brand-accent transition-colors cursor-col-resize"
        onMouseDown={handleDividerMouseDown}
      />

      {/* Git review panel */}
      <div style={{ width: reviewWidth, flexShrink: 0 }} className="flex flex-col min-h-0 overflow-hidden">
        <GitReviewPanel projectRoot={projectRoot} />
      </div>
    </div>
  )
}
