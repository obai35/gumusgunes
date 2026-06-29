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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl border border-border shadow-lg w-full max-w-md p-6 mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-navy">Close Shift</h2>
          <button onClick={onCancel} className="text-muted-foreground hover:text-navy"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground font-medium">Ending Cash *</label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={endingCash}
                onChange={(e) => onEndingCashChange(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2.5 border border-border rounded-lg text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground font-medium">Notes (optional)</label>
            <textarea
              value={shiftNotes}
              onChange={(e) => onShiftNotesChange(e.target.value)}
              placeholder="Any notes about this shift..."
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm mt-1.5 resize-none"
              rows={3}
            />
          </div>
          <button
            onClick={onClose}
            disabled={!endingCash || parseFloat(endingCash) <= 0}
            className="w-full px-6 py-3 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Close Shift
          </button>
        </div>
      </div>
    </div>
  )
}
