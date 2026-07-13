'use client'

import { useEffect } from 'react'

type ShortcutDef = {
  key: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  handler: (e: KeyboardEvent) => void
}

export function useKeyboardShortcuts(shortcuts: ShortcutDef[], enabled = true) {
  useEffect(() => {
    if (!enabled) return

    const listener = (e: KeyboardEvent) => {
      for (const s of shortcuts) {
        const ctrl = s.ctrl ?? false
        const meta = s.meta ?? false
        const shift = s.shift ?? false
        const matchCtrl = ctrl ? (e.ctrlKey || e.metaKey) : true
        const matchMeta = meta ? e.metaKey : true
        const matchShift = shift ? e.shiftKey : true
        const matchKey = e.key.toLowerCase() === s.key.toLowerCase()

        if (matchKey && matchCtrl && matchMeta && matchShift) {
          e.preventDefault()
          s.handler(e)
          return
        }
      }
    }

    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [shortcuts, enabled])
}
