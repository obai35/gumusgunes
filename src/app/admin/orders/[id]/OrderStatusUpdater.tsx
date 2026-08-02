'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
const PAYMENT_STATUSES = ['pending', 'paid', 'refunded']

export function OrderStatusUpdater({ orderId, currentStatus, paymentStatus: currentPayment }: { orderId: string; currentStatus: string; paymentStatus: string }) {
  const [status, setStatus] = useState(currentStatus)
  const [paymentStatus, setPaymentStatus] = useState(currentPayment)
  const router = useRouter()
  const { ta } = useAdminTranslate()

  async function updateStatus(field: string, value: string) {
    const res = await fetch('/api/orders/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, field, value }),
    })
    if (res.ok) {
      toast.success(ta(`${field} updated to ${value}`))
      router.refresh()
    } else {
      toast.error(ta('Failed to update'))
    }
  }

  return (
    <div className="flex gap-3">
      <select
        value={status} onChange={(e) => { setStatus(e.target.value); updateStatus('status', e.target.value) }}
        className="px-3 py-2 rounded-lg border border-border text-sm bg-white"
      >
        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <select
        value={paymentStatus} onChange={(e) => { setPaymentStatus(e.target.value); updateStatus('paymentStatus', e.target.value) }}
        className="px-3 py-2 rounded-lg border border-border text-sm bg-white"
      >
        {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  )
}
