'use client'

import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react'

type Shortcut = {
  key: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  description: string
  handler: (e: KeyboardEvent) => void
}

type ShortcutContextValue = {
  registerShortcut: (shortcut: Shortcut) => () => void
  allShortcuts: Shortcut[]
}

const ShortcutContext = createContext<ShortcutContextValue | null>(null)

export function useShortcut(shortcut: Shortcut) {
  const ctx = useContext(ShortcutContext)
  if (!ctx) throw new Error('useShortcut must be used within KeyboardShortcutProvider')

  useEffect(() => {
    return ctx.registerShortcut(shortcut)
  }, [shortcut.key, shortcut.ctrl, shortcut.meta, shortcut.shift, shortcut.description])
}

export function KeyboardShortcutProvider({ children }: { children: ReactNode }) {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([])

  const registerShortcut = useCallback((shortcut: Shortcut) => {
    setShortcuts((prev) => [...prev.filter((s) => s.key !== shortcut.key || s.ctrl !== shortcut.ctrl), shortcut])
    return () => {
      setShortcuts((prev) => prev.filter((s) => s !== shortcut))
    }
  }, [])

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        if (e.key === 'Escape') {
          const active = document.activeElement as HTMLElement | null
          active?.blur()
          return
        }
        return
      }

      for (const s of shortcuts) {
        const ctrl = s.ctrl ?? false
        const meta = s.meta ?? false
        const shift = s.shift ?? false
        const matchCtrl = ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey
        const matchMeta = meta ? e.metaKey : true
        const matchShift = shift ? e.shiftKey : !e.shiftKey
        const matchKey = e.key.toLowerCase() === s.key.toLowerCase()

        if (matchKey && matchCtrl && matchMeta && matchShift) {
          e.preventDefault()
          e.stopPropagation()
          s.handler(e)
          return
        }
      }
    }

    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [shortcuts])

  return (
    <ShortcutContext.Provider value={{ registerShortcut, allShortcuts: shortcuts }}>
      {children}
    </ShortcutContext.Provider>
  )
}
