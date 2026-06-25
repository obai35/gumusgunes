'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

type ProductData = {
  name: string; slug: string; description: string; price: number; compareAtPrice?: number
  sku: string; categoryId: string; material: string; weight?: string; stock: number
  imageUrl: string; images: string; tags: string; isActive: boolean; isFeatured: boolean
  isNew: boolean; isBestseller: boolean
}

export function ProductForm({ categories, initialData, productId }: {
  categories: { id: string; name: string }[]
  initialData?: ProductData
  productId?: string
}) {
  const router = useRouter()
  const [form, setForm] = useState<ProductData>(initialData || {
    name: '', slug: '', description: '', price: 0, sku: '', categoryId: '',
    material: '', stock: 0, imageUrl: '', images: '[]', tags: '[]',
    isActive: true, isFeatured: false, isNew: false, isBestseller: false,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const url = productId ? '/api/admin/products/update' : '/api/admin/products/create'
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, id: productId }),
    })
    if (res.ok) { toast.success(productId ? 'Product updated' : 'Product created'); router.push('/admin/products'); router.refresh() }
    else { toast.error('Failed to save product') }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="text-sm font-medium text-navy">Name</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
        <div><label className="text-sm font-medium text-navy">Slug</label><input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
      </div>
      <div><label className="text-sm font-medium text-navy">Description</label><textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1 min-h-[80px]" /></div>
      <div className="grid grid-cols-3 gap-4">
        <div><label className="text-sm font-medium text-navy">Price ($)</label><input type="number" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
        <div><label className="text-sm font-medium text-navy">Compare At</label><input type="number" step="0.01" value={form.compareAtPrice || ''} onChange={(e) => setForm({ ...form, compareAtPrice: parseFloat(e.target.value) || undefined })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
        <div><label className="text-sm font-medium text-navy">Stock</label><input type="number" required value={form.stock} onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="text-sm font-medium text-navy">SKU</label><input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
        <div><label className="text-sm font-medium text-navy">Category</label><select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1">{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="text-sm font-medium text-navy">Material</label><input value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
        <div><label className="text-sm font-medium text-navy">Weight</label><input value={form.weight || ''} onChange={(e) => setForm({ ...form, weight: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
      </div>
      <div><label className="text-sm font-medium text-navy">Image URL</label><input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
      <div className="flex gap-4">
        {(['isFeatured', 'isNew', 'isBestseller', 'isActive'] as const).map((f) => (
          <label key={f} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.checked })} className="rounded" />{f.replace('is', '')}</label>
        ))}
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="px-6 py-2.5 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">{productId ? 'Update' : 'Create'} Product</button>
        <button type="button" onClick={() => router.back()} className="px-6 py-2.5 border border-border rounded-lg text-sm text-muted-foreground hover:bg-gray-50 transition-colors">Cancel</button>
      </div>
    </form>
  )
}
