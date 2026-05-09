import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { GROUP_COLORS } from '../../session/session.service'
import { cn } from '../../../lib/utils'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'

interface NewGroupModalProps {
  onDismiss: () => void
  onSave: (name: string, color: string) => Promise<void>
}

export function NewGroupModal({ onDismiss, onSave }: NewGroupModalProps): JSX.Element {
  const [name, setName] = useState('')
  const [color, setColor] = useState(GROUP_COLORS[0])
  const [creating, setCreating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleCreate = async (): Promise<void> => {
    const trimmed = name.trim()
    if (!trimmed || creating) return
    setCreating(true)
    try {
      await onSave(trimmed, color)
      onDismiss()
    } catch (err) {
      toast.error(`Group failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setCreating(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onDismiss() }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-brand-surface border border-brand-panel/60 rounded-lg shadow-2xl w-72 p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-zinc-200">New Group</span>
          <button onClick={onDismiss} className="text-zinc-500 hover:text-zinc-300 transition-colors"><X size={14} /></button>
        </div>
        <Input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !creating) void handleCreate(); if (e.key === 'Escape') onDismiss() }}
          placeholder="group name"
        />
        <div className="flex gap-2 flex-wrap">
          {GROUP_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{ backgroundColor: c }}
              className={cn('w-7 h-7 rounded-full transition-transform hover:scale-110 flex-shrink-0', color === c && 'ring-2 ring-white ring-offset-2 ring-offset-brand-surface scale-110')}
            />
          ))}
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={onDismiss}>Cancel</Button>
          <Button
            size="sm"
            onClick={() => void handleCreate()}
            disabled={creating || !name.trim()}
            className="bg-brand-accent/20 text-brand-accent hover:bg-brand-accent/30 disabled:opacity-40"
          >
            {creating ? <Loader2 size={11} className="animate-spin inline" /> : 'Create'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
