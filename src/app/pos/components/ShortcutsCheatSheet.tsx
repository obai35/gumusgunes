'use client'

import { useState, useEffect } from 'react'
import { Keyboard } from 'lucide-react'

const shortcuts = [
  { key: 'Ctrl+K', action: 'Search products' },
  { key: 'F1', action: 'Toggle shortcuts' },
  { key: 'Escape', action: 'Close modal / clear search' },
  { key: 'F2', action: 'Focus barcode input' },
  { key: 'F3', action: 'Toggle cart panel' },
  { key: 'F4', action: 'Quick checkout' },
  { key: 'F5', action: 'Refresh product grid' },
  { key: 'F6', action: 'Toggle orders view' },
  { key: 'F7', action: 'Toggle returns view' },
  { key: 'F8', action: 'Toggle records view' },
  { key: 'F9', action: 'Toggle hall sale view' },
]

export default function ShortcutsCheatSheet() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault()
        setOpen(p => !p)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      <button
        onClick={() => setOpen(p => !p)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 text-white/50 text-xs hover:bg-white/20 hover:text-white/70 transition-all"
        title="Keyboard Shortcuts (F1)"
      >
        <Keyboard className="h-3.5 w-3.5" />
        Shortcuts
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="bg-navy-deep border border-white/10 rounded-xl p-6 w-80 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-silver-soft">Keyboard Shortcuts</h3>
              <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white/60">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2">
              {shortcuts.map(s => (
                <div key={s.key} className="flex items-center justify-between">
                  <span className="text-xs text-white/50">{s.action}</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/60 text-xs font-mono">{s.key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
