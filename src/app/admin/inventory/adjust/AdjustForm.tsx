'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

type ProductBrief = { id: string; name: string; sku: string; stock: number }

export function AdjustForm({ products }: { products: ProductBrief[] }) {
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()
  const router = useRouter()
  const [productId, setProductId] = useState('')
  const [change, setChange] = useState(0)
  const [note, setNote] = useState('')

  const selectedProduct = products.find((p) => p.id === productId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!productId || change === 0) { toast.error(ta('Select a product and enter a non-zero change')); return }
    const res = await fetch('/api/admin/inventory/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, change, note }),
    })
    if (res.ok) { toast.success(ta('Stock updated')); router.push('/admin/inventory'); router.refresh() }
    else { const err = await res.json(); toast.error(err.error || ta('Failed to adjust stock')) }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4 bg-white rounded-xl border border-border p-6">
      <div>
        <label className="text-sm font-medium text-navy">{ta('Product')}</label>
        <select required value={productId} onChange={(e) => setProductId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1">
          <option value="">{ta('Select a product...')}</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku}) — {ta('Current')}: {p.stock}</option>)}
        </select>
      </div>
      {selectedProduct && (
        <p className="text-xs text-muted-foreground">{ta('Current stock')}: <strong className="text-navy">{selectedProduct.stock}</strong></p>
      )}
      <div>
        <label className="text-sm font-medium text-navy">{ta('Change (+/-)')}</label>
        <input type="number" required value={change} onChange={(e) => setChange(parseInt(e.target.value) || 0)} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" placeholder={ta('e.g. 10 or -5')} />
      </div>
      {selectedProduct && (
        <p className="text-xs text-muted-foreground">{ta('Result')}: <strong className={selectedProduct.stock + change < 0 ? 'text-red-600' : 'text-navy'}>{selectedProduct.stock + change}</strong></p>
      )}
      <div>
        <label className="text-sm font-medium text-navy">{ta('Reason/Note')}</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" placeholder={ta('e.g. Restock from supplier')} />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="px-6 py-2.5 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">{ta('Save Adjustment')}</button>
        <button type="button" onClick={() => router.back()} className="px-6 py-2.5 border border-border rounded-lg text-sm text-muted-foreground hover:bg-gray-50 transition-colors">{ta('Cancel')}</button>
      </div>
    </form>
  )
}
