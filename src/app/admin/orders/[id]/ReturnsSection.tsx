'use client'

import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface ReturnsSectionProps {
  orderId: string
}

export default function ReturnsSection({ orderId }: ReturnsSectionProps) {
  const [returns, setReturns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/orders/${orderId}/returns`)
      .then((r) => r.json())
      .then((data) => setReturns(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [orderId])

  if (loading) return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="p-4 border border-border rounded-lg space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  )
  if (returns.length === 0) return null

  const refundLabels: Record<string, string> = {
    cash: 'Cash', store_credit: 'Store Credit', no_refund: 'No Refund',
  }
  const reasonLabels: Record<string, string> = {
    customer_change: 'Changed Mind', defective: 'Defective', wrong_item: 'Wrong Item', damaged: 'Damaged', other: 'Other',
  }

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <h2 className="font-display font-semibold text-navy mb-4">Returns ({returns.length})</h2>
      <div className="space-y-3">
        {Array.isArray(returns) && returns.map((ret: any) => (
          <div key={ret.id} className="border border-border rounded-lg p-3">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-navy">{ret.returnNumber}</span>
              <span className="text-muted-foreground text-xs">{new Date(ret.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex gap-3 text-xs text-muted-foreground mb-2">
              <span>Reason: {reasonLabels[ret.reason] || ret.reason}</span>
              <span>Refund: {refundLabels[ret.refundMethod]}</span>
              <span className="font-medium text-red-600">${ret.refundAmount.toFixed(2)}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {ret.items?.map((ri: any) => (
                <span key={ri.id} className="mr-3">{ri.product?.name} x{ri.quantity}</span>
              ))}
            </div>
            <div className="text-xs text-muted-foreground mt-1">By: {ret.processedBy?.name}</div>
            {ret.notes && <div className="text-xs text-muted-foreground mt-1 italic">{ret.notes}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
