'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Search, Undo2, ChevronDown, ChevronRight } from 'lucide-react'

type Props = {
  shiftId: string
  branchId?: string
  returnOrderId?: string | null
  onReturnOrderIdConsumed?: () => void
}

type OrderItem = {
  id: string
  productId: string
  quantity: number
  price: number
  product: { name: string; sku: string }
}

type ReturnItem = {
  id: string
  orderNumber: string
  fullName: string
  totalAmount: number
  createdAt: string
  status: string
  items?: OrderItem[]
}

export default function ReturnsTab({ shiftId, branchId, returnOrderId, onReturnOrderIdConsumed }: Props) {
  const [returns, setReturns] = useState<ReturnItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [returningId, setReturningId] = useState<string | null>(null)
  const [returnQtys, setReturnQtys] = useState<Record<string, number>>({})

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

  function initReturnQtys(order: ReturnItem) {
    const q: Record<string, number> = {}
    order.items?.forEach(i => { q[i.id] = i.quantity })
    setReturnQtys(q)
  }

  function handleExpand(orderId: string, order: ReturnItem) {
    if (expandedId === orderId) {
      setExpandedId(null)
      setReturnQtys({})
    } else {
      setExpandedId(orderId)
      initReturnQtys(order)
    }
  }

  function selectedCount(order: ReturnItem): number {
    let count = 0
    order.items?.forEach(i => {
      if (returnQtys[i.id] && returnQtys[i.id] > 0) count += returnQtys[i.id]
    })
    return count
  }

  function anySelected(order: ReturnItem): boolean {
    return selectedCount(order) > 0
  }

  async function handlePartialReturn(order: ReturnItem) {
    const items = order.items
      ?.filter(i => returnQtys[i.id] && returnQtys[i.id] > 0)
      .map(i => ({ itemId: i.id, quantity: Math.min(returnQtys[i.id], i.quantity) }))

    if (!items || items.length === 0) {
      toast.error('Select at least one item to return')
      return
    }

    const isFullReturn = items.length === order.items?.length &&
      items.every(it => {
        const orig = order.items!.find(i => i.id === it.itemId)
        return orig && it.quantity >= orig.quantity
      })

    setReturningId(order.id)
    try {
      const res = await fetch('/api/admin/pos/checkout', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          action: 'return',
          items,
          fullReturn: isFullReturn,
        }),
      })
      if (res.ok) {
        toast.success(isFullReturn ? 'Order fully returned' : 'Items returned successfully')
        if (isFullReturn) {
          setReturns(prev => prev.filter(r => r.id !== order.id))
        } else {
          const data = await res.json()
          if (data.order) {
            setReturns(prev => prev.map(r => r.id === order.id ? data.order : r))
          }
          setExpandedId(null)
          setReturnQtys({})
        }
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to return order')
      }
    } catch {
      toast.error('Failed to return order')
    } finally {
      setReturningId(null)
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
            placeholder="Search orders for return..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-silver-soft text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-gold/30"
          />
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map(r => {
          const isExpanded = expandedId === r.id
          const isReturning = returningId === r.id
          const hasSelection = isExpanded && anySelected(r)
          const selCount = isExpanded ? selectedCount(r) : 0
          return (
            <div key={r.id}>
              <div
                onClick={() => handleExpand(r.id, r)}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-white/30" /> : <ChevronRight className="h-3.5 w-3.5 text-white/30" />}
                  <div>
                    <p className="text-sm text-silver-soft font-medium">{r.orderNumber}</p>
                    <p className="text-xs text-white/50">{r.fullName} — ${r.totalAmount.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === 'cancelled' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                    {r.status}
                  </span>
                </div>
              </div>
              {isExpanded && r.items && (
                <div className="ml-4 mt-1 p-3 rounded-lg bg-white/[0.03] border border-white/5 space-y-2">
                  <p className="text-xs text-white/40 font-medium">Select items & quantities to return</p>
                  {r.items.map(item => {
                    const qty = returnQtys[item.id] ?? item.quantity
                    return (
                      <div key={item.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={qty > 0}
                              onChange={e => {
                                setReturnQtys(prev => ({ ...prev, [item.id]: e.target.checked ? item.quantity : 0 }))
                              }}
                              className="accent-gold"
                            />
                            <span className="text-silver-soft truncate">{item.product.name}</span>
                          </label>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {qty > 0 && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setReturnQtys(prev => ({ ...prev, [item.id]: Math.max(0, qty - 1) }))}
                                className="w-5 h-5 rounded bg-white/10 text-white/60 hover:bg-white/20 flex items-center justify-center text-xs"
                              >-</button>
                              <input
                                type="number"
                                min={0}
                                max={item.quantity}
                                value={qty}
                                onChange={e => {
                                  const v = parseInt(e.target.value) || 0
                                  setReturnQtys(prev => ({ ...prev, [item.id]: Math.max(0, Math.min(item.quantity, v)) }))
                                }}
                                className="w-10 text-center bg-white/5 border border-white/10 rounded text-silver-soft text-xs py-0.5"
                              />
                              <button
                                onClick={() => setReturnQtys(prev => ({ ...prev, [item.id]: Math.min(item.quantity, qty + 1) }))}
                                className="w-5 h-5 rounded bg-white/10 text-white/60 hover:bg-white/20 flex items-center justify-center text-xs"
                              >+</button>
                            </div>
                          )}
                          <span className="text-white/40 w-12 text-right">/ {item.quantity}</span>
                          <span className="text-silver-soft w-16 text-right">${(item.price * qty).toFixed(2)}</span>
                        </div>
                      </div>
                    )
                  })}
                  {hasSelection && (
                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <span className="text-xs text-white/50">Returning {selCount} item{selCount !== 1 ? 's' : ''}</span>
                      <button
                        onClick={() => handlePartialReturn(r)}
                        disabled={isReturning}
                        className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30 transition-all disabled:opacity-50"
                      >
                        <Undo2 className={`h-3 w-3 ${isReturning ? 'animate-spin' : ''}`} />
                        {isReturning ? 'Processing...' : 'Return Selected'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {!loading && filtered.length === 0 && (
          <p className="text-center text-white/30 text-sm py-8">No orders found</p>
        )}
      </div>
    </div>
  )
}
