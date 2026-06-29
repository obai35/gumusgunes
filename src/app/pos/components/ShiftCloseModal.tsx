'use client'

import { X } from 'lucide-react'

type Props = {
  endingCash: string
  onEndingCashChange: (value: string) => void
  shiftNotes: string
  onShiftNotesChange: (value: string) => void
  onClose: () => void
  onCancel: () => void
}

export default function ShiftCloseModal({ endingCash, onEndingCashChange, shiftNotes, onShiftNotesChange, onClose, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="pos-glass-strong rounded-xl w-full max-w-md p-6 mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-silver-soft">Close Shift</h2>
          <button onClick={onCancel} className="text-white/40 hover:text-silver-soft"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-white/50 font-medium">Ending Cash *</label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={endingCash}
                onChange={(e) => onEndingCashChange(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-silver-soft placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-white/50 font-medium">Notes (optional)</label>
            <textarea
              value={shiftNotes}
              onChange={(e) => onShiftNotesChange(e.target.value)}
              placeholder="Any notes about this shift..."
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-silver-soft placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all mt-1.5 resize-none"
              rows={3}
            />
          </div>
          <button
            onClick={onClose}
            disabled={!endingCash || parseFloat(endingCash) <= 0}
            className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg text-sm font-bold hover:from-red-500 hover:to-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-500/20"
          >
            Close Shift
          </button>
        </div>
      </div>
    </div>
  )
}
