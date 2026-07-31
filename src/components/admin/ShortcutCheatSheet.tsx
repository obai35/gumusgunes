'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Command, Keyboard } from 'lucide-react'
import { useShortcut } from './KeyboardShortcutProvider'

type Shortcut = { key: string; ctrl?: boolean; shift?: boolean; description: string }

const DEFAULT_SHORTCUTS: Shortcut[] = [
  { key: 'n', ctrl: true, description: 'New order' },
  { key: 's', ctrl: true, description: 'Save / Confirm' },
  { key: '/', ctrl: true, description: 'Search / Focus search' },
  { key: '1', ctrl: true, description: 'Go to Dashboard' },
  { key: '2', ctrl: true, description: 'Go to Orders' },
  { key: '3', ctrl: true, description: 'Go to Products' },
  { key: '4', ctrl: true, description: 'Go to Inventory' },
  { key: 'Escape', description: 'Close modal / Blur input' },
]

export function ShortcutCheatSheet() {
  const [open, setOpen] = useState(false)

  useShortcut({
    key: '/',
    ctrl: true,
    shift: true,
    description: 'Show keyboard shortcuts',
    handler: () => setOpen((p) => !p),
  })

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-9 w-9 rounded-lg flex items-center justify-center text-silver/60 hover:text-silver hover:bg-silver/5 transition-colors"
        title="Keyboard shortcuts (Ctrl+Shift+/)"
      >
        <Keyboard className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="bg-card border-border rounded-xl shadow-xl w-full max-w-sm overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Command className="h-4 w-4 text-gold" />
                  <h2 className="font-semibold text-foreground text-sm">Keyboard Shortcuts</h2>
                </div>
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-5 space-y-1 max-h-80 overflow-y-auto">
                {DEFAULT_SHORTCUTS.map((s) => (
                  <div key={`${s.key}-${s.ctrl}`} className="flex items-center justify-between py-2">
                    <span className="text-sm text-foreground">{s.description}</span>
                    <kbd className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs font-mono text-muted-foreground border border-border">
                      {s.ctrl && <span className="text-[10px]">⌘</span>}
                      {s.shift && <span className="text-[10px]">⇧</span>}
                      {s.key === 'Escape' ? 'Esc' : s.key === ' ' ? 'Space' : s.key === '/' ? '/' : s.key.toUpperCase()}
                    </kbd>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 bg-muted/30 border-t border-border">
                <p className="text-xs text-muted-foreground">Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono border border-border">⌘/Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono border border-border">⇧</kbd> + <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono border border-border">/</kbd> to toggle this panel</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
