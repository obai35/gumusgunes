'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ShieldCheck, XCircle } from 'lucide-react'

export function PaymentVerification({ orderId, paymentStatus }: { orderId: string; paymentStatus: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  if (paymentStatus !== 'awaiting_verification') return null

  async function handleVerify() {
    setLoading(true)
    const res = await fetch('/api/admin/orders/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    })
    if (res.ok) {
      toast.success('Payment verified — order is now processing')
      router.refresh()
    } else {
      toast.error('Failed to verify payment')
    }
    setLoading(false)
  }

  async function handleReject() {
    const reason = prompt('Reason for rejection (optional):')
    setLoading(true)
    const res = await fetch('/api/admin/orders/reject-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, reason }),
    })
    if (res.ok) {
      toast.success('Payment rejected')
      router.refresh()
    } else {
      toast.error('Failed to reject payment')
    }
    setLoading(false)
  }

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-orange-600" />
        <h3 className="font-semibold text-orange-800 text-sm">Payment Awaiting Verification</h3>
      </div>
      <p className="text-xs text-orange-600">Customer claims payment was sent. Verify before processing the order.</p>
      <div className="flex gap-2">
        <button
          onClick={handleVerify}
          disabled={loading}
          className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Approve Payment'}
        </button>
        <button
          onClick={handleReject}
          disabled={loading}
          className="flex-1 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 disabled:opacity-50 flex items-center justify-center gap-1"
        >
          <XCircle className="h-4 w-4" /> Reject
        </button>
      </div>
    </div>
  )
}
