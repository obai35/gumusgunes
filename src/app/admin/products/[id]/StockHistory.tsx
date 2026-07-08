'use client'

import { useEffect, useState } from 'react'
import { History } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface StockHistoryProps {
  productId: string
}

export default function StockHistory({ productId }: StockHistoryProps) {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/inventory/logs?productId=${productId}`)
      .then((r) => r.json())
      .then(setLogs)
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
  }, [productId])

  if (loading) return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  )

  const typeColors: Record<string, string> = {
    SALE: 'bg-red-100 text-red-700',
    RETURN: 'bg-green-100 text-green-700',
    ADJUSTMENT: 'bg-blue-100 text-blue-700',
    TRANSFER: 'bg-purple-100 text-purple-700',
  }

  return (
    <div className="bg-white rounded-xl border border-border p-5 mt-6">
      <h2 className="font-display font-semibold text-navy mb-4 flex items-center gap-2">
        <History className="h-5 w-5" /> Stock History
      </h2>
      {logs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No stock history</p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {logs.map((log: any) => (
            <div key={log.id} className="flex items-center justify-between text-sm py-2 border-b border-border/50 last:border-0">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[log.type] || 'bg-gray-100 text-gray-700'}`}>{log.type}</span>
                <span className="text-muted-foreground">{log.note || '—'}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-medium ${log.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {log.change > 0 ? '+' : ''}{log.change}
                </span>
                <span className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
