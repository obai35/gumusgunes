'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle2, Package } from 'lucide-react'
import Link from 'next/link'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

type POItem = { id: string; productId: string; product: { id: string; name: string; sku: string; imageUrl: string }; quantity: number; received: number; unitCost: number }

export function POReceiveClient({ purchaseOrder }: { purchaseOrder: any }) {
  const router = useRouter()
  const [receiveValues, setReceiveValues] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()

  const statusBadge = (status: string) => {
    const m: Record<string, string> = { pending: 'bg-amber-100 text-amber-700', partial: 'bg-blue-100 text-blue-700', received: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' }
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m[status] || 'bg-gray-100 text-gray-700'}`}>{status}</span>
  }

  async function handleReceive() {
    const items = purchaseOrder.items
      .filter((i: POItem) => (receiveValues[i.id] || 0) > 0)
      .map((i: POItem) => ({ id: i.id, received: Math.min(receiveValues[i.id] || 0, i.quantity - i.received) }))

    if (!items.length) { toast.error(ta('Enter receive quantities')); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/purchase-orders/${purchaseOrder.id}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const data = await res.json()
      if (data.ok) { toast.success(ta('Stock received')); router.refresh() }
      else toast.error(data.error || ta('Receive failed'))
    } catch { toast.error(ta('Failed to receive')) }
    finally { setLoading(false) }
  }

  const totalValue = purchaseOrder.items.reduce((s: number, i: POItem) => s + i.unitCost * i.quantity, 0)

  return (
    <div>
      <Link href="/admin/purchase-orders" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-navy mb-4"><ArrowLeft className="h-4 w-4" /> {ta('Back to POs')}</Link>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-display font-semibold text-navy">{purchaseOrder.poNumber}</h1>
          {statusBadge(purchaseOrder.status)}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="font-semibold text-navy mb-4">{ta('Items')}</h2>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-3 font-medium">{ta('Product')}</th><th className="p-3 font-medium text-right">{ta('Ordered')}</th>
                <th className="p-3 font-medium text-right">{ta('Received')}</th><th className="p-3 font-medium text-right">{ta('Unit Cost')}</th>
                <th className="p-3 font-medium text-right">{ta('Subtotal')}</th>
                {purchaseOrder.status !== 'received' && purchaseOrder.status !== 'cancelled' && <th className="p-3 font-medium text-right">{ta('Receive')}</th>}
              </tr></thead>
              <tbody>
                {purchaseOrder.items.map((item: POItem) => (
                  <tr key={item.id} className="border-b border-border/50">
                    <td className="p-3 font-medium text-navy flex items-center gap-2">
                      {item.product.imageUrl && <img src={item.product.imageUrl} className="h-8 w-8 rounded object-cover" />}
                      {item.product.name} <span className="text-muted-foreground font-normal">({item.product.sku})</span>
                    </td>
                    <td className="p-3 text-right text-navy">{fmtNum(item.quantity)}</td>
                    <td className="p-3 text-right"><span className="text-green-600 font-medium">{fmtNum(item.received)}</span></td>
                    <td className="p-3 text-right text-muted-foreground">{fmtCurrency(item.unitCost)}</td>
                    <td className="p-3 text-right font-medium text-navy">{fmtCurrency(item.unitCost * item.quantity)}</td>
                    {purchaseOrder.status !== 'received' && purchaseOrder.status !== 'cancelled' && (
                      <td className="p-3 text-right">
                        <input type="number" min={0} max={item.quantity - item.received}
                          value={receiveValues[item.id] || ''}
                          onChange={e => setReceiveValues(v => ({ ...v, [item.id]: parseInt(e.target.value) || 0 }))}
                          disabled={(item.received >= item.quantity)}
                          className={`w-16 px-2 py-1 border border-border rounded text-sm text-center ${item.received >= item.quantity ? 'opacity-50' : ''}`}
                          placeholder="0"
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot><tr className="border-t border-border font-medium text-navy">
                <td className="p-3" colSpan={4}>{ta('Total')}</td>
                <td className="p-3 text-right">{fmtCurrency(totalValue)}</td>
                {purchaseOrder.status !== 'received' && purchaseOrder.status !== 'cancelled' && <td />}
              </tr></tfoot>
            </table>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="font-semibold text-navy mb-3">{ta('Supplier')}</h2>
            <p className="text-sm text-navy">{purchaseOrder.supplier.name}</p>
            <p className="text-xs text-muted-foreground">{purchaseOrder.supplier.phone || ta('No phone')}</p>
            {purchaseOrder.supplier.email && <p className="text-xs text-muted-foreground">{purchaseOrder.supplier.email}</p>}
          </div>
          {purchaseOrder.notes && (
            <div className="bg-white rounded-xl border border-border p-5">
              <h2 className="font-semibold text-navy mb-3">{ta('Notes')}</h2>
              <p className="text-sm text-muted-foreground">{purchaseOrder.notes}</p>
            </div>
          )}
          {purchaseOrder.status !== 'received' && purchaseOrder.status !== 'cancelled' && (
            <button onClick={handleReceive} disabled={loading} className="w-full py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
              <Package className="h-4 w-4" /> {loading ? ta('Receiving...') : ta('Receive Stock')}
            </button>
          )}
          {purchaseOrder.status === 'received' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
              <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-700">{ta('Fully Received')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
