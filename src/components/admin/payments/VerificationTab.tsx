'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { CheckCircle, XCircle } from 'lucide-react'

type Order = {
  id: string; orderNumber: string; fullName: string; totalAmount: number
  paymentMethod: string; paymentReference: string | null; walletProvider: string | null
  createdAt: string; notes: string | null
}

export default function VerificationTab() {
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => { fetchOrders() }, [])

  async function fetchOrders() {
    const res = await fetch('/api/admin/payments/verifications')
    if (res.ok) { const d = await res.json(); setOrders(d.orders); setTotal(d.total) }
    setLoading(false)
  }

  async function handleVerify(orderId: string) {
    const res = await fetch('/api/admin/payments/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId }) })
    if (res.ok) { toast.success('Payment verified'); fetchOrders() }
    else toast.error('Failed to verify')
  }

  async function handleReject(orderId: string) {
    const res = await fetch('/api/admin/payments/reject', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId, reason: rejectReason }) })
    if (res.ok) { toast.success('Payment rejected'); setRejectId(null); setRejectReason(''); fetchOrders() }
    else toast.error('Failed to reject')
  }

  if (loading) return <div className="text-muted-foreground text-sm">Loading...</div>

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <p className="text-sm text-muted-foreground">{total} orders awaiting verification</p>
      </div>
      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">No pending verifications.</p>
      ) : (
        <div className="space-y-3">
          {orders.map(o => (
            <div key={o.id} className="bg-white rounded-xl border border-border p-4">
              <div className="flex items-start justify-between">
                <div className="text-sm space-y-1">
                  <p className="font-medium text-navy">{o.orderNumber}</p>
                  <p className="text-muted-foreground">{o.fullName}</p>
                  <p className="text-navy font-semibold">E£{o.totalAmount.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.paymentMethod}
                    {o.walletProvider && ` — ${o.walletProvider}`}
                    {o.paymentReference && ` — Ref: ${o.paymentReference}`}
                  </p>
                  <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleVerify(o.id)} className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100">
                    <CheckCircle className="h-3.5 w-3.5" /> Approve
                  </button>
                  <button onClick={() => setRejectId(rejectId === o.id ? null : o.id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100">
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              </div>
              {rejectId === o.id && (
                <div className="mt-3 flex gap-2">
                  <input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason for rejection..." className="flex-1 px-3 py-1.5 border border-border rounded-lg text-sm" />
                  <button onClick={() => handleReject(o.id)} disabled={!rejectReason.trim()} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium disabled:opacity-50">Confirm</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
