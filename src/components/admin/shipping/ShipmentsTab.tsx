'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import ShipmentCreateModal from './ShipmentCreateModal'

export default function ShipmentsTab() {
  const [data, setData] = useState<{ shipments: any[]; pendingOrders: any[] }>({ shipments: [], pendingOrders: [] })
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [filter, setFilter] = useState('pending')

  useEffect(() => { fetchData() }, [filter])

  async function fetchData() {
    const res = await fetch(`/api/admin/shipping/shipments?filter=${filter}`)
    if (res.ok) setData(await res.json())
    setLoading(false)
  }

  async function handleCreateShipment(body: any) {
    const res = await fetch('/api/admin/shipping/shipments/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) { toast.success('Shipment created'); setSelectedOrder(null); fetchData() }
    else { const e = await res.json(); toast.error(e.error || 'Failed') }
  }

  if (loading) return <div className="text-muted-foreground text-sm">Loading...</div>

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setFilter('pending')} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === 'pending' ? 'bg-navy text-silver' : 'bg-gray-100 text-muted-foreground'}`}>Pending Shipment</button>
        <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === 'all' ? 'bg-navy text-silver' : 'bg-gray-100 text-muted-foreground'}`}>All Shipments</button>
      </div>

      {filter === 'pending' && data.pendingOrders.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-navy mb-3">Orders Awaiting Shipment</h3>
          <div className="space-y-2">
            {Array.isArray(data.pendingOrders) && data.pendingOrders.map(o => (
              <div key={o.id} className="bg-white rounded-xl border border-border p-4 flex items-center justify-between">
                <div className="text-sm">
                  <p className="font-medium text-navy">{o.orderNumber}</p>
                  <p className="text-muted-foreground">{o.fullName} — {o.city} — E£{o.totalAmount.toFixed(2)}</p>
                </div>
                <button onClick={() => setSelectedOrder(o)} className="px-3 py-1.5 bg-navy text-silver rounded-lg text-xs font-medium">Create Shipment</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {filter === 'all' && (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-gray-50/50"><th className="text-left px-4 py-3 text-muted-foreground font-medium">Order</th><th className="text-left px-4 py-3 text-muted-foreground font-medium">Customer</th><th className="text-left px-4 py-3 text-muted-foreground font-medium">Method</th><th className="text-left px-4 py-3 text-muted-foreground font-medium">Tracking</th><th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th><th className="text-left px-4 py-3 text-muted-foreground font-medium">Shipped</th><th className="text-left px-4 py-3 text-muted-foreground font-medium">Label</th></tr></thead>
            <tbody>
              {Array.isArray(data.shipments) && data.shipments.map(s => (
                <tr key={s.id} className="border-b border-border/50">
                  <td className="px-4 py-3 font-medium text-navy">{s.order.orderNumber}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.order.fullName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.method?.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-navy">{s.trackingNumber}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${s.status === 'delivered' ? 'bg-green-50 text-green-700' : s.status === 'shipped' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>{s.status}</span></td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{s.shippedAt ? new Date(s.shippedAt).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => window.open(`/api/admin/shipping/shipments/${s.id}/label`, '_blank')} className="text-xs text-gold hover:text-gold/80 font-medium">Print Label</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrder && <ShipmentCreateModal order={selectedOrder} onSave={handleCreateShipment} onClose={() => setSelectedOrder(null)} />}
    </div>
  )
}
