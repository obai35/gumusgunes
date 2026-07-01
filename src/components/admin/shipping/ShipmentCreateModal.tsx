'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

type Props = {
  order: { id: string; orderNumber: string; fullName: string; address: string; city: string; totalAmount: number }
  onSave: (data: any) => void
  onClose: () => void
}

export default function ShipmentCreateModal({ order, onSave, onClose }: Props) {
  const [methods, setMethods] = useState<{ id: string; name: string }[]>([])
  const [methodId, setMethodId] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [shippedAt, setShippedAt] = useState(new Date().toISOString().slice(0, 10))
  const [estimatedDeliveryAt, setEstimatedDeliveryAt] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetch('/api/admin/shipping/methods').then(r => r.json()).then(d => { const m = d.methods || []; setMethods(m); if (m.length > 0) setMethodId(m[0].id) }).catch(() => {})
  }, [])

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4"><h3 className="font-semibold text-navy">Create Shipment</h3><button onClick={onClose}><X className="h-4 w-4" /></button></div>
        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm space-y-1">
          <p><span className="text-muted-foreground">Order:</span> <span className="font-medium text-navy">{order.orderNumber}</span></p>
          <p><span className="text-muted-foreground">Customer:</span> <span className="font-medium text-navy">{order.fullName}</span></p>
          <p><span className="text-muted-foreground">Address:</span> <span className="text-navy">{order.address}, {order.city}</span></p>
        </div>
        <div className="space-y-3">
          <select value={methodId} onChange={e => setMethodId(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm"><option value="">Select method</option>{methods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
          <input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="Tracking number *" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs text-muted-foreground">Shipped date</label><input value={shippedAt} onChange={e => setShippedAt(e.target.value)} type="date" className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
            <div><label className="text-xs text-muted-foreground">Est. delivery date</label><input value={estimatedDeliveryAt} onChange={e => setEstimatedDeliveryAt(e.target.value)} type="date" className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
          </div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none h-20" />
          <button onClick={() => onSave({ orderId: order.id, methodId, trackingNumber, shippedAt, estimatedDeliveryAt, notes })} disabled={!methodId || !trackingNumber} className="w-full px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium disabled:opacity-50">Create Shipment</button>
        </div>
      </div>
    </div>
  )
}
