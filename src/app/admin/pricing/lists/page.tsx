'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import Link from 'next/link'
import { Plus, Edit, Trash2, ArrowLeft, Check, X } from 'lucide-react'

type PriceList = {
  id: string
  name: string
  slug: string
  description: string | null
  type: string
  value: number | null
  currency: string
  isDefault: boolean
  isActive: boolean
  sortOrder: number
  createdAt: string
  _count: { items: number }
}

export default function PriceListsPage() {
  const [lists, setLists] = useState<PriceList[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', slug: '', description: '', type: 'markup', value: '', currency: 'EGP' })

  const fetchLists = () =>
    fetch('/api/admin/pricing/price-lists')
      .then((r) => r.json())
      .then(setLists)
      .finally(() => setLoading(false))

  useEffect(() => { fetchLists() }, [])

  const createList = async () => {
    if (!form.name || !form.slug) { toast.error('Name and slug are required'); return }
    const res = await fetch('/api/admin/pricing/price-lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        value: form.value ? Number(form.value) : null,
      }),
    })
    if (!res.ok) { toast.error('Failed to create list'); return }
    toast.success('Price list created')
    setShowForm(false)
    setForm({ name: '', slug: '', description: '', type: 'markup', value: '', currency: 'EGP' })
    fetchLists()
  }

  const deleteList = async (id: string) => {
    if (!confirm('Delete this price list?')) return
    const res = await fetch(`/api/admin/pricing/price-lists/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Failed to delete'); return }
    toast.success('Deleted')
    fetchLists()
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/pricing" className="text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Price Lists</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> New List
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} className="rounded border px-3 py-2 text-sm" />
            <input placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="rounded border px-3 py-2 text-sm" />
            <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded border px-3 py-2 text-sm" />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded border px-3 py-2 text-sm">
              <option value="markup">Markup %</option>
              <option value="fixed">Fixed Price</option>
            </select>
            <input type="number" placeholder="Default value (markup %)" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="rounded border px-3 py-2 text-sm" />
            <input placeholder="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="rounded border px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={createList} className="inline-flex items-center gap-1 rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground"><Check className="h-4 w-4" /> Create</button>
            <button onClick={() => setShowForm(false)} className="inline-flex items-center gap-1 rounded border px-3 py-1.5 text-sm"><X className="h-4 w-4" /> Cancel</button>
          </div>
        </motion.div>
      )}

      <div className="rounded-lg border">
        <div className="border-b px-4 py-3 text-sm font-medium text-muted-foreground grid grid-cols-12 gap-4">
          <span className="col-span-3">Name</span>
          <span className="col-span-2">Type</span>
          <span className="col-span-2">Value</span>
          <span className="col-span-2">Items</span>
          <span className="col-span-1">Active</span>
          <span className="col-span-2 text-right">Actions</span>
        </div>
        <div className="divide-y">
          {lists.map((list) => (
            <div key={list.id} className="px-4 py-3 text-sm grid grid-cols-12 gap-4 items-center">
              <div className="col-span-3">
                <Link href={`/admin/pricing/lists/${list.id}`} className="font-medium hover:underline">
                  {list.name}
                </Link>
                {list.isDefault && <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">Default</span>}
              </div>
              <span className="col-span-2 capitalize">{list.type}</span>
              <span className="col-span-2">{list.value ? `${list.value}${list.type === 'markup' ? '%' : ''}` : '-'}</span>
              <span className="col-span-2">{list._count.items}</span>
              <span className="col-span-1">{list.isActive ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-400" />}</span>
              <div className="col-span-2 flex justify-end gap-1">
                <Link href={`/admin/pricing/lists/${list.id}`} className="rounded p-1 text-muted-foreground hover:text-primary"><Edit className="h-4 w-4" /></Link>
                <button onClick={() => deleteList(list.id)} className="rounded p-1 text-muted-foreground hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
          {lists.length === 0 && <p className="px-4 py-8 text-center text-muted-foreground">No price lists yet</p>}
        </div>
      </div>
    </div>
  )
}
