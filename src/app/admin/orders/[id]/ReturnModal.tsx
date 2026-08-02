'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { toast } from 'sonner'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

interface ReturnModalProps {
  orderId: string
  items: Array<{ id: string; productId: string; product: { name: string }; quantity: number; price: number }>
  adminId: string
  onClose: () => void
  onSuccess: () => void
}

export default function ReturnModal({ orderId, items, adminId, onClose, onSuccess }: ReturnModalProps) {
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({})
  const [reason, setReason] = useState('customer_change')
  const [refundMethod, setRefundMethod] = useState('store_credit')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()

  function toggleItem(productId: string, maxQty: number) {
    setSelectedItems((prev) => {
      if (prev[productId]) {
        const next = { ...prev }
        delete next[productId]
        return next
      }
      return { ...prev, [productId]: maxQty }
    })
  }

  function updateQty(productId: string, qty: number) {
    setSelectedItems((prev) => ({ ...prev, [productId]: Math.max(1, qty) }))
  }

  async function handleSubmit() {
    const productIds = Object.keys(selectedItems)
    if (productIds.length === 0) { toast.error(ta('Select at least one item')); return }

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: productIds.map((pid) => ({
            productId: pid,
            quantity: selectedItems[pid],
            refundAmount: (items.find((i) => i.productId === pid)?.price ?? 0) * selectedItems[pid],
          })),
          reason,
          refundMethod,
          notes: notes || undefined,
          processedById: adminId,
        }),
      })
      if (res.ok) { toast.success(ta('Return processed')); onSuccess(); onClose() }
      else { const e = await res.json(); toast.error(e.error) }
    } catch { toast.error(ta('Failed to process return')) }
    finally { setLoading(false) }
  }

  const refundMethodLabels: Record<string, string> = {
    cash: ta('Cash Refund'), store_credit: ta('Store Credit'), no_refund: ta('No Refund (Loss)'),
  }
  const reasonLabels: Record<string, string> = {
    customer_change: ta('Customer Changed Mind'), defective: ta('Defective Item'),
    wrong_item: ta('Wrong Item Received'), damaged: ta('Damaged in Transit'), other: ta('Other'),
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-navy mb-4">{ta('Process Return')}</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-navy mb-2">{ta('Select Items to Return')}</p>
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-2 border-b border-border/50">
                <input
                  type="checkbox"
                  checked={!!selectedItems[item.productId]}
                  onChange={() => toggleItem(item.productId, item.quantity)}
                  className="h-4 w-4"
                />
                <span className="text-sm text-navy flex-1">{item.product.name}</span>
                {selectedItems[item.productId] && (
                  <input
                    type="number"
                    min={1}
                    max={item.quantity}
                    value={selectedItems[item.productId]}
                    onChange={(e) => updateQty(item.productId, parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-1 border border-border rounded text-sm text-center"
                  />
                )}
                <span className="text-sm text-muted-foreground w-20 text-right">
                  ${(item.price * (selectedItems[item.productId] || item.quantity)).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div>
            <label className="text-sm font-medium text-navy block mb-1">{ta('Reason')}</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
              {Object.entries(reasonLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-navy block mb-1">{ta('Refund Method')}</label>
            <select value={refundMethod} onChange={(e) => setRefundMethod(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
              {Object.entries(refundMethodLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-navy block mb-1">{ta('Notes')}</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" rows={3} />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:text-navy">{ta('Cancel')}</button>
            <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
              {loading ? ta('Processing...') : ta('Process Return')}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
