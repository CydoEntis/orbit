import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { getGitReview, stageFile, unstageFile, gitCommit, gitPush } from '../../fs/fs.service'
import type { GitReviewData } from '../../fs/fs.service'

export interface UseGitReviewReturn {
  data: GitReviewData | null
  loading: boolean
  committing: boolean
  pushing: boolean
  commitMessage: string
  setCommitMessage: (msg: string) => void
  stage: (path: string) => Promise<void>
  unstage: (path: string) => Promise<void>
  commit: () => Promise<void>
  push: () => Promise<void>
  refresh: () => void
}

export function useGitReview(projectRoot: string | null): UseGitReviewReturn {
  const [data, setData] = useState<GitReviewData | null>(null)
  const [loading, setLoading] = useState(false)
  const [committing, setCommitting] = useState(false)
  const [pushing, setPushing] = useState(false)
  const [commitMessage, setCommitMessage] = useState('')
  const [tick, setTick] = useState(0)
  const rootRef = useRef(projectRoot)
  useEffect(() => { rootRef.current = projectRoot }, [projectRoot])

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (!projectRoot) { setData(null); return }
    let cancelled = false
    setLoading(true)
    getGitReview(projectRoot)
      .then((d) => { if (!cancelled) { setData(d); setLoading(false) } })
      .catch(() => { if (!cancelled) { setLoading(false) } })
    return () => { cancelled = true }
  }, [projectRoot, tick])

  // Poll every 4000ms
  useEffect(() => {
    if (!projectRoot) return
    const id = setInterval(() => setTick((t) => t + 1), 4000)
    return () => clearInterval(id)
  }, [projectRoot])

  const stage = useCallback(async (filePath: string) => {
    if (!rootRef.current) return
    try {
      await stageFile(rootRef.current, filePath)
      refresh()
    } catch (err) {
      toast.error(`Stage failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  }, [refresh])

  const unstage = useCallback(async (filePath: string) => {
    if (!rootRef.current) return
    try {
      await unstageFile(rootRef.current, filePath)
      refresh()
    } catch (err) {
      toast.error(`Unstage failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  }, [refresh])

  const commit = useCallback(async () => {
    if (!rootRef.current || !commitMessage.trim()) return
    setCommitting(true)
    try {
      const result = await gitCommit(rootRef.current, commitMessage.trim())
      if (result.success) {
        setCommitMessage('')
        refresh()
        toast.success('Committed successfully')
      } else {
        toast.error(`Commit failed: ${result.error ?? 'unknown error'}`)
      }
    } catch (err) {
      toast.error(`Commit failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setCommitting(false)
    }
  }, [commitMessage, refresh])

  const push = useCallback(async () => {
    if (!rootRef.current) return
    setPushing(true)
    try {
      const result = await gitPush(rootRef.current)
      if (result.success) {
        toast.success('Pushed successfully')
      } else {
        toast.error(`Push failed: ${result.error ?? 'unknown error'}`)
      }
    } catch (err) {
      toast.error(`Push failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setPushing(false)
    }
  }, [])

  return {
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
  }
}
