import { useState } from 'react'
import { RefreshCw, ChevronDown, ChevronRight, Loader2, Plus, Minus } from 'lucide-react'
import { useGitReview } from '../hooks/useGitReview'
import { getGitDiff } from '../../fs/fs.service'
import type { GitFileInfo } from '../../fs/fs.service'
import { cn } from '../../../lib/utils'

interface Props {
  projectRoot: string | null
  sessionName?: string
}

function basename(p: string): string {
  return p.replace(/\\/g, '/').split('/').pop() ?? p
}

function dirpart(p: string): string {
  const normalized = p.replace(/\\/g, '/')
  const idx = normalized.lastIndexOf('/')
  return idx >= 0 ? normalized.slice(0, idx) : ''
}

type DiffState = 'collapsed' | 'loading' | 'loaded'

interface FileRowProps {
  info: GitFileInfo | string
  kind: 'staged' | 'unstaged' | 'untracked'
  projectRoot: string
  onStage?: (path: string) => Promise<void>
  onUnstage?: (path: string) => Promise<void>
}

function FileRow({ info, kind, projectRoot, onStage, onUnstage }: FileRowProps): JSX.Element {
  const [diffState, setDiffState] = useState<DiffState>('collapsed')
  const [diffText, setDiffText] = useState<string | null>(null)

  const filePath = typeof info === 'string' ? info : info.path
  const added = typeof info === 'string' ? 0 : info.added
  const deleted = typeof info === 'string' ? 0 : info.deleted

  const toggleDiff = async (): Promise<void> => {
    if (diffState === 'collapsed') {
      setDiffState('loading')
      const text = await getGitDiff(projectRoot, filePath)
      setDiffText(text)
      setDiffState('loaded')
    } else {
      setDiffState('collapsed')
    }
  }

  const statusColor =
    kind === 'untracked' ? '#22c55e'
    : deleted > 0 && added === 0 ? '#ef4444'
    : '#eab308'

  return (
    <div className="flex flex-col">
      <div className="group flex items-center gap-1.5 px-3 py-1 hover:bg-brand-panel/40 transition-colors min-w-0">
        <span
          className="w-2 h-2 rounded-sm flex-shrink-0"
          style={{ backgroundColor: statusColor }}
          title={kind}
        />
        <span className="text-xs text-zinc-200 truncate flex-1 min-w-0">
          {basename(filePath)}
          {dirpart(filePath) && (
            <span className="text-zinc-600 ml-1">{dirpart(filePath)}</span>
          )}
        </span>
        {kind !== 'untracked' && (added > 0 || deleted > 0) && (
          <span className="flex items-center gap-1 flex-shrink-0 text-[10px]">
            {added > 0 && <span className="text-green-400">+{added}</span>}
            {deleted > 0 && <span className="text-red-400">-{deleted}</span>}
          </span>
        )}
        {kind === 'untracked' && (
          <span className="flex-shrink-0 text-[9px] font-bold text-zinc-500 bg-brand-panel px-1 rounded">U</span>
        )}
        {kind === 'unstaged' && onStage && (
          <button
            onClick={() => onStage(filePath)}
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-green-400 transition-colors"
            title="Stage file"
          >
            <Plus size={11} />
          </button>
        )}
        {kind === 'staged' && onUnstage && (
          <button
            onClick={() => onUnstage(filePath)}
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-yellow-400 transition-colors"
            title="Unstage file"
          >
            <Minus size={11} />
          </button>
        )}
        {kind !== 'untracked' && (
          <button
            onClick={toggleDiff}
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-zinc-300 transition-colors"
            title="Toggle diff"
          >
            {diffState === 'loading' ? (
              <Loader2 size={11} className="animate-spin" />
            ) : diffState === 'loaded' ? (
              <ChevronDown size={11} />
            ) : (
              <ChevronRight size={11} />
            )}
          </button>
        )}
      </div>
      {diffState === 'loaded' && diffText && (
        <div className="mx-3 mb-1 rounded overflow-auto max-h-64 bg-zinc-950 border border-brand-panel/40">
          <pre className="text-[10px] font-mono leading-4 p-2 select-text">
            {diffText.split('\n').map((line, i) => (
              <span
                key={i}
                className={cn(
                  'block',
                  line.startsWith('+') && !line.startsWith('+++') && 'bg-green-950/50 text-green-300',
                  line.startsWith('-') && !line.startsWith('---') && 'bg-red-950/50 text-red-300',
                  line.startsWith('@@') && 'text-zinc-500',
                  !line.startsWith('+') && !line.startsWith('-') && !line.startsWith('@@') && 'text-zinc-400',
                )}
              >
                {line || ' '}
              </span>
            ))}
          </pre>
        </div>
      )}
    </div>
  )
}

