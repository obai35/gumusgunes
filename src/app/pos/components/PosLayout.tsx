'use client'

import { memo } from 'react'
import type { ReactNode } from 'react'
import { LogOut, ClipboardList, Clock, ShoppingCart, Search, FileText, BarChart3, RotateCcw, WifiOff } from 'lucide-react'
import type { Shift } from '../types'

type TabId = 'pos' | 'orders' | 'records' | 'returns' | 'hall-sale'

type Props = {
  branchName: string
  shift: Shift | null
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  onAssessment: () => void
  onCloseShift: () => void
  onLogout: () => void
  offlineMode?: boolean
  onToggleOffline?: () => void
  children: ReactNode
}

const tabs: { id: TabId; label: string; icon: typeof ShoppingCart }[] = [
  { id: 'pos', label: 'POS', icon: ShoppingCart },
  { id: 'orders', label: 'Orders', icon: Search },
  { id: 'records', label: 'Records', icon: FileText },
  { id: 'returns', label: 'Returns', icon: RotateCcw },
  { id: 'hall-sale', label: 'Hall Sale', icon: BarChart3 },
]

function PosLayout({ branchName, shift, activeTab, onTabChange, onAssessment, onCloseShift, onLogout, offlineMode, onToggleOffline, children }: Props) {
  return (
    <div className="flex flex-col min-h-screen pos-interface navy-radial">
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full overflow-hidden ring-1 ring-gold/40">
              <img src="/gumusgunes-logo.jpeg" alt="" className="h-full w-full object-cover" />
            </div>
            <span className="font-display text-lg font-semibold text-silver-soft">Gümüş <span className="gold-text">Güneş</span></span>
          </div>
          <span className="text-white/20">|</span>
          <h1 className="font-display text-lg font-semibold text-silver-soft">{branchName}</h1>
          {offlineMode && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 text-amber-400 text-xs font-semibold rounded-full border border-amber-500/30 shadow-[0_0_12px_-4px_rgba(251,191,36,0.3)]">
              <WifiOff className="h-3 w-3" />
              Offline Mode
            </span>
          )}
          {shift && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-full border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Open since {new Date(shift.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {shift && (
            <>
              <button onClick={onAssessment} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-silver-soft hover:bg-gold/10 hover:text-gold rounded-lg transition-all border border-white/10">
                <ClipboardList className="h-4 w-4" /> Assessment
              </button>
              <button onClick={onCloseShift} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-all border border-white/10">
                <Clock className="h-4 w-4" /> Close Shift
              </button>
            </>
          )}
          <button onClick={onLogout} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab.id
                ? 'text-gold bg-gold/10 shadow-[inset_0_0_0_1px_rgba(212,175,55,0.2)]'
                : 'text-white/40 hover:text-silver-soft hover:bg-white/5'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {children}
    </div>
  )
}

export default memo(PosLayout)
