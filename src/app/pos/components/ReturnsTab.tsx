'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Search, X, Undo2, Printer } from 'lucide-react'

type Props = {
  shiftId: string
  branchId?: string
  returnOrderId?: string | null
  onReturnOrderIdConsumed?: () => void
}

type ReturnItem = {
  id: string
  orderNumber: string
  fullName: string
  totalAmount: number
  createdAt: string
  status: string
}

export default function ReturnsTab({ shiftId, branchId, returnOrderId, onReturnOrderIdConsumed }: Props) {
  const [returns, setReturns] = useState<ReturnItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams({ branchId: branchId || '', shiftId })
    if (returnOrderId) params.set('q', returnOrderId)
    fetch(`/api/admin/pos/orders/search?${params}`)
      .then(r => r.json())
      .then(data => {
        if (data.orders) setReturns(data.orders)
      })
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false))
  }, [shiftId, branchId, returnOrderId])

  useEffect(() => {
    if (returnOrderId && onReturnOrderIdConsumed) {
      onReturnOrderIdConsumed()
    }
  }, [returnOrderId, onReturnOrderIdConsumed])

  const handleVoidOrder = async (orderId: string) => {
    try {
      const res = await fetch('/api/admin/pos/checkout', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action: 'return' }),
      })
      if (res.ok) {
        toast.success('Order returned successfully')
        setReturns(prev => prev.filter(r => r.id !== orderId))
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to return order')
      }
    } catch {
      toast.error('Failed to return order')
    }
  }

  const filtered = returns.filter(r =>
    r.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    r.fullName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search returns..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-silver-soft text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-gold/30"
          />
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map(r => (
          <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
            <div>
              <p className="text-sm text-silver-soft font-medium">{r.orderNumber}</p>
              <p className="text-xs text-white/50">{r.fullName} — ${r.totalAmount.toFixed(2)}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleVoidOrder(r.id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30 transition-all"
              >
                <Undo2 className="h-3 w-3" /> Return
              </button>
            </div>
          </div>
        ))}
        {!loading && filtered.length === 0 && (
          <p className="text-center text-white/30 text-sm py-8">No returns found</p>
        )}
      </div>
    </div>
  )
}