interface SectionProps {
  title: string
  count: number
  defaultOpen?: boolean
  children: React.ReactNode
}

function Section({ title, count, defaultOpen = true, children }: SectionProps): JSX.Element {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="flex flex-col">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors text-left border-b border-brand-panel/30"
      >
        {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        {title}
        <span className="ml-auto text-zinc-600">{count}</span>
      </button>
      {open && children}
    </div>
  )
}

export function GitReviewPanel({ projectRoot }: Props): JSX.Element {
  const {
    data,
    loading,
    committing,
    pushing,
    commitMessage,
    setCommitMessage,
    stage,
    unstage,
    commit,
    push,
    refresh,
  } = useGitReview(projectRoot)

  const hasStaged = (data?.staged.length ?? 0) > 0
  const canCommit = hasStaged && commitMessage.trim().length > 0

  return (
    <div className="bg-brand-surface border-l border-brand-panel/60 flex flex-col h-full w-full">
      {/* Header */}
      <div className="flex items-center px-4 h-10 border-b border-brand-panel/60 flex-shrink-0">
        <span className="text-xs font-semibold text-zinc-300 flex-1">Review Changes</span>
        <button
          onClick={refresh}
          disabled={loading}
          className="text-zinc-600 hover:text-zinc-300 transition-colors"
          title="Refresh"
        >
          <RefreshCw size={13} className={cn(loading && 'animate-spin')} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {!projectRoot && (
          <p className="text-xs text-zinc-600 text-center mt-8 px-4">No project selected</p>
        )}

        {projectRoot && !data && !loading && (
          <p className="text-xs text-zinc-600 text-center mt-8 px-4">No changes</p>
        )}

        {projectRoot && data && (
          <>
            {/* Against HEAD — staged + unstaged combined */}
            {(data.staged.length > 0 || data.unstaged.length > 0) && (
              <Section
                title="Against HEAD"
                count={data.staged.length + data.unstaged.length}
              >
                {data.staged.map((f) => (
                  <FileRow
                    key={`staged:${f.path}`}
                    info={f}
                    kind="staged"
                    projectRoot={projectRoot}
                    onUnstage={unstage}
                  />
                ))}
                {data.unstaged.map((f) => (
                  <FileRow
                    key={`unstaged:${f.path}`}
                    info={f}
                    kind="unstaged"
                    projectRoot={projectRoot}
                    onStage={stage}
                  />
                ))}
              </Section>
            )}

            {/* Untracked */}
            {data.untracked.length > 0 && (
              <Section title="Untracked" count={data.untracked.length} defaultOpen={false}>
                {data.untracked.map((p) => (
                  <FileRow
                    key={`untracked:${p}`}
                    info={p}
                    kind="untracked"
                    projectRoot={projectRoot}
                    onStage={stage}
                  />
                ))}
              </Section>
            )}

            {data.staged.length === 0 && data.unstaged.length === 0 && data.untracked.length === 0 && (
              <p className="text-xs text-zinc-600 text-center mt-8 px-4">Working tree clean</p>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      {projectRoot && (
        <div className="flex-shrink-0 border-t border-brand-panel/60 p-3 flex flex-col gap-2">
          <textarea
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Commit message..."
            rows={2}
            className="w-full bg-brand-panel border border-brand-panel/60 rounded px-2 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-brand-muted/50 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={commit}
              disabled={!canCommit || committing}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded bg-brand-accent/20 text-brand-accent hover:bg-brand-accent/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {committing ? <Loader2 size={11} className="animate-spin" /> : null}
              Commit
            </button>
            <button
              onClick={push}
              disabled={pushing}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded bg-brand-panel text-zinc-400 hover:text-zinc-200 hover:bg-brand-panel/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {pushing ? <Loader2 size={11} className="animate-spin" /> : null}
              Push
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
