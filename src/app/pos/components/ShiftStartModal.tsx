'use client'

import { Clock } from 'lucide-react'

type Props = {
  startingCash: string
  onStartingCashChange: (value: string) => void
  onStartShift: () => void
}

export default function ShiftStartModal({ startingCash, onStartingCashChange, onStartShift }: Props) {
  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="bg-white rounded-xl border border-border shadow-sm w-full max-w-md p-8 text-center">
        <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-5">
          <Clock className="h-8 w-8 text-gold" />
        </div>
        <h2 className="text-2xl font-bold text-navy mb-2">Start Your Shift</h2>
        <p className="text-sm text-muted-foreground mb-6">Open a shift to begin processing sales</p>
        <div className="mb-5 text-left">
          <label className="text-sm text-muted-foreground font-medium">Starting Cash</label>
          <div className="relative mt-1.5">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={startingCash}
              onChange={(e) => onStartingCashChange(e.target.value)}
              placeholder="0.00"
              className="w-full pl-7 pr-3 py-2.5 border border-border rounded-lg text-sm"
            />
          </div>
        </div>
        <button onClick={onStartShift} className="w-full px-6 py-3 bg-gold text-navy font-bold rounded-lg text-sm hover:bg-gold/90 transition-colors">
          Start Shift
        </button>
      </div>
    </div>
  )
}
