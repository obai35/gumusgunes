'use client'
import { useState, useEffect, useCallback } from 'react'
import { Upload, RefreshCw, CheckCircle, AlertTriangle, Wifi } from 'lucide-react'
import { getUnsyncedOrders, markOrderSynced, getUnsyncedOfflineOrders, markOfflineOrderSynced, markOfflineOrderFailed } from '@/lib/pos-db'
import { isOnline, onOnlineChange } from '@/lib/offline'

export default function OfflineSyncManager() {
  const [pending, setPending] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<{ ok: number; fail: number } | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [offlineOrders, setOfflineOrders] = useState<any[]>([])

  const refreshPending = useCallback(async () => {
    try {
      const [legacy, offOrders] = await Promise.all([
        getUnsyncedOrders(),
        getUnsyncedOfflineOrders(),
      ])
      setPending(legacy.length + offOrders.length)
      setOfflineOrders(offOrders)
    } catch { setPending(0); setOfflineOrders([]) }
  }, [])

  useEffect(() => { refreshPending() }, [refreshPending])

  useEffect(() => {
    const unsub = onOnlineChange((online) => {
      if (online) { refreshPending(); syncAll() }
    })
    return unsub
  }, [refreshPending])

  const syncAll = useCallback(async () => {
    if (syncing) return
    setSyncing(true)
    setResult(null)
    let ok = 0
    let fail = 0
    try {
      const [legacyOrders, offOrders] = await Promise.all([
        getUnsyncedOrders(),
        getUnsyncedOfflineOrders(),
      ])
      for (const order of legacyOrders) {
        try {
          const res = await fetch('/api/admin/pos/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order),
          })
          if (res.ok) {
            await markOrderSynced(order.id)
            ok++
          } else { fail++ }
        } catch { fail++ }
      }
      for (const order of offOrders) {
        try {
          const body: any = {
            items: order.items,
            discountCode: order.discountCode || undefined,
            paymentMethod: order.paymentMethod,
            shiftId: order.shiftId || undefined,
            notes: order.notes || undefined,
          }
          if (order.customerId) body.customerId = order.customerId
          if (order.customerName) body.customerName = order.customerName
          if (order.customerEmail) body.customerEmail = order.customerEmail
          if (order.customerPhone) body.customerPhone = order.customerPhone
          if (order.cashAmount != null && (order.paymentMethod === 'cash' || order.paymentMethod === 'split')) body.cashAmount = order.cashAmount
          if (order.cardAmount != null && order.paymentMethod === 'split') body.cardAmount = order.cardAmount
          const res = await fetch('/api/admin/pos/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
          if (res.ok) {
            const data = await res.json()
            await markOfflineOrderSynced(order.id!, data.orderId, data.order?.receiptNumber || '')
            ok++
          } else {
            await markOfflineOrderFailed(order.id!)
            fail++
          }
        } catch {
          await markOfflineOrderFailed(order.id!)
          fail++
        }
      }
    } catch { fail = pending }
    setSyncing(false)
    if (ok === 0 && fail === 0) {
      setResult(null)
    } else {
      setResult({ ok, fail })
      if (fail === 0) {
        setTimeout(() => setResult(null), 6000)
      }
    }
    await refreshPending()
  }, [syncing, pending, refreshPending])

  return (
    <div className={`mt-2 flex-shrink-0 rounded-lg border px-3 py-2 text-xs transition-all ${
      pending > 0
        ? result?.fail && result.fail > 0
          ? 'border-red-500/30 bg-red-500/5'
          : result && result.ok > 0
            ? 'border-emerald-500/30 bg-emerald-500/5'
            : 'border-amber-500/30 bg-amber-500/5'
        : 'border-white/5 bg-white/[0.02]'
    }`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-white/60 min-w-0">
          {syncing ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-gold shrink-0" />
          ) : pending > 0 && result?.fail && result.fail > 0 ? (
            <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
          ) : result?.ok && result.ok > 0 ? (
            <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          ) : pending > 0 ? (
            <Upload className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          ) : (
            <Wifi className="h-3.5 w-3.5 text-emerald-400/60 shrink-0" />
          )}
          <span className="truncate">
            {syncing
              ? 'Syncing...'
              : result
                ? result.fail > 0
                  ? `${result.ok} synced, ${result.fail} failed`
                  : `${result.ok} order${result.ok !== 1 ? 's' : ''} synced`
                : pending > 0
                  ? `${pending} order${pending !== 1 ? 's' : ''} pending`
                  : 'Online'
            }
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {(pending > 0 || offlineOrders.length > 0) && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-1.5 py-1 rounded text-white/30 hover:text-white/60 text-[11px]"
            >
              {showDetails ? 'Hide' : 'Details'}
            </button>
          )}
          <button
            onClick={syncAll}
            disabled={syncing}
            className="flex items-center gap-1 px-2 py-1 rounded bg-gold/20 text-gold text-[11px] font-medium hover:bg-gold/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync'}
          </button>
        </div>
      </div>
      {showDetails && offlineOrders.length > 0 && (
        <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
          <p className="text-[10px] text-white/20 font-medium uppercase tracking-wider">Pending Offline Orders</p>
          {offlineOrders.map((o) => (
            <div key={o.id} className="flex items-center justify-between text-[11px]">
              <span className="text-amber-400/80 font-mono">{o.tempReceiptNumber}</span>
              <span className="text-white/40">E£{o.total?.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
