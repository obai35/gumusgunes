'use client'

import { posFetch } from '@/lib/pos-client-fetch'
import { useState, useEffect } from 'react'
import { X, Calculator } from 'lucide-react'

type Props = {
  endingCash: string
  onEndingCashChange: (value: string) => void
  shiftNotes: string
  onShiftNotesChange: (value: string) => void
  onClose: () => void
  onCancel: () => void
  shiftId?: string
}

type ShiftSummary = {
  startingCash: number
  totalCash: number
  totalCard: number
  totalBankTransfer: number
  totalInstapay: number
  totalWallet: number
  totalExpenses: number
  totalRefunds: number
  cashRefunds: number
  cashExpenses: number
  orderCount: number
  totalSales: number
}

const DENOMINATIONS = [
  { label: '200 EGP', value: 200 },
  { label: '100 EGP', value: 100 },
  { label: '50 EGP', value: 50 },
  { label: '20 EGP', value: 20 },
  { label: '10 EGP', value: 10 },
  { label: '5 EGP', value: 5 },
  { label: '1 EGP', value: 1 },
  { label: '0.50', value: 0.5 },
  { label: '0.25', value: 0.25 },
]

export default function ShiftCloseModal({ endingCash, onEndingCashChange, shiftNotes, onShiftNotesChange, onClose, onCancel, shiftId }: Props) {
  const [summary, setSummary] = useState<ShiftSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState<Record<number, string>>({})
  const [useCount, setUseCount] = useState(false)

  useEffect(() => {
    if (!shiftId) { setLoading(false); return }
    posFetch(`/api/admin/pos/shifts/hall-sale?shiftId=${shiftId}`)
      .then((res) => res.json())
      .then((data) => {
        const totalRefunds = data.totalRefunds || 0
        const cashRefunds = data.refundsByMethod?.cash || 0
        const cashExpenses = data.expensesByMethod?.cash || 0
        const income = data.incomeByMethod || {}
        setSummary({
          startingCash: data.shift?.startingCash || 0,
          totalCash: income.cash || 0,
          totalCard: income.card || 0,
          totalBankTransfer: income.bank_transfer || 0,
          totalInstapay: income.instapay || 0,
          totalWallet: income.wallet || 0,
          totalExpenses: data.totalExpenses || 0,
          totalRefunds,
          cashRefunds,
          cashExpenses,
          orderCount: data.shift?.orderCount || 0,
          totalSales: data.totalIncome || 0,
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [shiftId])

  const expectedCash = summary
    ? summary.startingCash + summary.totalCash - summary.cashRefunds - summary.cashExpenses
    : 0

  const parsedEnding = parseFloat(endingCash) || 0
  const difference = parsedEnding - expectedCash

  const countedTotal = Object.entries(counts).reduce((sum, [denom, countStr]) => {
    return sum + parseFloat(denom) * (parseFloat(countStr) || 0)
  }, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="pos-glass-strong rounded-xl w-full max-w-lg p-6 mx-4 max-h-[90vh] overflow-y-auto scroll-luxury">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-silver-soft">Close Shift</h2>
          <button onClick={onCancel} className="text-white/40 hover:text-silver-soft"><X className="h-5 w-5" /></button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-white/40">Loading shift summary...</div>
        ) : summary ? (
          <div className="space-y-4">
            <div className="pos-glass rounded-lg p-3 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-white/50">Total Sales</span><span className="text-silver-soft font-medium">E£{summary.totalSales.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-white/50">Order Count</span><span className="text-silver-soft font-medium">{summary.orderCount}</span></div>
              <div className="border-t border-white/10 pt-1.5 space-y-1">
                <div className="flex justify-between"><span className="text-white/40">Cash Sales</span><span className="text-emerald-400 font-medium">E£{summary.totalCash.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-white/40">Card Sales</span><span className="text-blue-400 font-medium">E£{summary.totalCard.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-white/40">Bank Transfer</span><span className="text-purple-400 font-medium">E£{summary.totalBankTransfer.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-white/40">InstaPay</span><span className="text-amber-400 font-medium">E£{summary.totalInstapay.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-white/40">Wallet</span><span className="text-cyan-400 font-medium">E£{summary.totalWallet.toFixed(2)}</span></div>
              </div>
              {summary.totalRefunds > 0 && (
                <div className="flex justify-between border-t border-white/10 pt-1.5"><span className="text-white/40">Total Refunds</span><span className="text-red-400 font-medium">-E£{summary.totalRefunds.toFixed(2)}</span></div>
              )}
              {summary.totalExpenses > 0 && (
                <div className="flex justify-between"><span className="text-white/40">Expenses</span><span className="text-red-400 font-medium">-E£{summary.totalExpenses.toFixed(2)}</span></div>
              )}
            </div>

            <div className="pos-glass rounded-lg p-3">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2">Cash Reconciliation</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-white/50">Starting Cash</span><span className="text-silver-soft font-medium">E£{summary.startingCash.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-white/50">+ Cash Sales</span><span className="text-emerald-400 font-medium">+E£{summary.totalCash.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-white/50">- Cash Refunds</span><span className="text-red-400 font-medium">-E£{summary.cashRefunds.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-white/50">- Cash Expenses</span><span className="text-red-400 font-medium">-E£{summary.cashExpenses.toFixed(2)}</span></div>
                <div className="border-t border-white/10 pt-1.5 flex justify-between font-semibold">
                  <span className="text-silver-soft">Expected Cash</span>
                  <span className="text-gold">E£{expectedCash.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="pos-glass rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-white/50 font-medium">Actual Ending Cash *</label>
                <button
                  onClick={() => setUseCount(!useCount)}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-all ${useCount ? 'bg-gold/20 text-gold' : 'text-white/40 hover:text-white/60'}`}
                >
                  <Calculator className="h-3.5 w-3.5" /> Count
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">E£</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={useCount ? countedTotal.toFixed(2) : endingCash}
                  onChange={(e) => { if (!useCount) onEndingCashChange(e.target.value) }}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-silver-soft placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all"
                  readOnly={useCount}
                />
              </div>

              {useCount && (
                <div className="mt-3 space-y-1.5">
                  {DENOMINATIONS.map((d) => (
                    <div key={d.value} className="flex items-center gap-2">
                      <span className="w-16 text-xs text-white/40 font-medium">{d.label}</span>
                      <span className="text-white/20">×</span>
                      <input
                        type="number"
                        min="0"
                        value={counts[d.value] || ''}
                        onChange={(e) => setCounts((prev) => ({ ...prev, [d.value]: e.target.value }))}
                        placeholder="0"
                        className="w-16 px-2 py-1 rounded bg-white/5 border border-white/10 text-silver-soft text-xs text-center placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-gold/30"
                      />
                      <span className="text-xs text-white/30">= E£{((parseFloat(counts[d.value] || '0') || 0) * d.value).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t border-white/10 pt-1.5 flex justify-between text-sm font-semibold">
                    <span className="text-silver-soft">Counted Total</span>
                    <span className="text-gold">E£{countedTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {parsedEnding > 0 && (
              <div className={`flex justify-between items-center px-3 py-2.5 rounded-lg border text-sm ${difference >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <div>
                  <span className={difference >= 0 ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'}>
                    {difference >= 0 ? 'Over' : 'Short'}
                  </span>
                  <span className="text-white/40 text-xs ml-2">(E£{expectedCash.toFixed(2)} expected)</span>
                </div>
                <span className={`font-bold text-lg ${difference >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {difference >= 0 ? '+' : ''}E£{difference.toFixed(2)}
                </span>
              </div>
            )}

            <div>
              <label className="text-sm text-white/50 font-medium">Notes (optional)</label>
              <textarea
                value={shiftNotes}
                onChange={(e) => onShiftNotesChange(e.target.value)}
                placeholder="Any notes about this shift..."
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-silver-soft placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all mt-1.5 resize-none"
                rows={2}
              />
            </div>

            <button
              onClick={onClose}
              disabled={!endingCash || parseFloat(endingCash) <= 0 || (!parsedEnding && !useCount)}
              className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg text-sm font-bold hover:from-red-500 hover:to-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-500/20"
            >
              Close Shift
            </button>
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-red-400">Failed to load shift summary</div>
        )}
      </div>
    </div>
  )
}
