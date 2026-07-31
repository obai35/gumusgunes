'use client'

import { useState } from 'react'
import { Keyboard, X } from 'lucide-react'

const shortcutsByPage: Record<'pos' | 'payment', { key: string; action: string }[]> = {
  pos: [
    { key: 'F4', action: 'Focus search input' },
    { key: 'F6', action: 'Focus SKU / barcode input' },
    { key: 'Ctrl+1-9', action: 'Add product by grid position' },
    { key: 'Escape', action: 'Clear cart' },
  ],
  payment: [
    { key: 'F1', action: 'Set payment to Cash' },
    { key: 'F2', action: 'Set payment to Card' },
    { key: 'F3', action: 'Set payment to Split' },
    { key: 'F10', action: 'Set payment to Bank Transfer' },
    { key: 'F11', action: 'Set payment to Instapay' },
    { key: 'F12', action: 'Set payment to Wallet' },
    { key: 'Enter', action: 'Quick checkout (no input focused)' },
    { key: 'Escape', action: 'Back to cart' },
  ],
}

export default function ShortcutsCheatSheet({ page = 'pos' }: { page?: 'pos' | 'payment' }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(p => !p)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 text-white/50 text-xs hover:bg-white/20 hover:text-white/70 transition-all"
        title="Keyboard Shortcuts"
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
              {shortcutsByPage[page].map(s => (
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
