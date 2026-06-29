'use client'

import type { ReactNode } from 'react'
import { LogOut, ClipboardList, Clock } from 'lucide-react'
import type { Shift } from '../types'

type Props = {
  branchName: string
  shift: Shift | null
  onAssessment: () => void
  onCloseShift: () => void
  onLogout: () => void
  children: ReactNode
}

export default function PosLayout({ branchName, shift, onAssessment, onCloseShift, onLogout, children }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full overflow-hidden ring-1 ring-gold/30">
              <img src="/gumusgunes-logo.jpeg" alt="" className="h-full w-full object-cover" />
            </div>
            <span className="font-display text-lg font-semibold text-navy">Gümüş <span className="gold-text">Güneş</span></span>
          </div>
          <span className="text-muted-foreground">|</span>
          <h1 className="font-display text-lg font-semibold text-navy">{branchName}</h1>
          {shift && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Open since {new Date(shift.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {shift && (
            <>
              <button onClick={onAssessment} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-navy hover:bg-gold/10 rounded-lg transition-colors border border-border">
                <ClipboardList className="h-4 w-4" /> Assessment
              </button>
              <button onClick={onCloseShift} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-border">
                <Clock className="h-4 w-4" /> Close Shift
              </button>
            </>
          )}
          <button onClick={onLogout} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </div>
      {children}
    </div>
  )
}
