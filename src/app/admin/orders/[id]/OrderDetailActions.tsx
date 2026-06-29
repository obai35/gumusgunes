'use client'

import { useState } from 'react'
import ReturnModal from './ReturnModal'
import EditOrderModal from './EditOrderModal'

interface OrderDetailActionsProps {
  orderId: string
  items: Array<{ id: string; productId: string; product: { name: string }; quantity: number; price: number }>
  customer: { fullName: string; phone: string | null; address: string; city: string; postalCode: string; notes: string | null }
  adminId: string
}

export default function OrderDetailActions({ orderId, items, customer, adminId }: OrderDetailActionsProps) {
  const [showReturn, setShowReturn] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  return (
    <>
      <div className="flex flex-col gap-2">
        <button onClick={() => setShowReturn(true)} className="w-full px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
          Process Return
        </button>
        <button onClick={() => setShowEdit(true)} className="w-full px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">
          Edit Order
        </button>
      </div>
      {showReturn && <ReturnModal orderId={orderId} items={items} adminId={adminId} onClose={() => setShowReturn(false)} onSuccess={() => window.location.reload()} />}
      {showEdit && <EditOrderModal orderId={orderId} items={items} customer={customer} adminId={adminId} onClose={() => setShowEdit(false)} onSuccess={() => window.location.reload()} />}
    </>
  )
}
