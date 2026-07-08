'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { toast } from 'sonner'

interface EditOrderModalProps {
  orderId: string
  items: Array<{ id: string; productId: string; product: { name: string }; quantity: number; price: number }>
  customer: { fullName: string; phone: string | null; address: string; city: string; postalCode: string; notes: string | null }
  adminId: string
  onClose: () => void
  onSuccess: () => void
}

export default function EditOrderModal({ orderId, items, customer, adminId, onClose, onSuccess }: EditOrderModalProps) {
  const [editItems, setEditItems] = useState(items.map((i) => ({ id: i.id, productId: i.productId, name: i.product.name, quantity: i.quantity, maxQty: i.quantity })))
  const [fullName, setFullName] = useState(customer.fullName)
  const [phone, setPhone] = useState(customer.phone || '')
  const [address, setAddress] = useState(customer.address)
  const [city, setCity] = useState(customer.city)
  const [postalCode, setPostalCode] = useState(customer.postalCode)
  const [notes, setNotes] = useState(customer.notes || '')
  const [loading, setLoading] = useState(false)

  function updateItemQty(id: string, qty: number) {
    setEditItems((prev) => prev.map((i) => i.id === id ? { ...i, quantity: Math.max(0, qty) } : i))
  }

  async function handleSave() {
    const validItems = editItems.filter((i) => i.quantity > 0)
    if (validItems.length === 0) { toast.error('At least one item required'); return }

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: validItems.map((i) => ({ id: i.id, productId: i.productId, quantity: i.quantity })),
          fullName, phone: phone || null, address, city, postalCode, notes: notes || null,
          editedById: adminId,
        }),
      })
      if (res.ok) { toast.success('Order updated'); onSuccess(); onClose() }
      else { const e = await res.json(); toast.error(e.error) }
    } catch { toast.error('Failed to update order') }
    finally { setLoading(false) }
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
        className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-navy mb-4">Edit Order</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-navy mb-2">Items</h3>
            {editItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-2 border-b border-border/50">
                <span className="text-sm text-navy flex-1">{item.name}</span>
                <button onClick={() => updateItemQty(item.id, 0)} className="text-xs text-red-600 hover:text-red-800 mr-2">Remove</button>
                <input
                  type="number" min={0} max={999} value={item.quantity}
                  onChange={(e) => updateItemQty(item.id, parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 border border-border rounded text-sm text-center"
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-navy block mb-1">Full Name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-navy block mb-1">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-navy block mb-1">Address</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-navy block mb-1">City</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-navy block mb-1">Postal Code</label>
              <input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-navy block mb-1">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" rows={2} />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:text-navy">Cancel</button>
            <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
