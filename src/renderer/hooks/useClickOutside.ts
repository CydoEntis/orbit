import { useEffect } from 'react'
import type { RefObject } from 'react'

export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T>,
  onDismiss: () => void
): void {
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
  }, [ref, onDismiss])
}
