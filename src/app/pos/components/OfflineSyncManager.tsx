'use client'
import { useState, useEffect, useCallback } from 'react'
import { Upload, RefreshCw, CheckCircle, AlertTriangle, Wifi, ChevronDown, Clock } from 'lucide-react'
import { getUnsyncedOrders, getUnsyncedOrdersWithTempNumbers, markOrderSynced, markOrderSyncedWithRealInfo, markOrderSyncFailed } from '@/lib/pos-db'
import { isOnline, onOnlineChange } from '@/lib/offline'

export default function OfflineSyncManager() {
  const [pending, setPending] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number } | null>(null)
  const [result, setResult] = useState<{ ok: number; fail: number } | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [offlineOrders, setOfflineOrders] = useState<any[]>([])

  const refreshPending = useCallback(async () => {
    try {
      const [legacy, rich] = await Promise.all([
        getUnsyncedOrders(),
        getUnsyncedOrdersWithTempNumbers(),
      ])
      setPending(legacy.length + rich.length)
      setOfflineOrders(rich)
    } catch { setPending(0); setOfflineOrders([]) }
  }, [])

  useEffect(() => { refreshPending() }, [refreshPending])

  const syncAll = useCallback(async () => {
    if (syncing) return
    setSyncing(true)
    setResult(null)
    setSyncProgress(null)
    let ok = 0
    let fail = 0
    try {
      const [legacyOrders, richOrders] = await Promise.all([
        getUnsyncedOrders(),
        getUnsyncedOrdersWithTempNumbers(),
      ])
      const total = legacyOrders.length + richOrders.length
      setSyncProgress({ current: 0, total })
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
        setSyncProgress((p) => p ? { ...p, current: p.current + 1 } : null)
      }
      for (const order of richOrders) {
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
            await markOrderSyncedWithRealInfo(order.tempReceiptNumber, data.order?.receiptNumber || '', data.orderId)
            ok++
          } else {
            await markOrderSyncFailed(order.tempReceiptNumber)
            fail++
          }
        } catch {
          await markOrderSyncFailed(order.tempReceiptNumber)
          fail++
        }
        setSyncProgress((p) => p ? { ...p, current: p.current + 1 } : null)
      }
    } catch { fail = pending }
    setSyncing(false)
    setSyncProgress(null)
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

  useEffect(() => {
    const unsub = onOnlineChange((online) => {
      if (online) { refreshPending(); syncAll() }
    })
    return unsub
  }, [refreshPending, syncAll])

  const statusInfo = syncing
    ? { border: 'border-gold/30', bg: 'bg-gold/[0.04]', icon: RefreshCw, iconClass: 'text-gold animate-spin', text: syncProgress ? `Syncing ${syncProgress.current + 1}/${syncProgress.total}` : 'Syncing...' }
    : pending > 0 && result?.fail && result.fail > 0
      ? { border: 'border-red-500/30', bg: 'bg-red-500/[0.04]', icon: AlertTriangle, iconClass: 'text-red-400', text: `${result.ok} synced, ${result.fail} failed` }
      : result?.ok && result.ok > 0
        ? { border: 'border-emerald-500/30', bg: 'bg-emerald-500/[0.04]', icon: CheckCircle, iconClass: 'text-emerald-400', text: `${result.ok} order${result.ok !== 1 ? 's' : ''} synced` }
        : pending > 0
          ? { border: 'border-amber-500/30', bg: 'bg-amber-500/[0.04]', icon: Upload, iconClass: 'text-amber-400', text: `${pending} order${pending !== 1 ? 's' : ''} pending sync` }
          : { border: 'border-white/5', bg: 'bg-transparent', icon: Wifi, iconClass: 'text-emerald-400/50', text: 'All orders synced' }

  const Icon = statusInfo.icon

  return (
    <div className={'mt-2 flex-shrink-0 rounded-xl overflow-hidden border transition-all duration-300 ' + statusInfo.border + ' ' + statusInfo.bg}>
      <div className="px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={'h-6 w-6 rounded-lg flex items-center justify-center ' + (syncing ? 'bg-gold/10' : pending > 0 && result?.fail && result.fail > 0 ? 'bg-red-500/10' : result?.ok && result.ok > 0 ? 'bg-emerald-500/10' : pending > 0 ? 'bg-amber-500/10' : 'bg-white/5')}>
              <Icon className={'h-3.5 w-3.5 ' + statusInfo.iconClass} />
            </div>
            <div>
              <p className={'text-xs font-medium leading-tight ' + (syncing ? 'text-gold' : pending > 0 ? 'text-amber-300' : result?.ok && result.ok > 0 ? 'text-emerald-300' : 'text-white/50')}>{statusInfo.text}</p>
              {!syncing && !result && pending === 0 && (
                <p className="text-[10px] text-white/20 leading-tight mt-0.5">No pending orders to sync</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {offlineOrders.length > 0 && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className={'flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all ' + (showDetails ? 'bg-white/10 text-white/60' : 'text-white/30 hover:text-white/60 hover:bg-white/5')}
              >
                <ChevronDown className={'h-3 w-3 transition-transform duration-200 ' + (showDetails ? 'rotate-180' : '')} />
                {offlineOrders.length}
              </button>
            )}
            <button
              onClick={syncAll}
              disabled={syncing}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gold/20 text-gold text-[11px] font-semibold hover:bg-gold/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_10px_-4px_rgba(212,175,55,0.15)]"
            >
              <RefreshCw className={'h-3 w-3 ' + (syncing ? 'animate-spin' : '')} />
              {syncing ? 'Syncing' : 'Sync'}
            </button>
          </div>
        </div>
        {syncing && syncProgress && (
          <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold/60 to-gold transition-all duration-300"
              style={{ width: `${((syncProgress.current + 1) / syncProgress.total) * 100}%` }}
            />
          </div>
        )}
      </div>
      {showDetails && offlineOrders.length > 0 && (
        <div className="border-t border-white/5 mx-3">
          <div className="py-2 space-y-1">
            <p className="text-[10px] text-white/20 font-medium uppercase tracking-wider pb-1">Pending Offline Orders</p>
            {offlineOrders.map((o, i) => (
              <div key={o.tempReceiptNumber || i} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-white/[0.02] hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-amber-400/80 font-mono text-[11px] font-medium">{o.tempReceiptNumber}</span>
                  <span className="text-white/25 text-[10px]">{o.items?.length || 0} item{(o.items?.length || 0) !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-white/50 text-[11px] font-mono">E£{o.total?.toFixed(2)}</span>
                  <Clock className="h-3 w-3 text-white/20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
