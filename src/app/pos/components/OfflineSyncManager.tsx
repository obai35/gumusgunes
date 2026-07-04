'use client'
import { useState, useEffect, useCallback } from 'react'
import { Upload, RefreshCw, CheckCircle, AlertTriangle, Wifi } from 'lucide-react'
import { getUnsyncedOrders, markOrderSynced } from '@/lib/pos-db'
import { isOnline, onOnlineChange } from '@/lib/offline'

export default function OfflineSyncManager() {
  const [pending, setPending] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<{ ok: number; fail: number } | null>(null)

  const refreshPending = useCallback(async () => {
    try {
      const orders = await getUnsyncedOrders()
      setPending(orders.length)
    } catch { setPending(0) }
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
      const orders = await getUnsyncedOrders()
      for (const order of orders) {
        try {
          const res = await fetch('/api/admin/pos/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order),
          })
          if (res.ok) {
            await markOrderSynced(order.id)
            ok++
          } else {
            fail++
          }
        } catch { fail++ }
      }
    } catch { fail = pending }
    setSyncing(false)
    if (ok === 0 && fail === 0) {
      setResult(null)
    } else {
      setResult({ ok, fail })
      if (fail === 0) {
        setTimeout(() => setResult(null), 4000)
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
        <div className="flex items-center gap-1.5 text-white/60">
          {syncing ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-gold" />
          ) : pending > 0 && result?.fail && result.fail > 0 ? (
            <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
          ) : result?.ok && result.ok > 0 ? (
            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
          ) : pending > 0 ? (
            <Upload className="h-3.5 w-3.5 text-amber-400" />
          ) : (
            <Wifi className="h-3.5 w-3.5 text-emerald-400/60" />
          )}
          <span>
            {syncing
              ? 'Syncing...'
              : result
                ? result.fail > 0
                  ? `${result.ok} synced, ${result.fail} failed`
                  : `${result.ok} orders synced`
                : pending > 0
                  ? `${pending} order${pending !== 1 ? 's' : ''} pending sync`
                  : 'Online'
            }
          </span>
        </div>
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
  )
}
